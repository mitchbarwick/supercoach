// ============================================================
// Scene compiler — turns a Drill Script scene (script.js) into a
// baked, frame-by-frame timeline the renderer can play cheaply.
//
// Rules the compiler enforces so animations stay physically honest:
//  • The ball has no path of its own. Every frame it is either AT
//    SOMEONE'S FEET/HANDS (held), IN A KICK that left from where it
//    was and lands where the receiver actually is at that moment
//    (flight), or RESTING where it stopped (loose).
//  • Ball actions chain: a pass can't leave until the ball reaches
//    the passer, so one-touch moves line up automatically.
//  • Players turn to face where they are going, the pass they are
//    about to play, or the ball they are watching — they are aware
//    of the ball at all times.
//  • Players move on smooth splines: they accelerate out of a
//    standstill, carry speed through waypoints, and slow to a stop.
//
// Pure JS (no React) so scripts/check-scenes.mjs can validate every
// scene in Node.
// ============================================================

export const FPS = 60
export const PLAYER_R = 2.5 // token radius
export const BALL_R = 1.3
const FOOT = 3.5 // ball centre ↔ player centre when at feet
const HANDS = 1.6
const HEIGHT = { feet: 0, knee: 1.3, chest: 2.3, hands: 2.6, head: 3.6 }
const PACE = { walk: 6, jog: 11, run: 16, sprint: 22 } // units / second
const BALL_SPEED = { ground: 32, lofted: 22, toss: 18, shot: 46, knock: 26, rebound: 30 }
const BLEND = 0.14 // seconds to settle the ball into a new holder's feet
const MAX_PLAYER_SPEED = 42

const TAU = Math.PI * 2
const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1])
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const unit = (v, fallback = [1, 0]) => {
  const l = Math.hypot(v[0], v[1])
  return l < 1e-6 ? fallback : [v[0] / l, v[1] / l]
}
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
const smooth = (u) => u * u * (3 - 2 * u)
const wrapAngle = (a) => {
  while (a > Math.PI) a -= TAU
  while (a < -Math.PI) a += TAU
  return a
}
const angleOf = (v) => Math.atan2(v[1], v[0])
const vecOf = (a) => [Math.cos(a), Math.sin(a)]

const GOAL_NORMALS = { right: [1, 0], left: [-1, 0], down: [0, 1], up: [0, -1] }

// ---- Field normalisation ---------------------------------------
export function normaliseField(f = {}, legacy = {}) {
  const goals = (f.goals || legacy.goals || []).map((g) => {
    const facing = g.facing || (g.x < 50 ? 'right' : 'left')
    const n = GOAL_NORMALS[facing] || GOAL_NORMALS.right
    return { x: g.x, y: g.y, facing, n, t: [-n[1], n[0]], w: g.w || 14, depth: g.depth || 4 }
  })
  const rebounders = (f.rebounders || []).map((r) => {
    const facing = r.facing || (r.x < 50 ? 'right' : 'left')
    const n = GOAL_NORMALS[facing] || GOAL_NORMALS.right
    return { x: r.x, y: r.y, facing, n, t: [-n[1], n[0]], w: r.w || 8 }
  })
  let circle = f.circle || legacy.circle || null
  if (typeof circle === 'number') circle = { x: 50, y: 32, r: circle }
  if (!circle && (f.circleRadius || legacy.circleRadius)) circle = { x: 50, y: 32, r: f.circleRadius || legacy.circleRadius }
  return {
    cones: f.cones || [],
    discs: f.discs || [],
    gates: f.gates || [],
    goals,
    rebounders,
    zones: f.zones || [],
    ladders: f.ladders || [],
    hurdles: f.hurdles || [],
    hoops: f.hoops || [],
    mannequins: f.mannequins || [],
    flags: f.flags || [],
    lines: f.lines || [],
    circle,
  }
}

// ---- Player tracks (cubic Hermite through keyframes) -----------
function buildTrack(actor) {
  const k = [{ t: 0, p: actor.at }]
  const segs = actor.segs.slice().sort((a, b) => a.t0 - b.t0)
  k[0].rest = true
  for (let si = 0; si < segs.length; si++) {
    const s = segs[si]
    const last = k[k.length - 1]
    if (s.t0 > last.t + 1e-6) k.push({ t: s.t0, p: last.p, rest: true })
    const fromRest = !!k[k.length - 1].rest
    const t0 = Math.max(s.t0, k[k.length - 1].t)
    const t1 = Math.max(s.t1, t0 + 0.05)
    const T = t1 - t0
    const next = segs[si + 1]
    const toRest = !!s.stop || !next || next.t0 > t1 + 1e-6
    // the route as a polyline with cumulative arc length
    const poly = [k[k.length - 1].p, ...s.pts]
    const cum = [0]
    for (let i = 1; i < poly.length; i++) cum.push(cum[i - 1] + dist(poly[i - 1], poly[i]))
    const L = cum[cum.length - 1]
    if (L < 1e-6) {
      k.push({ t: t1, p: poly[0], rest: true })
      continue
    }
    // Real running: accelerate from rest, cruise, brake to a stop.
    const ta0 = fromRest ? Math.min(0.45, T * 0.35) : 0
    const ta1 = toRest ? Math.min(0.45, T * 0.35) : 0
    const vc = L / (T - ta0 / 2 - ta1 / 2)
    const da0 = (vc * ta0) / 2, da1 = (vc * ta1) / 2
    const timeAt = (a) =>
      a < da0 ? Math.sqrt((2 * a * ta0) / vc) : a <= L - da1 ? ta0 + (a - da0) / vc : T - Math.sqrt(Math.max(0, (2 * (L - a) * ta1) / vc))
    const speedAt = (a) => (a < da0 ? Math.sqrt((2 * a * vc) / ta0) : a <= L - da1 ? vc : Math.sqrt(Math.max(0, (2 * (L - a) * vc) / ta1)))
    const at = (a) => {
      let i = 1
      while (i < cum.length - 1 && cum[i] < a) i++
      const u = (a - cum[i - 1]) / (cum[i] - cum[i - 1] || 1)
      return { p: [poly[i - 1][0] + (poly[i][0] - poly[i - 1][0]) * u, poly[i - 1][1] + (poly[i][1] - poly[i - 1][1]) * u], i }
    }
    const marks = new Set(cum.slice(1))
    // guide points either side of each corner keep the legs straight
    // and round only the corner itself
    for (let wi = 1; wi < poly.length - 1; wi++) {
      const r = Math.min(3, (cum[wi] - cum[wi - 1]) / 3, (cum[wi + 1] - cum[wi]) / 3)
      if (r > 0.5) marks.add(cum[wi] - r).add(cum[wi] + r)
    }
    if (ta0 && da0 < L) marks.add(da0)
    if (ta1 && L - da1 > 0) marks.add(L - da1)
    const sorted = [...marks].sort((a, b) => a - b).filter((a, i, arr) => a > 0.2 && (i === arr.length - 1 || arr[i + 1] - a > 0.3))
    for (const a of sorted) {
      const end = a >= L - 1e-6
      const wi = cum.indexOf(a)
      let p, dir
      if (wi > 0) {
        p = poly[wi]
        const din = unit(sub(poly[wi], poly[wi - 1]))
        const dout = wi < poly.length - 1 ? unit(sub(poly[wi + 1], poly[wi])) : din
        dir = mul(add(din, dout), 0.5) // slows naturally through sharp corners
      } else {
        const q = at(a)
        p = q.p
        dir = unit(sub(poly[q.i], poly[q.i - 1]))
      }
      const v = end ? (toRest ? [0, 0] : undefined) : mul(dir, speedAt(a))
      k.push({ t: t0 + timeAt(a), p, v, rest: end && toRest })
    }
  }
  // tangents: explicit velocities where the run profile set them,
  // Catmull-Rom through joins between consecutive runs
  const m = k.map(() => [0, 0])
  for (let i = 1; i < k.length - 1; i++) {
    const a = k[i - 1], b = k[i], c = k[i + 1]
    if (b.v) {
      m[i] = b.v
      continue
    }
    if (b.rest || dist(a.p, b.p) < 1e-3 || dist(b.p, c.p) < 1e-3) continue
    let tan = mul(sub(c.p, a.p), 1 / (c.t - a.t))
    // limit overshoot: never faster than the quicker neighbouring leg
    const vmax = Math.max(dist(a.p, b.p) / (b.t - a.t), dist(b.p, c.p) / (c.t - b.t))
    const sp = Math.hypot(tan[0], tan[1])
    if (sp > vmax) tan = mul(tan, vmax / sp)
    m[i] = tan
  }
  return { k, m, segs }
}

function evalTrack(tr, t) {
  const { k, m } = tr
  if (t <= k[0].t) return k[0].p
  const n = k.length
  if (t >= k[n - 1].t) return k[n - 1].p
  let i = 0
  while (i < n - 2 && k[i + 1].t <= t) i++
  const a = k[i], b = k[i + 1]
  const dt = b.t - a.t
  const u = (t - a.t) / dt
  const u2 = u * u, u3 = u2 * u
  const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2
  return [
    h00 * a.p[0] + h10 * dt * m[i][0] + h01 * b.p[0] + h11 * dt * m[i + 1][0],
    h00 * a.p[1] + h10 * dt * m[i][1] + h01 * b.p[1] + h11 * dt * m[i + 1][1],
  ]
}

function heightOnTrack(tr, t) {
  for (const s of tr.segs) {
    if (t < s.t0 || t > s.t1) continue
    const u = (t - s.t0) / (s.t1 - s.t0 || 1)
    if (s.hop) return s.hop * 4 * u * (1 - u)
    if (s.bounce) return (s.bounceH || 1.1) * Math.abs(Math.sin(Math.PI * s.bounce * u))
  }
  return 0
}

// ---- Compile ----------------------------------------------------
export function compileScene(raw) {
  const warnings = []
  const warn = (msg) => warnings.push(msg)
  const field = normaliseField(raw.field, raw)

  const actors = {}
  const order = []
  for (const [id, c] of Object.entries(raw.cast || {})) {
    actors[id] = {
      id,
      team: c.team || 'a',
      label: c.label ?? '',
      at: c.at,
      figure: !!c.figure,
      scale: c.scale,
      flip: c.flip,
      pose0: c.pose || 'stand',
      keeper: c.team === 'k',
      face0: c.face,
      segs: [],
      kicks: [],
      faces: [],
      poses: [],
      _tr: null,
      _n: -1,
    }
    order.push(id)
  }
  const track = (a) => {
    if (a._n !== a.segs.length) {
      a._tr = buildTrack(a)
      a._n = a.segs.length
    }
    return a._tr
  }
  const pos = (id, t) => evalTrack(track(actors[id]), t)

  const balls = {}
  for (const [id, b] of Object.entries(raw.balls || (raw.ball ? { ball: raw.ball } : {}))) {
    const spec = typeof b === 'object' && !Array.isArray(b) ? b : { with: typeof b === 'string' ? b : null, at: Array.isArray(b) ? b : null }
    let s0
    if (spec.with && actors[spec.with]) {
      s0 = { type: 'held', t0: 0, who: spec.with, h: spec.in || (actors[spec.with].keeper ? 'hands' : 'feet') }
    } else if (spec.at) {
      s0 = { type: 'loose', t0: 0, p: spec.at }
    } else {
      warn(`ball ${id}: needs a holder id or [x, y]`)
      s0 = { type: 'loose', t0: 0, p: [50, 32] }
    }
    balls[id] = { id, states: [s0] }
  }
  const lastState = (b) => b.states[b.states.length - 1]
  const ballOf = (who, explicit) => {
    if (explicit) return balls[explicit]
    let best = null
    for (const b of Object.values(balls)) {
      const L = lastState(b)
      if (L.type === 'held' && L.who === who && (!best || L.t0 > lastState(best).t0)) best = b
    }
    return best
  }

  const effects = []
  const bubbles = []
  const highlights = []

  // Resolve a destination spec to a point for a mover starting at `from`.
  const resolvePoint = (spec, from, t) => {
    if (Array.isArray(spec) && typeof spec[0] === 'number') return spec
    if (spec && spec.rel) return add(from, spec.rel)
    if (typeof spec === 'string') {
      if (actors[spec]) return pos(spec, t)
      const g = goalRef(spec)
      if (g) return [g.x, g.y]
      const r = rebRef(spec)
      if (r) return add([r.x, r.y], mul(r.n, 1))
    }
    warn(`unknown target ${JSON.stringify(spec)}`)
    return from
  }
  const goalRef = (s) => {
    const m = /^goal:(\d+)$/.exec(s || '')
    return m ? field.goals[+m[1]] : null
  }
  const rebRef = (s) => {
    const m = /^rebounder:(\d+)$/.exec(s || '')
    return m ? field.rebounders[+m[1]] : null
  }
  const routeOf = (spec, from, t) => {
    if (Array.isArray(spec) && Array.isArray(spec[0])) {
      let cur = from
      return spec.map((p) => (cur = resolvePoint(p, cur, t)))
    }
    return [resolvePoint(spec, from, t)]
  }
  const routeLen = (from, pts) => {
    let l = 0, c = from
    for (const p of pts) {
      l += dist(c, p)
      c = p
    }
    return l
  }

  // ---- Movement ----
  const addMove = (a, kind, beatStart, beatDur) => {
    const actor = actors[a.who]
    if (!actor) return warn(`${a.do}: unknown cast member "${a.who}"`)
    const t0 = beatStart + (a.delay || 0)
    const from = pos(a.who, t0)
    const durGuess = a.dur ?? (beatDur != null ? beatDur - (a.delay || 0) : 1)
    const pts = routeOf(a.to, from, t0 + durGuess)
    const len = routeLen(from, pts)
    const dur = a.dur ?? (beatDur != null ? Math.max(0.2, beatDur - (a.delay || 0)) : Math.max(0.3, len / (PACE[a.pace] || PACE.jog)))
    actor.segs.push({ t0, t1: t0 + dur, pts, kind, hop: a.hop, bounce: a.bounce, bounceH: a.bounceH, dive: a.dive, stop: a.stop })
    return t0 + dur
  }

  // ---- Ball flights ----
  const kickDur = (kind, d, a) => {
    if (a.dur) return a.dur
    return clamp(d / BALL_SPEED[kind], kind === 'shot' ? 0.3 : 0.35, 2.4)
  }

  const pushFlight = (b, f) => {
    b.states.push({ type: 'flight', ...f })
    const t1 = f.t1
    if (f.to.who) b.states.push({ type: 'held', t0: t1, who: f.to.who, h: f.to.h || 'feet' })
    else b.states.push({ type: 'loose', t0: t1, p: f.to.p, net: f.net })
  }

  const doPass = (a, ts, beatEnd) => {
    const kicker = actors[a.from]
    if (!kicker) return warn(`pass: unknown kicker "${a.from}"`), ts
    if (typeof a.to === 'string' && a.to.startsWith('ball:') && !balls[a.to.slice(5)]) return warn(`pass: unknown target ${a.to}`), ts
    const b = ballOf(a.from, a.ball)
    if (!b) return warn(`pass: ${a.from} has no ball to play at ${ts.toFixed(2)}s`), ts
    const L = lastState(b)
    let t0 = Math.max(ts, L.t0)
    let fromH = L.h || 'feet'
    if (a.hands && fromH !== 'hands') {
      // pick it up first
      const tp = Math.max(L.t0, t0 - 0.3)
      b.states.push({ type: 'held', t0: tp, who: a.from, h: 'hands' })
      t0 = Math.max(t0, tp + 0.3)
      fromH = 'hands'
    }
    const kind = a.hands ? 'toss' : a.strike ? 'shot' : a.arc ? 'lofted' : 'ground'
    const recv = typeof a.to === 'string' && actors[a.to] ? a.to : null
    const targetBall = typeof a.to === 'string' && a.to.startsWith('ball:') ? balls[a.to.slice(5)] : null
    if (targetBall) {
      const TL = lastState(targetBall)
      a = { ...a, to: TL.p || TL.est }
    }
    const kp = pos(a.from, t0)
    let d, toSpec
    if (recv) {
      let est = t0 + 0.6
      for (let i = 0; i < 2; i++) est = t0 + kickDur(kind, dist(kp, pos(recv, est)), a)
      d = dist(kp, pos(recv, est))
      const h = a.at || (actors[recv].keeper && (a.hands || a.arc) ? 'hands' : 'feet')
      toSpec = { who: recv, h }
    } else {
      const p = resolvePoint(a.to, kp, t0)
      d = dist(kp, p)
      toSpec = { p }
    }
    let dur = kickDur(kind, d, a)
    if (!a.dur && beatEnd != null) {
      const room = beatEnd - t0
      if (room >= dur * 0.7) dur = Math.min(dur, room)
    }
    const t1 = t0 + dur
    pushFlight(b, { t0, t1, to: toSpec, arc: a.arc || 0, curve: a.curve || 0, z0: HEIGHT[fromH], kind: kind === 'toss' ? 'toss' : kind === 'shot' ? 'shot' : 'pass', ease: kind === 'shot' ? 'shot' : undefined, by: a.from })
    const aim = recv ? pos(recv, t1) : toSpec.p
    kicker.kicks.push({ t: t0, aim, hands: fromH === 'hands' })
    effects.push({ kind: fromH === 'hands' ? 'release' : 'kick', t: t0, ball: b.id })
    if (targetBall) {
      // strike the target ball: it flies off, ours stops where it hit
      const tp = toSpec.p
      const dir = unit(sub(tp, kp))
      const knockTo = a.knock || add(tp, mul(dir, 9))
      const kd = kickDur('knock', dist(tp, knockTo), {})
      pushFlight(targetBall, { t0: t1, t1: t1 + kd, to: { p: knockTo }, arc: 1.5, curve: 0, z0: 0, kind: 'knock' })
      effects.push({ kind: 'tackle', t: t1, ball: b.id })
      return t1
    }
    if (recv && a.hit) {
      // ball strikes the receiver and ricochets away
      b.states.pop()
      const kd = kickDur('knock', 8, {})
      pushFlight(b, { t0: t1, t1: t1 + kd, to: { p: a.hit }, arc: 0, curve: 0, z0: 0, kind: 'knock' })
      effects.push({ kind: 'tackle', t: t1, ball: b.id })
      return t1 + kd
    }
    if (recv) effects.push({ kind: 'touch', t: t1, ball: b.id })
    return t1
  }

  const doTag = (a, ts, beatDur) => {
    const actor = actors[a.who]
    if (!actor || !actors[a.victim]) return warn(`tag: unknown "${a.who}" or "${a.victim}"`), ts
    const t0 = ts + (a.delay || 0)
    const from = pos(a.who, t0)
    const t1 = t0 + (a.dur ?? (beatDur != null ? beatDur - (a.delay || 0) : Math.max(0.4, dist(from, pos(a.victim, t0 + 0.6)) / PACE.run)))
    const vp = pos(a.victim, t1)
    actor.segs.push({ t0, t1, pts: [add(vp, mul(unit(sub(from, vp)), PLAYER_R * 2 - 0.2))], kind: 'run' })
    effects.push({ kind: 'tag', t: t1, who: a.victim })
    return t1
  }

  const doShoot = (a, ts, beatEnd) => {
    if (typeof a.target === 'string' && a.target.startsWith('ball:')) return doPass({ ...a, to: a.target, strike: true }, ts, beatEnd)
    const kicker = actors[a.from]
    if (!kicker) return warn(`shoot: unknown shooter "${a.from}"`), ts
    const b = ballOf(a.from, a.ball)
    if (!b) return warn(`shoot: ${a.from} has no ball at ${ts.toFixed(2)}s`), ts
    const L = lastState(b)
    const t0 = Math.max(ts, L.t0)
    const kp = pos(a.from, t0)
    const g = typeof a.target === 'string' ? goalRef(a.target) : null
    let mouth, back
    if (g) {
      const aim = clamp(a.aim ?? 0, -(g.w / 2 - 1.2), g.w / 2 - 1.2)
      mouth = add([g.x, g.y], mul(g.t, a.miss ? (a.aim >= 0 ? 1 : -1) * (g.w / 2 + 3) : aim))
      back = add(mouth, mul(g.n, a.miss ? -8 : -g.depth * 0.7))
    } else {
      mouth = resolvePoint(a.target, kp, t0)
      back = mouth
    }
    const fromH = L.h || 'feet'
    const kind = 'shot'
    if (a.save && actors[a.save]) {
      const k = actors[a.save]
      const kStart = pos(a.save, t0)
      const catchP = g ? add(mouth, mul(g.n, 1.6)) : mouth
      const dur = kickDur(kind, dist(kp, catchP), a)
      const t1 = t0 + dur
      const body = add(catchP, mul(unit(sub(catchP, kp)), HANDS * 0.8))
      const reach = dist(kStart, body)
      k.segs.push({ t0: t0 + Math.min(0.12, dur * 0.3), t1, pts: [body], kind: 'run', dive: reach > 3.5 || a.dive, stop: true })
      pushFlight(b, { t0, t1, to: { who: a.save, h: 'hands' }, arc: a.arc || 0, curve: a.curve || 0, z0: HEIGHT[fromH], kind: 'shot', by: a.from })
      kicker.kicks.push({ t: t0, aim: catchP })
      effects.push({ kind: 'kick', t: t0, ball: b.id, big: true })
      effects.push({ kind: 'save', t: t1, who: a.save })
      if (a.parry) {
        const pd = kickDur('knock', dist(catchP, a.parry), {})
        pushFlight(b, { t0: t1, t1: t1 + pd, to: { p: a.parry }, arc: 1.5, curve: 0, z0: HEIGHT.hands, kind: 'knock' })
        return t1 + pd
      }
      return t1
    }
    if (a.bar && g) {
      // smack the crossbar and spin back out into play
      const barP = add(mouth, mul(g.n, 0.6))
      const dur = kickDur('lofted', dist(kp, barP), a)
      const t1 = t0 + dur
      const out = Array.isArray(a.bar) ? a.bar : add(barP, mul(g.n, 16))
      b.states.push({ type: 'flight', t0, t1, to: { p: barP, z: 3.6 }, arc: a.arc ?? 4, curve: a.curve || 0, z0: HEIGHT[fromH], kind: 'shot', by: a.from })
      const rd = kickDur('knock', dist(barP, out), {})
      pushFlight(b, { t0: t1, t1: t1 + rd, to: { p: out }, arc: 2.5, curve: 0, z0: 3.6, kind: 'knock' })
      kicker.kicks.push({ t: t0, aim: barP })
      effects.push({ kind: 'kick', t: t0, ball: b.id, big: true })
      effects.push({ kind: 'bar', t: t1, goal: field.goals.indexOf(g) })
      return t1 + rd
    }
    let dur = kickDur(kind, dist(kp, back), a)
    if (!a.dur && beatEnd != null) {
      const room = beatEnd - t0
      if (room >= dur * 0.7) dur = Math.min(dur, room)
    }
    const t1 = t0 + dur
    pushFlight(b, { t0, t1, to: { p: back }, arc: a.arc || 0, curve: a.curve || 0, z0: HEIGHT[fromH], kind: 'shot', ease: 'shot', by: a.from, net: g && !a.miss ? field.goals.indexOf(g) : undefined })
    kicker.kicks.push({ t: t0, aim: back })
    effects.push({ kind: 'kick', t: t0, ball: b.id, big: true })
    if (g && !a.miss) effects.push({ kind: 'goal', t: t0 + dur * 0.82, goal: field.goals.indexOf(g) })
    return t1
  }

  const latestLoose = (explicit) => {
    if (explicit) return balls[explicit]
    let best = null
    for (const b of Object.values(balls)) {
      const L = lastState(b)
      if (L.type === 'loose' && (!best || L.t0 > lastState(best).t0)) best = b
    }
    return best
  }

  const doRebound = (a, ts, beatEnd) => {
    const b = latestLoose(a.ball)
    if (!b) return warn(`rebound: no loose ball at ${ts.toFixed(2)}s`), ts
    const L = lastState(b)
    const t0 = Math.max(ts, L.t0)
    const lp = L.p || L.est
    const recv = typeof a.to === 'string' && actors[a.to] ? a.to : null
    let d, toSpec
    if (recv) {
      d = dist(lp, pos(recv, t0 + 0.6))
      toSpec = { who: recv, h: a.at || 'feet' }
    } else {
      const p = resolvePoint(a.to, lp, t0)
      d = dist(lp, p)
      toSpec = { p }
    }
    let dur = a.dur || clamp(d / BALL_SPEED.rebound, 0.3, 2)
    if (!a.dur && beatEnd != null && beatEnd - t0 >= dur * 0.7) dur = Math.min(dur, beatEnd - t0)
    pushFlight(b, { t0, t1: t0 + dur, to: toSpec, arc: a.arc || 0, curve: 0, z0: 0, kind: 'pass' })
    effects.push({ kind: 'bounce', t: t0, ball: b.id })
    return t0 + dur
  }

  const doCollect = (a, ts, beatDur) => {
    const actor = actors[a.who]
    if (!actor) return warn(`collect: unknown "${a.who}"`), ts
    let b = a.ball ? balls[a.ball] : null
    if (!b) {
      const from = pos(a.who, ts)
      let bestD = Infinity
      for (const bb of Object.values(balls)) {
        const L = lastState(bb)
        if (L.type !== 'loose') continue
        const d = dist(from, L.p || L.est)
        if (d < bestD) (bestD = d), (b = bb)
      }
    }
    if (!b) return warn(`collect: no loose ball for ${a.who} at ${ts.toFixed(2)}s`), ts
    const L = lastState(b)
    const t0 = ts + (a.delay || 0)
    const from = pos(a.who, t0)
    const lp = L.p || L.est
    const target = add(lp, mul(unit(sub(from, lp)), FOOT))
    const natural = Math.max(0.3, dist(from, target) / (PACE[a.pace] || PACE.run))
    const t1 = Math.max(t0 + (a.dur ?? (beatDur != null ? beatDur - (a.delay || 0) : natural)), L.t0 + 0.05)
    if (dist(from, target) > 0.4) actor.segs.push({ t0, t1, pts: [target], kind: 'run' })
    b.states.push({ type: 'held', t0: t1, who: a.who, h: 'feet' })
    effects.push({ kind: 'touch', t: t1, ball: b.id })
    return t1
  }

  const doTackle = (a, ts, beatDur) => {
    const actor = actors[a.who]
    const victim = actors[a.victim]
    if (!actor || !victim) return warn(`tackle: unknown "${a.who}" or "${a.victim}"`), ts
    const b = ballOf(a.victim, a.ball)
    if (!b) return warn(`tackle: ${a.victim} has no ball at ${ts.toFixed(2)}s`), ts
    const t0 = ts + (a.delay || 0)
    const from = pos(a.who, t0)
    let t1 = t0 + (a.dur ?? (beatDur != null ? beatDur - (a.delay || 0) : Math.max(0.4, dist(from, pos(a.victim, t0 + 0.6)) / PACE.run)))
    t1 = Math.max(t1, lastState(b).t0 + 0.05)
    const vp = pos(a.victim, t1)
    const vv = sub(pos(a.victim, t1), pos(a.victim, t1 - 0.1))
    const vdir = Math.hypot(vv[0], vv[1]) > 0.05 ? unit(vv) : unit(sub(from, vp))
    const ballP = add(vp, mul(vdir, FOOT))
    // reach the ball from the tackler's side but never through the
    // victim's body: aim between "back toward me" and "away from them"
    const approach = unit(add(unit(sub(from, ballP)), unit(sub(ballP, vp))), unit(sub(from, ballP)))
    const target = add(ballP, mul(approach, FOOT * 0.9))
    actor.segs.push({ t0, t1, pts: [target], kind: 'run' })
    effects.push({ kind: 'tackle', t: t1, ball: b.id })
    if (a.to) {
      const kd = kickDur('knock', dist(ballP, a.to), {})
      pushFlight(b, { t0: t1, t1: t1 + kd, to: { p: a.to }, arc: 0, curve: 0, z0: 0, kind: 'knock', by: a.who })
      actor.kicks.push({ t: t1, aim: a.to })
      return t1 + 0.3 // the ball rolls on, but the duel itself is over
    }
    b.states.push({ type: 'held', t0: t1, who: a.who, h: 'feet' })
    return t1
  }

  const doJuggle = (a, ts) => {
    const b = ballOf(a.who, a.ball)
    if (!b) return warn(`juggle: ${a.who} has no ball`), ts
    let t = Math.max(ts + (a.delay || 0), lastState(b).t0)
    const each = a.each || 0.5
    for (let i = 0; i < (a.count || 4); i++) {
      const h = a.height || 3.2
      pushFlight(b, { t0: t, t1: t + each, to: { who: a.who, h: a.at || 'feet' }, arc: h, curve: 0, z0: HEIGHT[a.at || 'feet'], kind: 'juggle', by: a.who })
      effects.push({ kind: 'tap', t, ball: b.id })
      t += each
    }
    return t
  }

  // Player steps away from the ball and leaves it where it is.
  const doLeave = (a, ts) => {
    const b = ballOf(a.who, a.ball)
    if (!b) return warn(`leave: ${a.who} has no ball`), ts
    const t0 = Math.max(ts + (a.delay || 0), lastState(b).t0)
    b.states.push({ type: 'loose', t0, p: null, est: pos(a.who, t0) })
    return t0
  }

  const doHold = (a, ts, h) => {
    const b = ballOf(a.who, a.ball)
    if (!b) return warn(`${a.do}: ${a.who} has no ball`), ts
    const t0 = Math.max(ts + (a.delay || 0), lastState(b).t0)
    b.states.push({ type: 'held', t0, who: a.who, h })
    return t0 + BLEND
  }

  // ---- Walk the beats ----
  const beats = []
  let cursor = 0
  for (const bt of raw.beats || []) {
    const tb = cursor
    const bd = bt.dur
    const beatEnd = bd != null ? tb + bd : null
    let end = tb + (bd || 0)
    const acts = bt.do || []
    for (const a of acts) {
      const t = tb + (a.delay || 0)
      switch (a.do) {
        case 'run':
        case 'dribble':
          end = Math.max(end, addMove(a, a.do, tb, bd))
          break
        case 'face':
          if (!actors[a.who]) warn(`face: unknown "${a.who}"`)
          else actors[a.who].faces.push({ t0: t, t1: t + (a.dur ?? (bd != null ? bd - (a.delay || 0) : 1)), target: a.target })
          break
        case 'pose':
          if (!actors[a.who]) warn(`pose: unknown "${a.who}"`)
          else actors[a.who].poses.push({ t, name: a.name, dur: a.dur ?? 0.7 })
          end = Math.max(end, t + (a.dur ?? 0.7))
          break
        case 'shout':
          bubbles.push({ t0: t, t1: t + (a.dur ?? Math.min(1.6, bd ?? 1.4)), who: a.who, text: a.text })
          break
        case 'highlight':
          highlights.push({ t0: t, t1: t + (a.dur ?? (bd ?? 1.2)), target: a.target, r: a.r, rate: a.rate, color: a.color })
          break
      }
    }
    for (const a of acts) {
      const t = tb + (a.delay || 0)
      let e = null
      switch (a.do) {
        case 'pass': e = doPass(a, t, beatEnd); break
        case 'shoot': e = doShoot(a, t, beatEnd); break
        case 'rebound': e = doRebound(a, t, beatEnd); break
        case 'collect': e = doCollect(a, t, bd); break
        case 'tackle': e = doTackle(a, t, bd); break
        case 'tag': e = doTag(a, t, bd); break
        case 'juggle': e = doJuggle(a, t); break
        case 'pickup': e = doHold(a, t, 'hands'); break
        case 'leave': e = doLeave(a, t); break
        case 'drop': e = doHold(a, t, 'feet'); break
      }
      if (e != null) {
        if (beatEnd != null && e > beatEnd + 0.3) warn(`beat "${bt.say || '#' + beats.length}": ${a.do} by ${a.from || a.who} finishes ${(e - beatEnd).toFixed(2)}s after the beat ends`)
        end = Math.max(end, e)
      }
    }
    if (!acts.length && bd == null) end = tb + 0.8
    const t1 = bd != null ? tb + bd : end + 0.1
    beats.push({ t0: tb, t1, say: bt.say })
    cursor = t1
  }
  let duration = Math.max(cursor, 0.5)

  // ---- Seamless loop? ----
  const finalStateMatches = () => {
    for (const id of order) {
      const a = actors[id]
      if (dist(pos(id, duration), a.at) > 0.8) return false
      if (a.figure) {
        const lastPose = a.poses.length ? a.poses[a.poses.length - 1].name : a.pose0
        if (lastPose !== a.pose0) return false
      }
    }
    for (const b of Object.values(balls)) {
      const s0 = b.states[0], L = lastState(b)
      if (s0.type !== L.type) return false
      if (s0.type === 'held' && (s0.who !== L.who || s0.h !== L.h)) return false
      if (s0.type === 'loose' && dist(s0.p, L.p || L.est) > 0.8) return false
    }
    return true
  }
  const seamless = finalStateMatches()
  let fade = null
  if (!seamless && raw.loop !== 'cut') {
    duration += 0.7 // let the final picture breathe before fading
    fade = { in: 0.35, out: 0.45 }
  }

  return bake({ raw, field, actors, order, balls, effects, bubbles, highlights, beats, duration, fade, warnings, pos, track })
}

// ---- Bake ------------------------------------------------------
function bake(ctx) {
  const { raw, field, actors, order, balls, effects, bubbles, highlights, beats, duration, fade, warnings, track } = ctx
  const warn = (m) => warnings.push(m)
  const n = Math.ceil(duration * FPS) + 1
  const dt = 1 / FPS

  const A = order.map((id) => {
    const a = actors[id]
    return {
      id,
      team: a.team,
      label: a.label,
      figure: a.figure,
      scale: a.scale,
      flip: a.flip,
      pose0: a.pose0,
      poses: a.poses,
      keeper: a.keeper,
      x: new Float32Array(n),
      y: new Float32Array(n),
      z: new Float32Array(n),
      h: new Float32Array(n),
      lx: new Float32Array(n),
      ly: new Float32Array(n),
      dive: new Uint8Array(n),
      _a: a,
      _tr: track(a),
    }
  })
  const idx = Object.fromEntries(A.map((a, i) => [a.id, i]))
  const B = Object.values(balls).map((b) => ({
    id: b.id,
    states: b.states,
    x: new Float32Array(n),
    y: new Float32Array(n),
    z: new Float32Array(n),
    rot: new Float32Array(n),
    holder: new Int16Array(n).fill(-1),
    _si: 0,
  }))

  const pAt = (ai, t) => evalTrack(A[ai]._tr, t)

  // initial headings
  const firstBallPos = () => {
    for (const b of B) {
      const s = b.states[0]
      if (s.type === 'loose') return s.p
      if (s.type === 'held') return actors[s.who].at
    }
    return null
  }
  const fb = firstBallPos()
  const heading = A.map((a) => {
    const f = a._a.face0
    if (typeof f === 'number') return (f * Math.PI) / 180
    if (Array.isArray(f)) return angleOf(sub(f, a._a.at))
    if (typeof f === 'string' && actors[f]) return angleOf(sub(actors[f].at, a._a.at))
    // starting with the ball: already shaped up for the first pass / shot / dribble
    if (B.some((b) => b.states[0].type === 'held' && b.states[0].who === a.id)) {
      const k = a._a.kicks[0]
      const firstMove = a._a.segs.slice().sort((p, q) => p.t0 - q.t0)[0]
      const kt = k ? k.t : Infinity
      if (firstMove && firstMove.t0 < kt) return angleOf(sub(firstMove.pts[0], a._a.at))
      if (k) return angleOf(sub(k.aim, a._a.at))
    }
    if (fb && dist(fb, a._a.at) > 0.5) return angleOf(sub(fb, a._a.at))
    return a._a.at[0] < 50 ? 0 : Math.PI
  })

  const faceTarget = (spec, t, from) => {
    if (Array.isArray(spec)) return spec
    if (typeof spec === 'number') return add(from, vecOf((spec * Math.PI) / 180))
    if (typeof spec === 'string' && idx[spec] != null) return pAt(idx[spec], t)
    if (typeof spec === 'string' && /^goal:/.test(spec)) {
      const g = field.goals[+spec.split(':')[1]]
      return g ? [g.x, g.y] : null
    }
    return null
  }

  // Seed "previous frame" ball positions from the opening state, so a
  // kick at t=0 still leaves from the kicker's feet.
  const prevBall = B.map((b) => {
    const s = b.states[0]
    if (s.type === 'loose') return [s.p[0], s.p[1]]
    if (s.type === 'held') {
      const ai = idx[s.who]
      const p = A[ai]._a.at
      const off = s.h === 'feet' ? FOOT : HANDS
      const hv = vecOf(heading[ai])
      return [p[0] + hv[0] * off, p[1] + hv[1] * off]
    }
    return null
  })
  const prevZ = B.map((b) => HEIGHT[b.states[0].h] ?? 0)
  const touchPhase = A.map(() => 0)

  for (let f = 0; f < n; f++) {
    const t = Math.min(f * dt, duration)

    // 1. bodies
    for (let i = 0; i < A.length; i++) {
      const a = A[i]
      const p = pAt(i, t)
      a.x[f] = p[0]
      a.y[f] = p[1]
      a.z[f] = heightOnTrack(a._tr, t)
      for (const s of a._tr.segs) if (s.dive && t >= s.t0 && t <= s.t1 + 0.35) a.dive[f] = 1
    }

    // 2. which ball state is active (needed for awareness)
    const active = B.map((b) => {
      while (b._si < b.states.length - 1 && b.states[b._si + 1].t0 <= t) b._si++
      return b.states[b._si]
    })

    // 3. headings
    for (let i = 0; i < A.length; i++) {
      const a = A[i]
      if (a.figure) continue
      const me = [a.x[f], a.y[f]]
      const v = sub(pAt(i, t + 0.04), pAt(i, t - 0.04))
      const speed = Math.hypot(v[0], v[1]) / 0.08
      let target = null
      let rate = 9
      const kick = a._a.kicks.find((k) => t >= k.t - 0.32 && t <= k.t + 0.08)
      if (kick) {
        target = angleOf(sub(kick.aim, me))
        rate = 16
      }
      if (target == null) {
        for (let j = 0; j < B.length; j++) {
          const s = active[j]
          if (s.type === 'flight' && s.to.who === a.id && prevBall[j]) {
            target = angleOf(sub(prevBall[j], me))
            rate = 14
          }
        }
      }
      if (target == null) {
        const fc = a._a.faces.find((q) => t >= q.t0 && t <= q.t1)
        if (fc) {
          const tp = faceTarget(fc.target, t, me)
          if (tp) target = angleOf(sub(tp, me))
        }
      }
      if (target == null && speed > 2.5 && !a.dive[f]) target = angleOf(v)
      const holding = active.some((s) => s.type === 'held' && s.who === a.id)
      if (target == null && !holding) {
        let best = null, bd = Infinity
        for (let j = 0; j < B.length; j++) {
          if (!prevBall[j]) continue
          const d = dist(prevBall[j], me)
          if (d < bd && d > 1) (bd = d), (best = prevBall[j])
        }
        if (best) {
          target = angleOf(sub(best, me))
          rate = 5
        }
      }
      if (target != null) {
        const k = f === 0 ? 1 : Math.min(1, rate * dt)
        heading[i] = heading[i] + wrapAngle(target - heading[i]) * k
      }
      a.h[f] = heading[i]

      // kick lean: the body drives through the ball
      a.lx[f] = 0
      a.ly[f] = 0
      for (const k of a._a.kicks) {
        const d = (t - k.t) / 0.14
        if (d > -1 && d < 1) {
          const amt = (k.hands ? 0.4 : 0.85) * (1 - Math.abs(d))
          const dir = unit(sub(k.aim, me))
          a.lx[f] += dir[0] * amt
          a.ly[f] += dir[1] * amt
        }
      }
    }

    // 4. balls
    for (let j = 0; j < B.length; j++) {
      const b = B[j]
      const s = active[j]
      const entering = s._entered !== true
      if (entering) {
        s._entered = true
        s._from = prevBall[j] ? [prevBall[j][0], prevBall[j][1], f ? b.z[f - 1] : prevZ[j]] : null
      }
      let x, y, z
      if (s.type === 'held') {
        const ai = idx[s.who]
        const a = A[ai]
        const hv = vecOf(a.h[f])
        const hh = HEIGHT[s.h] ?? 0
        let off = s.h === 'feet' ? FOOT : s.h === 'hands' || s.h === 'chest' ? HANDS : 1.2
        // dribble touches: ball is nudged ahead and gathered every few steps
        const v = sub(pAt(ai, t + 0.04), pAt(ai, t - 0.04))
        const sp = Math.hypot(v[0], v[1]) / 0.08
        if (s.h === 'feet' && sp > 2) {
          touchPhase[ai] += sp * dt
          off += 1.1 * (0.5 - 0.5 * Math.cos((touchPhase[ai] / 5.5) * TAU))
        }
        x = a.x[f] + hv[0] * off
        y = a.y[f] + hv[1] * off
        z = hh + a.z[f]
        const since = t - s.t0
        if (s._from && since < BLEND && f > 0) {
          const u = smooth(since / BLEND)
          x = s._from[0] + (x - s._from[0]) * u
          y = s._from[1] + (y - s._from[1]) * u
          z = s._from[2] + (z - s._from[2]) * u
        }
        b.holder[f] = ai
      } else if (s.type === 'flight') {
        if (!s._start) {
          s._start = s._from ? [s._from[0], s._from[1]] : [50, 32]
          s._z0 = s._from ? s._from[2] : s.z0
          if (s.to.who) {
            const ri = idx[s.to.who]
            const rp = pAt(ri, s.t1)
            const off = s.to.h === 'feet' ? FOOT : s.to.h === 'hands' || s.to.h === 'chest' ? HANDS : 1.2
            let dir = unit(sub(s._start, rp), null)
            if (!dir || dist(s._start, rp) < FOOT + 0.5) dir = vecOf(A[ri].h[f])
            s._end = add(rp, mul(dir, off))
            s._z1 = (HEIGHT[s.to.h] ?? 0) + heightOnTrack(A[ri]._tr, s.t1)
          } else {
            s._end = s.to.p
            s._z1 = s.to.z || 0
          }
        }
        const span = s.t1 - s.t0 || 1
        const u = clamp((t - s.t0) / span, 0, 1)
        let e
        if (s.arc || s.kind === 'toss' || s.kind === 'juggle') e = u
        else if (s.ease === 'shot') e = 1 - Math.pow(1 - u, 2.2) * 0.55 - (1 - u) * 0.45
        else e = 0.45 * u + 0.55 * (1 - (1 - u) * (1 - u)) // rolling ball loses pace but arrives with some
        const st = s._start, en = s._end
        x = st[0] + (en[0] - st[0]) * e
        y = st[1] + (en[1] - st[1]) * e
        if (s.curve) {
          const nrm = unit([-(en[1] - st[1]), en[0] - st[0]])
          const bend = s.curve * 4 * e * (1 - e)
          x += nrm[0] * bend
          y += nrm[1] * bend
        }
        z = s._z0 + (s._z1 - s._z0) * u + (s.arc || 0) * 4 * u * (1 - u)
      } else {
        // loose: rolls into its resting spot
        if (!s.p) s.p = s._from ? [s._from[0], s._from[1]] : s.est
        x = s.p[0]
        y = s.p[1]
        z = 0
        const since = t - s.t0
        if (s._from && since < BLEND && f > 0) {
          const u = smooth(since / BLEND)
          x = s._from[0] + (x - s._from[0]) * u
          y = s._from[1] + (y - s._from[1]) * u
          z = s._from[2] * (1 - u)
        }
      }
      b.x[f] = x
      b.y[f] = y
      b.z[f] = Math.max(0, z)
      const pb = prevBall[j]
      b.rot[f] = (f ? b.rot[f - 1] : 0) + (pb ? (dist(pb, [x, y]) / BALL_R) * (180 / Math.PI) : 0)
      prevBall[j] = [x, y]
    }
  }

  // ---- Coaching-board strokes ----
  const fi = (t) => clamp(Math.round(t * FPS), 0, n - 1)
  const strokes = []
  for (const b of B) {
    for (const s of b.states) {
      if (s.type !== 'flight' || s.kind === 'juggle') continue
      const i0 = fi(s.t0), i1 = fi(s.t1)
      if (i1 - i0 < 2) continue
      const pts = []
      for (let f = i0; f <= i1; f++) pts.push([b.x[f], b.y[f], f])
      strokes.push({ kind: s.kind === 'shot' ? 'shot' : s.kind === 'knock' ? 'knock' : 'pass', t0: s.t0, t1: s.t1, pts })
    }
  }
  for (const a of A) {
    for (const s of a._tr.segs) {
      if (s.dive) continue
      const i0 = fi(s.t0), i1 = fi(s.t1)
      let len = 0
      for (let f = i0 + 1; f <= i1; f++) len += Math.hypot(a.x[f] - a.x[f - 1], a.y[f] - a.y[f - 1])
      if (len < 5) continue
      let held = 0
      for (let f = i0; f <= i1; f++) if (B.some((b) => b.holder[f] === A.indexOf(a))) held++
      const dribble = held > (i1 - i0) * 0.6
      if (s.kind === 'dribble' && !dribble) warn(`${a.id} dribbles at ${s.t0.toFixed(2)}s without the ball`)
      const pts = []
      let acc = 0
      for (let f = i0; f <= i1; f++) {
        let px = a.x[f], py = a.y[f]
        if (f > i0) acc += Math.hypot(a.x[f] - a.x[f - 1], a.y[f] - a.y[f - 1])
        if (dribble && f > i0 && f < i1) {
          const tg = unit([a.x[Math.min(i1, f + 1)] - a.x[f - 1], a.y[Math.min(i1, f + 1)] - a.y[f - 1]])
          const w = 0.7 * Math.sin((acc / 3.2) * TAU)
          px += -tg[1] * w
          py += tg[0] * w
        }
        pts.push([px, py, f])
      }
      strokes.push({ kind: dribble ? 'dribble' : 'run', team: a.team, t0: s.t0, t1: s.t1, pts })
    }
  }

  // ---- Resolve effect positions ----
  const fx = []
  for (const e of effects) {
    const f = fi(e.t)
    const b = e.ball != null ? B.find((q) => q.id === e.ball) : null
    if (b) fx.push({ ...e, x: b.x[f], y: b.y[f] })
    else if (e.who != null && idx[e.who] != null) fx.push({ ...e, x: A[idx[e.who]].x[f], y: A[idx[e.who]].y[f] })
    else if (e.goal != null && field.goals[e.goal]) {
      const g = field.goals[e.goal]
      fx.push({ ...e, x: g.x, y: g.y })
    }
  }
  const hl = highlights.map((h) => {
    const tgt = h.target
    if (typeof tgt === 'string' && idx[tgt] != null) return { ...h, who: idx[tgt] }
    if (typeof tgt === 'string' && /^goal:/.test(tgt)) {
      const g = field.goals[+tgt.split(':')[1]]
      return { ...h, x: g?.x ?? 50, y: g?.y ?? 32, r: h.r || 8 }
    }
    return { ...h, x: tgt[0], y: tgt[1] }
  })
  const bub = bubbles.filter((q) => idx[q.who] != null).map((q) => ({ ...q, ai: idx[q.who] }))

  // ---- Validation: things that look wrong to a coach ----
  const overlapSeen = new Set()
  // tokens keep a little daylight between them (readable on a phone),
  // except in the moment of a tackle / tag
  const busy = (t) => fx.some((e) => (e.kind === 'tackle' && Math.abs(e.t - t) < 0.6) || (e.kind === 'tag' && Math.abs(e.t - t) < 0.9))
  for (let f = 0; f < n; f += 3) {
    for (let i = 0; i < A.length; i++) {
      const a = A[i]
      if (a.figure) continue
      if (a.x[f] < 0.5 || a.x[f] > 99.5 || a.y[f] < 0.5 || a.y[f] > 63.5) {
        const key = 'oob' + i
        if (!overlapSeen.has(key)) overlapSeen.add(key), warn(`${a.id} leaves the pitch at ${(f / FPS).toFixed(2)}s`)
      }
      if (f > 0 && !a.dive[f]) {
        const sp = Math.hypot(a.x[f] - a.x[f - 3], a.y[f] - a.y[f - 3]) / (3 / FPS)
        const key = 'spd' + i
        if (sp > MAX_PLAYER_SPEED && !overlapSeen.has(key)) overlapSeen.add(key), warn(`${a.id} moves implausibly fast (${sp.toFixed(0)} u/s) at ${(f / FPS).toFixed(2)}s`)
      }
      for (let j = i + 1; j < A.length; j++) {
        const b = A[j]
        if (b.figure) continue
        if (Math.hypot(a.x[f] - b.x[f], a.y[f] - b.y[f]) < PLAYER_R * 2.4 && !busy(f / FPS)) {
          const key = a.id + '|' + b.id
          if (!overlapSeen.has(key)) overlapSeen.add(key), warn(`${a.id} and ${b.id} get within touching distance at ${(f / FPS).toFixed(2)}s`)
        }
      }
    }
  }

  // captions carry forward until replaced
  let say = ''
  const captions = beats.map((b) => {
    if (b.say) say = b.say
    return { t0: b.t0, t1: b.t1, say, own: !!b.say }
  })

  for (const a of A) {
    delete a._a
    delete a._tr
  }
  for (const b of B) delete b.states

  return {
    duration,
    fps: FPS,
    n,
    field,
    area: raw.area || raw.areaLabel,
    trails: raw.trails ?? true,
    actors: A,
    balls: B,
    strokes,
    effects: fx,
    bubbles: bub,
    highlights: hl,
    beats: captions,
    fade,
    warnings,
  }
}

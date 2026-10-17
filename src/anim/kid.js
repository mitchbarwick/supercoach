// ============================================================
// SuperCoach kids — illustrated players for drills that need to show
// HOW a body is positioned (stretches, cool-downs).
//
// Everything is drawn from a pose skeleton, so poses blend, any team
// colour works and a new stretch is data, not artwork. What keeps it
// from looking like a puppet:
//   • Merged silhouettes. Parts are drawn in depth GROUPS (far arm,
//     legs, body, near arm, head). Each group gets ONE outline pass
//     under all its fills, so a group reads as a single shape; only
//     real edges (hems, fringe, overlaps) get thin interior lines.
//   • Smooth limbs. Arms and legs are tubes along a spline through the
//     joints with a muscle profile (thigh → knee → calf → ankle), and
//     garments are sections of the same tube with curved hems.
//   • Soft shading. Gradients across each limb (lit from the top left),
//     radial light on head / torso / hair, soft contact shadows.
//   • Real views. Front, three-quarter, side and back each have their
//     own head, torso and boot drawing, with near / far limb depth.
//
// Units: feet at y = 0, up is negative; a standing kid ≈ 12.4 tall.
// renderKid() returns an SVG string (wrapped by the React component in
// Actors.jsx) so it is cheap per frame and can render character sheets.
// ============================================================

// ---------- palette ----------
export const OUTLINE = '#4a2a1c'
const LINE = 'rgba(74,42,28,0.7)' // interior lines
export const SKINS = [
  { base: '#f7c7a0', light: '#ffdcbd', shade: '#e6a77c', deep: '#cc8a5e' },
  { base: '#e8a676', light: '#f6c095', shade: '#cc8656', deep: '#ad6a40' },
  { base: '#bd8052', light: '#d79c6d', shade: '#9b6038', deep: '#80492a' },
  { base: '#85542f', light: '#a06c44', shade: '#673f22', deep: '#4f2f19' },
]
export const HAIRS = {
  brown: '#5d3721', chestnut: '#8e5629', black: '#2a1f1a', blonde: '#d39f50', auburn: '#9b4524', dark: '#3e261a',
}

// ---------- maths ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const dot = (a, b) => a[0] * b[0] + a[1] * b[1]
const len = (a) => Math.hypot(a[0], a[1]) || 1e-6
const norm = (a) => mul(a, 1 / len(a))
const perp = (a) => [-a[1], a[0]]
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
const r2 = (n) => Math.round(n * 100) / 100
const P = (p) => `${r2(p[0])} ${r2(p[1])}`
const rot = (v, deg) => { const a = (deg * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a); return [v[0] * c - v[1] * s, v[0] * s + v[1] * c] }
const smooth = (u) => u * u * (3 - 2 * u)

export function tint(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))
  return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}
// warm / cool shift for shading: shadows lean warmer-darker, lights a touch creamy
const ramp = (base) => ({ base, light: tint(base, 0.2), shade: tint(base, -0.22), deep: tint(base, -0.36) })

// ---------- smooth closed path through points ----------
function smoothClosed(pts) {
  const n = pts.length
  const m = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]
  let d = `M${P(m(pts[n - 1], pts[0]))}`
  for (let i = 0; i < n; i++) d += `Q${P(pts[i])} ${P(m(pts[i], pts[(i + 1) % n]))}`
  return d + 'Z'
}

// ---------- splines & tubes ----------
function spline(pts, per = 9) {
  const raw = []
  if (pts.length === 2) {
    for (let k = 0; k <= per * 2; k++) raw.push(lerp(pts[0], pts[1], k / (per * 2)))
  } else {
    const cr = (p0, p1, p2, p3, t) => {
      const t2 = t * t, t3 = t2 * t
      return [0, 1].map((i) => 0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t2 + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t3))
    }
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)]
      for (let k = 0; k < per; k++) raw.push(cr(p0, p1, p2, p3, k / per))
    }
    raw.push(pts[pts.length - 1])
  }
  const L = [0]
  for (let i = 1; i < raw.length; i++) L.push(L[i - 1] + len(sub(raw[i], raw[i - 1])))
  const total = L[L.length - 1] || 1e-6
  // where each control joint sits along the curve (0..1)
  const joints = pts.map((p) => {
    let best = 0, bd = Infinity
    raw.forEach((q, i) => { const d = len(sub(p, q)); if (d < bd) { bd = d; best = i } })
    return L[best] / total
  })
  return { pts: raw, s: L.map((l) => l / total), total, joints }
}

function at(spl, s) {
  const { pts, s: S } = spl
  if (s <= 0) return { p: pts[0], t: norm(sub(pts[1], pts[0])) }
  if (s >= 1) return { p: pts[pts.length - 1], t: norm(sub(pts[pts.length - 1], pts[pts.length - 2])) }
  let i = 0
  while (i < S.length - 2 && S[i + 1] < s) i++
  const u = (s - S[i]) / Math.max(1e-6, S[i + 1] - S[i])
  const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 2)]
  return { p: lerp(pts[i], pts[i + 1], u), t: norm(sub(b, a)) }
}

// radius profile: [[s, r], …] eased between stops
function profile(stops) {
  return (s) => {
    if (s <= stops[0][0]) return stops[0][1]
    for (let i = 0; i < stops.length - 1; i++) {
      const [s0, r0] = stops[i], [s1, r1] = stops[i + 1]
      if (s <= s1) return r0 + (r1 - r0) * smooth((s - s0) / Math.max(1e-6, s1 - s0))
    }
    return stops[stops.length - 1][1]
  }
}

// Outline of a tube section [s0, s1]. caps: 'round' | 'hem' (a curved
// cross-section, like a sleeve or sock edge seen slightly from above).
function tube(spl, rAt, s0 = 0, s1 = 1, cap0 = 'round', cap1 = 'round', bulge = 0.32, n0 = 12) {
  const n = SMALL ? Math.max(6, Math.round(n0 * 0.7)) : n0
  const L = [], R = []
  for (let k = 0; k <= n; k++) {
    const s = s0 + ((s1 - s0) * k) / n
    const { p, t } = at(spl, s), nn = perp(t), r = rAt(s)
    L.push(add(p, mul(nn, r)))
    R.push(add(p, mul(nn, -r)))
  }
  const pts = [...L]
  const capPts = (s, sign, kind) => {
    const { p, t } = at(spl, s), nn = perp(t), r = rAt(s), out = []
    const steps = 5
    for (let k = 1; k < steps; k++) {
      const th = (Math.PI * k) / steps
      const along = kind === 'round' ? r * Math.sin(th) * sign : r * bulge * Math.sin(th)
      out.push(add(p, add(mul(nn, r * Math.cos(th) * sign), mul(t, along))))
    }
    return out
  }
  pts.push(...capPts(s1, 1, cap1))
  pts.push(...R.reverse())
  pts.push(...capPts(s0, -1, cap0).map((q) => q))
  return smoothClosed(pts)
}

// Curved line across a tube at s (a hem / stripe edge)
function hemLine(spl, rAt, s, bulge = 0.32, inset = 0.02) {
  const { p, t } = at(spl, s), nn = perp(t), r = rAt(s) - inset
  const a = add(p, mul(nn, r)), b = add(p, mul(nn, -r))
  return `M${P(a)}Q${P(add(p, mul(t, r * bulge * 2)))} ${P(b)}`
}

// ---------- gradients (ids unique per kid render) ----------
function makeGrads(uid) {
  let n = 0
  const defs = []
  const stops = (list) => list.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null && a < 1 ? ` stop-opacity="${a}"` : ''}/>`).join('')
  return {
    defs,
    lin(p1, p2, list) {
      const id = `${uid}${n++}`
      defs.push(`<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${r2(p1[0])}" y1="${r2(p1[1])}" x2="${r2(p2[0])}" y2="${r2(p2[1])}">${stops(list)}</linearGradient>`)
      return `url(#${id})`
    },
    // radial gradient squashed to an ellipse (fades out exactly at rx, ry)
    radE(c, rx, ry, list, deg = 0) {
      const id = `${uid}${n++}`
      defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${r2(c[0])} ${r2(c[1])}) rotate(${r2(deg)}) scale(${r2(rx)} ${r2(ry)})">${stops(list)}</radialGradient>`)
      return `url(#${id})`
    },
    rad(c, r, list, f) {
      const id = `${uid}${n++}`
      const fx = f ? ` fx="${r2(f[0])}" fy="${r2(f[1])}"` : ''
      defs.push(`<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${r2(c[0])}" cy="${r2(c[1])}" r="${r2(r)}"${fx}>${stops(list)}</radialGradient>`)
      return `url(#${id})`
    },
  }
}

// ---------- groups: one outline pass under all fills ----------
const W = 0.1 // visible silhouette line width
// Each shape is defined once and drawn twice through <use>: first fat and
// dark (outline pass), then with its fill. Ids come from the current render.
let GID = { prefix: 'g', n: 0, defs: null }
let SMALL = false // drill-size drawing: skip detail too fine to see
function group(items) {
  let outline = '', fills = ''
  for (const it of items) {
    if (!it) continue
    if (typeof it === 'string') { fills += it; continue }
    if (it.outline === false) { fills += `<path d="${it.d}" fill="${it.fill}"/>`; continue }
    const id = `${GID.prefix}${GID.n++}`
    GID.defs.push(`<path id="${id}" d="${it.d}"/>`)
    outline += `<use href="#${id}" fill="${OUTLINE}" stroke="${OUTLINE}" stroke-width="${W * 2}" stroke-linejoin="round"/>`
    fills += `<use href="#${id}" fill="${it.fill}"${it.opacity != null ? ` opacity="${it.opacity}"` : ''}/>`
  }
  return outline + fills
}
const iline = (d, w = 0.085, col = LINE) => `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`
// tapered stroke (thick in the middle) for strands, folds, brows, highlights
function taper(a, b, w, bend = 0, fill = LINE, opacity = 1) {
  const d = sub(b, a), nn = norm(perp(d)), m = add(lerp(a, b, 0.5), mul(nn, bend))
  return `<path d="M${P(a)}Q${P(add(m, mul(nn, w)))} ${P(b)}Q${P(add(m, mul(nn, -w * 0.35)))} ${P(a)}Z" fill="${fill}"${opacity < 1 ? ` opacity="${opacity}"` : ''}/>`
}

// Gradient across a limb so it reads as a cylinder lit from the top left
function limbGrad(G, a, b, r, c, LT, far) {
  const mid = lerp(a, b, 0.5), nn = norm(perp(sub(b, a)))
  const lit = dot(nn, LT) >= 0 ? nn : mul(nn, -1)
  const k = far ? -0.1 : 0
  return G.lin(add(mid, mul(lit, r * 1.05)), add(mid, mul(lit, -r * 1.05)), [
    [0, tint(c.light, k)], [0.35, tint(c.base, k)], [0.8, tint(c.shade, k)], [1, tint(c.deep, k)],
  ])
}

// ============================================================
// POSES — joints in kid units, authored facing +x (flip to face left).
// view: front | three | side | back. In three / side views `near` is the
// limb set closer to us ('L' = screen-left limbs by default in three,
// 'R' in side). `front` = arms drawn in front of the body. Hand states:
// open | fist | grip. `effort` = little motion ticks [[x, y, angle°]].
// ============================================================
const STAND_LEGS = { kneeL: [-0.85, -2.05], footL: [-0.95, 0], kneeR: [0.85, -2.05], footR: [0.95, 0] }
export const POSES = {
  stand: { view: 'front', head: [0, -9.6], neck: [0, -6.9], hip: [0, -3.95],
    elbowL: [-2.08, -4.95], handL: [-2.32, -3.05], elbowR: [2.08, -4.95], handR: [2.32, -3.05], ...STAND_LEGS },
  standSide: { view: 'side', head: [0.35, -9.6], neck: [0.1, -6.9], hip: [0, -3.95],
    elbowL: [-0.65, -5.0], handL: [-0.35, -3.15], elbowR: [-0.35, -4.95], handR: [0.1, -3.1],
    kneeL: [-0.25, -2.05], footL: [-0.35, 0], kneeR: [0.25, -2.05], footR: [0.35, 0] },
  handsOnHips: { view: 'front', head: [0.1, -9.6], neck: [0, -6.9], hip: [0, -3.95],
    elbowL: [-2.55, -5.45], handL: [-1.72, -4.05], handLState: 'fist', elbowR: [2.55, -5.45], handR: [1.72, -4.05], handRState: 'fist',
    kneeL: [-1.0, -2.05], footL: [-1.3, 0], kneeR: [1.0, -2.05], footR: [1.3, 0] },
  reachUp: { view: 'three', head: [-1.2, -9.4], neck: [-0.55, -6.85], hip: [0, -3.95],
    elbowL: [-2.6, -5.3], handL: [-1.45, -4.15], handLState: 'fist',
    elbowR: [2.2, -10.0], handR: [0.4, -12.55], handRState: 'open', overHead: ['R'],
    kneeL: [-1.25, -2.05], footL: [-1.85, 0], kneeR: [1.25, -2.05], footR: [1.85, 0],
    effort: [[2.9, -12.35, -30], [3.5, -11.2, 0], [3.35, -10.0, 25]] },
  quadHold: { view: 'three', head: [-0.15, -9.6], neck: [-0.05, -6.9], hip: [0, -3.95],
    elbowL: [-2.75, -6.4], handL: [-3.95, -6.05], handLState: 'fist',
    elbowR: [2.25, -5.0], handR: [2.7, -3.3], handRState: 'grip',
    kneeL: [-0.55, -2.05], footL: [-0.55, 0], kneeR: [0.85, -1.85], footR: [2.55, -3.05], liftR: true, front: ['L', 'R'],
    effort: [[-4.9, -7.15, -20], [-5.2, -5.65, 15], [3.85, -3.9, -10]] },
  armAcross: { view: 'three', head: [0.3, -9.6], neck: [0, -6.9], hip: [0, -3.95],
    elbowL: [-1.75, -5.3], handL: [-0.55, -6.1], handLState: 'grip',
    elbowR: [-0.45, -6.3], handR: [-3.2, -6.3], handRState: 'fist',
    kneeL: [-0.95, -2.05], footL: [-1.15, 0], kneeR: [0.95, -2.05], footR: [1.15, 0],
    front: ['R', 'L'], effort: [[3.0, -7.4, -30], [3.55, -6.2, 0]] },
  breathe: { view: 'front', head: [0, -9.65], neck: [0, -6.95], hip: [0, -3.95],
    elbowL: [-2.55, -7.0], handL: [-3.55, -8.6], elbowR: [2.55, -7.0], handR: [3.55, -8.6], ...STAND_LEGS, expr: 'calm' },
  cheer: { view: 'front', head: [0, -9.65], neck: [0, -6.95], hip: [0, -3.95],
    elbowL: [-2.25, -8.55], handL: [-2.05, -10.95], handLState: 'fist', elbowR: [2.25, -8.55], handR: [2.05, -10.95], handRState: 'fist',
    ...STAND_LEGS, expr: 'happy', effort: [[-3.4, -11.6, -35], [3.4, -11.6, 35]] },
  armsAround: { view: 'front', head: [0, -9.6], neck: [0, -6.9], hip: [0, -3.95],
    elbowL: [-2.55, -6.15], handL: [-4.05, -6.5], elbowR: [2.55, -6.15], handR: [4.05, -6.5], ...STAND_LEGS, expr: 'grin' },
  // folding forward towards the viewer: head drops over the hips, hands to the boots
  toeTouch: { view: 'front', head: [0, -6.6], neck: [0, -5.45], hip: [0, -3.95],
    elbowL: [-1.5, -3.0], handL: [-0.95, -0.95], elbowR: [1.5, -3.0], handR: [0.95, -0.95],
    kneeL: [-0.75, -2.05], footL: [-0.85, 0], kneeR: [0.75, -2.05], footR: [0.85, 0], expr: 'focus' },
  lunge: { view: 'side', head: [0.4, -8.75], neck: [0.25, -6.05], hip: [0, -3.15],
    elbowL: [0.8, -4.4], handL: [1.55, -3.45], elbowR: [1.0, -4.3], handR: [1.75, -3.35],
    kneeL: [2.15, -2.3], footL: [2.4, 0], kneeR: [-1.35, -0.75], footR: [-3.35, 0] },
  butterfly: { view: 'front', head: [0, -7.5], neck: [0, -4.85], hip: [0, -1.25],
    elbowL: [-1.9, -2.75], handL: [-0.45, -0.85], handLState: 'grip', elbowR: [1.9, -2.75], handR: [0.45, -0.85], handRState: 'grip',
    kneeL: [-2.8, -1.1], footL: [-0.35, -0.3], kneeR: [2.8, -1.1], footR: [0.35, -0.3], sit: true, expr: 'calm' },
  sitReach: { view: 'side', head: [2.5, -5.8], neck: [1.45, -3.7], hip: [0, -1.15],
    elbowL: [3.55, -2.3], handL: [5.2, -1.3], handLState: 'grip', elbowR: [3.7, -2.2], handR: [5.35, -1.2], handRState: 'grip',
    kneeL: [2.75, -0.72], footL: [5.6, -0.62], kneeR: [2.75, -0.62], footR: [5.6, -0.52], sit: true, front: ['R'], expr: 'calm' },
  sitTall: { view: 'side', head: [0.5, -7.5], neck: [0.25, -4.85], hip: [0, -1.15],
    elbowL: [1.1, -2.95], handL: [2.3, -1.65], elbowR: [1.3, -2.85], handR: [2.5, -1.55],
    kneeL: [2.7, -0.72], footL: [5.4, -0.62], kneeR: [2.7, -0.62], footR: [5.4, -0.52], sit: true },
  sitCross: { view: 'front', head: [0, -7.5], neck: [0, -4.85], hip: [0, -1.25],
    elbowL: [-2.1, -2.95], handL: [-2.5, -1.45], elbowR: [2.1, -2.95], handR: [2.5, -1.45],
    kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, expr: 'calm' },
  // the twist: hand on the opposite knee, the other arm reaching round
  // behind to high-five the partner (both reach to the viewer's left)
  twistFront: { view: 'three', head: [-0.35, -7.5], neck: [-0.1, -4.85], hip: [0, -1.25],
    elbowL: [-2.75, -3.6], handL: [-4.1, -3.15], handLState: 'open',
    elbowR: [0.75, -2.95], handR: [-1.6, -1.6], handRState: 'grip',
    kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, expr: 'grin',
    front: ['L', 'R'], effort: [[-5.2, -4.2, -15]] },
  twistBack: { view: 'back', head: [-0.3, -7.5], neck: [-0.1, -4.85], hip: [0, -1.25],
    elbowL: [-2.75, -3.55], handL: [-3.95, -3.35], handLState: 'open',
    elbowR: [0.7, -2.9], handR: [1.9, -1.5],
    kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, front: ['L'] },
  // two extremes of a jog stride (side view)
  strideA: { view: 'side', head: [0.75, -9.4], neck: [0.4, -6.8], hip: [0, -3.9],
    elbowL: [1.15, -5.3], handL: [1.95, -5.95], handLState: 'fist', elbowR: [-0.95, -5.0], handR: [-1.3, -3.95], handRState: 'fist',
    kneeL: [-0.75, -1.95], footL: [-1.85, -0.45], kneeR: [1.15, -2.3], footR: [1.05, 0] },
  strideB: { view: 'side', head: [0.75, -9.4], neck: [0.4, -6.8], hip: [0, -3.9],
    elbowL: [-0.95, -5.0], handL: [-1.3, -3.95], handLState: 'fist', elbowR: [1.15, -5.3], handR: [1.95, -5.95], handRState: 'fist',
    kneeL: [1.15, -2.3], footL: [1.05, 0], kneeR: [-0.75, -1.95], footR: [-1.85, -0.45] },
}
POSES.sideBend = POSES.reachUp
POSES.sitCrossBack = { ...POSES.sitCross, view: 'back', front: [] }

// ============================================================
// HAIR (front / three views): a soft mass round the skull, flicks
// breaking the silhouette, fringe clumps over the forehead.
// Angles in degrees round the head centre, 0 = up, + = clockwise.
// ============================================================
const HAIR_STYLES = {
  tufts: {
    from: -100, to: 100, r: 2.95, lobes: 7, amp: 0.42,
    flicks: [[-88, 0.5, -1], [-55, 0.72, 1], [-20, 1.0, 1], [14, 1.08, 1], [48, 0.9, 1], [84, 0.6, 1]],
    fringe: [[-58, -1.3, 0.8, 0.9], [-26, -1.25, 0.92, 1.3], [8, -1.35, 0.85, 1.2], [46, -1.45, 0.6, 0.45]],
  },
  swept: {
    from: -100, to: 100, r: 2.88, lobes: 7, amp: 0.26,
    flicks: [[-62, 0.6, -1], [52, 0.75, 1]],
    fringe: [[-50, -1.1, 0.88, 1.0], [-16, -0.95, 0.88, 1.1], [20, -1.0, 0.78, 0.9]],
  },
  curly: { curls: true },
  ponytail: {
    from: -100, to: 100, r: 2.78, lobes: 6, amp: 0.14, smooth: true, tail: true, locks: true,
    flicks: [],
    fringe: [[-42, -1.05, 0.8, 0.75], [-10, -0.92, 0.85, 0.85], [24, -1.0, 0.74, 0.7]],
  },
}
// Hand-drawn front hair shapes, as path commands relative to the head
// centre: crown tufts flowing to the right, a fringe of clumps swept
// right that stops above the brows. `k` scales tuft height per style.
function hairShape(c, style, k = 1, mirror = false) {
  const X = (x) => r2(c[0] + (mirror ? -x : x)), Y = (y) => r2(c[1] + y)
  const tu = (y) => (y < -2.6 ? -2.6 + (y + 2.6) * k : y) // squash tufts above the skull
  const segs = style === 'swept' ? HAIR_SWEPT : style === 'ponytail' ? HAIR_PONY : HAIR_TUFTS
  return segs.map(([cmd, ...n]) => {
    const pts = []
    for (let i = 0; i < n.length; i += 2) pts.push(`${X(n[i])} ${Y(tu(n[i + 1]))}`)
    return cmd + pts.join(' ')
  }).join('') + 'Z'
}
const HAIR_TUFTS = [
  ['M', -2.35, 0.05],
  ['C', -2.72, -0.4, -2.88, -1.0, -2.78, -1.45],
  ['C', -3.05, -1.5, -3.22, -1.72, -3.22, -1.98],
  ['C', -2.88, -1.88, -2.72, -1.98, -2.56, -2.35],
  ['C', -2.36, -2.95, -1.92, -3.28, -1.55, -3.35],
  ['C', -1.62, -3.68, -1.86, -3.92, -2.12, -4.06],
  ['C', -1.45, -4.05, -0.96, -3.72, -0.76, -3.46],
  ['C', -0.5, -3.88, -0.08, -4.16, 0.46, -4.24],
  ['C', 0.26, -3.96, 0.24, -3.72, 0.4, -3.5],
  ['C', 0.96, -3.82, 1.6, -3.86, 2.22, -3.74],
  ['C', 1.96, -3.56, 1.86, -3.36, 1.94, -3.14],
  ['C', 2.6, -3.0, 3.06, -2.56, 3.26, -2.1],
  ['C', 2.96, -2.06, 2.86, -1.96, 2.86, -1.8],
  ['C', 3.0, -1.2, 2.84, -0.48, 2.4, 0.0],
  // fringe, right to left: clumps swept right, tips above the brows
  ['C', 2.38, -0.3, 2.3, -0.58, 2.18, -0.74],
  ['C', 1.98, -0.9, 1.75, -1.18, 1.6, -1.55],
  ['C', 1.55, -1.25, 1.48, -1.02, 1.35, -0.86],
  ['C', 1.05, -0.98, 0.76, -1.22, 0.6, -1.58],
  ['C', 0.55, -1.3, 0.48, -1.08, 0.35, -0.92],
  ['C', 0.05, -1.02, -0.24, -1.26, -0.4, -1.6],
  ['C', -0.45, -1.36, -0.5, -1.16, -0.6, -1.04],
  ['C', -0.9, -1.15, -1.2, -1.36, -1.4, -1.6],
  ['C', -1.45, -1.36, -1.55, -1.12, -1.7, -0.98],
  ['C', -1.95, -0.85, -2.2, -0.45, -2.35, 0.05],
]
const HAIR_PONY = [
  ['M', -2.35, 0.1],
  ['C', -2.82, -0.6, -2.96, -1.5, -2.62, -2.3],
  ['C', -2.12, -3.22, -1.0, -3.56, 0.1, -3.56],
  ['C', 1.3, -3.56, 2.42, -3.06, 2.76, -2.1],
  ['C', 2.96, -1.4, 2.86, -0.5, 2.45, 0.05],
  // side-parted fringe sweeping right, down to the right temple
  ['C', 2.22, -0.42, 1.62, -0.7, 0.92, -0.9],
  ['C', 0.22, -1.1, -0.45, -1.42, -0.85, -2.0],
  ['C', -1.5, -2.05, -2.2, -1.5, -2.45, -0.55],
  ['C', -2.5, -0.3, -2.45, -0.05, -2.35, 0.1],
]
const HAIR_SWEPT = [
  ['M', -2.35, 0.05],
  ['C', -2.75, -0.5, -2.95, -1.3, -2.75, -2.05],
  ['C', -2.45, -3.05, -1.4, -3.65, -0.1, -3.7],
  ['C', 1.2, -3.75, 2.35, -3.25, 2.85, -2.35],
  ['C', 3.2, -2.25, 3.35, -2.05, 3.4, -1.8],
  ['C', 3.15, -1.75, 3.0, -1.6, 2.95, -1.4],
  ['C', 2.95, -0.85, 2.75, -0.35, 2.4, 0.0],
  ['C', 2.3, -0.45, 2.05, -0.82, 1.7, -1.05],
  ['C', 1.25, -1.15, 0.7, -1.35, 0.35, -1.62],
  ['C', 0.15, -1.3, -0.25, -1.05, -0.75, -0.98],
  ['C', -1.15, -1.0, -1.5, -1.2, -1.75, -1.5],
  ['C', -1.95, -1.05, -2.2, -0.5, -2.35, 0.05],
]

const polar = (c, deg, r) => [c[0] + Math.sin((deg * Math.PI) / 180) * r, c[1] - Math.cos((deg * Math.PI) / 180) * r]

function hairMass(c, S) {
  let d = `M${P(polar(c, S.from, 2.3))}L${P(polar(c, S.from, S.r))}`
  for (let i = 0; i < S.lobes; i++) {
    const a0 = S.from + ((S.to - S.from) * i) / S.lobes, a1 = S.from + ((S.to - S.from) * (i + 1)) / S.lobes
    d += `Q${P(polar(c, (a0 + a1) / 2, S.r + S.amp))} ${P(polar(c, a1, S.r))}`
  }
  d += `L${P(polar(c, S.to, 2.3))}C${P(polar(c, 35, 2.3))} ${P(polar(c, -35, 2.3))} ${P(polar(c, S.from, 2.3))}Z`
  return d
}
function flickPath(c, S, deg, size, dir) {
  const base = polar(c, deg, S.r + S.amp * 0.4)
  const out = norm(sub(base, c)), tan = [out[1] * -dir, -out[0] * -dir]
  const tip = add(base, add(mul(out, size * 0.85), mul(tan, size * 0.55)))
  const b1 = add(base, mul(tan, -0.6)), b2 = add(base, mul(tan, 0.45))
  // a tapered tuft: wide at the root, leaning with the flow, pointed tip
  return `M${P(add(b1, mul(out, -0.4)))}C${P(add(b1, mul(out, 0.55)))} ${P(add(tip, add(mul(out, -0.15), mul(tan, -0.45))))} ${P(tip)}C${P(add(tip, add(mul(out, -0.45), mul(tan, -0.05))))} ${P(add(b2, mul(out, 0.35)))} ${P(add(b2, mul(out, -0.4)))}Z`
}
function fringeClump(c, deg, endY, w, sweep) {
  const root = polar(c, deg, 2.15)
  const tip = [root[0] + sweep, c[1] + endY]
  const d = sub(tip, root), nn = norm(perp(d)), m = lerp(root, tip, 0.5)
  const bow = mul(nn, -0.3 * Math.sign(sweep || 1))
  const A = add(root, mul(nn, w)), CA = add(add(m, mul(nn, w * 0.9)), bow)
  const B = add(root, mul(nn, -w)), CB = add(add(m, mul(nn, -w * 0.8)), bow)
  const q = (p0, p1, p2, u) => add(add(mul(p0, (1 - u) * (1 - u)), mul(p1, 2 * u * (1 - u))), mul(p2, u * u))
  // lower part of each edge only, so neighbouring clumps don't scribble on the crown
  const ea = q(A, CA, tip, 0.5), eb = q(B, CB, tip, 0.5)
  const edge = `M${P(ea)}Q${P(lerp(CA, tip, 0.5))} ${P(tip)}Q${P(lerp(CB, tip, 0.5))} ${P(eb)}`
  return { d: `M${P(A)}Q${P(CA)} ${P(tip)}Q${P(CB)} ${P(B)}Z`, root, tip, edge }
}

// ============================================================
// HEAD
// ============================================================
const HR = 2.45 // head radius
function headOutline(c, view) {
  const x = c[0], y = c[1], R = HR
  // wide cheeks, soft chin
  return `M${r2(x)} ${r2(y - R)}C${r2(x + R * 0.62)} ${r2(y - R)} ${r2(x + R * 1.02)} ${r2(y - R * 0.55)} ${r2(x + R)} ${r2(y + R * 0.14)}` +
    `C${r2(x + R * 0.98)} ${r2(y + R * 0.66)} ${r2(x + R * 0.55)} ${r2(y + R * 0.9)} ${r2(x)} ${r2(y + R * 0.9)}` +
    `C${r2(x - R * 0.55)} ${r2(y + R * 0.9)} ${r2(x - R * 0.98)} ${r2(y + R * 0.66)} ${r2(x - R)} ${r2(y + R * 0.14)}` +
    `C${r2(x - R * 1.02)} ${r2(y - R * 0.55)} ${r2(x - R * 0.62)} ${r2(y - R)} ${r2(x)} ${r2(y - R)}Z`
}
const ellipse = (c, rx, ry, deg = 0) => {
  const pts = []
  for (let k = 0; k < 16; k++) {
    const a = (k / 16) * Math.PI * 2
    pts.push(add(c, rot([Math.cos(a) * rx, Math.sin(a) * ry], deg)))
  }
  return smoothClosed(pts)
}

function eyes(G, ex, ey, rx, ry, expr, blink, closedSide) {
  const ink = '#1f130d'
  if (blink || expr === 'happy' || closedSide) {
    const curve = expr === 'happy' || closedSide ? -0.5 : 0.2
    return `<path d="M${r2(ex - rx * 1.1)} ${r2(ey + 0.12)}Q${r2(ex)} ${r2(ey + curve)} ${r2(ex + rx * 1.1)} ${r2(ey + 0.12)}" fill="none" stroke="${ink}" stroke-width="0.22" stroke-linecap="round"/>`
  }
  let s = `<path d="${ellipse([ex, ey], rx, ry)}" fill="${G.lin([ex, ey - ry], [ex, ey + ry], [[0, '#140b07'], [1, '#3a2316']])}"/>`
  s += `<path d="${ellipse([ex + rx * 0.28, ey - ry * 0.36], rx * 0.36, ry * 0.26)}" fill="#fff"/>`
  return s
}

function brow(ex, ey, w, hairCol, tilt = 0) {
  const a = [ex - w, ey + tilt], b = [ex + w, ey - tilt * 0.4]
  return taper(a, b, 0.26, -0.12, tint(hairCol, -0.3))
}

function mouth(G, mx, my, expr, scale = 1) {
  const k = scale
  if (expr === 'oh') return `<path d="${ellipse([mx, my + 0.15 * k], 0.27 * k, 0.33 * k)}" fill="#7b2420"/>` + iline(ellipse([mx, my + 0.15 * k], 0.27 * k, 0.33 * k), 0.07)
  if (expr === 'calm' || expr === 'focus' || expr === 'wink') {
    const c = expr === 'focus' ? 0.14 : 0.36
    return `<path d="M${r2(mx - 0.48 * k)} ${r2(my)}Q${r2(mx)} ${r2(my + c * k)} ${r2(mx + 0.48 * k)} ${r2(my)}" fill="none" stroke="#5e2416" stroke-width="0.17" stroke-linecap="round"/>`
  }
  const w = (expr === 'happy' ? 0.58 : 0.64) * k, h = 0.82 * k
  const d = `M${r2(mx - w)} ${r2(my - 0.06)}Q${r2(mx)} ${r2(my + 0.04)} ${r2(mx + w)} ${r2(my - 0.06)}Q${r2(mx + w * 0.85)} ${r2(my + h)} ${r2(mx)} ${r2(my + h)}Q${r2(mx - w * 0.85)} ${r2(my + h)} ${r2(mx - w)} ${r2(my - 0.06)}Z`
  let s = `<path d="${d}" fill="${G.lin([mx, my], [mx, my + h], [[0, '#5a1414'], [1, '#8e2c26']])}"/>`
  s += `<path d="M${r2(mx - w * 0.8)} ${r2(my - 0.02)}L${r2(mx + w * 0.8)} ${r2(my - 0.02)}L${r2(mx + w * 0.68)} ${r2(my + 0.19 * k)}Q${r2(mx)} ${r2(my + 0.24 * k)} ${r2(mx - w * 0.68)} ${r2(my + 0.19 * k)}Z" fill="#fff"/>`
  s += `<path d="M${r2(mx - 0.4 * k)} ${r2(my + h * 0.74)}Q${r2(mx)} ${r2(my + h * 0.38)} ${r2(mx + 0.4 * k)} ${r2(my + h * 0.74)}Q${r2(mx)} ${r2(my + h)} ${r2(mx - 0.4 * k)} ${r2(my + h * 0.74)}Z" fill="#ff7e86"/>`
  s += iline(d, 0.075)
  return s
}

function softBlob(G, c, rx, ry, col, a, deg = 0) {
  return `<path d="${ellipse(c, rx, ry, deg)}" fill="${G.radE(c, rx, ry, [[0, col, a], [0.55, col, a * 0.55], [1, col, 0]], deg)}"/>`
}
function blush(G, cx, cy, rx = 0.66, ry = 0.42) {
  return softBlob(G, [cx, cy], rx, ry, '#ff7468', 0.6)
}

function head(G, c, o, view, kit, LT) {
  const skin = o.skin, hairCol = o.hairColour
  const S = HAIR_STYLES[o.hair] || HAIR_STYLES.tufts
  const hr = ramp(hairCol)
  const skinFill = G.rad(add(c, mul(LT, 1.3)), 3.7, [[0, skin.light], [0.55, skin.base], [1, skin.shade]])
  const hairFill = G.rad(add(c, add(mul(LT, 1.6), [0, -0.6])), 4.8, [[0, tint(hairCol, 0.32)], [0.45, hairCol], [1, tint(hairCol, -0.42)]])
  const hairLine = tint(hairCol, -0.5)
  const items = []
  const side = view === 'side', three = view === 'three', back = view === 'back'

  // ---- behind the head: ponytail / nape volume ----
  if (S.tail) {
    const swing = o.swing || 0
    const base = side ? [c[0] - 1.55, c[1] - 2.3] : back ? [c[0], c[1] - 2.2] : [c[0] + (three ? -1.2 : 1.35), c[1] - 2.65]
    const dir = side || three ? -1 : 1
    const R0 = (v) => add(base, rot(v, swing))
    const mid = R0([2.05 * dir, 1.55]), tip = R0([1.5 * dir, 4.6]), curl = R0([0.55 * dir, 4.0])
    const tail = `M${P(R0([-0.6 * dir, -0.1]))}C${P(R0([2.35 * dir, -1.3]))} ${P(add(mid, [1.0 * dir, 0]))} ${P(tip)}Q${P(add(tip, [-0.75 * dir, 0.75]))} ${P(curl)}Q${P(add(mid, [-0.55 * dir, 0.3]))} ${P(R0([0.35 * dir, 0.85]))}Z`
    if (!back) items.push({ d: tail, fill: G.lin(base, tip, [[0, tint(hairCol, 0.15)], [1, tint(hairCol, -0.3)]]) })
    o._tail = { tail, base, mid, tip, dir, back }
  }
  if ((S.locks || back) && !side) {
    const low = back ? 2.55 : 1.35
    items.push({ d: `M${P([c[0] - 2.8, c[1] - 0.6])}C${P([c[0] - 3.05, c[1] + low * 0.6])} ${P([c[0] - 2.25, c[1] + low])} ${P([c[0] - 1.4, c[1] + low])}L${P([c[0] + 1.4, c[1] + low])}C${P([c[0] + 2.25, c[1] + low])} ${P([c[0] + 3.05, c[1] + low * 0.6])} ${P([c[0] + 2.8, c[1] - 0.6])}Z`, fill: hairFill })
  }
  if (S.curls && !side) items.push({ d: ellipse([c[0], c[1] - 0.8], 3.0, 2.65), fill: hairFill })

  // ---- ears (behind the face in front / three; on it in side) ----
  const ears = back ? [-1, 1] : view === 'front' ? [-1, 1] : three ? [-1] : []
  for (const e of ears) {
    const ex = c[0] + e * (three ? 2.3 : 2.55), ey = c[1] + 0.42
    items.push({ d: ellipse([ex, ey], 0.66, 0.82), fill: skinFill })
  }

  // ---- the head ----
  items.push({ d: headOutline(c, view), fill: skinFill })
  if (three) items.push({ d: ellipse([c[0] + 1.45, c[1] + 0.95], 1.05, 0.95), fill: skinFill }) // near cheek fills the jaw
  if (side) {
    items.push({ d: ellipse([c[0] + 1.55, c[1] + 0.95], 1.1, 1.0), fill: skinFill })
    items.push({ d: ellipse([c[0] + 2.42, c[1] + 0.62], 0.36, 0.3), fill: skinFill }) // nose in profile
  }

  // ---- face ----
  let f = ''
  for (const e of ears) {
    const ex = c[0] + e * (three ? 2.3 : 2.55), ey = c[1] + 0.42
    f += iline(`M${r2(ex - e * 0.05)} ${r2(ey - 0.38)}q${r2(e * -0.32)} 0.38 0 0.76`, 0.08, skin.deep)
  }
  if (!back) {
    // soft shading: jaw / under-fringe
    f += softBlob(G, [c[0] + (side ? 0.2 : 0), c[1] - 1.25], side ? 1.6 : 2.1, 0.75, skin.shade, 0.75)
    // the side of the face away from the light
    f += softBlob(G, [c[0] - LT[0] * 1.9, c[1] + 0.5], 1.0, 1.9, skin.shade, 0.5)
    const fx = side ? 1.25 : three ? 0.62 : 0
    const eyeY = c[1] + 0.32
    if (side) {
      f += eyes(G, c[0] + 1.25, eyeY, 0.3, 0.52, o.expr, o.blink)
      f += brow(c[0] + 1.2, eyeY - 1.0, 0.36, hairCol, o.expr === 'focus' ? 0.15 : 0)
      f += blush(G, c[0] + 0.85, c[1] + 1.15, 0.6, 0.38)
      f += mouth(G, c[0] + 1.95, c[1] + 1.45, o.expr, 0.62)
      // ear on the side of the head
      const ex = c[0] - 0.3, ey = c[1] + 0.5
      f += `<path d="${ellipse([ex, ey], 0.44, 0.58, -8)}" fill="${G.radE([ex - 0.08, ey - 0.08], 0.5, 0.64, [[0, skin.light], [1, skin.shade]])}"/>` + iline(ellipse([ex, ey], 0.44, 0.58, -8), 0.055, skin.deep)
      f += iline(`M${r2(ex + 0.08)} ${r2(ey - 0.26)}q-0.24 0.26 0 0.52`, 0.06, skin.deep)
    } else {
      const xs = [c[0] - 1.1 + fx, c[0] + 1.1 + fx]
      xs.forEach((ex, i) => {
        const farEye = three && i === 0
        const rx = 0.38 * (farEye ? 0.8 : 1), ry = o.expr === 'oh' ? 0.58 : 0.54
        const wink = o.expr === 'wink' && i === 1
        f += eyes(G, ex, eyeY, rx, ry, o.expr, o.blink, wink)
        const inner = i === 0 ? 1 : -1
        const tilt = o.expr === 'focus' ? 0.22 * inner : o.expr === 'oh' ? -0.14 : 0
        f += brow(ex, eyeY - 0.9, 0.38 * (farEye ? 0.8 : 1), hairCol, tilt)
      })
      f += blush(G, c[0] - 1.6 + fx * 0.8, c[1] + 1.12)
      f += blush(G, c[0] + 1.6 + fx * 0.8, c[1] + 1.12)
      if (o.freckles && !SMALL) for (const cx of [c[0] - 1.6 + fx * 0.8, c[0] + 1.6 + fx * 0.8]) for (const [dx, dy] of [[-0.25, -0.05], [0.05, 0.12], [0.28, -0.08]]) f += `<circle cx="${r2(cx + dx)}" cy="${r2(c[1] + 1.02 + dy)}" r="0.07" fill="${skin.deep}"/>`
      // button nose
      const nx = c[0] + fx * 1.3, ny = c[1] + 0.95
      f += `<path d="${ellipse([nx, ny], 0.28, 0.22)}" fill="${G.rad([nx - 0.08, ny - 0.08], 0.32, [[0, skin.light], [1, skin.deep]])}"/>`
      f += `<circle cx="${r2(nx - 0.08)}" cy="${r2(ny - 0.07)}" r="0.07" fill="#fff" opacity="0.75"/>`
      f += mouth(G, c[0] + fx * 1.1, c[1] + 1.48, o.expr)
    }
  }
  items.push(f)

  // ---- front hair ----
  const hairItems = []
  let hairDetail = ''
  const strand = (a, b, w = 0.07, bend = 0.1) => SMALL ? '' : taper(a, b, w, bend, tint(hairCol, -0.32), 0.4)
  const shine = (a, b, w = 0.12, bend = -0.15) => SMALL ? '' : taper(a, b, w, bend, tint(hairCol, 0.45), 0.7)
  if (S.curls) {
    const ring = back
      ? [[-2.5, -0.2], [-2.6, -1.4], [-2.0, -2.5], [-1.0, -3.15], [0.1, -3.35], [1.2, -3.1], [2.15, -2.45], [2.65, -1.3], [2.5, -0.1], [-1.4, 0.9], [0, 1.2], [1.4, 0.9], [-1.0, -1.0], [0.6, -1.2]]
      : side
        ? [[-2.6, 0.6], [-2.8, -0.6], [-2.4, -1.8], [-1.5, -2.8], [-0.3, -3.25], [0.9, -3.0], [1.75, -2.35], [-1.6, 1.3], [-0.6, -1.6], [0.5, -2.0]]
        : [[-2.6, 0.05], [-2.75, -1.2], [-2.2, -2.35], [-1.2, -3.05], [0, -3.3], [1.2, -3.05], [2.2, -2.35], [2.75, -1.2], [2.6, 0.05], [-1.65, -1.75], [-0.55, -2.05], [0.55, -2.05], [1.65, -1.75]]
    const sh = three ? -0.25 : 0
    for (const [x, y] of ring) hairItems.push({ d: ellipse([c[0] + x + sh, c[1] + y], 0.86, 0.84), fill: hairFill })
    for (const [x, y] of ring) hairDetail += taper([c[0] + x + sh - 0.35, c[1] + y + 0.05], [c[0] + x + sh + 0.25, c[1] + y - 0.35], 0.09, -0.2, tint(hairCol, 0.4), 0.6)
  } else if (side) {
    // profile hair: hairline from the forehead, over the crown, down to the
    // nape; tufts sweep back, the fringe flicks forward over the brow
    const H = (x, y) => [c[0] + x, c[1] + y]
    const clump = (b, t, w, bend = 0.3) => {
      const bb = H(...b), tt = H(...t), nn = norm(perp(sub(tt, bb)))
      return `M${P(add(bb, mul(nn, w)))}Q${P(add(lerp(bb, tt, 0.5), mul(nn, w * 0.8 + bend)))} ${P(tt)}Q${P(add(lerp(bb, tt, 0.5), mul(nn, -w * 0.5 + bend * 0.4)))} ${P(add(bb, mul(nn, -w)))}Z`
    }
    if (!S.smooth && !S.curls) {
      for (const [b, t, w] of [[[-1.2, -2.75], [-2.55, -3.45], 0.6], [[-2.2, -1.85], [-3.45, -2.15], 0.6], [[-2.6, -0.55], [-3.35, -0.05], 0.5], [[0.0, -2.95], [-0.9, -3.75], 0.55]]) hairItems.push({ d: clump(b, t, w, 0.15), fill: hairFill })
    }
    const mass = smoothClosed([
      [1.85, -1.3], [1.75, -2.35], [0.9, -3.05], [-0.4, -3.2], [-1.6, -2.85], [-2.55, -1.95], [-2.9, -0.6], [-2.75, 0.55], [-2.25, 1.35],
      [-1.55, 1.2], [-1.05, 0.6], [-0.8, -0.3], [-0.2, -0.6], [0.35, -0.45], [0.55, 0.15], [0.85, -0.85], [1.35, -1.0],
    ].map(([x, y]) => H(x, y)))
    hairItems.push({ d: mass, fill: hairFill })
    if (!S.smooth) {
      for (const [b, t, w] of [[[1.05, -2.25], [2.15, -0.95], 0.6], [[0.2, -2.55], [1.45, -1.2], 0.6]]) {
        const d = clump(b, t, w, -0.1)
        hairItems.push({ d, fill: hairFill })
      }
    }
    hairDetail += strand(H(-0.2, -2.6), H(-1.9, -0.6), 0.075, -0.35) + strand(H(0.5, -2.35), H(-0.9, -0.9), 0.06, -0.3)
    hairDetail += softBlob(G, H(-0.6, -2.35), 1.15, 0.5, tint(hairCol, 0.45), 0.55, -10)
  } else if (back) {
    hairItems.push({ d: hairMass(c, { ...S, from: -150, to: 150, r: (S.r || 2.85) + 0.05 }), fill: hairFill })
    hairItems.push({ d: ellipse([c[0], c[1] + 0.25], 2.45, 2.2), fill: hairFill })
    for (const x of [-1.6, -0.55, 0.55, 1.6]) hairDetail += strand([c[0] + x * 0.65, c[1] - 2.3], [c[0] + x, c[1] + 1.75], 0.07, x * 0.15)
    hairDetail += softBlob(G, [c[0] - 0.8, c[1] - 2.1], 1.3, 0.55, tint(hairCol, 0.45), 0.5, -20)
  } else {
    const sh = three ? -0.28 : 0
    const cc = [c[0] + sh, c[1]]
    if (o.hair === 'tufts' || o.hair === 'swept' || o.hair === 'ponytail') {
      const d = hairShape(cc, o.hair, 1)
      hairItems.push({ d, fill: hairFill })
      const H = (x, y) => [cc[0] + x, cc[1] + y]
      // tuft separations and flow strands (curving the way the hair falls)
      if (o.hair === 'tufts') {
        for (const [a, b, bend] of [[[-0.76, -3.4], [-0.95, -2.55], 0.1], [[0.4, -3.45], [0.15, -2.6], 0.12], [[1.94, -3.1], [1.5, -2.45], 0.1], [[-1.55, -3.3], [-1.85, -2.7], 0.08]]) hairDetail += strand(H(...a), H(...b), 0.07, bend)
      }
      if (o.hair === 'ponytail') {
        // the part, and strands combed back to the ponytail
        hairDetail += strand(H(-0.9, -1.95), H(0.9, -3.3), 0.05, -0.2) + strand(H(-0.4, -1.55), H(2.1, -1.4), 0.05, -0.35) + strand(H(0.4, -1.3), H(2.35, -0.6), 0.05, -0.25)
      } else {
        hairDetail += strand(H(-1.9, -2.2), H(-0.3, -1.75), 0.06, 0.25) + strand(H(0.2, -2.85), H(1.9, -1.9), 0.06, 0.2)
      }
      // fringe clump edges
      if (o.hair === 'tufts') for (const [a, b] of [[[1.6, -1.5], [1.42, -1.08]], [[0.6, -1.52], [0.42, -1.12]], [[-0.4, -1.55], [-0.55, -1.2]], [[-1.4, -1.55], [-1.6, -1.15]]]) hairDetail += taper(H(...a), H(...b), 0.06, -0.05, hairLine, 0.7)
      hairDetail += softBlob(G, H(-0.75, -2.75), 1.25, 0.5, tint(hairCol, 0.5), 0.6, -15)
      hairDetail += shine(H(-1.6, -2.75), H(-0.2, -3.2), 0.1, -0.12)
    } else {
      for (const [deg, size, dir] of S.flicks) hairItems.push({ d: flickPath(cc, S, deg, size, dir), fill: hairFill })
      hairItems.push({ d: hairMass(cc, S), fill: hairFill })
      for (const [deg, endY, w, sweep] of S.fringe) {
        const fc = fringeClump(cc, deg, endY, w, sweep + (three ? 0.3 : 0))
        hairItems.push({ d: fc.d, fill: hairFill })
        hairDetail += iline(fc.edge, 0.06, hairLine)
      }
      hairDetail += softBlob(G, polar(cc, -32, S.r - 0.55), 1.05, 0.42, tint(hairCol, 0.48), 0.6, -28)
    }
    // long side locks framing the face (ponytail style)
    if (S.locks) for (const sd of three ? [1] : [-1, 1]) {
      const r = [cc[0] + sd * 2.35, cc[1] - 1.2], t = [cc[0] + sd * 2.75, cc[1] + 1.65]
      // hugs the outside of the cheek: the inner edge never crosses the face
      hairItems.push({ d: `M${P([r[0] - 0.2 * sd, r[1] - 0.4])}C${P([t[0] + 0.5 * sd, cc[1] - 1.0])} ${P([t[0] + 0.3 * sd, cc[1] + 0.9])} ${P(t)}C${P([t[0] - 0.2 * sd, cc[1] + 1.1])} ${P([r[0] + 0.12 * sd, cc[1] + 0.4])} ${P([r[0] + 0.02 * sd, r[1] + 1.0])}Z`, fill: hairFill })
      hairDetail += strand([r[0] + 0.1 * sd, r[1] + 0.3], [t[0] - 0.1 * sd, t[1] - 0.6], 0.05, 0.15 * sd)
    }
  }
  // ponytail in the back view sits over the hair
  if (o._tail && o._tail.back) hairItems.push({ d: o._tail.tail, fill: G.lin(o._tail.base, o._tail.tip, [[0, tint(hairCol, 0.15)], [1, tint(hairCol, -0.3)]]) })

  // ponytail detail + scrunchie
  if (o._tail) {
    const { base, mid, tip, dir } = o._tail
    hairDetail += strand(add(base, [0.9 * dir, 0.2]), add(tip, [0.1 * dir, -0.8]), 0.08, 0.25 * dir)
    hairDetail += softBlob(G, lerp(base, mid, 0.55), 0.7, 0.3, tint(hairCol, 0.45), 0.5, Math.atan2(mid[1] - base[1], mid[0] - base[0]) * 57.3)
    const sc = G.rad(add(base, [-0.15, -0.2]), 0.75, [[0, tint(kit.shirt, 0.25)], [1, tint(kit.shirt, -0.3)]])
    hairDetail += group([{ d: ellipse(base, 0.34, 0.44, -30 * dir), fill: sc }])
  }
  return group(items) + group(hairItems) + hairDetail
}

// ============================================================
// BODY
// ============================================================
function hand(G, at, from, state, skin, bodyX, LT, far) {
  const d = norm(sub(at, from)), nn0 = perp(d)
  const inward = dot(nn0, [bodyX - at[0], 0]) >= 0 ? nn0 : mul(nn0, -1)
  const g = G.rad(add(at, mul(LT, 0.4)), 0.95, [[0, tint(skin.light, far ? -0.1 : 0)], [0.6, tint(skin.base, far ? -0.1 : 0)], [1, tint(skin.shade, far ? -0.1 : 0)]])
  const items = []
  let det = ''
  if (state === 'fist' || state === 'grip') {
    const c = add(at, mul(d, 0.08))
    items.push({ d: ellipse(c, 0.52, 0.48, Math.atan2(d[1], d[0]) * 57.3), fill: g })
    const th = add(c, add(mul(inward, 0.36), mul(d, -0.08)))
    items.push({ d: ellipse(th, 0.22, 0.17, Math.atan2(d[1], d[0]) * 57.3), fill: g })
    if (!SMALL) for (const k of [-0.2, 0.08, 0.34]) {
      const a = add(c, add(mul(inward, -k), mul(d, 0.12))), b = add(a, mul(d, 0.36))
      det += iline(`M${P(a)}L${P(b)}`, 0.06, skin.deep)
    }
  } else {
    const c = add(at, mul(d, 0.1))
    const palm = spline([add(c, mul(d, -0.28)), add(c, mul(d, 0.36))])
    items.push({ d: tube(palm, profile([[0, 0.34], [0.55, 0.43], [1, 0.4]]), 0, 1, 'round', 'round', 0.3, 10), fill: g })
    const tb = add(c, add(mul(inward, 0.28), mul(d, -0.12))), tt = add(c, add(mul(inward, 0.68), mul(d, 0.06)))
    items.push({ d: tube(spline([tb, tt]), () => 0.16, 0, 1, 'round', 'round', 0.3, 6), fill: g })
    // finger splits at the tip
    if (!SMALL) for (const k of [-0.2, 0.06]) {
      const a = add(c, add(mul(inward, k), mul(d, 0.62))), b = add(c, add(mul(inward, k), mul(d, 0.32)))
      det += taper(a, b, 0.035, 0, skin.deep, 0.8)
    }
  }
  return { items, det }
}

// An arm, split so the sleeve can belong to the shirt while the bare arm
// sits behind or in front of the body as the pose needs.
function armParts(G, sh, el, hd, state, kit, skin, bodyX, LT, far, neck) {
  const dHand = norm(sub(hd, el))
  const wrist = sub(hd, mul(dHand, 0.42))
  const spl = spline([sh, el, wrist])
  const se = spl.joints[1]
  const rAt = profile([[0, 0.44], [se * 0.7, 0.4], [se, 0.35], [se + (1 - se) * 0.3, 0.38], [1, 0.3]])
  const sk = far ? { light: tint(skin.light, -0.1), base: tint(skin.base, -0.1), shade: tint(skin.shade, -0.1), deep: tint(skin.deep, -0.1) } : skin
  const kr = far ? ramp(tint(kit.shirt, -0.08)) : kit.r
  const skinItems = [{ d: tube(spl, rAt), fill: limbGrad(G, sh, wrist, 0.5, sk, LT) }]
  // sleeve: rooted inside the shoulder so the shirt's shoulder line runs on
  const sEnd = se * 0.58
  const end = at(spl, sEnd).p, midS = at(spl, sEnd * 0.5).p
  const toNeck = norm(sub(neck, sh))
  const root = add(sh, mul(toNeck, 0.6))
  const sspl = spline([root, sh, midS, end])
  const sj = sspl.joints[1]
  const sr = profile([[0, 0.36], [sj, 0.68], [1, 0.8]])
  const sleeveD = tube(sspl, sr, 0, 1, 'round', 'hem', 0.34)
  const sleeveFill = limbGrad(G, sh, end, 0.85, kr, LT)
  const t0 = 1 - 0.18 * (len(sub(end, sh)) > 0.4 ? 1 : 0.6)
  const trimD = tube(sspl, (x) => sr(x) + 0.004, t0, 1, 'hem', 'hem', 0.34, 6)
  const trimFill = limbGrad(G, at(sspl, t0).p, end, 0.85, kit.trimR, LT)
  const hemDet = iline(hemLine(sspl, sr, t0, 0.34, 0.03), 0.06) + iline(hemLine(sspl, sr, 1, 0.34, 0), 0.08)
  // armpit edge: the inside of the sleeve meets the shirt
  let pit = ''
  {
    const pts = []
    for (let i = 0; i <= 6; i++) {
      const sx = 1 - (i / 6) * 0.45, q = at(sspl, sx), nn = perp(q.t)
      const inner = dot(nn, sub([bodyX, q.p[1]], q.p)) >= 0 ? nn : mul(nn, -1)
      pts.push(add(q.p, mul(inner, sr(sx))))
    }
    pit = iline(`M${pts.map(P).join('L')}`, 0.065)
  }
  // soft contact shadow just below the sleeve
  const a0 = at(spl, sEnd).p, a1 = at(spl, Math.min(1, sEnd + 0.16)).p
  let skinDet = `<path d="${tube(spl, (x) => rAt(x) - 0.01, sEnd, Math.min(1, sEnd + 0.16), 'hem', 'hem', 0.34, 8)}" fill="${G.lin(a0, a1, [[0, skin.deep, 0.55], [1, skin.deep, 0]])}"/>`
  const h = hand(G, hd, el, state, sk, bodyX, LT, far)
  skinItems.push(...h.items)
  skinDet += h.det
  // shade on the underside of the sleeve, strongest at the hem
  let sleeveShade = ''
  {
    const pts = [], q0 = at(sspl, 0.55), q1 = at(sspl, 1)
    for (let i = 0; i <= 8; i++) {
      const sx = 0.55 + (0.45 * i) / 8, q = at(sspl, sx), nn = perp(q.t)
      const under = dot(nn, LT) < 0 ? nn : mul(nn, -1)
      pts.push([add(q.p, mul(under, sr(sx))), add(q.p, mul(under, sr(sx) * 0.15))])
    }
    const poly = [...pts.map((x) => x[0]), ...pts.slice().reverse().map((x) => x[1])]
    sleeveShade = `<path d="${smoothClosed(poly)}" fill="${G.lin(q0.p, q1.p, [[0, kit.r.deep, 0], [1, kit.r.deep, 0.55]])}"/>`
  }
  // the bare arm below the sleeve, for when only the forearm crosses the body
  const lowerItems = [{ d: tube(spl, rAt, sEnd - 0.01, 1, 'hem', 'round', 0.34), fill: limbGrad(G, at(spl, sEnd).p, wrist, 0.5, sk, LT) }, ...h.items]
  return { skin: group(skinItems) + skinDet, lower: group(lowerItems) + h.det, sleeveD, trimD, trimFill, hemDet, sleeveShade, se }
}

function bootShape(foot, knee, view, side, LT, kitLine) {
  const dShin = norm(sub(foot, knee))
  const frontOn = false
  const B = (x, y, td, up) => add(foot, add(mul(td, x), mul(up, y)))
  if (frontOn) {
    // boot seen from the front, toe turned slightly out
    const td = rot([1, 0], side * 14), up = [0, 1]
    const pts = [[-0.74, 0.04], [-0.86, -0.4], [-0.6, -0.88], [0, -0.96], [0.6, -0.88], [0.86, -0.4], [0.74, 0.04]].map(([x, y]) => B(x, y, td, up))
    const body = smoothClosed([...pts, B(0, 0.1, td, up)])
    const sole = `M${P(B(-0.78, -0.08, td, up))}L${P(B(0.78, -0.08, td, up))}Q${P(B(0.84, 0.06, td, up))} ${P(B(0.7, 0.12, td, up))}L${P(B(-0.7, 0.12, td, up))}Q${P(B(-0.84, 0.06, td, up))} ${P(B(-0.78, -0.08, td, up))}Z`
    let det = `<path d="${sole}" fill="#cfd4d8"/>` + iline(`M${P(B(-0.76, -0.08, td, up))}L${P(B(0.76, -0.08, td, up))}`, 0.05)
    for (let i = 0; i < 3; i++) det += taper(B(side * (0.32 + i * 0.13), -0.7, td, up), B(side * (0.42 + i * 0.13), -0.2, td, up), 0.05, 0, '#ffffff', 0.95)
    det += taper(B(-0.35, -0.72, td, up), B(0.15, -0.8, td, up), 0.1, -0.08, '#ffffff', 0.35)
    return { d: body, det }
  }
  // profile boot; toe points perpendicular to the shin, towards "forward + up"
  const p1 = perp(dShin)
  const standing = Math.abs(dShin[1]) > 0.75
  const pref = (view === 'front' || view === 'back') ? (standing ? [side, 0] : [0, -1]) : [0.75, -0.65]
  const td = dot(p1, pref) >= 0 ? p1 : mul(p1, -1)
  const up = mul(dShin, 1) // +y = towards the sole
  const sx = (view === 'front' || view === 'back') && standing ? 0.6 : view === 'three' ? 0.82 : 1
  const Q = (x, y) => B(x * sx, y, td, up)
  const body = `M${P(Q(-0.62, 0.02))}C${P(Q(-0.84, -0.3))} ${P(Q(-0.8, -0.8))} ${P(Q(-0.48, -0.93))}Q${P(Q(-0.05, -1.04))} ${P(Q(0.36, -0.84))}C${P(Q(0.74, -0.68))} ${P(Q(1.04, -0.62))} ${P(Q(1.24, -0.38))}Q${P(Q(1.44, -0.06))} ${P(Q(1.18, 0.06))}L${P(Q(-0.62, 0.06))}Z`
  const sole = `M${P(Q(-0.66, -0.07))}L${P(Q(1.32, -0.1))}Q${P(Q(1.4, 0.02))} ${P(Q(1.18, 0.1))}L${P(Q(-0.6, 0.1))}Q${P(Q(-0.72, 0.02))} ${P(Q(-0.66, -0.07))}Z`
  let det = `<path d="${sole}" fill="#cfd4d8"/>` + iline(`M${P(Q(-0.64, -0.07))}L${P(Q(1.3, -0.1))}`, 0.05)
  for (let i = 0; i < 3; i++) det += taper(Q(-0.2 + i * 0.27, -0.74), Q(0.0 + i * 0.27, -0.22), 0.055, 0, '#ffffff', 0.95)
  det += taper(Q(0.55, -0.66), Q(1.12, -0.44), 0.1, -0.06, '#ffffff', 0.35)
  return { d: body, det }
}

function legGroup(G, hip, knee, foot, kit, skin, view, side, LT, far) {
  const ankle = add(foot, mul(norm(sub(knee, foot)), 0.62))
  const spl = spline([hip, knee, ankle])
  const sk = spl.joints[1]
  const rAt = profile([[0, 0.66], [sk * 0.55, 0.6], [sk, 0.46], [sk + (1 - sk) * 0.38, 0.52], [1, 0.38]])
  const skinR = far ? { light: tint(skin.light, -0.1), base: tint(skin.base, -0.1), shade: tint(skin.shade, -0.1), deep: tint(skin.deep, -0.1) } : skin
  const sockR = far ? ramp(tint(kit.shirt, -0.1)) : kit.r
  const items = []
  items.push({ d: tube(spl, rAt), fill: limbGrad(G, hip, knee, 0.7, skinR, LT) })
  const sS = sk + (1 - sk) * 0.1
  const srad = (s) => rAt(s) + 0.05
  const kneeP = at(spl, sS).p
  items.push({ d: tube(spl, srad, sS, 1, 'hem', 'round', 0.3), fill: limbGrad(G, kneeP, ankle, 0.58, sockR, LT) })
  // two stripes near the top of the sock
  let det = ''
  const sh = (u) => sS + (1 - sS) * u
  for (const [u0, u1] of [[0.12, 0.25], [0.33, 0.46]]) {
    items.push({ d: tube(spl, (s) => srad(s) + 0.004, sh(u0), sh(u1), 'hem', 'hem', 0.3, 6), fill: limbGrad(G, at(spl, sh(u0)).p, at(spl, sh(u1)).p, 0.6, kit.trimR, LT) })
  }
  const boot = bootShape(foot, knee, view, side, LT)
  items.push({ d: boot.d, fill: G.lin(add(foot, [0, -1]), foot, [[0, far ? '#3c4246' : '#4d555a'], [0.55, far ? '#1f2326' : '#272c2f'], [1, '#141719']]) })
  det += iline(hemLine(spl, srad, sS, 0.3, 0.0), 0.08)
  if (!SMALL) for (const [u0, u1] of [[0.12, 0.25], [0.33, 0.46]]) det += iline(hemLine(spl, srad, sh(u0), 0.3, 0.04), 0.045) + iline(hemLine(spl, srad, sh(u1), 0.3, 0.04), 0.045)
  // knee: a soft crease when the leg bends
  const kp = at(spl, sk)
  if (!SMALL) det += taper(add(kp.p, mul(perp(kp.t), 0.3)), add(kp.p, mul(perp(kp.t), -0.3)), 0.05, 0.12, skin.deep, 0.5)
  det += boot.det
  return { svg: group(items) + det, spl, rAt, sk }
}

// The torso, in a frame at the neck: x across (screen right when upright),
// y down the spine. H = neck→hip length. Returns a path.
function torsoPath(M, H, view, cx) {
  const k = H / 2.95
  if (view === 'side') {
    const pts = [
      [-0.55, 0.0], [-1.2, 0.2], [-1.45, 0.85 * k], [-1.38, 1.6 * k], [-1.3, 2.3 * k], [-1.36, H + 0.14],
      [-0.4, H + 0.32], [0.5, H + 0.3], [1.4, H + 0.12], [1.5, H - 0.6], [1.58, 1.35 * k], [1.36, 0.7 * k], [0.95, 0.12], [0.5, -0.02], [0, -0.08],
    ]
    return smoothClosed(pts.map(([x, y]) => M(x, y)))
  }
  const wl = view === 'three' ? 0.78 : 0.92, wr = view === 'three' ? 0.72 : 0.92
  const pts = [
    [-0.8 * wl + cx, 0.0], [-1.3 * wl + cx, -0.02], [-1.72 * wl + cx, 0.14], [-1.92 * wl + cx, 0.55], [-1.98 * wl + cx, 1.1 * k], [-1.82 * wl + cx, 1.8 * k], [-1.86 * wl + cx * 0.6, H - 0.18],
    [-0.9 + cx * 0.6, H - 0.02], [0 + cx * 0.6, H + 0.02], [0.9 + cx * 0.6, H - 0.02],
    [1.86 * wr + cx * 0.6, H - 0.18], [1.8 * wr + cx, 1.85 * k], [1.98 * wr + cx, 1.1 * k], [1.92 * wr + cx, 0.55], [1.72 * wr + cx, 0.14], [1.3 * wr + cx, -0.02], [0.8 * wr + cx, 0.0],
    [0.35 + cx, view === 'back' ? 0.12 : 0.32], [-0.35 + cx, view === 'back' ? 0.12 : 0.32],
  ]
  return smoothClosed(pts.map(([x, y]) => M(x, y)))
}

// ============================================================
// renderKid
// ============================================================
/**
 * @param pose  a POSES name or joint object (blendPoses for transitions)
 * @param team  team colour hex — shirt, socks, stripes, scrunchie follow it
 * @param opts  { uid (unique id prefix for gradients), number, hair,
 *               hairColour, skin (index|object), freckles, coach,
 *               expr: grin|happy|calm|oh|focus|wink, look: 1|-1,
 *               mirror (drawn inside a flipped group), t, phase, still }
 */
export function renderKid(pose, team, opts = {}) {
  const p = typeof pose === 'string' ? POSES[pose] || POSES.stand : pose
  const view = opts.view || p.view || 'front'
  const flipSelf = opts.look === -1
  const mirrored = !!opts.mirror !== flipSelf
  const LT = mirrored ? norm([0.55, -0.83]) : norm([-0.55, -0.83]) // towards the light, on screen
  const G = makeGrads(opts.uid || 'kid')
  GID = { prefix: (opts.uid || 'kid') + 'p', n: 0, defs: G.defs }
  SMALL = opts.lod === 'small'
  const pale = lum(team) > 0.66
  const kit = {
    shirt: team,
    r: ramp(team),
    trim: pale ? tint(team, -0.62) : '#ffffff',
    trimR: pale ? ramp(tint(team, -0.62)) : { light: '#ffffff', base: '#fbfbfa', shade: '#dedcd8', deep: '#c9c6c0' },
    numberLine: tint(team, -0.3),
  }
  const skin = typeof opts.skin === 'object' ? opts.skin : SKINS[opts.skin || 0]
  const t = opts.t || 0
  const breath = opts.still ? 0 : Math.sin(t * 2.4 + (opts.phase || 0)) * 0.07
  const blink = opts.blink ?? (!opts.still && (t + (opts.phase || 0)) % 3.7 < 0.13)
  const o = {
    hair: opts.hair || 'tufts', hairColour: opts.hairColour || HAIRS.brown, skin,
    expr: opts.expr || p.expr || 'grin', blink, freckles: opts.freckles,
    swing: opts.still ? 0 : Math.sin(t * 2.1 + (opts.phase || 0)) * 3 + (opts.swing || 0),
  }

  const neck = add(p.neck, [0, breath])
  const headC = add(add(p.neck, mul(sub(p.head, p.neck), 0.87)), [0, breath * 1.25])
  const HS = 0.86 // head scale (chibi, but closer to 3 heads tall)
  const dn = norm(sub(p.hip, neck)), nx = [dn[1], -dn[0]] // spine down, and across (screen right when upright)
  const H = len(sub(p.hip, neck))
  const M = (x, y) => add(neck, add(mul(nx, x), mul(dn, y)))
  const cx = view === 'three' ? 0.28 : 0
  // shoulder & hip joints by view
  const shW = view === 'side' ? [-0.15, -0.3] : view === 'three' ? [-1.38, 1.0] : [-1.5, 1.5]
  const hpW = view === 'side' ? [-0.12, 0.12] : view === 'three' ? [-0.78, 0.6] : [-0.85, 0.85]
  const shoulder = { L: M(shW[0], 0.62), R: M(shW[1], 0.62) }
  const hipJ = { L: M(hpW[0], H), R: M(hpW[1], H) }
  const near = p.near || (view === 'side' ? 'R' : view === 'three' ? 'L' : null)
  const far = near === 'L' ? 'R' : near === 'R' ? 'L' : null
  const bodyX = p.hip[0]

  let out = ''
  // ground shadow
  const xs = [p.footL[0], p.footR[0], p.hip[0], p.handL[0], p.handR[0]]
  const minX = Math.min(...xs) - 1.2, maxX = Math.max(...xs) + 1.4
  const sc = [(minX + maxX) / 2, 0.2]
  const srx = (maxX - minX) / 2 + 0.3
  out += `<path d="${ellipse(sc, srx, 0.66)}" fill="${G.radE(sc, srx, 0.66, [[0, '#0b2a12', 0.42], [0.6, '#0b2a12', 0.2], [1, '#0b2a12', 0]])}"/>`

  // Arms: a sleeve always belongs to the shirt silhouette. The bare arm is
  // drawn behind the body when it hangs clear of it, in front when it
  // crosses the torso (then the sleeve is laid back over it), and after
  // the head when the pose reaches over it.
  const arms = {}
  for (const k of ['L', 'R']) arms[k] = armParts(G, shoulder[k], p['elbow' + k], p['hand' + k], p['hand' + k + 'State'], kit, skin, bodyX, LT, far === k, neck)
  const tw = view === 'side' ? 1.45 : 1.72
  const inside = (q) => {
    const v = sub(q, neck), x = dot(v, nx), y = dot(v, dn)
    return Math.abs(x - cx) < tw * 0.92 && y > -0.6 && y < H + 1.8
  }
  const touches = (q) => {
    const v = sub(q, neck), x = dot(v, nx), y = dot(v, dn)
    return Math.abs(x - cx) < tw * 1.12 && y > -0.6 && y < H + 1.8
  }
  const crosses = (k) => inside(p['elbow' + k]) || inside(p['hand' + k])
  const overHead = p.overHead || []
  const place = {}
  for (const k of ['L', 'R']) {
    if (overHead.includes(k)) place[k] = 'overHead'
    else if (far === k && view !== 'front') place[k] = 'behind'
    else if (inside(p['elbow' + k])) place[k] = view === 'back' ? 'behind' : 'front'
    else if (touches(p['hand' + k])) place[k] = view === 'back' ? 'behind' : 'frontLower'
    else place[k] = 'behind'
  }
  for (const k of ['L', 'R']) if (place[k] === 'behind' || place[k] === 'frontLower' || place[k] === 'overHead') out += arms[k].skin
  // legs: far / lifted first
  const legOrder = p.liftR ? ['R', 'L'] : far ? [far, near] : ['L', 'R']
  const legs = {}
  for (const k of legOrder) {
    legs[k] = legGroup(G, hipJ[k], p['knee' + k], p['foot' + k], kit, skin, view, k === 'L' ? -1 : 1, LT, far === k)
    out += legs[k].svg
  }

  // one gradient for the whole shirt (torso AND sleeves), so it reads as one garment
  const lit = mirrored ? 1 : -1
  const shirtFill = G.lin(M(lit * 2.6 + cx, -0.4), M(-lit * 2.2 + cx, H + 0.5), [[0, kit.r.light], [0.3, kit.r.base], [0.8, kit.r.shade], [1, kit.r.deep]])
  // ---- body group: neck, shorts, shirt ----
  const body = []
  let bodyDet = ''
  const neckTop = lerp(neck, headC, 0.45)
  body.push({ d: tube(spline([M(cx * 0.6, 0.35), neckTop]), () => 0.66), fill: G.lin(M(-0.7, 0), M(0.7, 0), [[0, skin.base], [1, skin.shade]]) })
  // shorts: waistband + one tube per leg, merged into one garment
  const shortsFill = G.lin(add(p.hip, mul(LT, 2.0)), add(p.hip, mul(LT, -2.0)), [[0, '#ffffff'], [0.5, '#f4f1eb'], [1, '#cbc4b8']])
  const wx = view === 'side' ? [-1.3, 1.4] : view === 'three' ? [-1.6, 1.35] : [-1.72, 1.72]
  const waist = smoothClosed([[wx[0], H - 0.55], [wx[1], H - 0.55], [wx[1] + 0.06, H + 0.15], [wx[1] - 0.05, H + 0.6], [0, H + 0.68], [wx[0] + 0.05, H + 0.6], [wx[0] - 0.06, H + 0.15]].map(([x, y]) => M(x, y)))
  body.push({ d: waist, fill: shortsFill })
  const shortsHem = {}
  for (const k of legOrder) {
    const sp = spline([hipJ[k], p['knee' + k]])
    const sEnd = 0.66
    const rr = profile([[0, 0.94], [1, 0.88]])
    body.push({ d: tube(sp, rr, 0, sEnd, 'round', 'hem', 0.3), fill: shortsFill })
    shortsHem[k] = { sp, rr, sEnd }
  }
  for (const k of legOrder) {
    const { sp, rr, sEnd } = shortsHem[k]
    bodyDet += iline(hemLine(sp, rr, sEnd, 0.3, 0.0), 0.075)
    // team stripe down the outside of each leg
    const outSide = view === 'side' ? 0 : (k === 'L' ? -1 : 1)
    const pts = []
    for (let i = 0; i <= 6; i++) {
      const s = (sEnd * i) / 6, { p: q, t: tt } = at(sp, s), nn = perp(tt)
      const sgn = outSide === 0 ? 1 : (dot(nn, [outSide, 0]) >= 0 ? 1 : -1)
      const a = outSide === 0 ? -0.13 : 0.62, b = outSide === 0 ? 0.13 : 0.86
      pts.push([add(q, mul(nn, sgn * rr(s) * a)), add(q, mul(nn, sgn * rr(s) * b))])
    }
    const strip = [...pts.map((x) => x[0]), ...pts.reverse().map((x) => x[1])]
    bodyDet += `<path d="M${strip.map(P).join('L')}Z" fill="${kit.shirt}"/>`
  }
  // crotch seam
  if (view === 'front' || view === 'back' || view === 'three') bodyDet += iline(`M${P(M(cx * 0.6, H + 0.2))}L${P(M(cx * 0.6, H + 0.62))}`, 0.06)
  // shirt
  const tp = torsoPath(M, H, view, cx)
  for (const k of ['L', 'R']) {
    body.push({ d: arms[k].sleeveD, fill: shirtFill }, { d: arms[k].trimD, fill: arms[k].trimFill, outline: false })
    // hem + a soft shadow on the underside of the sleeve, before the torso covers their inner ends
    body.push(arms[k].sleeveShade + arms[k].hemDet)
  }
  body.push({ d: tp, fill: shirtFill })
  // soft shadow under the head, folds, hem line
  bodyDet += softBlob(G, M(cx * 0.7 + (view === 'side' ? 0.3 : 0), 0.45), 1.45, 0.75, kit.r.deep, 0.7)
  // a gentle fold where the shirt gathers at the waist
  if (view !== 'side') bodyDet += taper(M(-0.9 + cx, H - 0.25), M(0.5 + cx, H - 0.05), 0.07, 0.12, kit.r.deep, 0.35)
  // number
  if (opts.number != null && view !== 'side' && !opts.coach) {
    const back = view === 'back'
    const c = M(cx * 1.15, back ? H * 0.45 : H * 0.42)
    const size = back ? 1.9 : 1.32
    const sxn = (view === 'three' ? 0.82 : 1) * (mirrored ? -1 : 1)
    const ang = (Math.atan2(dn[1], dn[0]) * 180) / Math.PI - 90
    bodyDet += `<text x="0" y="0" transform="translate(${r2(c[0])} ${r2(c[1])}) rotate(${r2(ang)}) scale(${sxn} 1) translate(0 ${r2(size * 0.36)})" font-size="${size}" font-weight="900" text-anchor="middle" fill="${kit.trim}" stroke="${kit.numberLine}" stroke-width="0.1" paint-order="stroke" font-family="Nunito, 'Arial Rounded MT Bold', system-ui, sans-serif">${opts.number}</text>`
  }
  // ring collar
  if (view !== 'back') {
    const cw = view === 'side' ? 0.5 : 0.82, cxx = view === 'side' ? 0.35 : cx
    const a = M(cxx - cw, 0.02), b = M(cxx + cw, 0.02)
    const d1 = `M${P(a)}Q${P(M(cxx, 0.62))} ${P(b)}`
    const ring = `${d1}L${P(M(cxx + cw + 0.08, -0.16))}Q${P(M(cxx, 0.3))} ${P(M(cxx - cw - 0.08, -0.16))}Z`
    bodyDet += `<path d="${ring}" fill="${G.lin(M(0, -0.2), M(0, 0.6), [[0, '#ffffff'], [1, '#dcd9d3']])}"/>` + iline(d1, 0.07) + iline(`M${P(M(cxx - cw - 0.08, -0.16))}Q${P(M(cxx, 0.3))} ${P(M(cxx + cw + 0.08, -0.16))}`, 0.06)
    if (pale) bodyDet += iline(d1, 0.18, kit.trim)
  } else {
    bodyDet += iline(`M${P(M(-0.8, 0.02))}Q${P(M(0, 0.2))} ${P(M(0.8, 0.02))}`, 0.2, kit.trim)
  }
  // shirt hem line over the shorts
  bodyDet += iline(`M${P(M(view === 'side' ? -1.3 : -1.7, H - 0.12))}Q${P(M(0, H + 0.12))} ${P(M(view === 'side' ? 1.38 : 1.7, H - 0.14))}`, 0.06)
  // coach: whistle on a lanyard
  if (opts.coach) {
    const w = M(0.35 + cx, 1.55)
    bodyDet += iline(`M${P(M(-0.55 + cx, 0.1))}Q${P(M(-0.2 + cx, 1.2))} ${P(w)}Q${P(M(0.75 + cx, 1.0))} ${P(M(0.65 + cx, 0.1))}`, 0.07, '#2f6fed')
    bodyDet += group([{ d: ellipse(w, 0.32, 0.2), fill: G.lin(add(w, [0, -0.2]), add(w, [0, 0.2]), [[0, '#f2f4f6'], [1, '#8e979e']]) }])
  }
  out += group(body) + bodyDet

  // arms crossing in front of the body, sleeve laid back over them
  const laySleeve = (k) => `<path d="${arms[k].sleeveD}" fill="${shirtFill}"/>` + arms[k].sleeveShade + `<path d="${arms[k].trimD}" fill="${arms[k].trimFill}"/>` + iline(arms[k].sleeveD, 0.08) + arms[k].hemDet
  for (const k of ['L', 'R']) if (place[k] === 'front') out += arms[k].skin + laySleeve(k)
  for (const k of ['L', 'R']) if (place[k] === 'frontLower') out += arms[k].lower

  // head
  out += `<g transform="translate(${r2(headC[0])} ${r2(headC[1])}) scale(${HS}) translate(${r2(-headC[0])} ${r2(-headC[1])})">${head(G, headC, o, view, kit, LT)}</g>`
  for (const k of ['L', 'R']) if (place[k] === 'overHead') out += arms[k].lower

  // effort ticks
  if (p.effort && opts.effort !== false) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 5)
    out += p.effort.map(([x, y, a]) => `<path d="M0 -0.45Q0.2 0 0 0.45" transform="translate(${x} ${y}) rotate(${a})" fill="none" stroke="#ffffff" stroke-width="0.2" stroke-linecap="round" opacity="${r2(pulse)}"/>`).join('')
  }

  const svg = `<defs>${G.defs.join('')}</defs>${out}`
  return flipSelf ? `<g transform="scale(-1 1)">${svg}</g>` : svg
}

// Blend two poses (for transitions). Views switch at the halfway point.
export function blendPoses(a, b, u) {
  const A = typeof a === 'string' ? POSES[a] : a
  const B = typeof b === 'string' ? POSES[b] : b
  if (u <= 0) return A
  if (u >= 1) return B
  const out = { ...(u < 0.5 ? A : B) }
  for (const k of ['head', 'neck', 'hip', 'elbowL', 'handL', 'elbowR', 'handR', 'kneeL', 'footL', 'kneeR', 'footR']) out[k] = lerp(A[k], B[k], u)
  out.effort = null
  return out
}

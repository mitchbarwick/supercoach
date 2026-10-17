// ============================================================
// SuperCoach kids — the illustrated players used where a drill
// needs to show HOW a body is positioned (stretches, cool-downs).
//
// Drawn entirely from a pose skeleton as layered flat vector art,
// so any pose blends into any other, any team colour works, and a
// new stretch is data, not artwork. Style follows the character
// brief: chibi proportions (head ≈ 40% of height), clumped hair,
// a real tee / shorts / long socks / chunky boots kit, one warm
// outline (heavier on the silhouette), two-tone cel shading with the
// light from the top left.
//
// Units: feet at y = 0, up is negative, a standing kid ≈ 12 units.
// renderKid() returns an SVG string (wrapped by the React component
// in Actors.jsx); keeping it a pure string makes it cheap to call
// every frame and lets scripts render character sheets.
// ============================================================

// ---------- palette ----------
export const OUTLINE = '#3a2418'
export const SKINS = [
  { base: '#f7d2ae', shade: '#e6b08a', warm: '#eda27f' },
  { base: '#e7ad80', shade: '#cd8d61', warm: '#d98a62' },
  { base: '#b97c50', shade: '#9a6239', warm: '#a96a45' },
  { base: '#7f5033', shade: '#653d24', warm: '#704329' },
]
export const HAIRS = {
  brown: '#5a3420', chestnut: '#8a5328', black: '#231a16', blonde: '#d09a4a', auburn: '#9a4220', dark: '#3b2418',
}
const SHORTS = '#f7f5f0', SHORTS_SHADE = '#d9d4cb'
const BOOT = '#24282b', BOOT_HI = '#3d4347', SOLE = '#cfd4d7'

// ---------- maths ----------
const add = (a, b) => [a[0] + b[0], a[1] + b[1]]
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]]
const mul = (a, k) => [a[0] * k, a[1] * k]
const len = (a) => Math.hypot(a[0], a[1]) || 1e-6
const norm = (a) => mul(a, 1 / len(a))
const perp = (a) => [-a[1], a[0]]
const lerp = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
const r2 = (n) => Math.round(n * 100) / 100
const P = (p) => `${r2(p[0])} ${r2(p[1])}`
const LIGHT = norm([0.75, 0.66]) // direction shadows fall (light from top left)

export function tint(hex, k) {
  const n = parseInt(hex.slice(1), 16)
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))
  return '#' + c.map((v) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('')
}
const lum = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  return (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255
}

// Tapered capsule a(ra) → b(rb), as a path.
function capsule(a, b, ra, rb) {
  const d = norm(sub(b, a)), n = perp(d)
  const a1 = add(a, mul(n, ra)), a2 = add(a, mul(n, -ra))
  const b1 = add(b, mul(n, rb)), b2 = add(b, mul(n, -rb))
  return `M${P(a1)}L${P(b1)}A${r2(rb)} ${r2(rb)} 0 0 0 ${P(b2)}L${P(a2)}A${r2(ra)} ${r2(ra)} 0 0 0 ${P(a1)}Z`
}

// One filled, cel-shaded, outlined limb segment.
//   fill → shade sliver on the side away from the light → outline on top
function limb(a, b, ra, rb, fill, shade, w = 0.17) {
  const d = norm(sub(b, a)), n = perp(d)
  const side = n[0] * LIGHT[0] + n[1] * LIGHT[1] >= 0 ? 1 : -1
  const k = 0.42
  const sa = add(a, mul(n, side * ra * (1 - k))), sb = add(b, mul(n, side * rb * (1 - k)))
  const path = capsule(a, b, ra, rb)
  return `<path d="${path}" fill="${fill}"/>` +
    `<path d="${capsule(sa, sb, ra * k, rb * k)}" fill="${shade}"/>` +
    `<path d="${path}" fill="none" stroke="${OUTLINE}" stroke-width="${w}" stroke-linejoin="round"/>`
}
const line = (a, b, col, w, cap = 'round') =>
  `<path d="M${P(a)}L${P(b)}" stroke="${col}" stroke-width="${w}" stroke-linecap="${cap}" fill="none"/>`

// ============================================================
// POSES — joints in kid units. view: front | three | side | back.
// In side / three views +x is the way the kid faces; L = far limb,
// R = near limb. `hand*` states: open | fist | grip.
// `front` lists limbs drawn in front of the shirt (default arms).
// `effort` = little motion ticks [[x, y, angle°], …].
// ============================================================
const STAND_LEGS = { kneeL: [-0.85, -2.05], footL: [-0.95, 0], kneeR: [0.85, -2.05], footR: [0.95, 0] }
export const POSES = {
  stand: { view: 'front', head: [0, -9.55], neck: [0, -6.9], hip: [0, -4.0],
    elbowL: [-2.1, -5.1], handL: [-2.35, -3.55], elbowR: [2.1, -5.1], handR: [2.35, -3.55], ...STAND_LEGS },
  handsOnHips: { view: 'three', head: [0.15, -9.55], neck: [0, -6.9], hip: [0, -4.0],
    elbowL: [-2.75, -5.2], handL: [-1.55, -4.15], handLState: 'fist', elbowR: [2.75, -5.2], handR: [1.6, -4.15], handRState: 'fist',
    kneeL: [-1.0, -2.05], footL: [-1.3, 0], kneeR: [1.0, -2.05], footR: [1.3, 0] },
  reachUp: { view: 'three', head: [-0.95, -9.35], neck: [-0.5, -6.85], hip: [0, -4.0],
    elbowL: [-2.7, -5.3], handL: [-1.55, -4.15], handLState: 'fist',
    elbowR: [2.45, -9.35], handR: [0.95, -12.15],
    kneeL: [-1.25, -2.05], footL: [-1.85, 0], kneeR: [1.25, -2.05], footR: [1.85, 0],
    effort: [[2.9, -12.4, -30], [3.5, -11.3, 0], [3.35, -10.1, 25]] },
  quadHold: { view: 'three', head: [-0.15, -9.55], neck: [-0.05, -6.9], hip: [0, -4.0],
    elbowL: [-2.8, -6.45], handL: [-4.05, -6.0],
    elbowR: [2.3, -4.95], handR: [2.75, -3.3], handRState: 'grip',
    kneeL: [-0.55, -2.05], footL: [-0.55, 0], kneeR: [0.85, -1.85], footR: [2.6, -3.0], liftR: true,
    effort: [[-4.9, -7.1, -20], [-5.2, -5.6, 15], [3.9, -3.9, -10]] },
  armAcross: { view: 'three', head: [0.3, -9.55], neck: [0, -6.9], hip: [0, -4.0],
    elbowL: [-1.75, -5.25], handL: [-0.5, -6.15], handLState: 'grip',
    elbowR: [-0.55, -6.3], handR: [-3.25, -6.3],
    kneeL: [-0.95, -2.05], footL: [-1.15, 0], kneeR: [0.95, -2.05], footR: [1.15, 0],
    front: ['R', 'L'], effort: [[3.0, -7.4, -30], [3.55, -6.2, 0]] },
  breathe: { view: 'front', head: [0, -9.6], neck: [0, -6.95], hip: [0, -4.0],
    elbowL: [-2.6, -7.0], handL: [-3.6, -8.6], elbowR: [2.6, -7.0], handR: [3.6, -8.6], ...STAND_LEGS, expr: 'calm' },
  cheer: { view: 'front', head: [0, -9.6], neck: [0, -6.95], hip: [0, -4.0],
    elbowL: [-2.3, -8.6], handL: [-2.1, -11.0], handLState: 'fist', elbowR: [2.3, -8.6], handR: [2.1, -11.0], handRState: 'fist',
    ...STAND_LEGS, expr: 'happy', effort: [[-3.4, -11.6, -35], [3.4, -11.6, 35]] },
  armsAround: { view: 'front', head: [0, -9.55], neck: [0, -6.9], hip: [0, -4.0],
    elbowL: [-2.6, -6.1], handL: [-4.1, -6.5], elbowR: [2.6, -6.1], handR: [4.1, -6.5], ...STAND_LEGS, expr: 'grin' },
  // folding forward towards the viewer: head drops over the hips, hands to the boots
  toeTouch: { view: 'front', head: [0, -6.55], neck: [0, -5.45], hip: [0, -4.0],
    elbowL: [-1.55, -3.0], handL: [-0.95, -0.95], elbowR: [1.55, -3.0], handR: [0.95, -0.95],
    kneeL: [-0.75, -2.05], footL: [-0.85, 0], kneeR: [0.75, -2.05], footR: [0.85, 0], expr: 'focus' },
  lunge: { view: 'side', head: [0.4, -8.7], neck: [0.25, -6.05], hip: [0, -3.2],
    elbowL: [0.8, -4.4], handL: [1.55, -3.45], elbowR: [1.0, -4.3], handR: [1.75, -3.35],
    kneeL: [2.15, -2.3], footL: [2.4, 0], kneeR: [-1.35, -0.75], footR: [-3.35, 0] },
  butterfly: { view: 'front', head: [0, -7.45], neck: [0, -4.85], hip: [0, -1.25],
    elbowL: [-1.9, -2.7], handL: [-0.45, -0.85], handLState: 'grip', elbowR: [1.9, -2.7], handR: [0.45, -0.85], handRState: 'grip',
    kneeL: [-2.8, -1.1], footL: [-0.35, -0.3], kneeR: [2.8, -1.1], footR: [0.35, -0.3], sit: true, expr: 'calm' },
  sitReach: { view: 'side', head: [2.55, -5.75], neck: [1.45, -3.7], hip: [0, -1.15],
    elbowL: [3.6, -2.3], handL: [5.25, -1.25], handLState: 'grip', elbowR: [3.75, -2.2], handR: [5.4, -1.15], handRState: 'grip',
    kneeL: [2.75, -0.7], footL: [5.6, -0.6], kneeR: [2.75, -0.6], footR: [5.6, -0.5], sit: true, soles: true, expr: 'calm' },
  sitTall: { view: 'side', head: [0.55, -7.45], neck: [0.25, -4.85], hip: [0, -1.15],
    elbowL: [1.1, -2.9], handL: [2.3, -1.6], elbowR: [1.3, -2.8], handR: [2.5, -1.5],
    kneeL: [2.7, -0.7], footL: [5.4, -0.6], kneeR: [2.7, -0.6], footR: [5.4, -0.5], sit: true },
  // Back-to-back twist: sitting tall, rotated towards the partner behind,
  // near hand on the far knee, far hand back to touch the partner's hand.
  sitTwist: { view: 'three', head: [-0.55, -7.5], neck: [-0.15, -4.9], hip: [0, -1.15],
    elbowL: [-2.4, -3.0], handL: [-3.6, -1.7], elbowR: [1.1, -3.4], handR: [1.9, -1.4], handRState: 'grip',
    kneeL: [2.0, -0.95], footL: [3.4, -0.35], kneeR: [2.6, -0.8], footR: [4.0, -0.3], sit: true, expr: 'grin',
    effort: [[-1.9, -9.6, -20], [0.9, -9.8, 20]] },
}
POSES.sideBend = POSES.reachUp
// Cross-legged, facing us / seen from behind (back-to-back partners).
POSES.sitCross = { view: 'front', head: [0, -7.45], neck: [0, -4.85], hip: [0, -1.25],
  elbowL: [-2.15, -2.95], handL: [-2.55, -1.45], elbowR: [2.15, -2.95], handR: [2.55, -1.45],
  kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, expr: 'calm' }
POSES.sitCrossBack = { ...POSES.sitCross, view: 'back', front: [] }
// The twist: hand on the opposite knee, the other arm reaching round
// behind to high-five the partner (both reach to the viewer's left).
POSES.twistFront = { view: 'three', head: [-0.35, -7.5], neck: [-0.1, -4.85], hip: [0, -1.25],
  elbowL: [-2.75, -3.6], handL: [-4.1, -3.15], handLState: 'open',
  elbowR: [0.75, -2.95], handR: [-1.6, -1.6], handRState: 'grip',
  kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, expr: 'grin',
  effort: [[-5.2, -4.2, -15]] }
POSES.twistBack = { view: 'back', head: [-0.3, -7.5], neck: [-0.1, -4.85], hip: [0, -1.25],
  elbowL: [-2.75, -3.55], handL: [-3.95, -3.35], handLState: 'open',
  elbowR: [0.7, -2.9], handR: [1.9, -1.5],
  kneeL: [-2.7, -1.0], footL: [0.85, -0.3], kneeR: [2.7, -1.0], footR: [-0.85, -0.3], sit: true, front: ['L'] }
// Two extremes of a jog stride (side view); the player swings between them.
POSES.strideA = { view: 'side', head: [0.75, -9.35], neck: [0.4, -6.75], hip: [0, -3.95],
  elbowL: [1.2, -5.3], handL: [2.0, -5.9], handLState: 'fist', elbowR: [-1.0, -5.0], handR: [-1.3, -3.9], handRState: 'fist',
  kneeL: [-0.75, -1.95], footL: [-1.85, -0.45], kneeR: [1.15, -2.3], footR: [1.05, 0] }
POSES.strideB = { view: 'side', head: [0.75, -9.35], neck: [0.4, -6.75], hip: [0, -3.95],
  elbowL: [-1.0, -5.0], handL: [-1.3, -3.9], handLState: 'fist', elbowR: [1.2, -5.3], handR: [2.0, -5.9], handRState: 'fist',
  kneeL: [1.15, -2.3], footL: [1.05, 0], kneeR: [-0.75, -1.95], footR: [-1.85, -0.45] }
POSES.standSide = { view: 'side', head: [0.3, -9.55], neck: [0.05, -6.9], hip: [0, -4.0],
  elbowL: [-0.35, -5.15], handL: [-0.25, -3.6], elbowR: [0.4, -5.1], handR: [0.6, -3.55],
  kneeL: [-0.15, -2.05], footL: [-0.25, 0], kneeR: [0.2, -2.05], footR: [0.3, 0] }

// ============================================================
// HAIR — a soft, clumpy mass built round the skull (head radius 2.4):
// rounded lobes make the silhouette, a few curved flicks break it,
// fringe clumps hang over the forehead, strand lines + highlights on top.
// Angles in degrees round the head centre, 0 = straight up, + = clockwise.
// ============================================================
const HAIR_STYLES = {
  tufts: {
    from: -100, to: 100, r: 2.85, lobes: 8, amp: 0.4,
    flicks: [[-72, 0.8, -1], [-30, 0.95, -1], [8, 0.85, 1], [44, 0.95, 1], [80, 0.75, 1]],
    fringe: [[-46, -1.2, 0.7, -0.2], [-14, -0.95, 0.76, 0.15], [18, -1.0, 0.7, 0.35], [48, -1.25, 0.6, 0.3]],
  },
  swept: {
    from: -100, to: 100, r: 2.8, lobes: 7, amp: 0.28,
    flicks: [[-60, 0.6, -1], [50, 0.75, 1]],
    fringe: [[-50, -1.15, 0.85, 1.0], [-16, -1.0, 0.85, 1.1], [20, -1.05, 0.75, 0.9]],
  },
  curly: { curls: true },
  ponytail: {
    from: -100, to: 100, r: 2.7, lobes: 6, amp: 0.15, smooth: true, tail: true,
    flicks: [],
    locks: true,
    fringe: [[-42, -1.1, 0.78, 0.75], [-10, -0.95, 0.82, 0.85], [24, -1.05, 0.72, 0.7]],
  },
}

const polar = (c, deg, r) => [c[0] + Math.sin((deg * Math.PI) / 180) * r, c[1] - Math.cos((deg * Math.PI) / 180) * r]

function hairMass(c, S) {
  // start at the left temple, scallop over the crown, end at the right temple
  const n = S.lobes
  let d = `M${P(polar(c, S.from, 2.35))}L${P(polar(c, S.from, S.r))}`
  for (let i = 0; i < n; i++) {
    const a0 = S.from + ((S.to - S.from) * i) / n, a1 = S.from + ((S.to - S.from) * (i + 1)) / n
    const am = (a0 + a1) / 2
    d += `Q${P(polar(c, am, S.r + S.amp))} ${P(polar(c, a1, S.r))}`
  }
  d += `L${P(polar(c, S.to, 2.3))}`
  // close along the hairline: temples → high across the forehead
  d += `C${P(polar(c, 35, 2.3))} ${P(polar(c, -35, 2.3))} ${P(polar(c, S.from, 2.3))}Z`
  return d
}

function flickPath(c, S, deg, size, dir) {
  const base = polar(c, deg, S.r + S.amp * 0.4)
  const out = norm(sub(base, c)), tan = [out[1] * -dir, -out[0] * -dir]
  const tip = add(base, add(mul(out, size * 0.75), mul(tan, size * 0.7)))
  const b1 = add(base, mul(tan, -0.42)), b2 = add(base, mul(tan, 0.42))
  return `M${P(add(b1, mul(out, -0.3)))}Q${P(add(lerp(b1, tip, 0.5), mul(out, 0.35)))} ${P(tip)}Q${P(add(lerp(b2, tip, 0.5), mul(out, -0.05)))} ${P(add(b2, mul(out, -0.3)))}Z`
}

function fringeClump(c, deg, endY, w, sweep) {
  const root = polar(c, deg, 2.2)
  const tip = [root[0] + sweep, c[1] + endY]
  const d = sub(tip, root), n = norm(perp(d)), m = lerp(root, tip, 0.5)
  const bow = mul(n, -0.3 * Math.sign(sweep || 1))
  return `M${P(add(root, mul(n, w)))}Q${P(add(add(m, mul(n, w * 0.9)), bow))} ${P(tip)}Q${P(add(add(m, mul(n, -w * 0.8)), bow))} ${P(add(root, mul(n, -w)))}Z`
}

function hair(c, style, col, look, view, layer, kit) {
  const S = HAIR_STYLES[style] || HAIR_STYLES.tufts
  const dark = tint(col, -0.38), hi = tint(col, 0.35)
  const shift = view === 'three' ? -look * 0.25 : view === 'side' ? -look * 0.55 : 0
  const cc = [c[0] + shift, c[1]]
  const stroke = `stroke="${OUTLINE}" stroke-width="0.22" stroke-linejoin="round"`
  let s = ''
  if (S.curls) {
    if (layer === 'back') {
      s += `<circle cx="${r2(cc[0])}" cy="${r2(cc[1] - 0.5)}" r="3.0" fill="${col}" ${stroke}/>`
      return s
    }
    const ring = view === 'back'
      ? [[-2.5, -0.2], [-2.6, -1.4], [-2.0, -2.5], [-1.0, -3.15], [0.1, -3.35], [1.2, -3.1], [2.15, -2.45], [2.65, -1.3], [2.5, -0.1], [-1.4, 0.9], [0, 1.2], [1.4, 0.9], [-1.0, -1.0], [0.6, -1.2]]
      : [[-2.55, 0.0], [-2.7, -1.2], [-2.15, -2.35], [-1.15, -3.05], [0, -3.3], [1.15, -3.05], [2.15, -2.35], [2.7, -1.2], [2.55, 0.0], [-1.6, -1.75], [-0.5, -2.05], [0.6, -2.05], [1.65, -1.75]]
    for (const [x, y] of ring) s += `<circle cx="${r2(cc[0] + x)}" cy="${r2(cc[1] + y)}" r="0.82" fill="${col}" ${stroke}/>`
    for (const [x, y] of [[-1.15, -2.8], [0.1, -3.05], [-2.0, -1.95]]) s += `<path d="M${r2(cc[0] + x - 0.32)} ${r2(cc[1] + y + 0.12)}q0.32 -0.38 0.64 0" fill="none" stroke="${hi}" stroke-width="0.2" stroke-linecap="round"/>`
    return s
  }
  if (layer === 'back') {
    // volume behind the head (and the side locks / ponytail)
    if (S.locks || view === 'back') {
      const low = view === 'back' ? 2.5 : 1.3
      s += `<path d="M${P([cc[0] - 2.75, cc[1] - 0.6])}C${P([cc[0] - 3.0, cc[1] + low * 0.6])} ${P([cc[0] - 2.2, cc[1] + low])} ${P([cc[0] - 1.4, cc[1] + low])}L${P([cc[0] + 1.4, cc[1] + low])}C${P([cc[0] + 2.2, cc[1] + low])} ${P([cc[0] + 3.0, cc[1] + low * 0.6])} ${P([cc[0] + 2.75, cc[1] - 0.6])}Z" fill="${col}" ${stroke}/>`
    }
    if (S.tail) {
      const dir = view === 'front' || view === 'back' ? 1 : -look
      const base = [cc[0] + 1.7 * dir, cc[1] - 2.25]
      const mid = [base[0] + 2.0 * dir, base[1] + 1.6], tip = [base[0] + 1.5 * dir, base[1] + 4.6], curl = [base[0] + 0.55 * dir, base[1] + 4.0]
      const tailD = `M${P([base[0] - 0.55 * dir, base[1] - 0.1])}C${P([base[0] + 2.3 * dir, base[1] - 1.3])} ${P([mid[0] + 1.0 * dir, mid[1]])} ${P(tip)}Q${P([tip[0] - 0.75 * dir, tip[1] + 0.75])} ${P(curl)}Q${P([mid[0] - 0.55 * dir, mid[1] + 0.3])} ${P([base[0] + 0.35 * dir, base[1] + 0.8])}Z`
      s += `<path d="${tailD}" fill="${col}" ${stroke}/>`
      s += `<path d="M${P([base[0] + 0.95 * dir, base[1] + 0.2])}Q${P([mid[0] + 0.15 * dir, mid[1] - 0.3])} ${P([tip[0] + 0.05 * dir, tip[1] - 0.8])}" fill="none" stroke="${dark}" stroke-width="0.13" stroke-linecap="round"/>`
      s += `<path d="M${P([base[0] + 0.6 * dir, base[1] - 0.45])}Q${P([mid[0] + 0.25 * dir, mid[1] - 1.1])} ${P([mid[0] + 0.75 * dir, mid[1] + 0.2])}" fill="none" stroke="${hi}" stroke-width="0.2" stroke-linecap="round"/>`
      s += `<ellipse cx="${r2(base[0])}" cy="${r2(base[1])}" rx="0.52" ry="0.66" fill="${kit.shirt}" stroke="${OUTLINE}" stroke-width="0.17" transform="rotate(${-30 * dir} ${r2(base[0])} ${r2(base[1])})"/>`
    }
    return s
  }
  if (view === 'back') {
    // the back of the head: all hair, clumps falling to the nape
    s += `<path d="${hairMass(cc, { ...S, from: -150, to: 150 })}" fill="${col}" ${stroke}/>`
    s += `<ellipse cx="${r2(cc[0])}" cy="${r2(cc[1] + 0.2)}" rx="2.4" ry="2.15" fill="${col}"/>`
    for (const x of [-1.5, -0.5, 0.5, 1.5]) s += `<path d="M${r2(cc[0] + x * 0.7)} ${r2(cc[1] - 2.2)}Q${r2(cc[0] + x * 1.1)} ${r2(cc[1] - 0.4)} ${r2(cc[0] + x)} ${r2(cc[1] + 1.7)}" fill="none" stroke="${dark}" stroke-width="0.14" stroke-linecap="round"/>`
    s += `<path d="M${r2(cc[0] - 2.4)} ${r2(cc[1] + 1.1)}Q${r2(cc[0])} ${r2(cc[1] + 2.5)} ${r2(cc[0] + 2.4)} ${r2(cc[1] + 1.1)}" fill="none" stroke="${OUTLINE}" stroke-width="0.2"/>`
    return s
  }
  // flicks sit behind the mass so only their tips show
  for (const [deg, size, dir] of S.flicks) s += `<path d="${flickPath(cc, S, deg, size, dir)}" fill="${col}" ${stroke}/>`
  s += `<path d="${hairMass(cc, S)}" fill="${col}" ${stroke}/>`
  // side locks framing the face (ponytail style)
  if (S.locks) for (const side of [-1, 1]) {
    if (view !== 'front' && side === look) continue
    const r = [cc[0] + side * 2.25, cc[1] - 1.1], t = [cc[0] + side * 2.75, cc[1] + 1.05]
    s += `<path d="M${P([r[0] - 0.45 * side, r[1] - 0.2])}Q${P([t[0] + 0.3 * side, cc[1] - 0.2])} ${P(t)}Q${P([t[0] - 0.5 * side, cc[1] + 0.1])} ${P([r[0] - 0.55 * side, r[1] + 0.9])}Z" fill="${col}" ${stroke}/>`
  }
  // strand lines on the crown
  for (const deg of [-62, -28, 30, 64]) {
    const a = polar(cc, deg, S.r - 0.2), b = polar(cc, deg + (deg < 0 ? 14 : -14), S.r - 0.85)
    s += `<path d="M${P(a)}Q${P(polar(cc, deg + (deg < 0 ? 4 : -4), S.r - 0.6))} ${P(b)}" fill="none" stroke="${dark}" stroke-width="0.12" stroke-linecap="round"/>`
  }
  // fringe over the forehead
  for (const [deg, endY, w, sweep] of S.fringe) {
    const sw = sweep + (view === 'three' ? look * 0.3 : 0)
    s += `<path d="${fringeClump(cc, deg, endY, w, sw)}" fill="${col}" stroke="${dark}" stroke-width="0.14" stroke-linejoin="round"/>`
  }
  // highlights where the light hits (top left)
  for (const [deg, l] of [[-40, 24], [-8, 16]]) {
    const r = S.r - 0.42
    s += `<path d="M${P(polar(cc, deg - l / 2, r))}Q${P(polar(cc, deg, r + 0.2))} ${P(polar(cc, deg + l / 2, r))}" fill="none" stroke="${hi}" stroke-width="0.26" stroke-linecap="round"/>`
  }
  return s
}

// ============================================================
// HEAD & FACE
// ============================================================
function headShape(c) {
  const x = c[0], y = c[1]
  return `M${r2(x)} ${r2(y - 2.35)}C${r2(x + 1.5)} ${r2(y - 2.35)} ${r2(x + 2.5)} ${r2(y - 1.35)} ${r2(x + 2.45)} ${r2(y + 0.35)}` +
    `C${r2(x + 2.4)} ${r2(y + 1.6)} ${r2(x + 1.35)} ${r2(y + 2.2)} ${r2(x)} ${r2(y + 2.2)}` +
    `C${r2(x - 1.35)} ${r2(y + 2.2)} ${r2(x - 2.4)} ${r2(y + 1.6)} ${r2(x - 2.45)} ${r2(y + 0.35)}` +
    `C${r2(x - 2.5)} ${r2(y - 1.35)} ${r2(x - 1.5)} ${r2(y - 2.35)} ${r2(x)} ${r2(y - 2.35)}Z`
}

function face(c, skin, hairCol, look, view, expr, blink, freckles) {
  const ink = '#2b1a12'
  const fx = view === 'side' ? 1.25 : view === 'three' ? 0.62 : 0
  const fl = look < 0 ? -1 : 1
  const eyeY = c[1] + 0.35
  let s = ''
  // jaw shade + the soft shadow the fringe casts on the forehead
  s += `<path d="M${r2(c[0] + 2.35)} ${r2(c[1] + 0.2)}C${r2(c[0] + 2.2)} ${r2(c[1] + 1.7)} ${r2(c[0] + 1.0)} ${r2(c[1] + 2.15)} ${r2(c[0] - 0.2)} ${r2(c[1] + 2.15)}C${r2(c[0] + 1.3)} ${r2(c[1] + 1.6)} ${r2(c[0] + 1.95)} ${r2(c[1] + 1.0)} ${r2(c[0] + 2.35)} ${r2(c[1] + 0.2)}Z" fill="${skin.shade}" opacity="0.7"/>`
  s += `<ellipse cx="${r2(c[0] + fx * fl * 0.3)}" cy="${r2(c[1] - 1.15)}" rx="1.95" ry="0.6" fill="${skin.shade}" opacity="0.55"/>`
  const eyes = view === 'side' ? [c[0] + fl * 1.15] : [c[0] - 1.0 + fl * fx, c[0] + 1.0 + fl * fx]
  eyes.forEach((ex, i) => {
    const far = view !== 'front' && ((fl > 0 && i === 0) || (fl < 0 && i === 1))
    const sx = far ? 0.82 : 1
    const closed = blink || expr === 'happy' || (expr === 'wink' && i === (fl > 0 ? 1 : 0))
    if (closed) {
      const curve = expr === 'happy' || expr === 'wink' ? -0.5 : 0.18
      s += `<path d="M${r2(ex - 0.42 * sx)} ${r2(eyeY + 0.1)}Q${r2(ex)} ${r2(eyeY + curve)} ${r2(ex + 0.42 * sx)} ${r2(eyeY + 0.1)}" fill="none" stroke="${ink}" stroke-width="0.24" stroke-linecap="round"/>`
    } else {
      const ry = expr === 'oh' ? 0.66 : 0.6
      s += `<ellipse cx="${r2(ex)}" cy="${r2(eyeY)}" rx="${r2(0.43 * sx)}" ry="${ry}" fill="${ink}"/>`
      s += `<circle cx="${r2(ex + 0.14 * sx)}" cy="${r2(eyeY - 0.22)}" r="0.17" fill="#fff"/>`
    }
    // short thick brows in hair colour (determined = angled down to the middle)
    const inner = ex < c[0] + fl * fx ? 1 : -1
    const dip = expr === 'focus' ? 0.3 : expr === 'oh' ? -0.18 : 0
    const b1 = [ex - 0.42 * sx, eyeY - 1.0 + (inner < 0 ? dip : 0)]
    const b2 = [ex + 0.42 * sx, eyeY - 1.0 + (inner > 0 ? dip : 0)]
    s += `<path d="M${P(b1)}Q${r2(ex)} ${r2(eyeY - 1.28)} ${P(b2)}" fill="none" stroke="${tint(hairCol, -0.15)}" stroke-width="0.27" stroke-linecap="round"/>`
  })
  // blush + freckles
  const cheeks = view === 'side' ? [c[0] + fl * 0.75] : [c[0] - 1.55 + fl * fx * 0.8, c[0] + 1.55 + fl * fx * 0.8]
  for (const cx of cheeks) {
    s += `<ellipse cx="${r2(cx)}" cy="${r2(c[1] + 1.15)}" rx="0.5" ry="0.3" fill="#ff8f80" opacity="0.5"/>`
    if (freckles) for (const [dx, dy] of [[-0.25, -0.05], [0.05, 0.12], [0.28, -0.08]]) s += `<circle cx="${r2(cx + dx)}" cy="${r2(c[1] + 1.05 + dy)}" r="0.07" fill="${tint(skin.shade, -0.3)}"/>`
  }
  // button nose with a tiny highlight
  const nx = c[0] + fl * fx * 1.35 + (view === 'side' ? fl * 0.25 : 0), ny = c[1] + 0.98
  s += `<ellipse cx="${r2(nx)}" cy="${r2(ny)}" rx="0.27" ry="0.21" fill="${skin.warm}"/><circle cx="${r2(nx - 0.07)}" cy="${r2(ny - 0.07)}" r="0.07" fill="#fff" opacity="0.7"/>`
  // mouth
  const mx = c[0] + fl * fx * 1.15, my = c[1] + 1.48
  if (expr === 'oh') {
    s += `<ellipse cx="${r2(mx)}" cy="${r2(my + 0.18)}" rx="0.27" ry="0.34" fill="#7a2420" stroke="${OUTLINE}" stroke-width="0.1"/>`
  } else if (expr === 'calm' || expr === 'focus' || expr === 'wink') {
    const k = expr === 'focus' ? 0.12 : 0.36
    s += `<path d="M${r2(mx - 0.46)} ${r2(my)}Q${r2(mx)} ${r2(my + k)} ${r2(mx + 0.46)} ${r2(my)}" fill="none" stroke="#6a2a1a" stroke-width="0.18" stroke-linecap="round"/>`
  } else {
    const w = expr === 'happy' ? 0.62 : 0.7
    s += `<path d="M${r2(mx - w)} ${r2(my - 0.08)}Q${r2(mx)} ${r2(my)} ${r2(mx + w)} ${r2(my - 0.08)}Q${r2(mx + w * 0.82)} ${r2(my + 0.95)} ${r2(mx)} ${r2(my + 0.95)}Q${r2(mx - w * 0.82)} ${r2(my + 0.95)} ${r2(mx - w)} ${r2(my - 0.08)}Z" fill="#7d2622" stroke="${OUTLINE}" stroke-width="0.12" stroke-linejoin="round"/>`
    s += `<path d="M${r2(mx - w * 0.78)} ${r2(my - 0.04)}L${r2(mx + w * 0.78)} ${r2(my - 0.04)}L${r2(mx + w * 0.66)} ${r2(my + 0.16)}L${r2(mx - w * 0.66)} ${r2(my + 0.16)}Z" fill="#fff"/>`
    s += `<path d="M${r2(mx - 0.36)} ${r2(my + 0.72)}Q${r2(mx)} ${r2(my + 0.36)} ${r2(mx + 0.36)} ${r2(my + 0.72)}Q${r2(mx)} ${r2(my + 0.95)} ${r2(mx - 0.36)} ${r2(my + 0.72)}Z" fill="#ff7c84"/>`
  }
  return s
}

function head(c, o, look, view, kit) {
  const skin = o.skin
  let s = ''
  s += hair(c, o.hair, o.hairColour, look, view, 'back', kit)
  // ears, set low (the near one only in three/side views)
  const ears = view === 'side' ? [-look * 0.35] : view === 'three' ? [-look * 2.15] : [-2.38, 2.38]
  if (view !== 'back') for (const dx of ears) {
    const ex = c[0] + dx, ey = c[1] + 0.5
    s += `<ellipse cx="${r2(ex)}" cy="${r2(ey)}" rx="0.58" ry="0.74" fill="${skin.base}" stroke="${OUTLINE}" stroke-width="0.2"/>`
    s += `<path d="M${r2(ex + 0.05)} ${r2(ey - 0.35)}q-0.3 0.35 0 0.7" fill="none" stroke="${skin.shade}" stroke-width="0.16" stroke-linecap="round"/>`
  }
  s += `<path d="${headShape(c)}" fill="${skin.base}"/>`
  if (view !== 'back') s += face(c, skin, o.hairColour, look, view, o.expr, o.blink, o.freckles)
  s += `<path d="${headShape(c)}" fill="none" stroke="${OUTLINE}" stroke-width="0.24"/>`
  s += hair(c, o.hair, o.hairColour, look, view, 'front', kit)
  return s
}

// ============================================================
// BODY PARTS
// ============================================================
function hand(at, from, state, skin) {
  const d = norm(sub(at, from)), n = perp(d)
  const c = add(at, mul(d, 0.1))
  let s = ''
  if (state === 'fist' || state === 'grip') {
    s += `<circle cx="${r2(c[0])}" cy="${r2(c[1])}" r="0.66" fill="${skin.base}" stroke="${OUTLINE}" stroke-width="0.18"/>`
    // finger creases over whatever is held
    for (const k of [-0.22, 0.05, 0.3]) {
      const a = add(c, add(mul(n, k), mul(d, 0.05))), b = add(a, mul(d, 0.38))
      s += line(a, b, skin.shade, 0.11)
    }
    const th = add(c, add(mul(n, -0.42), mul(d, -0.12)))
    s += `<ellipse cx="${r2(th[0])}" cy="${r2(th[1])}" rx="0.24" ry="0.2" fill="${skin.base}" stroke="${OUTLINE}" stroke-width="0.14"/>`
  } else {
    // open mitten: rounded palm along the forearm + a thumb
    const tip = add(c, mul(d, 0.35))
    s += `<path d="${capsule(add(c, mul(d, -0.25)), tip, 0.56, 0.52)}" fill="${skin.base}" stroke="${OUTLINE}" stroke-width="0.18"/>`
    const th = add(c, add(mul(n, 0.45), mul(d, -0.05)))
    s += `<path d="${capsule(add(c, mul(n, 0.2)), th, 0.2, 0.17)}" fill="${skin.base}" stroke="${OUTLINE}" stroke-width="0.14"/>`
    s += line(add(tip, mul(n, -0.12)), add(c, mul(n, -0.12)), skin.shade, 0.09)
  }
  return s
}

function arm(sh, el, hd, state, kit, skin, view) {
  const sleeveEnd = lerp(sh, el, 0.5)
  let s = ''
  s += limb(lerp(sh, el, 0.35), el, 0.55, 0.48, skin.base, skin.shade)
  s += limb(el, lerp(el, hd, 0.84), 0.48, 0.42, skin.base, skin.shade)
  s += hand(hd, el, state, skin)
  // sleeve: flares off the shoulder, white trim at the hem
  const d = norm(sub(el, sh)), n = perp(d)
  const w0 = 0.9, w1 = 0.82
  const a1 = add(sh, add(mul(n, w0), mul(d, -0.25))), a2 = add(sh, add(mul(n, -w0), mul(d, -0.25)))
  const b1 = add(sleeveEnd, mul(n, w1)), b2 = add(sleeveEnd, mul(n, -w1))
  const sleeve = `M${P(a1)}L${P(b1)}Q${P(add(sleeveEnd, mul(d, 0.12)))} ${P(b2)}L${P(a2)}Q${P(add(sh, mul(d, -0.75)))} ${P(a1)}Z`
  s += `<path d="${sleeve}" fill="${kit.shirt}"/>`
  const side = n[0] * LIGHT[0] + n[1] * LIGHT[1] >= 0 ? 1 : -1
  const sa = add(sh, add(mul(n, side * w0 * 0.55), mul(d, -0.1))), sb = add(sleeveEnd, mul(n, side * w1 * 0.55))
  s += `<path d="${capsule(sa, sb, w0 * 0.42, w1 * 0.42)}" fill="${kit.shade}"/>`
  s += line(add(b1, mul(d, -0.12)), add(b2, mul(d, -0.12)), kit.trim, 0.22, 'butt')
  s += `<path d="${sleeve}" fill="none" stroke="${OUTLINE}" stroke-width="0.2" stroke-linejoin="round"/>`
  return s
}

function boot(foot, knee, facing) {
  const down = norm(sub(foot, knee))
  // toe points the way the shin leans, or the way the kid faces
  const f = Math.abs(down[0]) > 0.45 ? Math.sign(down[0]) : facing
  const x = foot[0], y = foot[1]
  const heel = x - f * 0.55, toe = x + f * 1.05
  const d = `M${r2(heel)} ${r2(y - 0.72)}Q${r2(x + f * 0.15)} ${r2(y - 0.95)} ${r2(x + f * 0.55)} ${r2(y - 0.62)}Q${r2(toe + f * 0.1)} ${r2(y - 0.5)} ${r2(toe)} ${r2(y - 0.12)}` +
    `L${r2(toe - f * 0.05)} ${r2(y + 0.12)}L${r2(heel - f * 0.05)} ${r2(y + 0.12)}Q${r2(heel - f * 0.25)} ${r2(y - 0.35)} ${r2(heel)} ${r2(y - 0.72)}Z`
  let s = `<path d="${d}" fill="${BOOT}" stroke="${OUTLINE}" stroke-width="0.2" stroke-linejoin="round"/>`
  s += `<path d="M${r2(heel - f * 0.04)} ${r2(y + 0.02)}L${r2(toe - f * 0.06)} ${r2(y + 0.02)}" stroke="${SOLE}" stroke-width="0.2" stroke-linecap="round"/>`
  s += `<path d="M${r2(x - f * 0.05)} ${r2(y - 0.82)}Q${r2(x + f * 0.4)} ${r2(y - 0.86)} ${r2(x + f * 0.65)} ${r2(y - 0.58)}" fill="none" stroke="${BOOT_HI}" stroke-width="0.16" stroke-linecap="round"/>`
  for (let i = 0; i < 3; i++) {
    const sx = x - f * 0.25 + f * i * 0.26
    s += `<path d="M${r2(sx)} ${r2(y - 0.66)}L${r2(sx + f * 0.2)} ${r2(y - 0.18)}" stroke="#fff" stroke-width="0.12" stroke-linecap="round"/>`
  }
  return s
}

function leg(hip, knee, foot, kit, skin, facing) {
  let s = ''
  s += limb(lerp(hip, knee, 0.55), knee, 0.66, 0.52, skin.base, skin.shade)
  // long sock from just below the knee, two stripes near the top
  const top = lerp(knee, foot, 0.1)
  s += limb(knee, top, 0.5, 0.52, skin.base, skin.shade)
  s += limb(top, lerp(top, foot, 0.92), 0.6, 0.47, kit.sock, kit.sockShade)
  const d = sub(foot, top)
  for (const u of [0.1, 0.26]) {
    const c = lerp(top, foot, u), n = norm(perp(d)), w = 0.57 - u * 0.12
    s += line(add(c, mul(n, w)), add(c, mul(n, -w)), kit.trim, 0.2, 'butt')
  }
  s += `<path d="${capsule(top, lerp(top, foot, 0.92), 0.6, 0.47)}" fill="none" stroke="${OUTLINE}" stroke-width="0.17"/>`
  s += boot(foot, knee, facing)
  return s
}

// One leg opening of the shorts: a flared tube down the thigh.
function shortsLeg(hip, knee, center, kit) {
  const d = norm(sub(knee, hip)), n = perp(d)
  const out = (hip[0] - center[0]) * n[0] + (hip[1] - center[1]) * n[1] >= 0 ? 1 : -1
  const end = lerp(hip, knee, 0.68)
  const a1 = add(hip, mul(n, 1.05)), a2 = add(hip, mul(n, -1.05))
  const b1 = add(end, mul(n, 0.95)), b2 = add(end, mul(n, -0.95))
  const p = `M${P(a1)}L${P(b1)}Q${P(add(end, mul(d, 0.1)))} ${P(b2)}L${P(a2)}Z`
  let s = `<path d="${p}" fill="${SHORTS}"/>`
  const side = n[0] * LIGHT[0] + n[1] * LIGHT[1] >= 0 ? 1 : -1
  s += `<path d="M${P(add(hip, mul(n, side * 0.3)))}L${P(add(end, mul(n, side * 0.3)))}L${P(add(end, mul(n, side * 0.95)))}L${P(add(hip, mul(n, side * 1.05)))}Z" fill="${SHORTS_SHADE}"/>`
  // team stripe down the outside of the leg
  s += line(add(hip, mul(n, out * 0.8)), add(end, mul(n, out * 0.72)), kit.shirt, 0.26, 'butt')
  s += `<path d="${p}" fill="none" stroke="${OUTLINE}" stroke-width="0.18" stroke-linejoin="round"/>`
  return s
}

function shirtBody(neck, hip, kit, view, number, look, mirror) {
  const up = norm(sub(neck, hip)), n = perp(up)
  const narrow = view === 'side' ? 0.62 : view === 'three' ? 0.9 : 1
  const sw = 1.95 * narrow, hw = 1.78 * narrow
  const fl = look < 0 ? -1 : 1
  const s1 = add(neck, add(mul(n, sw), mul(up, -0.2))), s2 = add(neck, add(mul(n, -sw), mul(up, -0.2)))
  const hem = add(hip, mul(up, -0.05))
  const h1 = add(hem, mul(n, hw)), h2 = add(hem, mul(n, -hw))
  const top = add(neck, mul(up, 0.3))
  const d = `M${P(s1)}Q${P(add(top, mul(n, sw * 0.75)))} ${P(top)}Q${P(add(top, mul(n, -sw * 0.75)))} ${P(s2)}L${P(h2)}Q${P(add(hem, mul(up, -0.25)))} ${P(h1)}Z`
  let s = `<path d="${d}" fill="${kit.shirt}"/>`
  // cel shading: the side away from the light + a fold under the chest
  const side = n[0] * LIGHT[0] + n[1] * LIGHT[1] >= 0 ? 1 : -1
  const e1 = side > 0 ? s1 : s2, e2 = side > 0 ? h1 : h2
  s += `<path d="M${P(lerp(e1, e2, 0.05))}L${P(e2)}L${P(lerp(e2, side > 0 ? h2 : h1, 0.28))}Q${P(lerp(lerp(e1, e2, 0.5), add(neck, mul(n, side * sw * 0.2)), 0.45))} ${P(lerp(e1, side > 0 ? s2 : s1, 0.2))}Z" fill="${kit.shade}"/>`
  s += `<path d="M${P(lerp(h2, h1, 0.28))}Q${P(add(lerp(hem, hip, 0.2), mul(up, 0.45)))} ${P(lerp(h2, h1, 0.62))}" fill="none" stroke="${kit.shade}" stroke-width="0.16" stroke-linecap="round"/>`
  // number (front / three: chest; back: big on the back)
  if (number != null && view !== 'side') {
    const c = view === 'back' ? lerp(neck, hip, 0.5) : lerp(neck, hip, 0.47)
    const size = view === 'back' ? 2.25 : 1.75
    const sx = (view === 'three' ? 0.82 : 1) * (mirror ? -1 : 1)
    const ox = view === 'three' ? fl * 0.35 : 0
    s += `<text x="0" y="0" transform="translate(${r2(c[0] + ox)} ${r2(c[1] + size * 0.36)}) scale(${sx} 1)" font-size="${size}" font-weight="900" text-anchor="middle" fill="${kit.trim}" stroke="${kit.numberLine}" stroke-width="0.14" paint-order="stroke" font-family="Nunito, 'Arial Rounded MT Bold', system-ui, sans-serif">${number}</text>`
  }
  s += `<path d="${d}" fill="none" stroke="${OUTLINE}" stroke-width="0.26" stroke-linejoin="round"/>`
  // white ring collar (back view: a plain band)
  const cw = view === 'side' ? 0.55 : 0.85
  const c1 = add(neck, add(mul(n, cw), mul(up, 0.1))), c2 = add(neck, add(mul(n, -cw), mul(up, 0.1)))
  const dip = view === 'back' ? 0.15 : 0.55
  s += `<path d="M${P(c1)}Q${P(add(neck, mul(up, -dip)))} ${P(c2)}" fill="none" stroke="${OUTLINE}" stroke-width="0.55" stroke-linecap="round"/>`
  s += `<path d="M${P(c1)}Q${P(add(neck, mul(up, -dip)))} ${P(c2)}" fill="none" stroke="${kit.trim}" stroke-width="0.32" stroke-linecap="round"/>`
  return s
}

// little curved effort ticks
function effortLines(list, t) {
  if (!list) return ''
  const pulse = 0.65 + 0.35 * Math.sin((t || 0) * 5)
  return list.map(([x, y, a]) =>
    `<path d="M0 -0.45Q0.18 0 0 0.45" transform="translate(${x} ${y}) rotate(${a})" fill="none" stroke="#ffffff" stroke-width="0.2" stroke-linecap="round" opacity="${r2(pulse)}"/>`).join('')
}

// ============================================================
// renderKid
// ============================================================
/**
 * @param pose  a POSES name or joint object (blend with blendPoses)
 * @param team  team colour hex (shirt + socks + trims follow it)
 * @param opts  { number, hair, hairColour, skin (index|object), freckles,
 *               expr: grin|happy|calm|oh|focus|wink, look: 1|-1,
 *               t (seconds, for idle life), still (no idle), effort }
 */
export function renderKid(pose, team, opts = {}) {
  const p = typeof pose === 'string' ? POSES[pose] || POSES.stand : pose
  const view = opts.view || p.view || 'front'
  const look = opts.look ?? 1
  const light = lum(team) > 0.66 // white / pale / yellow kits: dark trims
  const kit = {
    shirt: team,
    shade: tint(team, light ? -0.14 : -0.2),
    sock: team, sockShade: tint(team, light ? -0.14 : -0.2),
    trim: light ? tint(team, -0.62) : '#ffffff',
    numberLine: light ? tint(team, -0.2) : tint(team, -0.25),
  }
  const skin = typeof opts.skin === 'object' ? opts.skin : SKINS[opts.skin || 0]
  const t = opts.t || 0
  // idle life: a slow breath and a blink every few seconds
  const breath = opts.still ? 0 : Math.sin(t * 2.4) * 0.07
  const blink = !opts.still && (t + (opts.phase || 0)) % 3.7 < 0.13
  const o = {
    hair: opts.hair || 'tufts', hairColour: opts.hairColour || HAIRS.brown, skin,
    expr: opts.expr || p.expr || 'grin', blink, freckles: opts.freckles,
  }

  const up = norm(sub(p.neck, p.hip)), n = perp(up)
  const spread = view === 'side' ? 0.2 : view === 'three' ? 0.82 : 1
  const neck = add(p.neck, [0, breath]), headC = add(p.head, [0, breath * 1.3])
  const shA = add(neck, add(mul(n, 1.62 * spread), mul(up, -0.4)))
  const shB = add(neck, add(mul(n, -1.62 * spread), mul(up, -0.4)))
  // the shoulder nearer each hand's side of the body
  const [shL, shR] = shA[0] <= shB[0] ? [shA, shB] : [shB, shA]
  const hpA = add(p.hip, mul(n, 0.85 * spread)), hpB = add(p.hip, mul(n, -0.85 * spread))
  const [hipL, hipR] = hpA[0] <= hpB[0] ? [hpA, hpB] : [hpB, hpA]
  const facing = view === 'front' || view === 'back' ? 0 : 1
  const fBoot = facing || 1

  const front = new Set(p.front || ['L', 'R'])
  // side view: far arm (L) behind the body
  if (view === 'side' && !p.front) front.delete('L')

  let s = ''
  // ground shadow
  const minX = Math.min(p.footL[0], p.footR[0], p.hip[0]) - 1.4, maxX = Math.max(p.footL[0], p.footR[0], p.hip[0]) + 1.6
  s += `<ellipse cx="${r2((minX + maxX) / 2)}" cy="0.22" rx="${r2((maxX - minX) / 2 + 0.3)}" ry="0.55" fill="rgba(0,0,0,0.2)"/>`

  const armL = arm(view === 'side' ? shR : shL, p.elbowL, p.handL, p.handLState, kit, skin, view)
  const armR = arm(shR, p.elbowR, p.handR, p.handRState, kit, skin, view)
  if (!front.has('L')) s += armL
  if (!front.has('R')) s += armR
  // legs: far / lifted leg first
  const legL = leg(hipL, p.kneeL, p.footL, kit, skin, fBoot)
  const legR = leg(hipR, p.kneeR, p.footR, kit, skin, fBoot)
  s += p.liftR ? legR + legL : legL + legR
  // shorts: both leg openings then the waist
  const pc = p.hip
  s += shortsLeg(hipL, p.kneeL, pc, kit) + shortsLeg(hipR, p.kneeR, pc, kit)
  const wL = add(hipL, mul(up, 0.55)), wR = add(hipR, mul(up, 0.55))
  s += `<path d="${capsule(wL, wR, 1.0, 1.0)}" fill="${SHORTS}" stroke="${OUTLINE}" stroke-width="0.18"/>`
  // shirt body, then arms in front, then head
  s += shirtBody(neck, p.hip, kit, view, opts.number, look, opts.mirror)
  for (const k of p.front || ['L', 'R']) {
    if (!front.has(k)) continue
    s += k === 'L' ? armL : armR
  }
  // neck shadow under the chin
  s += `<ellipse cx="${r2(neck[0])}" cy="${r2(neck[1] - 0.1)}" rx="0.95" ry="0.35" fill="${skin.shade}"/>`
  s += head(headC, o, look, view, kit)
  if (opts.effort !== false) s += effortLines(p.effort, t)
  return s
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

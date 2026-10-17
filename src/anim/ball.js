// ============================================================
// Ball geometry + orientation maths, shared by the compiler (which
// spins the ball) and BallToken (which draws it).
//
// The ball is a classic 32-panel football: 12 black pentagons on a
// white ball (the hexagons are left implicit — no seams at this size).
// Its orientation is a unit quaternion [w, x, y, z] in VIEW space:
//   X = screen right, Y = screen down, Z = into the grass.
// The camera looks straight down, so the visible half of the ball is
// the half with Z < 0.
// ============================================================

// ---- Quaternions ----------------------------------------------
export const Q_ID = [1, 0, 0, 0]

export function qMul(a, b) {
  return [
    a[0] * b[0] - a[1] * b[1] - a[2] * b[2] - a[3] * b[3],
    a[0] * b[1] + a[1] * b[0] + a[2] * b[3] - a[3] * b[2],
    a[0] * b[2] - a[1] * b[3] + a[2] * b[0] + a[3] * b[1],
    a[0] * b[3] + a[1] * b[2] - a[2] * b[1] + a[3] * b[0],
  ]
}

export function qNorm(q) {
  const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1
  return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]
}

export const qConj = (q) => [q[0], -q[1], -q[2], -q[3]]

// Rotation by |v| radians about the axis v.
export function qFromRotVec(v) {
  const a = Math.hypot(v[0], v[1], v[2])
  if (a < 1e-9) return Q_ID
  const s = Math.sin(a / 2) / a
  return [Math.cos(a / 2), v[0] * s, v[1] * s, v[2] * s]
}

// Rotation vector (axis × angle) of a unit quaternion — the inverse of qFromRotVec.
export function qToRotVec(q) {
  const w = q[0] < 0 ? -1 : 1 // shortest way round
  const s = Math.hypot(q[1], q[2], q[3])
  if (s < 1e-9) return [0, 0, 0]
  const a = 2 * Math.atan2(s, Math.abs(q[0]))
  return [(w * q[1] * a) / s, (w * q[2] * a) / s, (w * q[3] * a) / s]
}

// Normalised lerp, taking the short way round. Fine for the small
// steps between baked frames.
export function qNlerp(a, b, u) {
  const d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3]
  const k = d < 0 ? -1 : 1
  return qNorm([a[0] + (k * b[0] - a[0]) * u, a[1] + (k * b[1] - a[1]) * u, a[2] + (k * b[2] - a[2]) * u, a[3] + (k * b[3] - a[3]) * u])
}

export function qRotate(q, v) {
  // v' = v + 2w(r × v) + 2 r × (r × v)
  const [w, x, y, z] = q
  const cx = y * v[2] - z * v[1]
  const cy = z * v[0] - x * v[2]
  const cz = x * v[1] - y * v[0]
  return [
    v[0] + 2 * (w * cx + y * cz - z * cy),
    v[1] + 2 * (w * cy + z * cx - x * cz),
    v[2] + 2 * (w * cz + x * cy - y * cx),
  ]
}

// ---- Panels ---------------------------------------------------
const norm3 = (v) => {
  const l = Math.hypot(v[0], v[1], v[2])
  return [v[0] / l, v[1] / l, v[2] / l]
}
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

// How far along each icosahedron edge the pentagon reaches. A true
// truncated icosahedron is 1/3; a touch more keeps the panels legible
// on a ball that's only ~10px across on a phone.
const TRUNC = 1 / 3

// 12 pentagons, each an outline of points on the unit sphere. Built
// from an icosahedron (pentagon centres = its vertices), then turned
// so one pentagon starts face-up to the camera.
export const PANELS = (() => {
  const p = (1 + Math.sqrt(5)) / 2
  const raw = []
  for (const a of [-1, 1]) for (const b of [-p, p]) raw.push([0, a, b], [a, b, 0], [b, 0, a])
  let centres = raw.map(norm3)
  // turn centre 0 to face the camera (−Z)
  const from = centres[0]
  const to = [0, 0, -1]
  const axis = cross3(from, to)
  const ang = Math.acos(Math.max(-1, Math.min(1, dot3(from, to))))
  const q0 = qFromRotVec(norm3(axis).map((c) => c * ang))
  centres = centres.map((c) => qRotate(q0, c))

  const edge = Math.max(...centres.slice(1).map((c) => dot3(centres[0], c))) // cos of neighbour spacing
  return centres.map((c) => {
    const nbrs = centres.filter((o) => o !== c && dot3(o, c) > edge - 1e-6)
    const corners = nbrs.map((nb) => norm3(c.map((ci, i) => ci + (nb[i] - ci) * TRUNC)))
    // order corners around the centre
    const e1 = norm3(cross3(c, Math.abs(c[0]) < 0.9 ? [1, 0, 0] : [0, 1, 0]))
    const e2 = cross3(c, e1)
    corners.sort((a, b) => Math.atan2(dot3(a, e2), dot3(a, e1)) - Math.atan2(dot3(b, e2), dot3(b, e1)))
    // a midpoint per edge, pushed out to the sphere, so the panels bulge like the ball does
    const pts = []
    corners.forEach((a, i) => {
      const b = corners[(i + 1) % corners.length]
      pts.push(a, norm3([(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2]))
    })
    return { c, pts }
  })
})()

// The panels as seen from above for orientation q, in units of the ball
// radius. Points round the back are pinned to the silhouette, so a panel
// rolling out of view slides off the edge of the disc instead of
// showing through it.
export function panelOutlines(q) {
  const out = []
  for (const panel of PANELS) {
    const rot = panel.pts.map((v) => qRotate(q, v))
    if (rot.every((r) => r[2] > 0)) continue // entirely round the back
    out.push(
      rot.map((r) => {
        if (r[2] <= 0) return [r[0], r[1]]
        const l = Math.hypot(r[0], r[1]) || 1
        return [r[0] / l, r[1] / l]
      }),
    )
  }
  return out
}

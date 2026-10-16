// ============================================================
// Stretch figures — side-view people for cool-down / stretching
// drills, so the animation shows HOW the body is positioned rather
// than a token. Joints in local units: origin at the feet, negative
// y = up, person ≈ 10 units tall.
// ============================================================

export const POSES = {
  stand: {
    head: [0, -9.6], shoulder: [0, -7.4], hip: [0, -4.2],
    handL: [-1.4, -4.4], handR: [1.4, -4.4],
    kneeL: [-0.5, -2.1], footL: [-0.9, 0], kneeR: [0.5, -2.1], footR: [0.9, 0],
  },
  reachUp: {
    head: [0, -9.9], shoulder: [0, -7.6], hip: [0, -4.2],
    handL: [-1.1, -11.6], handR: [1.1, -11.6],
    kneeL: [-0.4, -2.1], footL: [-0.8, 0], kneeR: [0.4, -2.1], footR: [0.8, 0],
  },
  sideBend: {
    head: [1.9, -9.2], shoulder: [1.1, -7.2], hip: [0, -4.2],
    handL: [3.6, -10.6], handR: [1.9, -4.6],
    kneeL: [-0.4, -2.1], footL: [-0.9, 0], kneeR: [0.4, -2.1], footR: [0.9, 0],
  },
  toeTouch: {
    head: [3.6, -3.4], shoulder: [2.7, -4.1], hip: [0, -4.2],
    handL: [2.5, -0.6], handR: [3.1, -0.6],
    kneeL: [-0.2, -2.1], footL: [-0.5, 0], kneeR: [0.4, -2.1], footR: [0.7, 0],
  },
  quadHold: {
    head: [0, -9.6], shoulder: [0, -7.4], hip: [0, -4.2],
    handL: [-2.5, -6.7], handR: [-1.8, -3.5],
    kneeL: [0.2, -2.1], footL: [0, 0], kneeR: [-1.0, -2.5], footR: [-1.8, -3.6],
  },
  lunge: {
    head: [0.3, -8.4], shoulder: [0.3, -6.2], hip: [0, -3.1],
    handL: [0.9, -3.4], handR: [1.2, -3.2],
    kneeL: [2.6, -2.6], footL: [2.8, 0], kneeR: [-1.6, -0.6], footR: [-3.6, 0],
  },
  butterfly: {
    head: [0, -7.2], shoulder: [0, -5.0], hip: [0, -1.1],
    handL: [-2.2, -2.3], handR: [2.2, -2.3],
    kneeL: [-2.2, -1.7], footL: [-0.3, -0.4], kneeR: [2.2, -1.7], footR: [0.3, -0.4],
  },
  sitReach: {
    head: [2.4, -5.2], shoulder: [1.5, -4.4], hip: [0, -1.1],
    handL: [2.9, -1.9], handR: [3.4, -1.6],
    kneeL: [1.8, -1.5], footL: [3.6, -0.5], kneeR: [1.8, -1.1], footR: [3.6, -0.2],
  },
  breathe: {
    head: [0, -9.7], shoulder: [0, -7.5], hip: [0, -4.2],
    handL: [-2.6, -7.9], handR: [2.6, -7.9],
    kneeL: [-0.5, -2.1], footL: [-0.9, 0], kneeR: [0.5, -2.1], footR: [0.9, 0],
  },
}

const smooth = (u) => u * u * (3 - 2 * u)

// Blend through the figure's pose changes: each `pose` action morphs
// from whatever the figure was doing into the new pose over `dur`.
export function jointsAt(actor, t) {
  let cur = POSES[actor.pose0] || POSES.stand
  for (const p of actor.poses) {
    if (t < p.t) break
    const next = POSES[p.name] || POSES.stand
    const u = smooth(Math.min(1, (t - p.t) / (p.dur || 0.7)))
    if (u >= 1) {
      cur = next
      continue
    }
    const out = {}
    for (const k of Object.keys(cur)) {
      const a = cur[k], b = next[k] || a
      out[k] = [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]
    }
    return out
  }
  return cur
}

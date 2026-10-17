// ============================================================
// SpinningBall — the drill-animation ball as the SuperCoach logo.
// On page load it rolls as if it's just been played, then friction
// brings it to rest with a pentagon facing up, the classic pose.
// ============================================================
import { useEffect, useState } from 'react'
import { Q_ID, qFromRotVec } from '../anim/ball.js'
import { BallToken } from '../anim/Actors.jsx'
import { BallShade } from '../anim/Field.jsx'
import { BALL_R } from '../anim/compile.js'

const SPIN = 2.6 // seconds until it stops
const TURNS = 2.4 // how far it rolls over in that time
// Rolling towards the wordmark (to the right), with a touch of sidespin.
const AXIS = (() => {
  const a = [0, -1, 0.3]
  const l = Math.hypot(...a)
  return a.map((c) => c / l)
})()

// Friction: spin falls off as (1 − u)², so the angle still to go is
// (1 − u)³ of the total, landing exactly on the resting pose.
function orientation(t) {
  const u = Math.min(1, t / SPIN)
  const toGo = TURNS * 2 * Math.PI * Math.pow(1 - u, 3)
  return qFromRotVec(AXIS.map((c) => -c * toGo))
}

export default function SpinningBall({ size = 24 }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const [q, setQ] = useState(() => (reduced ? Q_ID : orientation(0)))

  useEffect(() => {
    if (reduced) return
    let raf
    let start = null
    const step = (now) => {
      if (start == null) start = now
      const t = (now - start) / 1000
      setQ(orientation(t))
      if (t < SPIN) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduced])

  const r = BALL_R + 0.15
  return (
    <svg className="ball" viewBox={`${-r} ${-r} ${2 * r} ${2 * r}`} width={size} height={size} aria-hidden="true" style={{ overflow: 'visible' }}>
      <defs>
        <BallShade />
      </defs>
      <BallToken x={0} y={0} z={0} q={q} />
    </svg>
  )
}

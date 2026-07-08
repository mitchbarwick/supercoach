// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// A small looping pitch animation (same visual language as the
// drill diagrams in PitchAnimation.jsx) showing what the app is
// actually for at a glance: a coach on the sideline watching two
// players pass the ball. Deliberately lightweight — no controls,
// captions or per-drill data, just an ambient loop.
// ============================================================
import { useEffect, useRef, useState } from 'react'

const TEAM_COLORS = {
  a: { fill: '#ff5a5f', ring: '#c93a3e' }, // players
  n: { fill: '#f5a623', ring: '#c07f12' }, // coach
}

const DURATION = 3200 // ms for one full there-and-back pass
const smooth = (u) => u * u * (3 - 2 * u)

function Token({ x, y, team, label }) {
  const c = TEAM_COLORS[team]
  return (
    <g>
      <ellipse cx={x} cy={y + 3.1} rx="2.6" ry="0.9" fill="rgba(0,0,0,0.2)" />
      <circle cx={x} cy={y} r="3" fill={c.fill} stroke={c.ring} strokeWidth="0.6" />
      <text x={x} y={y + 1.1} textAnchor="middle" fontSize="3" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">
        {label}
      </text>
    </g>
  )
}

export default function LandingHero() {
  const [t, setT] = useState(0)
  const raf = useRef()
  const start = useRef(null)

  useEffect(() => {
    const step = (now) => {
      if (start.current == null) start.current = now
      setT(((now - start.current) % DURATION) / DURATION)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [])

  const AX = 34, BX = 66, PY = 26
  // ball: A -> B (0-0.45), held at B (0.45-0.55), B -> A (0.55-1)
  let bx
  if (t < 0.45) bx = AX + (BX - AX) * smooth(t / 0.45)
  else if (t < 0.55) bx = BX
  else bx = BX - (BX - AX) * smooth((t - 0.55) / 0.45)

  return (
    <div className="landing-anim" aria-hidden="true">
      <svg viewBox="0 0 100 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="100" height="64" fill="#2e8f57" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 20} y="0" width="10" height="64" fill="rgba(255,255,255,0.045)" />
        ))}
        <rect x="3" y="3" width="94" height="58" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" rx="1.5" />

        {/* the two players passing the ball */}
        <Token x={AX} y={PY} team="a" label="1" />
        <Token x={BX} y={PY} team="a" label="2" />

        {/* ball */}
        <g>
          <ellipse cx={bx} cy={PY + 2} rx="1.6" ry="0.6" fill="rgba(0,0,0,0.22)" />
          <circle cx={bx} cy={PY} r="1.7" fill="#fff" stroke="#222" strokeWidth="0.35" />
          <path d={`M ${bx - 0.7} ${PY - 0.4} l 0.7 -0.5 l 0.7 0.5 l -0.27 0.8 h -0.86 Z`} fill="#222" />
        </g>

        {/* coach watching from the sideline */}
        <Token x={50} y={57} team="n" label="C" />
      </svg>
    </div>
  )
}

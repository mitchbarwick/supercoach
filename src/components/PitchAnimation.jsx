// ============================================================
// PitchAnimation — SuperCoach's drill visualisation system.
// Renders a consistent top-down pitch (100 x 64 units) and
// animates player/ball tokens along declarative keyframe paths
// defined in each drill's `diagram` spec. Loops continuously.
// ============================================================
import { useEffect, useRef, useState } from 'react'

const TEAM_COLORS = {
  a: { fill: '#ff5a5f', ring: '#c93a3e' }, // coral team
  b: { fill: '#2f6fed', ring: '#1f4fb0' }, // blue team
  n: { fill: '#f5a623', ring: '#c07f12' }, // neutral / coach
  k: { fill: '#8e5cd9', ring: '#6a3fb0' }, // goalkeeper
}

// Easing per path segment. The DESTINATION keyframe of a segment may carry:
//   ease: 'linear' | 'in' | 'out' | 'inout' — how the entity travels into it
//   arc:  peak height (pitch units) of a lofted flight into it
// Physics defaults: a kicked ball leaves the foot at max speed and slows
// down (friction/drag), so balls default to 'out' — never easing in from a
// standstill mid-flight. Players accelerate and decelerate, so they keep
// 'inout' (smoothstep). Lofted balls ('arc') travel at near-constant
// horizontal speed, so they default to 'linear'.
const EASING = {
  linear: (u) => u,
  in: (u) => u * u,
  out: (u) => 1 - (1 - u) * (1 - u),
  inout: (u) => u * u * (3 - 2 * u),
}

// interpolate along keyframes; returns {x, y, z} where z = height off the ground
function posAt(path, t, kind) {
  if (path.length === 1) return { ...path[0], z: 0 }
  let i = 0
  while (i < path.length - 1 && path[i + 1].t <= t) i++
  if (i >= path.length - 1) {
    const last = path[path.length - 1]
    return { x: last.x, y: last.y, z: 0 }
  }
  const a = path[i]
  const b = path[i + 1]
  const span = b.t - a.t || 1
  const u = Math.min(1, Math.max(0, (t - a.t) / span))
  const ease = EASING[b.ease] || (b.arc ? EASING.linear : kind === 'ball' ? EASING.out : EASING.inout)
  const e = ease(u)
  // parabolic flight height over the segment (0 at both ends, peak = arc)
  const z = (b.arc || 0) * 4 * u * (1 - u)
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z }
}

function phaseAt(phases, t) {
  if (!phases?.length) return null
  let current = phases[0]
  for (const p of phases) if (p.t <= t) current = p
  return current.label
}

function GoalShape({ g }) {
  const facing = g.facing || (g.x < 50 ? 'right' : 'left')
  const depth = facing === 'right' ? -4 : 4
  return (
    <g>
      <rect
        x={facing === 'right' ? g.x + depth : g.x}
        y={g.y - 7}
        width={4}
        height={14}
        fill="rgba(255,255,255,0.25)"
        stroke="#fff"
        strokeWidth="0.8"
        rx="0.5"
      />
      <line x1={g.x + depth} y1={g.y - 7} x2={g.x + depth} y2={g.y + 7} stroke="#fff" strokeWidth="1.2" />
    </g>
  )
}

export default function PitchAnimation({ diagram }) {
  const [t, setT] = useState(0)
  const [playing, setPlaying] = useState(true)
  const raf = useRef()
  const start = useRef(null)
  const pausedAt = useRef(0)

  const duration = (diagram?.duration || 6) * 1000

  useEffect(() => {
    if (!playing) return
    const step = (now) => {
      if (start.current == null) start.current = now - pausedAt.current * duration
      const elapsed = (now - start.current) % duration
      setT(elapsed / duration)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [playing, duration])

  const togglePlay = () => {
    if (playing) {
      pausedAt.current = t
      start.current = null
    }
    setPlaying(!playing)
  }
  const restart = () => {
    pausedAt.current = 0
    start.current = null
    setT(0)
    setPlaying(true)
  }

  if (!diagram) return null
  const phase = phaseAt(diagram.phases, t)

  return (
    <div className="pitch-wrap" style={{ aspectRatio: '100 / 64' }}>
      <svg viewBox="0 0 100 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* grass with mowing stripes */}
        <rect x="0" y="0" width="100" height="64" fill="#2e8f57" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 20} y="0" width="10" height="64" fill="rgba(255,255,255,0.045)" />
        ))}
        {/* pitch boundary */}
        <rect x="3" y="3" width="94" height="58" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" rx="1.5" />

        {/* optional area circle (rondos etc.) */}
        {diagram.circleRadius && (
          <circle cx="50" cy="32" r={diagram.circleRadius} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" strokeDasharray="2.5 2" />
        )}

        {/* end zones */}
        {diagram.zones?.map((z, i) => (
          <rect key={i} x={z.x} y={z.y} width={z.w} height={z.h} fill="rgba(255,214,0,0.16)" stroke="rgba(255,214,0,0.7)" strokeWidth="0.6" strokeDasharray="2 1.5" rx="1" />
        ))}

        {/* goals */}
        {diagram.goals?.map((g, i) => <GoalShape key={i} g={g} />)}

        {/* gates (paired cones with dashed opening) */}
        {diagram.gates?.map((pair, i) => (
          <g key={i}>
            <line x1={pair[0].x} y1={pair[0].y} x2={pair[1].x} y2={pair[1].y} stroke="rgba(255,255,255,0.65)" strokeWidth="0.6" strokeDasharray="1.6 1.4" />
            {pair.map((c, j) => (
              <path key={j} d={`M ${c.x} ${c.y - 1.8} L ${c.x + 1.6} ${c.y + 1.2} L ${c.x - 1.6} ${c.y + 1.2} Z`} fill="#ffd54d" stroke="#c99a06" strokeWidth="0.3" />
            ))}
          </g>
        ))}

        {/* agility ladders: two rails + rungs */}
        {diagram.ladders?.map((l, i) => {
          const w = l.w || 6
          const rungs = []
          for (let rx = l.x; rx <= l.x + l.len + 0.01; rx += l.gap || 4) rungs.push(rx)
          return (
            <g key={i} stroke="rgba(255,255,255,0.75)" strokeWidth="0.45">
              <line x1={l.x} y1={l.y - w / 2} x2={l.x + l.len} y2={l.y - w / 2} />
              <line x1={l.x} y1={l.y + w / 2} x2={l.x + l.len} y2={l.y + w / 2} />
              {rungs.map((rx, j) => <line key={j} x1={rx} y1={l.y - w / 2} x2={rx} y2={l.y + w / 2} />)}
            </g>
          )
        })}

        {/* mini hurdles: a bar on two feet */}
        {diagram.hurdles?.map((h, i) => {
          const hw = (h.w || 6) / 2
          return (
            <g key={i}>
              <line x1={h.x - hw} y1={h.y - 1.2} x2={h.x - hw} y2={h.y + 1.2} stroke="#c99a06" strokeWidth="0.5" />
              <line x1={h.x + hw} y1={h.y - 1.2} x2={h.x + hw} y2={h.y + 1.2} stroke="#c99a06" strokeWidth="0.5" />
              <line x1={h.x - hw} y1={h.y} x2={h.x + hw} y2={h.y} stroke="#ffd54d" strokeWidth="1.1" />
            </g>
          )
        })}

        {/* flat hoops / ring targets */}
        {diagram.hoops?.map((h, i) => (
          <circle key={i} cx={h.x} cy={h.y} r={h.r || 3} fill="rgba(124,196,255,0.14)" stroke="#7cc4ff" strokeWidth="0.7" />
        ))}

        {/* cones */}
        {diagram.cones?.map((c, i) => (
          <path key={i} d={`M ${c.x} ${c.y - 2} L ${c.x + 1.8} ${c.y + 1.4} L ${c.x - 1.8} ${c.y + 1.4} Z`} fill="#ff9d2e" stroke="#c96a06" strokeWidth="0.35" />
        ))}

        {/* entities */}
        {diagram.entities?.map((e) => {
          const p = posAt(e.path, t, e.kind)
          if (e.kind === 'ball') {
            // Shadow stays on the ground; it shrinks and fades as the ball
            // rises, while the ball itself lifts and grows slightly
            // (closer to the "camera") so height reads instantly.
            const z = p.z || 0
            const k = 1 / (1 + z * 0.22) // ground-shadow scale with height
            const by = p.y - z // ball's drawn (airborne) position
            const r = 1.7 * (1 + z * 0.045)
            return (
              <g key={e.id}>
                <ellipse cx={p.x} cy={p.y + 2} rx={1.6 * (0.55 + 0.45 * k)} ry={0.6 * (0.55 + 0.45 * k)} fill={`rgba(0,0,0,${0.22 * k})`} />
                <circle cx={p.x} cy={by} r={r} fill="#fff" stroke="#222" strokeWidth="0.35" />
                <path d={`M ${p.x - 0.7} ${by - 0.4} l 0.7 -0.5 l 0.7 0.5 l -0.27 0.8 h -0.86 Z`} fill="#222" />
              </g>
            )
          }
          const c = TEAM_COLORS[e.team] || TEAM_COLORS.a
          // Players support `arc` too (hurdle jumps, headers) — same
          // grounded-shadow treatment as the ball.
          const zp = p.z || 0
          const kp = 1 / (1 + zp * 0.22)
          return (
            <g key={e.id}>
              <ellipse cx={p.x} cy={p.y + 3.1} rx={2.6 * (0.6 + 0.4 * kp)} ry={0.9 * (0.6 + 0.4 * kp)} fill={`rgba(0,0,0,${0.22 * kp})`} />
              <circle cx={p.x} cy={p.y - zp} r="3" fill={c.fill} stroke={c.ring} strokeWidth="0.6" />
              <text x={p.x} y={p.y - zp + 1.1} textAnchor="middle" fontSize="3" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">
                {e.label}
              </text>
            </g>
          )
        })}
      </svg>

      {phase && <div className="phase-banner">{phase}</div>}
      {diagram.areaLabel && (
        <div style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.9)', fontSize: 11.5, fontWeight: 800, color: 'var(--ink-700)', padding: '4px 10px', borderRadius: 999 }}>
          {diagram.areaLabel}
        </div>
      )}
      <div className="pitch-controls">
        <button onClick={togglePlay} aria-label={playing ? 'Pause' : 'Play'}>{playing ? '⏸' : '▶️'}</button>
        <button onClick={restart} aria-label="Restart">↺</button>
      </div>
    </div>
  )
}

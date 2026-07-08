// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// NOT a drill diagram: this is a hero animation meant to convey
// the FUN of training. Two players knock a ball about — passes
// aren't always accurate, player 2 juggles now and then, and the
// coach bounces on the sideline cheering them on. Bigger, closer
// tokens so it reads as a little group having a good time.
// ============================================================
import { useEffect, useRef, useState } from 'react'

const PLAYER = { fill: '#ff5a5f', ring: '#c93a3e' }
const COACH = { fill: '#f5a623', ring: '#c07f12' }

const R_PLAYER = 4.6
const R_COACH = R_PLAYER * 1.25 // coach 25% larger
const R_BALL = 2.1

const LOOP = 11.4 // seconds; every track starts and ends identical for a seamless loop

// ---- easing --------------------------------------------------
const EASE = {
  linear: (u) => u,
  in: (u) => u * u,
  out: (u) => 1 - (1 - u) * (1 - u), // a struck ball leaves fast, friction slows it
  inout: (u) => u * u * (3 - 2 * u),
}

// Sample an {t,x,y,e?,arc?} keyframe track at time t (seconds).
function sample(track, t, defaultEase) {
  let i = 0
  while (i < track.length - 1 && track[i + 1].t <= t) i++
  const a = track[i]
  const b = track[Math.min(i + 1, track.length - 1)]
  if (a === b) return { x: a.x, y: a.y, z: 0 }
  const span = b.t - a.t || 1
  const u = Math.min(1, Math.max(0, (t - a.t) / span))
  const e = (EASE[b.e || defaultEase] || EASE.inout)(u)
  // a lofted pass rides a parabola into its destination keyframe
  const z = b.arc ? b.arc * 4 * u * (1 - u) : 0
  return { x: a.x + (b.x - a.x) * e, y: a.y + (b.y - a.y) * e, z }
}

// ---- the ball's ground path ----------------------------------
// Passes deliberately land off-target (see the y values that don't
// match the receiver's home row) so a player has to step across.
const BALL = [
  { t: 0.0, x: 43, y: 31, e: 'out' },
  { t: 1.25, x: 59, y: 24, e: 'out' }, // pass 1 → P2, drifts high
  { t: 1.65, x: 59, y: 24, e: 'out' }, // controlled
  { t: 2.85, x: 42, y: 31, e: 'out' }, // pass 2 → P1
  { t: 3.25, x: 42, y: 31, e: 'out' },
  { t: 4.4, x: 60, y: 30, e: 'out' }, // pass 3 → P2, then juggles
  { t: 5.1, x: 61, y: 29, e: 'inout' }, // little drift while juggling
  { t: 5.8, x: 59, y: 30, e: 'inout' },
  { t: 6.5, x: 60, y: 30, e: 'inout' }, // ball settles back onto the foot
  { t: 7.7, x: 41, y: 31, e: 'out', arc: 7 }, // lofted return → P1
  { t: 8.1, x: 41, y: 31, e: 'out' },
  { t: 9.35, x: 61, y: 37, e: 'out' }, // pass 5 → P2, drifts low
  { t: 9.75, x: 61, y: 37, e: 'out' },
  { t: 10.95, x: 42, y: 31, e: 'out' }, // pass 6 → P1
  { t: 11.4, x: 43, y: 31, e: 'out' },
]

// Juggle: while the ball is "at" P2 (4.4–6.5s) it bounces on the
// foot a few times. Real gravity → symmetric parabola per bounce,
// fast near the ground, hanging at the top.
const JUGGLE = { start: 4.4, end: 6.5, peaks: [11, 8.5, 6.5] }
function juggleHeight(t) {
  if (t < JUGGLE.start || t > JUGGLE.end) return 0
  const span = (JUGGLE.end - JUGGLE.start) / JUGGLE.peaks.length
  const i = Math.min(JUGGLE.peaks.length - 1, Math.floor((t - JUGGLE.start) / span))
  const u = (t - JUGGLE.start - i * span) / span
  return JUGGLE.peaks[i] * 4 * u * (1 - u)
}

// ---- players & coach ground tracks ---------------------------
const P1 = [
  { t: 0.0, x: 40, y: 30 },
  { t: 2.7, x: 40, y: 30 },
  { t: 2.9, x: 40.5, y: 31 }, // steps onto pass 2
  { t: 3.4, x: 40, y: 30 },
  { t: 7.4, x: 40, y: 30 },
  { t: 7.75, x: 40.5, y: 31 }, // gathers the lofted ball
  { t: 8.2, x: 40, y: 30 },
  { t: 11.4, x: 40, y: 30 },
]
const P2 = [
  { t: 0.0, x: 60, y: 30 },
  { t: 1.0, x: 60, y: 30 },
  { t: 1.2, x: 60, y: 24 }, // shuffles up for the high pass
  { t: 1.9, x: 60, y: 26 },
  { t: 2.6, x: 60, y: 30 },
  { t: 6.5, x: 60, y: 30 }, // juggling, roughly in place
  { t: 7.7, x: 60, y: 30 },
  { t: 8.6, x: 60.5, y: 32 },
  { t: 9.3, x: 61, y: 37 }, // drops down for the low pass
  { t: 9.9, x: 61, y: 37 },
  { t: 10.6, x: 60, y: 32 },
  { t: 11.4, x: 60, y: 30 },
]
const COACH_HOME = { x: 50, y: 53 }

// ---- pulses & hops -------------------------------------------
// A short pop of squash-and-stretch whenever a player kicks or
// receives, so the tokens feel like they're doing the work.
const P1_PULSES = [0.0, 2.9, 7.75, 8.1, 11.4]
const P2_PULSES = [1.25, 1.65, 4.4, 5.1, 5.8, 6.5, 9.35, 9.75]
function pulseAt(times, t, half = 0.17) {
  let best = 0
  for (const time of times) {
    const raw = Math.abs(t - time)
    const d = Math.min(raw, LOOP - raw) // wrap around the loop
    if (d < half) best = Math.max(best, 1 - d / half)
  }
  return best
}

// The coach hops on the sideline to cheer — a few times per loop.
const COACH_HOPS = [1.3, 3.1, 4.85, 6.45, 8.3, 10.1]
const HOP_DUR = 0.6
function coachHop(t) {
  for (const h of COACH_HOPS) {
    if (t >= h && t <= h + HOP_DUR) {
      const u = (t - h) / HOP_DUR
      return { z: 5 * 4 * u * (1 - u), lift: Math.sin(Math.PI * u), u }
    }
  }
  return { z: 0, lift: 0, u: -1 }
}

const TAU = Math.PI * 2

function PlayerToken({ x, y, z, r, label, pulse, bob }) {
  const sx = 1 + 0.28 * pulse
  const sy = 1 - 0.22 * pulse
  const cy = y - z - bob
  const k = 1 / (1 + z * 0.2)
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.72} rx={r * 0.8 * (0.6 + 0.4 * k)} ry={r * 0.26 * (0.6 + 0.4 * k)} fill={`rgba(0,0,0,${0.22 * k})`} />
      <g transform={`translate(${x} ${cy}) scale(${sx} ${sy})`}>
        <circle r={r} fill={PLAYER.fill} stroke={PLAYER.ring} strokeWidth="0.7" />
        <text y={r * 0.34} textAnchor="middle" fontSize={r * 0.95} fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">
          {label}
        </text>
      </g>
    </g>
  )
}

function CoachToken({ x, y, z, lift, bob }) {
  const r = R_COACH
  const cy = y - z - bob
  // stretch a touch on the way up at the peak of each hop
  const sy = 1 + 0.13 * lift
  const sx = 1 - 0.09 * lift
  return (
    <g>
      <ellipse cx={x} cy={y + r * 0.7} rx={r * 0.78} ry={r * 0.24} fill="rgba(0,0,0,0.2)" />
      <g transform={`translate(${x} ${cy})`}>
        <g transform={`scale(${sx} ${sy})`}>
          <circle r={r} fill={COACH.fill} stroke={COACH.ring} strokeWidth="0.7" />
          <text y={r * 0.34} textAnchor="middle" fontSize={r * 0.82} fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">
            C
          </text>
        </g>
      </g>
    </g>
  )
}

export default function LandingHero() {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Freeze on a lively frame (mid-juggle) for reduced-motion users.
  const [t, setT] = useState(reduced ? 5.1 : 0)
  const raf = useRef()
  const start = useRef(null)

  useEffect(() => {
    if (reduced) return
    const step = (now) => {
      if (start.current == null) start.current = now
      setT(((now - start.current) / 1000) % LOOP)
      raf.current = requestAnimationFrame(step)
    }
    raf.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf.current)
  }, [reduced])

  const ball = sample(BALL, t, 'out')
  const ballZ = ball.z + juggleHeight(t)
  const p1 = sample(P1, t, 'inout')
  const p2 = sample(P2, t, 'inout')
  const hop = coachHop(t)

  // subtle idle life; frequency is a whole number of cycles per loop so it wraps cleanly
  const bob = (phase) => 0.32 * Math.sin((TAU * 4 * t) / LOOP + phase)
  const bz = 1 / (1 + ballZ * 0.2)
  const ballDrawY = ball.y - ballZ

  return (
    <div className="landing-anim" aria-hidden="true">
      <svg viewBox="0 0 100 64" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        {/* pitch */}
        <rect x="0" y="0" width="100" height="64" fill="#2e8f57" />
        {[0, 1, 2, 3, 4].map((i) => (
          <rect key={i} x={i * 20} y="0" width="10" height="64" fill="rgba(255,255,255,0.045)" />
        ))}
        <rect x="3" y="3" width="94" height="58" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="0.7" rx="1.5" />
        <line x1="50" y1="3" x2="50" y2="61" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6" />
        <circle cx="50" cy="32" r="9" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="0.6" />

        <PlayerToken x={p1.x} y={p1.y} z={0} r={R_PLAYER} label="1" pulse={pulseAt(P1_PULSES, t)} bob={bob(0)} />
        <PlayerToken x={p2.x} y={p2.y} z={0} r={R_PLAYER} label="2" pulse={pulseAt(P2_PULSES, t)} bob={bob(Math.PI)} />

        {/* ball */}
        <g>
          <ellipse cx={ball.x} cy={ball.y + 1.9} rx={1.6 * (0.5 + 0.5 * bz)} ry={0.6 * (0.5 + 0.5 * bz)} fill={`rgba(0,0,0,${0.24 * bz})`} />
          <circle cx={ball.x} cy={ballDrawY} r={R_BALL * (1 + ballZ * 0.03)} fill="#fff" stroke="#222" strokeWidth="0.35" />
          <path d={`M ${ball.x - 0.8} ${ballDrawY - 0.5} l 0.8 -0.6 l 0.8 0.6 l -0.3 0.9 h -1 Z`} fill="#222" />
        </g>

        <CoachToken x={COACH_HOME.x} y={COACH_HOME.y} z={hop.z} lift={hop.lift} bob={hop.u < 0 ? bob(1.2) * 0.5 : 0} />
      </svg>
    </div>
  )
}

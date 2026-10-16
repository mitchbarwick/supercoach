// ============================================================
// Actor components — players, balls, stretch figures, and the
// coaching-board overlays (trails, effects, speech bubbles).
// All are pure: they draw one frame from values the player hands in.
// ============================================================
import { TEAM, STROKE, LIMB } from './theme.js'
import { PLAYER_R, BALL_R } from './compile.js'
import { jointsAt } from './figures.js'

const deg = (r) => (r * 180) / Math.PI

// A player seen from above: coloured disc, white rim, and a small
// "nose" showing which way they face — so you can read body shape
// (open to receive, side-on to defend, head up to scan).
export function PlayerToken({ x, y, z, h, team, label, dive, hasBall }) {
  const c = TEAM[team] || TEAM.a
  const lift = z * 0.9
  const k = 1 / (1 + z * 0.18)
  const small = String(label).length > 1
  return (
    <g>
      <ellipse cx={x + 0.5} cy={y + 0.9} rx={(dive ? 3.6 : 2.6) * (0.6 + 0.4 * k)} ry={(dive ? 2.0 : 1.9) * (0.6 + 0.4 * k)} fill={`rgba(0,0,0,${0.24 * k})`} />
      {hasBall && <circle cx={x} cy={y - lift} r={PLAYER_R + 1.3} fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.45)" strokeWidth="0.25" />}
      <g transform={`translate(${x} ${y - lift}) rotate(${deg(h)})`}>
        <path d={`M ${PLAYER_R - 0.6} -1.75 L ${PLAYER_R + 1.75} 0 L ${PLAYER_R - 0.6} 1.75 Z`} fill={c.dark} stroke="#fff" strokeWidth="0.3" strokeLinejoin="round" />
        {dive ? (
          <ellipse rx={PLAYER_R + 1.1} ry={PLAYER_R - 0.6} fill={c.fill} stroke="#fff" strokeWidth="0.5" transform="rotate(90)" />
        ) : (
          <circle r={PLAYER_R} fill={c.fill} stroke="#fff" strokeWidth="0.5" />
        )}
      </g>
      <text x={x} y={y - lift + (small ? 0.85 : 1.05)} textAnchor="middle" fontSize={small ? 2.2 : 2.9} fontWeight="900" fill="#fff" fontFamily="Nunito, sans-serif" style={{ pointerEvents: 'none' }}>
        {label}
      </text>
    </g>
  )
}

// Ball: its shadow stays on the grass while the ball itself lifts and
// grows a touch, so height reads instantly even on a phone.
export function BallToken({ x, y, z, rot }) {
  const k = 1 / (1 + z * 0.2)
  const by = y - z * 0.9
  const r = BALL_R * (1 + z * 0.045)
  return (
    <g>
      <ellipse cx={x + 0.35 + z * 0.12} cy={y + 0.55} rx={1.25 * (0.5 + 0.5 * k)} ry={0.75 * (0.5 + 0.5 * k)} fill={`rgba(0,0,0,${0.3 * k})`} />
      <g transform={`translate(${x} ${by}) rotate(${rot})`}>
        <circle r={r} fill="#fff" stroke="#1f262b" strokeWidth="0.28" />
        <path d="M -0.42 -0.3 L 0 -0.6 L 0.42 -0.3 L 0.27 0.22 L -0.27 0.22 Z" fill="#1f262b" transform={`scale(${r / BALL_R})`} />
        <path d={`M ${-r * 0.92} 0.35 L ${-r * 0.55} 0.55`} stroke="#1f262b" strokeWidth="0.22" />
        <path d={`M ${r * 0.92} 0.35 L ${r * 0.55} 0.55`} stroke="#1f262b" strokeWidth="0.22" />
      </g>
    </g>
  )
}

export function StretchFigure({ actor, x, y, t }) {
  const j = jointsAt(actor, t)
  const s = actor.scale || 1.8
  const c = TEAM[actor.team] || TEAM.a
  const pts = (...keys) => keys.map((k) => `${j[k][0]},${j[k][1]}`).join(' ')
  return (
    <g transform={`translate(${x} ${y}) scale(${(actor.flip ? -1 : 1) * s} ${s})`}>
      <ellipse cx="0.6" cy="0.5" rx="3" ry="0.55" fill="rgba(0,0,0,0.16)" />
      <polyline points={pts('hip', 'kneeL', 'footL')} fill="none" stroke={LIMB} strokeWidth="0.62" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={pts('hip', 'kneeR', 'footR')} fill="none" stroke={LIMB} strokeWidth="0.62" strokeLinecap="round" strokeLinejoin="round" />
      <line x1={j.hip[0]} y1={j.hip[1]} x2={j.shoulder[0]} y2={j.shoulder[1]} stroke={c.fill} strokeWidth="1.25" strokeLinecap="round" />
      <line x1={j.shoulder[0]} y1={j.shoulder[1]} x2={j.handL[0]} y2={j.handL[1]} stroke={LIMB} strokeWidth="0.62" strokeLinecap="round" />
      <line x1={j.shoulder[0]} y1={j.shoulder[1]} x2={j.handR[0]} y2={j.handR[1]} stroke={LIMB} strokeWidth="0.62" strokeLinecap="round" />
      <circle cx={j.head[0]} cy={j.head[1]} r="1.45" fill={c.fill} stroke={c.dark} strokeWidth="0.28" />
    </g>
  )
}

// Coaching-board lines: solid arrow = pass, gold arrow = shot,
// dashed = run without the ball, wavy = dribble. They draw on as the
// move happens, then fade so the board never gets cluttered.
export function Strokes({ strokes, t, frame, mode }) {
  return (
    <g fill="none" strokeLinecap="round" strokeLinejoin="round">
      {strokes.map((s, i) => {
        if (mode === 'ball' && (s.kind === 'run' || s.kind === 'dribble')) return null
        if (t < s.t0 || t > s.t1 + STROKE.fade) return null
        // pts are one per baked frame, so the drawn-so-far tip is an index
        const upto = Math.min(s.pts.length - 1, frame - s.pts[0][2])
        if (upto < 1) return null
        const pts = []
        for (let k = 0; k < upto; k += 2) pts.push(s.pts[k])
        pts.push(s.pts[upto])
        const after = Math.max(0, t - s.t1)
        const op = (1 - after / STROKE.fade) * (s.kind === 'run' || s.kind === 'dribble' ? 0.75 : 0.85)
        const d = pts.map((p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(' ')
        const c = TEAM[s.team] || TEAM.a
        if (s.kind === 'pass') return <polyline key={i} points={d} stroke={STROKE.pass} strokeWidth="0.42" opacity={op} markerEnd={after > 0 ? 'url(#sc-arrow)' : undefined} />
        if (s.kind === 'shot') return <polyline key={i} points={d} stroke={STROKE.shot} strokeWidth="0.55" opacity={op} markerEnd={after > 0 ? 'url(#sc-arrow-shot)' : undefined} />
        if (s.kind === 'knock') return <polyline key={i} points={d} stroke="#fff" strokeWidth="0.35" strokeDasharray="0.8 0.8" opacity={op} />
        if (s.kind === 'dribble') return <polyline key={i} points={d} stroke={c.light} strokeWidth="0.4" opacity={op} />
        return <polyline key={i} points={d} stroke={c.light} strokeWidth="0.4" strokeDasharray="1.3 1.1" opacity={op} />
      })}
    </g>
  )
}

const EFFECT_LIFE = { bar: 0.9, kick: 0.3, touch: 0.22, tap: 0.18, release: 0.25, bounce: 0.3, tackle: 0.4, tag: 0.4, save: 0.55, goal: 1.0 }

export function Effects({ effects, t, goals }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {effects.map((e, i) => {
        const life = EFFECT_LIFE[e.kind] || 0.3
        const u = (t - e.t) / life
        if (u < 0 || u > 1) return null
        const fade = 1 - u
        switch (e.kind) {
          case 'kick':
          case 'bounce':
            return <circle key={i} cx={e.x} cy={e.y} r={1.2 + u * (e.big ? 3.6 : 2.6)} fill="none" stroke="#fff" strokeWidth={0.5 * fade + 0.1} opacity={fade} />
          case 'touch':
          case 'tap':
          case 'release':
            return <circle key={i} cx={e.x} cy={e.y} r={1 + u * 1.6} fill="none" stroke="#fff" strokeWidth="0.3" opacity={0.7 * fade} />
          case 'tackle':
          case 'tag':
            return (
              <g key={i} stroke="#ffe066" strokeWidth={0.45} opacity={fade} strokeLinecap="round">
                {[0, 1, 2, 3, 4, 5].map((q) => {
                  const a = (q / 6) * Math.PI * 2 + 0.3
                  const r0 = 1.4 + u * 1.5, r1 = 2.6 + u * 2.4
                  return <line key={q} x1={e.x + Math.cos(a) * r0} y1={e.y + Math.sin(a) * r0} x2={e.x + Math.cos(a) * r1} y2={e.y + Math.sin(a) * r1} />
                })}
              </g>
            )
          case 'save':
            return (
              <g key={i} opacity={fade}>
                <circle cx={e.x} cy={e.y} r={2.5 + u * 4} fill="none" stroke={TEAM.k.light} strokeWidth="0.6" />
                <Pop x={e.x} y={e.y - 5 - u * 2} text="SAVE!" color={TEAM.k.light} />
              </g>
            )
          case 'bar': {
            const g = goals[e.goal]
            return (
              <g key={i} opacity={Math.min(1, fade * 2)}>
                <line x1={g.x + g.t[0] * -g.w / 2} y1={g.y + g.t[1] * -g.w / 2} x2={g.x + g.t[0] * g.w / 2} y2={g.y + g.t[1] * g.w / 2} stroke="#ffe066" strokeWidth={1.4 * fade + 0.4} strokeLinecap="round" />
                <Pop x={g.x + g.n[0] * 9} y={g.y - 9 - u * 2} text="CLANG!" color="#ffe066" />
              </g>
            )
          }
          case 'goal': {
            const g = goals[e.goal]
            const cx = g ? g.x + g.n[0] * 7 : e.x
            const cy = g ? g.y + g.n[1] * 7 - 7 : e.y
            return (
              <g key={i} opacity={Math.min(1, fade * 2)}>
                <Pop x={cx} y={cy - u * 2} text="GOAL!" color="#ffe066" scale={0.8 + Math.min(1, u * 5) * 0.3} />
              </g>
            )
          }
          default:
            return null
        }
      })}
    </g>
  )
}

function Pop({ x, y, text, color, scale = 1 }) {
  const cx = Math.max(8, Math.min(92, x))
  const cy = Math.max(5, y)
  return (
    <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
      <text textAnchor="middle" y="1" fontSize="3.6" fontWeight="900" fontFamily="Nunito, sans-serif" fill={color} stroke="#073b25" strokeWidth="0.9" paintOrder="stroke">
        {text}
      </text>
    </g>
  )
}

export function Highlights({ highlights, t, actors, frame }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {highlights.map((h, i) => {
        if (t < h.t0 || t > h.t1) return null
        const x = h.who != null ? actors[h.who].x[frame] : h.x
        const y = h.who != null ? actors[h.who].y[frame] : h.y
        const pulse = 0.5 - 0.5 * Math.cos((t - h.t0) * (h.rate || 7))
        const base = h.r || 4.2
        const r = base + pulse * (h.rate ? base * 0.25 : 0.9)
        const c = h.color || '#ffe066'
        return <circle key={i} cx={x} cy={y} r={r} fill={h.color ? 'none' : 'rgba(255,224,102,0.12)'} stroke={c} strokeWidth="0.45" strokeDasharray="1.6 1" opacity={0.6 + 0.4 * pulse} />
      })}
    </g>
  )
}

export function Bubbles({ bubbles, t, actors, frame }) {
  return (
    <g style={{ pointerEvents: 'none' }}>
      {bubbles.map((b, i) => {
        if (t < b.t0 || t > b.t1) return null
        const a = actors[b.ai]
        const w = Math.max(8, b.text.length * 1.55 + 3)
        const pop = Math.min(1, (t - b.t0) / 0.15)
        const out = Math.min(1, (b.t1 - t) / 0.2)
        const ax = a.x[frame], ay = a.y[frame]
        const above = ay > 12
        const bx = Math.max(w / 2 + 1, Math.min(99 - w / 2, ax))
        const by = above ? ay - 7.2 : ay + 7.2
        return (
          <g key={i} opacity={out} transform={`translate(${bx} ${by}) scale(${0.6 + 0.4 * pop})`}>
            <path d={above ? `M ${ax - bx - 1.2} 2.2 L ${ax - bx} 4.4 L ${ax - bx + 1.2} 2.2 Z` : `M ${ax - bx - 1.2} -2.2 L ${ax - bx} -4.4 L ${ax - bx + 1.2} -2.2 Z`} fill="#fff" />
            <rect x={-w / 2} y="-2.5" width={w} height="5" rx="2.5" fill="#fff" />
            <text textAnchor="middle" y="1" fontSize="2.8" fontWeight="900" fill="#073b25" fontFamily="Nunito, sans-serif">
              {b.text}
            </text>
          </g>
        )
      })}
    </g>
  )
}

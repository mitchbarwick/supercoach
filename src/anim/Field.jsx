// ============================================================
// Field components — the pitch and every piece of training kit,
// drawn consistently TOP-DOWN (a cone is a ring with a hole, as a
// coach sees it looking down at the grass).
// Coordinates: 100 x 64 units.
// ============================================================
import { PITCH, KIT } from './theme.js'

export function Pitch() {
  return (
    <g>
      <rect x="0" y="0" width="100" height="64" fill={PITCH.grass} />
      {[0, 1, 2, 3, 4].map((i) => (
        <rect key={i} x={i * 20} y="0" width="10" height="64" fill={PITCH.stripe} />
      ))}
      <rect x="3" y="3" width="94" height="58" fill="none" stroke={PITCH.line} strokeWidth="0.55" rx="1.5" opacity="0.8" />
    </g>
  )
}

export function Cone({ x, y, color = KIT.cone, dark = KIT.coneDark }) {
  return (
    <g>
      <ellipse cx={x + 0.35} cy={y + 0.45} rx="1.45" ry="1.2" fill="rgba(0,0,0,0.18)" />
      <circle cx={x} cy={y} r="1.35" fill={color} stroke={dark} strokeWidth="0.3" />
      <circle cx={x} cy={y} r="0.45" fill={KIT.coneHole} stroke={dark} strokeWidth="0.15" />
    </g>
  )
}

export function Disc({ x, y }) {
  return <ellipse cx={x} cy={y} rx="1.3" ry="1.3" fill={KIT.disc} stroke={KIT.discDark} strokeWidth="0.25" />
}

export function Gate({ pair }) {
  const [a, b] = pair
  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={KIT.gateLine} strokeWidth="0.5" strokeDasharray="1.4 1.2" />
      <Cone x={a.x} y={a.y} color={KIT.disc} dark={KIT.discDark} />
      <Cone x={b.x} y={b.y} color={KIT.disc} dark={KIT.discDark} />
    </g>
  )
}

// Top-down goal: two posts on the goal line, the net box behind it.
// `ripple` (0..1) bulges the net back when a shot goes in.
export function Goal({ g, ripple = 0 }) {
  const { x, y, n, t, w, depth } = g
  const bulge = Math.sin(ripple * Math.PI) * 1.4
  const p = (along, back) => [x + t[0] * along - n[0] * back, y + t[1] * along - n[1] * back]
  const L = p(-w / 2, 0), R = p(w / 2, 0)
  const BL = p(-w / 2, depth), BR = p(w / 2, depth)
  const BM = p(0, depth + bulge)
  const net = `M ${L[0]} ${L[1]} L ${BL[0]} ${BL[1]} Q ${BM[0]} ${BM[1]} ${BR[0]} ${BR[1]} L ${R[0]} ${R[1]} Z`
  return (
    <g>
      <path d={net} fill="url(#sc-net)" stroke="rgba(255,255,255,0.75)" strokeWidth="0.35" />
      {ripple > 0 && <path d={net} fill={`rgba(255,224,102,${0.45 * Math.sin(ripple * Math.PI)})`} />}
      <line x1={L[0]} y1={L[1]} x2={R[0]} y2={R[1]} stroke="#fff" strokeWidth="0.9" strokeLinecap="round" />
      <circle cx={L[0]} cy={L[1]} r="0.7" fill="#fff" />
      <circle cx={R[0]} cy={R[1]} r="0.7" fill="#fff" />
    </g>
  )
}

export function Rebounder({ r, pulse = 0 }) {
  const { x, y, n, t, w } = r
  const p = (along, back) => [x + t[0] * along - n[0] * back, y + t[1] * along - n[1] * back]
  const a = p(-w / 2, 0), b = p(w / 2, 0), c = p(w / 2, 1.6), d = p(-w / 2, 1.6)
  return (
    <g>
      <path d={`M ${a[0]} ${a[1]} L ${b[0]} ${b[1]} L ${c[0]} ${c[1]} L ${d[0]} ${d[1]} Z`} fill="url(#sc-net)" stroke="#e8edf0" strokeWidth="0.45" />
      <line x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]} stroke={pulse ? '#ffe066' : '#fff'} strokeWidth={0.8 + pulse * 0.6} strokeLinecap="round" />
    </g>
  )
}

export function Ladder({ l }) {
  const w = l.w || 6
  const rungs = []
  for (let rx = l.x; rx <= l.x + l.len + 0.01; rx += l.gap || 4) rungs.push(rx)
  return (
    <g stroke={KIT.ladder} strokeWidth="0.45" opacity="0.9">
      <line x1={l.x} y1={l.y - w / 2} x2={l.x + l.len} y2={l.y - w / 2} />
      <line x1={l.x} y1={l.y + w / 2} x2={l.x + l.len} y2={l.y + w / 2} />
      {rungs.map((rx, j) => <line key={j} x1={rx} y1={l.y - w / 2} x2={rx} y2={l.y + w / 2} />)}
    </g>
  )
}

export function Hurdle({ h }) {
  const hw = (h.w || 6) / 2
  const vertical = h.dir === 'v'
  const [x1, y1, x2, y2] = vertical ? [h.x, h.y - hw, h.x, h.y + hw] : [h.x - hw, h.y, h.x + hw, h.y]
  return (
    <g>
      <line x1={x1 + 0.4} y1={y1 + 0.5} x2={x2 + 0.4} y2={y2 + 0.5} stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={KIT.disc} strokeWidth="0.9" strokeLinecap="round" />
      <circle cx={x1} cy={y1} r="0.6" fill={KIT.discDark} />
      <circle cx={x2} cy={y2} r="0.6" fill={KIT.discDark} />
    </g>
  )
}

export function Hoop({ h }) {
  return <circle cx={h.x} cy={h.y} r={h.r || 3} fill="rgba(124,196,255,0.14)" stroke={KIT.hoop} strokeWidth="0.6" />
}

export function Mannequin({ m }) {
  return (
    <g>
      <ellipse cx={m.x + 0.4} cy={m.y + 0.6} rx="2.2" ry="1.7" fill="rgba(0,0,0,0.2)" />
      <rect x={m.x - 2} y={m.y - 1.3} width="4" height="2.6" rx="1.2" fill="#c9d1d6" stroke="#77838b" strokeWidth="0.35" />
      <circle cx={m.x} cy={m.y} r="0.9" fill="#77838b" />
    </g>
  )
}

export function Flag({ f }) {
  return (
    <g>
      <circle cx={f.x} cy={f.y} r="0.5" fill="#fff" />
      <path d={`M ${f.x} ${f.y} l 2.4 -0.9 l -0.2 1.9 Z`} fill={f.color || '#ff5a5f'} />
    </g>
  )
}

export function Zone({ z }) {
  return <rect x={z.x} y={z.y} width={z.w} height={z.h} fill={z.fill || PITCH.zone} stroke={z.stroke || PITCH.zoneLine} strokeWidth="0.5" strokeDasharray="2 1.5" rx="1" />
}

// Static kit that sits UNDER players and trails (painted on the grass).
export function FieldBase({ field }) {
  return (
    <g>
      {field.circle && (
        <circle cx={field.circle.x} cy={field.circle.y} r={field.circle.r} fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.5)" strokeWidth="0.55" strokeDasharray="2.5 2" />
      )}
      {field.zones.map((z, i) => <Zone key={i} z={z} />)}
      {field.lines.map((l, i) => (
        <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} stroke={PITCH.line} strokeWidth="0.45" strokeDasharray={l[4] ? '1.6 1.4' : undefined} />
      ))}
      {field.ladders.map((l, i) => <Ladder key={i} l={l} />)}
      {field.hoops.map((h, i) => <Hoop key={i} h={h} />)}
      {field.discs.map((d, i) => <Disc key={i} {...d} />)}
    </g>
  )
}

// Kit with height (cones, goals, hurdles, mannequins).
export function FieldKit({ field, ripples, pulses }) {
  return (
    <g>
      {field.goals.map((g, i) => <Goal key={i} g={g} ripple={ripples?.[i] || 0} />)}
      {field.rebounders.map((r, i) => <Rebounder key={i} r={r} pulse={pulses?.[i] || 0} />)}
      {field.gates.map((pair, i) => <Gate key={i} pair={pair} />)}
      {field.hurdles.map((h, i) => <Hurdle key={i} h={h} />)}
      {field.mannequins.map((m, i) => <Mannequin key={i} m={m} />)}
      {field.flags.map((f, i) => <Flag key={i} f={f} />)}
      {field.cones.map((c, i) => <Cone key={i} x={c.x} y={c.y} />)}
    </g>
  )
}

export function Defs() {
  return (
    <defs>
      <pattern id="sc-net" width="1.4" height="1.4" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <rect width="1.4" height="1.4" fill="rgba(255,255,255,0.12)" />
        <path d="M 0 0 L 0 1.4 M 0 0 L 1.4 0" stroke="rgba(255,255,255,0.45)" strokeWidth="0.18" />
      </pattern>
      <BallShade />
    </defs>
  )
}

// The ball's shading, shared by every pitch and the spinning logo ball.
export function BallShade() {
  // light from the top left: a soft highlight, and shade towards the far edge
  return (
    <radialGradient id="sc-ball-shade" cx="0.36" cy="0.32" r="0.78">
      <stop offset="0" stopColor="#fff" stopOpacity="0.55" />
      <stop offset="0.32" stopColor="#fff" stopOpacity="0" />
      <stop offset="0.75" stopColor="#1f262b" stopOpacity="0.06" />
      <stop offset="1" stopColor="#1f262b" stopOpacity="0.2" />
    </radialGradient>
  )
}

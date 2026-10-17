// ============================================================
// PitchAnimation — plays a drill scene (src/anim/script.js).
// The scene is compiled once into a baked timeline; every frame
// just reads values out of it, so playback stays cheap on phones.
//
// Layout note: captions, step progress and controls live in a bar
// BELOW the pitch — a safe zone that never covers the action.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { compileScene } from '../anim/compile.js'
import { Defs, Pitch, FieldBase, FieldKit } from '../anim/Field.jsx'
import { qNlerp } from '../anim/ball.js'
import { PlayerToken, BallToken, StretchFigure, Wake, Effects, Highlights, Bubbles } from '../anim/Actors.jsx'

const lerp = (a, b, u) => a + (b - a) * u
const lerpAngle = (a, b, u) => {
  let d = b - a
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a + d * u
}

function usePlayback(duration, startPaused, startAt = 0) {
  const [t, setT] = useState(startAt)
  const [playing, setPlaying] = useState(!startPaused)
  const [speed, setSpeed] = useState(1)
  const [visible, setVisible] = useState(true)
  const tRef = useRef(startAt)
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.1 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!playing || !visible) return
    let raf, last = null
    const step = (now) => {
      if (last != null) {
        tRef.current = (tRef.current + ((now - last) / 1000) * speed) % duration
        setT(tRef.current)
      }
      last = now
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [playing, visible, speed, duration])

  const seek = (to) => {
    tRef.current = Math.max(0, Math.min(duration - 1e-3, to))
    setT(tRef.current)
  }
  return { ref, t, playing, setPlaying, speed, setSpeed, seek }
}

// `freezeAt` (seconds) shows a single paused frame and `viewBox` crops
// in on part of the pitch — both used by the dev lab.
export default function PitchAnimation({ diagram, freezeAt, viewBox }) {
  const scene = useMemo(() => (diagram ? compileScene(diagram) : null), [diagram])
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const pb = usePlayback(scene?.duration || 1, reduced || freezeAt != null, freezeAt || 0)

  useEffect(() => {
    if (scene?.warnings.length && import.meta.env?.DEV) console.warn('[drill animation]', scene.warnings)
  }, [scene])

  if (!scene) return null
  const { t } = pb
  const beatIdx = scene.beats.findIndex((b) => t >= b.t0 && t < b.t1)
  const caption = scene.beats[beatIdx]?.say || scene.beats[scene.beats.length - 1]?.say || ' '
  const steps = groupSteps(scene.beats, scene.duration)

  return (
    <div className="pitch-wrap" ref={pb.ref}>
      <div className="pitch-stage" style={{ aspectRatio: '100 / 64' }}>
        <PitchBoard scene={scene} t={t} viewBox={viewBox} role="img" aria-label={`Drill animation: ${caption}`} />
      </div>

      <div className="pitch-bar">
        {steps.length > 1 && (
          <div className="pitch-steps">
            {steps.map((s, i) => {
              const fill = t >= s.t1 ? 1 : t <= s.t0 ? 0 : (t - s.t0) / (s.t1 - s.t0)
              return (
                <button key={i} className="pitch-step" style={{ flexGrow: s.t1 - s.t0 }} onClick={() => pb.seek(s.t0 + 0.01)} aria-label={`Jump to step ${i + 1}: ${s.say}`}>
                  <span style={{ transform: `scaleX(${fill})` }} />
                </button>
              )
            })}
          </div>
        )}
        <div className="pitch-bar-row">
          <div className="phase-banner" aria-live="polite">{caption}</div>
          {scene.area && <span className="area-tag">{scene.area}</span>}
          <div className="pitch-controls">
            {/* Speed: both choices always visible, the active one lit —
                tortoise = slow motion to study it, hare = normal speed. */}
            <div className="speed-toggle" role="radiogroup" aria-label="Animation speed">
              <button role="radio" aria-checked={pb.speed !== 1} aria-label="Slow" title="Slow" className={pb.speed !== 1 ? 'on' : ''} onClick={() => pb.setSpeed(0.5)}>🐢</button>
              <button role="radio" aria-checked={pb.speed === 1} aria-label="Normal speed" title="Normal speed" className={pb.speed === 1 ? 'on' : ''} onClick={() => pb.setSpeed(1)}>🐇</button>
            </div>
            <button onClick={() => pb.setPlaying(!pb.playing)} aria-label={pb.playing ? 'Pause' : 'Play'}>{pb.playing ? '⏸' : '▶️'}</button>
            <button onClick={() => { pb.seek(0); pb.setPlaying(true) }} aria-label="Restart">↺</button>
          </div>
        </div>
      </div>
    </div>
  )
}

// One progress segment per caption (beats without their own caption
// belong to the step before them).
function groupSteps(beats, duration) {
  const out = []
  for (const b of beats) {
    if (b.own || !out.length) out.push({ t0: b.t0, t1: b.t1, say: b.say })
    else out[out.length - 1].t1 = b.t1
  }
  if (out.length) out[out.length - 1].t1 = duration
  return out
}

// Draws one frame of a compiled scene. `viewBox` crops in on part of
// the 100 x 64 pitch (the landing hero zooms on the middle); any other
// props go on the <svg>.
export function PitchBoard({ scene, t, viewBox = '0 0 100 64', ...svgProps }) {
  const ff = Math.min(scene.n - 1, t * scene.fps)
  const f = Math.floor(ff)
  const f2 = Math.min(scene.n - 1, f + 1)
  const u = ff - f

  let alpha = 1
  if (scene.fade) {
    if (t < scene.fade.in) alpha = t / scene.fade.in
    else if (t > scene.duration - scene.fade.out) alpha = Math.max(0, (scene.duration - t) / scene.fade.out)
  }

  const ripples = scene.field.goals.map((_, gi) => {
    const e = scene.effects.find((q) => q.kind === 'goal' && q.goal === gi && t >= q.t && t <= q.t + 0.55)
    return e ? (t - e.t) / 0.55 : 0
  })
  const pulses = scene.field.rebounders.map((r) => {
    const e = scene.effects.find((q) => q.kind === 'bounce' && t >= q.t && t <= q.t + 0.25 && Math.hypot(q.x - r.x, q.y - r.y) < 8)
    return e ? 1 - (t - e.t) / 0.25 : 0
  })

  const holders = new Set(scene.balls.map((b) => b.holder[f]).filter((h) => h >= 0))

  return (
    <svg viewBox={viewBox} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" {...svgProps}>
      <Defs />
      <Pitch />
      <FieldBase field={scene.field} />
      <g opacity={alpha}>
        {scene.trails && <Wake wake={scene.wake} t={t} duration={scene.duration} loop={!scene.fade} mode={scene.trails} />}
      </g>
      <FieldKit field={scene.field} ripples={ripples} pulses={pulses} />
      <g opacity={alpha}>
        <Highlights highlights={scene.highlights} t={t} actors={scene.actors} frame={f} />
        {/* illustrated kids, back to front so nearer kids overlap further ones */}
        {scene.actors.filter((a) => a.figure).sort((p, q) => p.y[f] - q.y[f]).map((a) => (
          <StretchFigure key={a.id} actor={a} x={lerp(a.x[f], a.x[f2], u)} y={lerp(a.y[f], a.y[f2], u)} t={t} frame={f} fps={scene.fps} />
        ))}
        {scene.actors.map((a, i) =>
          a.figure ? null : (
            <PlayerToken
              key={a.id}
              x={lerp(a.x[f], a.x[f2], u) + lerp(a.lx[f], a.lx[f2], u)}
              y={lerp(a.y[f], a.y[f2], u) + lerp(a.ly[f], a.ly[f2], u)}
              z={lerp(a.z[f], a.z[f2], u)}
              h={lerpAngle(a.h[f], a.h[f2], u)}
              team={a.team}
              label={a.label}
              dive={a.dive[f]}
              hasBall={holders.has(i)}
            />
          ),
        )}
        {scene.balls.map((b) => (
          <BallToken
            key={b.id}
            x={lerp(b.x[f], b.x[f2], u)}
            y={lerp(b.y[f], b.y[f2], u)}
            z={lerp(b.z[f], b.z[f2], u)}
            q={qNlerp([b.qw[f], b.qx[f], b.qy[f], b.qz[f]], [b.qw[f2], b.qx[f2], b.qy[f2], b.qz[f2]], u)}
            blur={lerp(b.blur[f], b.blur[f2], u)}
          />
        ))}
        <Effects effects={scene.effects} t={t} goals={scene.field.goals} />
        <Bubbles bubbles={scene.bubbles} t={t} actors={scene.actors} frame={f} />
      </g>
    </svg>
  )
}

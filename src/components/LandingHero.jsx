// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// NOT a drill diagram: it shows what SuperCoach is for. The coach
// checks the session on their phone, calls out a drill, and the kids
// set out the cones and play it (src/data/scenes/hero.js), through the
// same engine as the drill library. No controls or captions; it loops.
//
// It runs edge to edge from the top of the screen, under the
// transparent top bar: the headline (`title`) on the grass, the kids and
// coach in the stage below it, then sign-in (`children`). The scale is
// set so the stage holds the action.
// ============================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { compileScene } from '../anim/compile.js'
import { HERO, COACH_Y, CONES, PHONE_BEATS } from '../data/scenes/hero.js'
import { PitchBoard } from './PitchAnimation.jsx'
import { LooseCone } from '../anim/Field.jsx'

// Pitch units the stage must hold, top to bottom (the coach, their
// phone and its shadow at the bottom) and across.
const STAGE_TOP = 10
const STAGE_BOTTOM = COACH_Y + 4
const STAGE_W = 48
// Reduced-motion users get a lively still: mid cone weave.
const STILL_AT = 7.6
// Carried cones sit in the kid's hands, out in front.
const HOLD = [2.4, -1.4]
const SWAP = 0.25 // seconds to pick up / put down

const clamp01 = (u) => Math.min(1, Math.max(0, u))
const mix = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

// Heading (radians) a player faces at time t.
function headingAt(scene, id, t) {
  const a = scene.actors.find((x) => x.id === id)
  const ff = Math.min(scene.n - 1, t * scene.fps)
  const f = Math.floor(ff), f2 = Math.min(scene.n - 1, f + 1)
  let d = a.h[f2] - a.h[f]
  while (d > Math.PI) d -= Math.PI * 2
  while (d < -Math.PI) d += Math.PI * 2
  return a.h[f] + d * (ff - f)
}

function actorAt(scene, id, t) {
  const a = scene.actors.find((x) => x.id === id)
  const ff = Math.min(scene.n - 1, t * scene.fps)
  const f = Math.floor(ff), f2 = Math.min(scene.n - 1, f + 1), u = ff - f
  const v = (k) => a[k][f] + (a[k][f2] - a[k][f]) * u
  return [v('x') + v('lx'), v('y') + v('ly') - v('z') * 0.9]
}

// Where a cone is at time t, and whether it's in someone's hands.
function coneAt(scene, cone, t) {
  let p = cone.start
  for (const leg of cone.legs) {
    const tp = scene.beats[leg.pick].t1
    const td = scene.beats[leg.drop].t1
    if (t < tp) break
    const hand = (tt) => {
      const [x, y] = actorAt(scene, leg.who, tt)
      return [x + HOLD[0], y + HOLD[1]]
    }
    if (t < tp + SWAP) return { p: mix(p, hand(t), clamp01((t - tp) / SWAP)), held: true }
    if (t < td) return { p: hand(t), held: true }
    if (t < td + SWAP) return { p: mix(hand(td), leg.to, clamp01((t - td) / SWAP)), held: (t - td) / SWAP < 0.5 }
    p = leg.to
  }
  return { p, held: false }
}

// The coach's phone, held out in their right hand: just to the right of
// the token's nose, turning with them. Its screen lights up (and it
// comes up a little) while they read the session plan.
const PHONE_AT = [3.0, 2.9] // along the heading, to the right of it
function CoachPhone({ scene, t }) {
  const [x, y] = actorAt(scene, 'c', t)
  const h = (headingAt(scene, 'c', t) * 180) / Math.PI
  let lit = 0
  for (const i of PHONE_BEATS) {
    const b = scene.beats[i]
    lit = Math.max(lit, Math.min(clamp01((t - b.t0) / 0.25), clamp01((b.t1 - t) / 0.3)))
  }
  const s = 1 + lit * 0.25
  return (
    <g transform={`translate(${x} ${y}) rotate(${h}) translate(${PHONE_AT[0]} ${PHONE_AT[1]}) rotate(90) scale(${s})`}>
      <rect x="-1.05" y="-1.75" width="2.1" height="3.5" rx="0.45" fill="#1a1f24" />
      <rect x="-0.82" y="-1.5" width="1.64" height="3" rx="0.25" fill="#36424c" />
      <g opacity={lit}>
        <rect x="-0.82" y="-1.5" width="1.64" height="3" rx="0.25" fill="#f2faf6" />
        <rect x="-0.6" y="-1.2" width="1.2" height="0.42" rx="0.1" fill="#0b7a4b" />
        {[-0.45, 0.1, 0.65].map((ry) => (
          <rect key={ry} x="-0.6" y={ry} width={ry > 0.5 ? 0.8 : 1.2} height="0.3" rx="0.1" fill="#aab2ba" />
        ))}
      </g>
    </g>
  )
}

export default function LandingHero({ title, children }) {
  const scene = useMemo(() => compileScene(HERO), [])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [t, setT] = useState(reduced ? STILL_AT : 0)
  const start = useRef(null)
  const hero = useRef(null)
  const stage = useRef(null)
  const [size, setSize] = useState({ w: 390, h: 640, top: 200, bottom: 480 })

  useLayoutEffect(() => {
    const measure = () => {
      if (!hero.current || !stage.current) return
      const h = hero.current.getBoundingClientRect()
      const s = stage.current.getBoundingClientRect()
      if (h.width && h.height) setSize({ w: h.width, h: h.height, top: s.top - h.top, bottom: s.bottom - h.top })
    }
    measure()
    if (typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(hero.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    if (reduced) return
    let raf
    const step = (now) => {
      if (start.current == null) start.current = now
      setT(((now - start.current) / 1000) % scene.duration)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduced, scene])

  // Pixels per pitch unit: the stage holds STAGE_TOP..STAGE_BOTTOM and
  // at least STAGE_W across, centred in it; the grass fills the hero.
  const ppu = Math.min((size.bottom - size.top) / (STAGE_BOTTOM - STAGE_TOP), size.w / STAGE_W)
  const vw = size.w / ppu, vh = size.h / ppu
  const top = (STAGE_TOP + STAGE_BOTTOM) / 2 - (size.top + size.bottom) / 2 / ppu
  const ground = [50 - vw / 2, top, vw, vh]
  const cones = CONES.map((c) => coneAt(scene, c, t))

  return (
    <section className="landing-hero" ref={hero}>
      <div className="landing-anim" aria-hidden="true">
        <PitchBoard
          scene={scene}
          t={t}
          viewBox={ground.join(' ')}
          ground={ground}
          over={<>
            {cones.map((c, i) => c.held && <LooseCone key={i} x={c.p[0]} y={c.p[1]} r={1.15} lift={0.01} />)}
            <CoachPhone scene={scene} t={t} />
          </>}
        >
          {cones.map((c, i) => !c.held && <LooseCone key={i} x={c.p[0]} y={c.p[1]} />)}
        </PitchBoard>
      </div>
      <div className="landing-hero-copy">{title}</div>
      <div className="landing-stage" ref={stage} />
      <div className="landing-hero-copy landing-hero-actions">{children}</div>
    </section>
  )
}

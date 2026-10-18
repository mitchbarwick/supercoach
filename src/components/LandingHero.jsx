// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// NOT a drill diagram: it shows what SuperCoach is for. The coach
// checks the session on their phone, calls out a drill, and the kids
// set out the cones and play it (src/data/scenes/hero.js), through the
// same engine as the drill library. No controls or captions; it loops.
//
// It runs edge to edge from the top of the screen, under the
// transparent top bar, with the page's headline and sign-in on the
// grass (`children`). The kids play in the stage below the copy; the
// scale is set so that stage holds the action, and the frame's bottom
// edge runs through the coach so they stand half on the grass, half off.
// ============================================================
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { compileScene } from '../anim/compile.js'
import { HERO, COACH_Y, CONES, PHONE_BEATS } from '../data/scenes/hero.js'
import { PitchBoard } from './PitchAnimation.jsx'
import { LooseCone } from '../anim/Field.jsx'

// Pitch units the stage must hold, top to bottom and across.
const STAGE_TOP = 10
const STAGE_W = 48
// Reduced-motion users get a lively still: mid cone weave.
const STILL_AT = 7.6
// Carried cones sit in the kid's hands, out in front.
const HOLD = [2.4, -1.4]
const SWAP = 0.25 // seconds to pick up / put down

const clamp01 = (u) => Math.min(1, Math.max(0, u))
const mix = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u]

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

// The coach's phone, in their right hand. Its screen lights up (and it
// comes up a little) while they read the session plan.
function CoachPhone({ scene, t }) {
  const [x, y] = actorAt(scene, 'c', t)
  let lit = 0
  for (const i of PHONE_BEATS) {
    const b = scene.beats[i]
    lit = Math.max(lit, Math.min(clamp01((t - b.t0) / 0.25), clamp01((b.t1 - t) / 0.3)))
  }
  const s = 1 + lit * 0.25
  return (
    <g transform={`translate(${x + 3.1} ${y + 1.5}) rotate(-14) scale(${s})`}>
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

export default function LandingHero({ children }) {
  const scene = useMemo(() => compileScene(HERO), [])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [t, setT] = useState(reduced ? STILL_AT : 0)
  const start = useRef(null)
  const hero = useRef(null)
  const stage = useRef(null)
  const [size, setSize] = useState({ w: 390, h: 560, stage: 260 })

  useLayoutEffect(() => {
    const measure = () => {
      if (!hero.current || !stage.current) return
      const h = hero.current.getBoundingClientRect()
      const s = stage.current.getBoundingClientRect()
      if (h.width && h.height) setSize({ w: h.width, h: h.height, stage: h.bottom - s.top })
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

  // Pixels per pitch unit: the stage holds STAGE_TOP..COACH_Y and at
  // least STAGE_W across; the frame's bottom edge is COACH_Y.
  const ppu = Math.min(size.stage / (COACH_Y - STAGE_TOP), size.w / STAGE_W)
  const vw = size.w / ppu, vh = size.h / ppu
  const ground = [50 - vw / 2, COACH_Y - vh, vw, vh]
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
      <div className="landing-hero-copy">{children}</div>
      <div className="landing-stage" ref={stage} />
    </section>
  )
}

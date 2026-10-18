// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// NOT a drill diagram: a hero animation meant to convey the FUN of
// training. It plays a Drill Script scene (src/data/scenes/hero.js)
// through the same engine as the drill library, cropped in on the
// middle of the pitch so the little group reads big on a phone.
// No controls or captions — it just loops.
// It runs edge to edge under the transparent top bar; the crop keeps a
// fixed height of pitch and widens with the screen, and its bottom edge
// runs through the coach so they stand half on the grass, half off.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { compileScene } from '../anim/compile.js'
import { HERO, COACH_Y } from '../data/scenes/hero.js'
import { PitchBoard } from './PitchAnimation.jsx'

// Pitch units shown top to bottom; the top bar sits over the first ~10.
const VIEW_H = 36
const VIEW_TOP = COACH_Y - VIEW_H
// Reduced-motion users get a lively still: mid keepy-up.
const STILL_AT = 5.0

export default function LandingHero() {
  const scene = useMemo(() => compileScene(HERO), [])
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const [t, setT] = useState(reduced ? STILL_AT : 0)
  const start = useRef(null)
  const box = useRef(null)
  const [aspect, setAspect] = useState(390 / 300)

  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width && height) setAspect(width / height)
    })
    ro.observe(el)
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

  const w = VIEW_H * aspect
  const ground = [50 - w / 2, VIEW_TOP, w, VIEW_H]
  return (
    <div className="landing-anim" ref={box} aria-hidden="true">
      <PitchBoard scene={scene} t={t} viewBox={ground.join(' ')} ground={ground} />
    </div>
  )
}

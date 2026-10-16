// ============================================================
// LandingHero — the first thing a signed-out visitor sees.
// NOT a drill diagram: a hero animation meant to convey the FUN of
// training. It plays a Drill Script scene (src/data/scenes/hero.js)
// through the same engine as the drill library, cropped in on the
// middle of the pitch so the little group reads big on a phone.
// No controls or captions — it just loops.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { compileScene } from '../anim/compile.js'
import { HERO } from '../data/scenes/hero.js'
import { PitchBoard } from './PitchAnimation.jsx'

// 52 x 33.28 keeps the pitch's 100:64 shape, so it fills .landing-anim exactly.
const VIEW = '24 11.5 52 33.28'
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

  return (
    <div className="landing-anim" aria-hidden="true">
      <PitchBoard scene={scene} t={t} viewBox={VIEW} />
    </div>
  )
}

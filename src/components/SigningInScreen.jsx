// Full-screen takeover shown while a Google credential is being
// exchanged for a session (AccountButton sets `busy` for this).
// Covers whatever page triggered sign-in (Landing, guest info, the
// Home sign-in card, etc.) via a portal so it always fills the
// viewport regardless of where AccountButton is nested.
//
// While it waits it plays random drills from the library, cross-fading
// from one to the next — a preview of what's inside while the API
// wakes up (a cold start can take the best part of a minute).
import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { DRILLS } from '../data/drills.js'
import { compileScene } from '../anim/compile.js'
import { PitchBoard } from './PitchAnimation.jsx'

const SHOW_FOR = 7 // seconds per drill, at most (shorter drills play once through)
const FADE = 0.4

// Stretch figures read poorly at this size — show the active drills.
const POOL = DRILLS.filter((d) => d.category !== 'cooldown')

function shuffled(list) {
  const a = list.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function SigningInScreen({ text = 'Signing you in…' }) {
  const reduced = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const order = useMemo(() => shuffled(POOL), [])
  const [i, setI] = useState(0)
  const [t, setT] = useState(0)
  const compiled = useRef(new Map())
  const sceneAt = (k) => {
    const d = order[k % order.length]
    if (!compiled.current.has(d.id)) compiled.current.set(d.id, compileScene(d.diagram))
    return compiled.current.get(d.id)
  }
  const drill = order[i % order.length]
  const scene = sceneAt(i)
  const showFor = Math.min(scene.duration, SHOW_FOR)

  useEffect(() => {
    if (reduced) return
    // compile the next drill while this one plays, so the switch never hitches
    const prep = setTimeout(() => sceneAt(i + 1), 300)
    let raf
    let start = null
    const step = (now) => {
      if (start == null) start = now
      const el = (now - start) / 1000
      if (el >= showFor) {
        setI((k) => k + 1)
        setT(0)
        return
      }
      setT(el)
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => {
      clearTimeout(prep)
      cancelAnimationFrame(raf)
    }
  }, [i, reduced, showFor])

  const at = reduced ? scene.duration * 0.5 : t
  const opacity = reduced ? 1 : Math.min(1, t / FADE, (showFor - t) / FADE)

  return createPortal(
    <div className="signing-in-screen" role="status" aria-live="polite">
      <div className="signing-in-card">
        <div className="signing-in-anim" aria-hidden="true">
          <div style={{ opacity, height: '100%' }}>
            <PitchBoard scene={scene} t={at} />
          </div>
        </div>
        <div className="signing-in-drill" aria-hidden="true" style={{ opacity }}>
          {drill.emoji} {drill.name}
        </div>
      </div>
      <p className="signing-in-text">{text}</p>
      <p className="signing-in-sub">This can take up to a minute — we're warming up the pitch.</p>
    </div>,
    document.body,
  )
}

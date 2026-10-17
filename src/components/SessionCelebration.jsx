// ============================================================
// SessionCelebration — shown when every block is ticked off.
//
// A floodlit "full time" moment, told in the same top-down language
// as every drill diagram: the coach's own team (their Settings
// colour) works a move and curls one into the top corner; the net
// flashes, confetti bursts from the goal in the team's colours, the
// players sprint over to celebrate with the coach, and a stadium
// scoreboard counts up the session's real numbers.
//
// It plays ONCE when scrolled into view and rests on the last frame
// ("Watch again" replays). Reduced motion: final frame, no confetti.
// Below it, the completed drills with favourite hearts.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, actions } from '../store/useStore.js'
import { compileScene } from '../anim/compile.js'
import { PitchBoard } from './PitchAnimation.jsx'
import { CELEBRATION } from '../data/scenes/celebration.js'
import { TEAM } from '../anim/theme.js'

const SCOREBOARD_AT = 0.75 // seconds after the goal
const COUNT_FOR = 0.9

const reducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

// One-shot clock: starts when the stage is on screen, stops at `end`.
function useOneShot(end) {
  const ref = useRef(null)
  const [t, setT] = useState(reducedMotion() ? end : 0)
  const [run, setRun] = useState(0) // bump to replay
  const [started, setStarted] = useState(reducedMotion())

  useEffect(() => {
    if (started || !ref.current) return
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) setStarted(true) }, { threshold: 0.45 })
    io.observe(ref.current)
    return () => io.disconnect()
  }, [started])

  useEffect(() => {
    if (!started || reducedMotion()) return
    let raf
    const t0 = performance.now()
    const tick = (now) => {
      const v = Math.min(end, (now - t0) / 1000)
      setT(v)
      if (v < end) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [started, run, end])

  return { ref, t, replay: () => { setT(0); setStarted(true); setRun((r) => r + 1) } }
}

// Deterministic pseudo-random, so the burst looks the same every replay.
function rng(seed) {
  let s = seed
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646
}

function useConfetti(colourKey) {
  return useMemo(() => {
    const r = rng(7)
    const colours = [TEAM.a.fill, TEAM.a.fill, TEAM.a.light, '#ffffff', '#ffc94d', '#ffc94d']
    return Array.from({ length: 64 }, (_, i) => {
      // fan out up-and-back from the goal mouth, towards the pitch
      const angle = (200 + r() * 115) * (Math.PI / 180)
      const power = 90 + r() * 170
      return {
        i,
        dx: Math.cos(angle) * power,
        rise: -(60 + r() * 120) * Math.abs(Math.sin(angle) + 0.35),
        fall: 160 + r() * 140,
        rot: (r() - 0.5) * 1440,
        flip: 360 + r() * 1080,
        dur: 1.9 + r() * 1.3,
        delay: r() * 0.18,
        w: 5 + r() * 5,
        h: r() > 0.45 ? 9 + r() * 7 : 5 + r() * 4, // ribbons and squares
        round: r() > 0.82,
        c: colours[Math.floor(r() * colours.length)],
      }
    })
  }, [colourKey]) // eslint-disable-line react-hooks/exhaustive-deps
}

const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3)

function Stat({ value, label, t, at }) {
  const shown = Math.round(value * easeOut((t - at) / COUNT_FOR))
  const settled = t >= at + COUNT_FOR
  return (
    <div className="ft-stat">
      <span className={`ft-digits${settled ? ' settled' : ''}`} aria-hidden="true">{shown}</span>
      <span className="ft-label">{label}</span>
      <span className="visually-hidden">{value} {label}</span>
    </div>
  )
}

export default function SessionCelebration({ session }) {
  const favourites = useStore((s) => s.favourites)
  const teamColour = useStore((s) => s.team?.colour)
  const scene = useMemo(() => compileScene(CELEBRATION), [])
  const goalT = useMemo(() => scene.effects.find((e) => e.kind === 'goal')?.t ?? 2.6, [scene])
  const end = scene.duration - 0.02
  const { ref, t, replay } = useOneShot(end)
  const confetti = useConfetti(teamColour)
  const cardRef = useRef(null)
  const reduced = reducedMotion()

  // Arriving here from "Finish session" — bring the moment into view.
  useEffect(() => {
    const id = setTimeout(() => cardRef.current?.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' }), 200)
    return () => clearTimeout(id)
  }, [reduced])

  // one recap row per unique drill, in session order
  const seen = new Set()
  const drills = (session?.blocks || []).filter((b) => {
    if (!b.drillId || seen.has(b.drillId)) return false
    seen.add(b.drillId)
    return true
  })

  const minutes = session?.totalPlanned || session?.request?.duration || 0
  const players = session?.request?.players || 0
  const boardAt = goalT + SCOREBOARD_AT
  const scored = t >= goalT
  const showBoard = t >= boardAt
  const flash = scored && t < goalT + 0.5 ? Math.sin(((t - goalT) / 0.5) * Math.PI) : 0

  return (
    <>
      <section ref={cardRef} className="ft-card" aria-labelledby="ft-title">
        <h3 id="ft-title" className="ft-title">Session complete</h3>
        <div ref={ref} className="ft-stage">
          <PitchBoard scene={scene} t={t} role="img" aria-label="Your team scores the winner and runs over to celebrate with the coach" />
          <div className="ft-floodlights" aria-hidden="true" />
          <div className="ft-flash" style={{ opacity: flash * 0.55 }} aria-hidden="true" />
          {scored && !reduced && (
            <div className="ft-confetti" aria-hidden="true">
              {confetti.map((p) => (
                <span
                  key={`${p.i}-${Math.floor(goalT)}`}
                  className="ft-piece"
                  style={{
                    '--dx': `${p.dx}px`, '--rise': `${p.rise}px`, '--fall': `${p.fall}px`,
                    '--rot': `${p.rot}deg`, '--flip': `${p.flip}deg`,
                    '--dur': `${p.dur}s`, '--delay': `${p.delay}s`,
                  }}
                >
                  <i style={{ width: p.w, height: p.h, background: p.c, borderRadius: p.round ? '50%' : 1.5 }} />
                </span>
              ))}
            </div>
          )}
        </div>

        <div className={`ft-board${showBoard ? ' on' : ''}`}>
          <div className="ft-board-head" aria-live="polite">
            <span className="ft-live" aria-hidden="true" />
            {showBoard ? 'Full time' : 'Final minute'}
          </div>
          <div className="ft-stats">
            <Stat value={minutes} label={minutes === 1 ? 'minute' : 'minutes'} t={t} at={boardAt + 0.1} />
            <Stat value={drills.length} label={drills.length === 1 ? 'activity' : 'activities'} t={t} at={boardAt + 0.25} />
            <Stat value={players} label={players === 1 ? 'player' : 'players'} t={t} at={boardAt + 0.4} />
          </div>
        </div>

        <div className={`ft-copy${showBoard ? ' on' : ''}`}>
          <p className="ft-sub">Great work, coach. That's a whole session, warm-up to cool-down, and the team went home better than they arrived.</p>
          {!reduced && t >= end && (
            <button className="btn btn-ghost btn-sm ft-replay" onClick={replay}>↺ Watch again</button>
          )}
        </div>
      </section>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-h">⭐ Which drills landed well?</div>
        <p className="muted" style={{ marginBottom: 6 }}>
          Heart the ones your team loved — favourites get picked first next time.
        </p>
        {drills.map((b) => {
          const isFav = favourites.includes(b.drillId)
          return (
            <div key={b.drillId} className="recap-row">
              <div className="emoji-badge" style={{ background: 'var(--green-100)' }}>{b.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="item-title">{b.title}</span>
              </div>
              <button
                className="icon-btn"
                style={isFav ? { background: 'var(--coral-100)', borderColor: 'var(--coral-600)' } : {}}
                onClick={() => actions.toggleFavourite(b.drillId)}
                aria-label={isFav ? `Remove ${b.title} from favourites` : `Add ${b.title} to favourites`}
              >
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

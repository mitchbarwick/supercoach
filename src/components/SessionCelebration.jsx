// ============================================================
// SessionCelebration — shown when every block is ticked off.
//
// The end of a real training night, told in the same top-down
// language as every drill diagram: the players (the coach's team
// colour from Settings) collect the cones and bring them back to the
// coach, thank them and bounce about, the coach says "See you next
// time!", and they run back to their parents — who thank the coach
// too. A scoreboard counts up the session's real numbers.
//
// It plays ONCE when scrolled into view and rests on the last frame
// ("Watch again" replays). Reduced motion: the final frame.
// Below it, the completed drills with favourite hearts.
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'
import { useStore, actions } from '../store/useStore.js'
import { compileScene } from '../anim/compile.js'
import { PitchBoard } from './PitchAnimation.jsx'
import { CELEBRATION, CONE_RUNS, STACK_AT, GOODBYE_BEAT } from '../data/scenes/celebration.js'
import { KIT } from '../anim/theme.js'

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

// ---- Cones: on the grass → carried → stacked at the coach's feet ----
function ConeShape({ x, y, r = 1.35, lift = 0 }) {
  return (
    <g>
      {lift === 0 && <ellipse cx={x + 0.35} cy={y + 0.45} rx={r + 0.1} ry={r * 0.88} fill="rgba(0,0,0,0.18)" />}
      <circle cx={x} cy={y - lift} r={r} fill={KIT.cone} stroke={KIT.coneDark} strokeWidth="0.3" />
      <circle cx={x} cy={y - lift} r={r * 0.33} fill={KIT.coneHole} stroke={KIT.coneDark} strokeWidth="0.15" />
    </g>
  )
}

function ConeLayer({ scene, t }) {
  const f = Math.min(scene.n - 1, Math.floor(t * scene.fps))
  const at = (id) => {
    const a = scene.actors.find((x) => x.id === id)
    return [a.x[f], a.y[f] - a.z[f] * 0.9]
  }
  const end = (i) => scene.beats[i].t1
  // drop order decides each cone's place in the stack
  const order = [...CONE_RUNS].map((c, i) => ({ ...c, i })).sort((p, q) => end(p.drop) - end(q.drop) || p.i - q.i)
  const carried = {} // who -> count so far, so a second cone sits on the first
  return (
    <g style={{ pointerEvents: 'none' }}>
      {order.map((c, k) => {
        if (t < end(c.pick)) return <ConeShape key={c.i} x={c.at[0]} y={c.at[1]} />
        if (t < end(c.drop)) {
          const n = (carried[c.who] = (carried[c.who] || 0) + 1) - 1
          const [x, y] = at(c.who)
          // held out in front of the player, stacked if they've two
          return <ConeShape key={c.i} x={x + 2.4} y={y - 1.2} r={1.15} lift={n * 0.55} />
        }
        return <ConeShape key={c.i} x={STACK_AT[0]} y={STACK_AT[1]} lift={k * 0.5} />
      })}
    </g>
  )
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
  useStore((s) => s.team?.colour) // re-render when the team colour changes
  const scene = useMemo(() => compileScene(CELEBRATION), [])
  const end = scene.duration - 0.02
  const { ref, t, replay } = useOneShot(end)
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
  const boardAt = scene.beats[GOODBYE_BEAT].t0 + 0.4 // as the coach says goodbye
  const showBoard = t >= boardAt

  return (
    <>
      <section ref={cardRef} className="ft-card" aria-labelledby="ft-title">
        <h3 id="ft-title" className="ft-title">Session complete</h3>
        <div ref={ref} className="ft-stage">
          <PitchBoard scene={scene} t={t} role="img" aria-label="The players bring the cones back to the coach, say thank you, then run back to their parents, who thank the coach too" />
          <svg className="ft-cones" viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
            <ConeLayer scene={scene} t={t} />
          </svg>
          <div className="ft-floodlights" aria-hidden="true" />
        </div>

        <div className={`ft-board${showBoard ? ' on' : ''}`}>
          <div className="ft-board-head" aria-live="polite">
            <span className="ft-live" aria-hidden="true" />
            {showBoard ? 'Full time' : 'Packing up'}
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

// Account home — the "welcome back, Jasmine" screen.
// Quick access to a new session, plus recent programs, saved
// programs and favourite drills. Brand-new visitors skip straight
// to the setup wizard so first-time friction stays at zero.
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useStore, actions } from '../store/useStore.js'
import { getDrill } from '../data/drills.js'
import { accountsEnabled } from '../config.js'
import AccountButton from '../components/AccountButton.jsx'
import Landing from './Landing.jsx'

function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 60) return 'just now'
  const hours = Math.round(mins / 60)
  if (hours < 24) return hours === 1 ? '1 hour ago' : `${hours} hours ago`
  const days = Math.round(hours / 24)
  if (days === 1) return 'yesterday'
  if (days < 30) return `${days} days ago`
  return new Date(ts).toLocaleDateString()
}

function ProgramCard({ p, onRun, onEdit, inProgress = false, primaryLabel = '▶ Run again', meta = null }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const drills = p.session.blocks.filter((b) => b.drillId).length
  return (
    <div className={`program-card${inProgress ? ' in-progress' : ''}`}>
      <div className="program-main">
        <div className="row" style={{ gap: 8 }}>
          <strong className="program-name">{p.name}</strong>
          {inProgress
            ? <span className="tag inprogress">⏱ In progress</span>
            : p.runs > 1 && <span className="tag grey">×{p.runs}</span>}
        </div>
        <p className="muted program-meta">
          {meta || `${drills} drills · ${p.session.request.duration} min · last used ${timeAgo(p.lastRunAt)}`}
        </p>
      </div>
      <div className="program-actions">
        <button className="btn btn-primary btn-sm" onClick={onRun}>{primaryLabel}</button>
        <button className="btn btn-ghost btn-sm" onClick={onEdit}>✎ Edit</button>
        <button
          className="icon-btn sm"
          aria-label={p.saved ? 'Unsave' : 'Save for later'}
          title={p.saved ? 'Remove from saved' : 'Save for later'}
          onClick={() => actions.toggleSaved(p.id)}
        >
          {p.saved ? '📌' : '📍'}
        </button>
        {confirmDelete ? (
          <button className="btn btn-ghost btn-sm danger" onClick={() => actions.deleteProgram(p.id)}>Sure?</button>
        ) : (
          <button className="icon-btn sm" aria-label="Delete" onClick={() => setConfirmDelete(true)}>🗑</button>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  const navigate = useNavigate()
  const auth = useStore((s) => s.auth)
  const programs = useStore((s) => s.programs)
  const favourites = useStore((s) => s.favourites)
  const session = useStore((s) => s.session)
  const ticks = useStore((s) => s.ticks)
  const currentProgramId = useStore((s) => s.currentProgramId)
  const guestEntered = useStore((s) => s.guestEntered)

  useEffect(() => { actions.refresh() }, [])

  // Signed-out visitors see the landing (which nudges them to sign in) on
  // every visit, until they either sign in or choose to continue as guest
  // for this session. Only when accounts are actually available.
  if (!auth && !guestEntered && accountsEnabled()) {
    return <Landing />
  }

  // Nothing here yet? Go straight to the wizard — no extra taps for
  // a first-time coach.
  if (!auth && programs.length === 0 && favourites.length === 0) {
    return <Navigate to="/new" replace />
  }

  const liveBlocks = session?.blocks || []
  const liveDone = liveBlocks.filter((b) => ticks[b.id]).length
  const sessionInProgress = liveBlocks.length > 0 && liveDone > 0 && liveDone < liveBlocks.length

  const saved = programs.filter((p) => p.saved)
  // The in-progress session gets its own "resume" card at the top of the
  // recent list, so drop it from the cards below to avoid showing it twice.
  const recent = programs
    .filter((p) => !p.saved && !(sessionInProgress && p.id === currentProgramId))
    .slice(0, 5)
  // The live, partly-done session — shown as a normal (but highlighted)
  // recent card with a "Continue" action instead of "Run again".
  const inProgressProgram = sessionInProgress ? programs.find((p) => p.id === currentProgramId) : null
  const favDrills = favourites.map(getDrill).filter(Boolean)
  const firstName = auth?.user?.name?.split(' ')[0]

  const run = (id) => { actions.runProgram(id); navigate('/plan') }
  const edit = (id) => { actions.runProgram(id); navigate('/plan?edit=1') }

  return (
    <div>
      <div className="hero">
        <h1>{firstName ? `Welcome back, ${firstName} 👋` : 'Welcome back 👋'}</h1>
        <p>Pick up where you left off, or build tonight's session from scratch.</p>
      </div>

      <Link to="/new" className="card new-session-card">
        <span className="emoji-badge" style={{ background: 'var(--green-100)', fontSize: 24 }}>⚽</span>
        <span style={{ flex: 1 }}>
          <strong style={{ fontSize: 17 }}>Plan a new session</strong>
          <span className="muted" style={{ display: 'block', fontSize: 13.5 }}>Your usual setup is already filled in</span>
        </span>
        <span aria-hidden="true">→</span>
      </Link>

      {(inProgressProgram || recent.length > 0) && (
        <section style={{ marginTop: 26 }}>
          <h2 className="home-h">🕐 Recent sessions</h2>
          {inProgressProgram && (
            <ProgramCard
              p={inProgressProgram}
              inProgress
              primaryLabel="▶ Continue"
              meta={`${liveDone} of ${liveBlocks.length} done · ${inProgressProgram.session.request.duration} min`}
              onRun={() => navigate('/plan')}
              onEdit={() => navigate('/plan?edit=1')}
            />
          )}
          {recent.map((p) => <ProgramCard key={p.id} p={p} onRun={() => run(p.id)} onEdit={() => edit(p.id)} />)}
        </section>
      )}

      {saved.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <h2 className="home-h">📌 Saved sessions</h2>
          {saved.map((p) => <ProgramCard key={p.id} p={p} onRun={() => run(p.id)} onEdit={() => edit(p.id)} />)}
        </section>
      )}

      {favDrills.length > 0 && (
        <section style={{ marginTop: 26 }}>
          <div className="spread">
            <h2 className="home-h">❤️ Favourite drills</h2>
            <Link to="/library" className="muted" style={{ fontSize: 13.5, fontWeight: 700 }}>Library →</Link>
          </div>
          <div className="fav-strip">
            {favDrills.map((d) => (
              <Link key={d.id} to={`/drill/${d.id}`} className="fav-pill">
                <span aria-hidden="true">{d.emoji}</span> {d.name}
              </Link>
            ))}
          </div>
        </section>
      )}

      {!auth && accountsEnabled() && (
        <div className="card" style={{ marginTop: 26 }}>
          <div className="section-h">☁️ Keep your sessions everywhere</div>
          <p className="muted" style={{ marginBottom: 14, fontSize: 14 }}>
            Sign in and your plans, saved sessions and favourite drills follow you to any device.
            Everything on this phone comes with you.
          </p>
          <AccountButton />
        </div>
      )}
    </div>
  )
}

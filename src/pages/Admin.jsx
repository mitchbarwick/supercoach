// Admin dashboard — only reachable by admin accounts (email listed in
// the API's ADMIN_EMAILS). Users, programs created, and drill feedback
// with its telemetry.
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client.js'
import { useStore } from '../store/useStore.js'
import { getDrill, AGE_GROUPS, FOCUS_AREAS } from '../data/drills.js'
import AccountButton from '../components/AccountButton.jsx'
import Icon from '../icons/Icon.jsx'

const fmtDate = (ts) => new Date(ts).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

function Stat({ icon, label, value }) {
  return (
    <div className="card stat-card">
      <Icon name={icon} size={24} className="stat-icon" />
      <span className="stat-value">{value}</span>
      <span className="muted" style={{ fontSize: 13.5 }}>{label}</span>
    </div>
  )
}

function FeedbackItem({ f }) {
  const drill = f.drillId ? getDrill(f.drillId) : null
  const age = AGE_GROUPS.find((a) => a.id === f.ageGroup)?.label || f.ageGroup
  const focus = f.focus?.map((x) => FOCUS_AREAS.find((fa) => fa.id === x)?.label).filter(Boolean).join(', ')
  return (
    <div className="card feedback-item">
      <div className="spread" style={{ marginBottom: 6 }}>
        <strong>
          {drill ? <Link to={`/drill/${drill.id}`}>{drill.emoji} {drill.name}</Link> : (f.drillName || 'General')}
        </strong>
        <span className="muted" style={{ fontSize: 12.5 }}>{fmtDate(f.createdAt)}</span>
      </div>
      <p style={{ fontSize: 15, marginBottom: 8 }}>"{f.text}"</p>
      <div className="chip-row" style={{ gap: 6 }}>
        {age && <span className="tag grey"><Icon name="baby" size={14} /> {age}</span>}
        {f.players && <span className="tag grey"><Icon name="users" size={14} /> {f.players} players</span>}
        {f.duration && <span className="tag grey"><Icon name="timer" size={14} /> {f.duration} min</span>}
        {focus && <span className="tag grey"><Icon name="target" size={14} /> {focus}</span>}
        {f.source && <span className="tag grey">{f.source === 'plan' ? <><Icon name="clipboard-list" size={14} /> from a plan</> : <><Icon name="library" size={14} /> from the library</>}</span>}
        {f.aiGenerated && <span className="tag blue"><Icon name="sparkles" size={14} /> AI session</span>}
        <span className="tag grey">{f.userEmail ? <><Icon name="mail" size={14} /> {f.userEmail}</> : <><Icon name="user-round" size={14} /> guest</>}</span>
      </div>
    </div>
  )
}

export default function Admin() {
  const auth = useStore((s) => s.auth)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!auth?.token) return
    let live = true
    api.adminOverview(auth.token)
      .then((d) => live && setData(d))
      .catch((err) => live && setError(err.message || 'Could not load dashboard'))
    return () => { live = false }
  }, [auth?.token])

  if (!auth) {
    return (
      <div className="empty-state">
        <div className="big"><Icon name="lock" size={44} /></div>
        <h2>Admin sign-in</h2>
        <p style={{ margin: '10px 0 22px' }}>Sign in with the app creator account to see the dashboard.</p>
        <AccountButton />
      </div>
    )
  }

  if (!auth.user.isAdmin) {
    return (
      <div className="empty-state">
        <div className="big"><Icon name="eye-off" size={44} /></div>
        <h2>Nothing to see here</h2>
        <p style={{ marginTop: 10 }}>This area is just for the app creator.</p>
      </div>
    )
  }

  if (error) return <div className="empty-state"><div className="big"><Icon name="triangle-alert" size={44} /></div><h2>Couldn't load</h2><p style={{ marginTop: 10 }}>{error}</p></div>
  if (!data) return <div className="empty-state"><div className="big"><Icon name="chart-column" size={44} /></div><h2>Loading dashboard…</h2></div>

  const { counts, recentFeedback, recentUsers } = data

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>SuperCoach HQ</h1>
      <p className="muted" style={{ marginBottom: 18 }}>How the app is doing, and what coaches are telling you.</p>

      <div className="stat-grid">
        <Stat icon="users" label="Coaches signed up" value={counts.users} />
        <Stat icon="clipboard-list" label="Programs created" value={counts.programs} />
        <Stat icon="message-square" label="Feedback received" value={counts.feedback} />
      </div>

      <section style={{ marginTop: 26 }}>
        <h2 className="home-h"><Icon name="message-square" /> Latest feedback</h2>
        {recentFeedback.length === 0 && <p className="muted">Nothing yet — feedback from drill pages lands here.</p>}
        {recentFeedback.map((f) => <FeedbackItem key={f.id} f={f} />)}
      </section>

      <section style={{ marginTop: 26 }}>
        <h2 className="home-h"><Icon name="users" /> Recent coaches</h2>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          {recentUsers.map((u) => (
            <div key={u.id} className="admin-user-row">
              {u.picture
                ? <img className="avatar" src={u.picture} alt="" referrerPolicy="no-referrer" />
                : <span className="avatar avatar-fallback">{u.name?.[0] || <Icon name="user-round" size={16} />}</span>}
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: 14.5 }}>{u.name}</strong>
                <span className="muted" style={{ display: 'block', fontSize: 12.5 }}>{u.email}</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span className="tag green">{u.programs} program{u.programs === 1 ? '' : 's'}</span>
                <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 4 }}>last seen {fmtDate(u.lastLogin)}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

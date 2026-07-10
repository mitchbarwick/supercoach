// Shown once, right when a signed-out visitor picks "Continue as guest"
// on the Landing page — a clear guest-vs-signed-in comparison before
// they commit, with sign-in still one tap away if they change their mind.
import { Navigate, useNavigate } from 'react-router-dom'
import { useStore, actions } from '../store/useStore.js'
import { accountsEnabled } from '../config.js'
import AccountButton from '../components/AccountButton.jsx'

const GUEST_POINTS = [
  'One plan at a time — building a new one replaces the last',
  'No favouriting drills',
  'No editing or swapping drills in a plan',
  'Drill library browsing, but coaching scripts are locked',
  'No Emergency injury support',
  'Nothing saved across devices',
]

const SIGNED_IN_POINTS = [
  'Unlimited plans, kept in your history',
  'Favourite drills — picked first when building sessions',
  'Edit any plan — swap drills that don’t fit',
  'Full drill library, including "say this to the players" scripts',
  'Emergency injury support',
  'Synced across every device',
]

export default function GuestInfo() {
  const navigate = useNavigate()
  const auth = useStore((s) => s.auth)
  const guestEntered = useStore((s) => s.guestEntered)

  // One-time interstitial — once the choice is made (or if accounts
  // aren't even configured), there's nothing to show here.
  if (auth || guestEntered || !accountsEnabled()) {
    return <Navigate to="/" replace />
  }

  return (
    <div className="fade-in">
      <div className="hero">
        <h1 style={{ fontSize: 26 }}>Guest, or signed in?</h1>
        <p className="muted" style={{ marginTop: 8 }}>Here's exactly what changes — you can always sign in later.</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="row" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="tag grey" style={{ marginBottom: 8 }}>👤 Guest</span>
            <ul className="nice-list" style={{ marginTop: 8 }}>
              {GUEST_POINTS.map((p, i) => <li key={i}><span className="dot">•</span><span>{p}</span></li>)}
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="tag green" style={{ marginBottom: 8 }}>☁️ Signed in</span>
            <ul className="nice-list" style={{ marginTop: 8 }}>
              {SIGNED_IN_POINTS.map((p, i) => <li key={i}><span className="dot">✓</span><span>{p}</span></li>)}
            </ul>
          </div>
        </div>
      </div>

      <div className="landing-cta card">
        <div className="landing-signin">
          <AccountButton />
        </div>
        <p className="muted landing-guest-note">Sign in for the full experience — or keep browsing as a guest.</p>
        <button
          className="btn btn-ghost btn-block"
          onClick={() => { actions.enterAsGuest(); navigate('/') }}
        >
          Continue as guest →
        </button>
      </div>

      <button className="btn btn-ghost btn-sm" style={{ marginTop: 14 }} onClick={() => navigate('/')}>← Back</button>
    </div>
  )
}

// Google sign-in button + signed-in account chip.
// Renders nothing until the API + Google client id are configured,
// so the app looks exactly like phase 2 until accounts go live.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountsEnabled } from '../config.js'
import { renderGoogleButton, googleSignOut } from '../auth/googleAuth.js'
import { api } from '../api/client.js'
import { useStore, actions } from '../store/useStore.js'

export default function AccountButton({ compact = false }) {
  const auth = useStore((s) => s.auth)
  const navigate = useNavigate()
  const holder = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!accountsEnabled() || auth || !holder.current) return
    let live = true
    renderGoogleButton(holder.current, async (credential) => {
      if (!live) return
      setBusy(true)
      setError('')
      try {
        const resp = await api.authGoogle(credential)
        await actions.signedIn(resp)
      } catch (err) {
        setError(err.message || 'Sign-in failed — try again.')
      } finally {
        if (live) setBusy(false)
      }
    }).catch(() => live && setError('Could not load Google sign-in.'))
    return () => { live = false }
  }, [auth])

  if (!accountsEnabled()) return null

  if (auth) {
    return (
      <div className="account-chip">
        {auth.user.picture
          ? <img className="avatar" src={auth.user.picture} alt="" referrerPolicy="no-referrer" />
          : <span className="avatar avatar-fallback">{auth.user.name?.[0] || '👤'}</span>}
        {!compact && (
          <div className="account-meta">
            <strong>{auth.user.name}</strong>
            <span className="muted">{auth.user.email}</span>
          </div>
        )}
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => { googleSignOut(); actions.signOut(); navigate('/') }}
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <div className="signin-holder">
      <div ref={holder} style={{ minHeight: 44, opacity: busy ? 0.5 : 1 }} />
      {busy && <p className="muted" style={{ fontSize: 13, marginTop: 6 }}>Signing you in…</p>}
      {error && <p style={{ color: 'var(--coral-700)', fontSize: 13, marginTop: 6 }}>{error}</p>}
    </div>
  )
}

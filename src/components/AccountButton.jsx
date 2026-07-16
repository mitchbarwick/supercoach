// Google sign-in button + signed-in account chip.
// Renders nothing until the API + Google client id are configured,
// so the app looks exactly like phase 2 until accounts go live.
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { accountsEnabled } from '../config.js'
import { renderGoogleButton, googleSignOut } from '../auth/googleAuth.js'
import { isEmbeddedBrowser, isAndroid, androidChromeIntentUrl } from '../auth/embeddedBrowser.js'
import { api } from '../api/client.js'
import { useStore, actions } from '../store/useStore.js'
import SigningInScreen from './SigningInScreen.jsx'

export default function AccountButton({ compact = false }) {
  const auth = useStore((s) => s.auth)
  const navigate = useNavigate()
  const holder = useRef(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)
  const embedded = !auth && isEmbeddedBrowser()

  useEffect(() => {
    // Google sign-in is blocked in in-app webviews — don't even try to render
    // the button (it would white-screen on tap). Show the escape hatch instead.
    if (embedded) return
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
  }, [auth, embedded])

  if (!accountsEnabled()) return null

  // In-app browser (Facebook/Messenger/Instagram/etc.): Google sign-in can't
  // run here. Offer a one-tap breakout on Android, plus a copy-link fallback.
  if (embedded) {
    const openInChrome = () => { window.location.href = androidChromeIntentUrl() }
    const copyLink = async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        setCopied(true)
        setTimeout(() => setCopied(false), 2500)
      } catch { setCopied(false) }
    }
    return (
      <div className="signin-holder signin-embedded">
        <p style={{ fontSize: 14, lineHeight: 1.4, margin: '0 0 10px' }}>
          To sign in with Google, open SuperCoach in your normal browser — Google
          blocks sign-in inside the {isAndroid() ? 'in-app' : 'Facebook'} browser.
        </p>
        {isAndroid() ? (
          <button className="btn btn-primary btn-sm" onClick={openInChrome}>
            Open in Chrome
          </button>
        ) : (
          <p style={{ fontSize: 13, margin: '0 0 8px' }}>
            Tap the menu (bottom of the screen), then
            <strong> "Open in Safari"</strong> (or your browser).
          </p>
        )}
        <button className="btn btn-ghost btn-sm" style={{ marginLeft: isAndroid() ? 8 : 0 }} onClick={copyLink}>
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>
    )
  }

  if (auth) {
    return (
      <div className="account-chip">
        {auth.user.picture
          ? <img className="avatar" src={auth.user.picture} alt="" referrerPolicy="no-referrer" />
          : <span className="avatar avatar-fallback">{auth.user.name?.[0] || '\u{1F464}'}</span>}
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
      {error && <p style={{ color: 'var(--coral-700)', fontSize: 13, marginTop: 6 }}>{error}</p>}
      {busy && <SigningInScreen />}
    </div>
  )
}

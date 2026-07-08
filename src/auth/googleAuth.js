// Google Identity Services (GIS) loader + button renderer.
// Free, works from any static host — the ID token it returns is
// verified server-side by the Functions API, which issues our own JWT.
import { GOOGLE_CLIENT_ID } from '../config.js'

let scriptPromise = null

function loadGis() {
  if (window.google?.accounts?.id) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://accounts.google.com/gsi/client'
      s.async = true
      s.onload = resolve
      s.onerror = () => { scriptPromise = null; reject(new Error('Could not load Google sign-in')) }
      document.head.appendChild(s)
    })
  }
  return scriptPromise
}

/**
 * Renders the official Google button into `el`.
 * `onCredential(idToken)` fires when the user completes sign-in.
 */
export async function renderGoogleButton(el, onCredential) {
  await loadGis()
  window.google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: (resp) => resp?.credential && onCredential(resp.credential),
    auto_select: false,
  })
  window.google.accounts.id.renderButton(el, {
    theme: 'outline',
    size: 'large',
    shape: 'pill',
    text: 'signin_with',
    width: 260,
  })
}

export function googleSignOut() {
  try { window.google?.accounts?.id?.disableAutoSelect() } catch { /* fine */ }
}

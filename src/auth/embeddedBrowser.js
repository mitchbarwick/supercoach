// Google blocks OAuth inside embedded/in-app webviews (Facebook, Messenger,
// Instagram, TikTok, etc.), so "Sign in with Google" just white-screens there.
// We can't fix that inside the webview — the only cure is to reopen the page
// in a real browser. These helpers detect the situation and, on Android, hand
// the user a one-tap escape via a Chrome `intent://` URL.

// User-agent fingerprints for the common in-app browsers. This can't be
// exhaustive, but it catches the ones that actually send shared links.
const EMBEDDED_UA = [
  'FBAN', 'FBAV', 'FB_IAB', 'FBIOS', // Facebook / Messenger
  'Instagram',
  'Line/',
  'Twitter', 'TwitterAndroid',
  'MicroMessenger', // WeChat
  'Snapchat',
  'TikTok', 'BytedanceWebview', 'musical_ly',
  'Pinterest',
  'GSA/', // Google App in-app browser
]

export function getUserAgent() {
  return typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
}

/** True when we're almost certainly inside an app's in-app browser. */
export function isEmbeddedBrowser(ua = getUserAgent()) {
  if (!ua) return false
  if (EMBEDDED_UA.some((sig) => ua.includes(sig))) return true
  // Android WebView: the "wv" token or "Version/x.x Chrome" combo that real
  // Chrome never sends. Guards against apps that don't add a custom UA token.
  if (/\bwv\b/.test(ua)) return true
  if (/Android/.test(ua) && /Version\/[\d.]+ Chrome/.test(ua)) return true
  return false
}

export function isAndroid(ua = getUserAgent()) {
  return /Android/i.test(ua)
}

export function isIOS(ua = getUserAgent()) {
  return /iPhone|iPad|iPod/i.test(ua)
}

/**
 * Android-only: an `intent://` URL that reopens the current page in Chrome,
 * breaking out of the in-app webview. `S.browser_fallback_url` sends users
 * without Chrome to the Play Store gracefully.
 */
export function androidChromeIntentUrl(url = window.location.href) {
  const stripped = url.replace(/^https?:\/\//, '')
  const fallback = encodeURIComponent(url)
  return (
    `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;` +
    `S.browser_fallback_url=${fallback};end`
  )
}

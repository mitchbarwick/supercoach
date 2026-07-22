// Self-contained sharing: a whole session plan is squeezed into a
// URL-safe string so a coach can send it by email / Messenger / text.
// No backend, no account, no expiry — the link *is* the plan. Drills
// stay referenced by their library id, and everything else that can be
// looked up from the library (title/emoji/blurb) is stripped before
// encoding and rehydrated on the way back out, keeping links short.
import { getDrill } from '../data/drills.js'

const SHARE_VERSION = 1

// ---- base64url (UTF-8 safe) ----
function toB64Url(str) {
  const b64 = btoa(unescape(encodeURIComponent(str)))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function fromB64Url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4)
  return decodeURIComponent(escape(atob(b64)))
}

/**
 * Encode a session {blocks, totalPlanned, request} into a compact,
 * URL-safe payload string. Drill blocks keep only what can't be looked
 * up (id, type, duration, startMin); non-drill blocks (drink breaks)
 * keep their display fields since they aren't in the library.
 */
export function encodeSession(session) {
  if (!session?.blocks) return ''
  const b = session.blocks.map((blk) =>
    blk.drillId
      ? { d: blk.drillId, t: blk.type, u: blk.duration, s: blk.startMin }
      : { t: blk.type, u: blk.duration, s: blk.startMin, ti: blk.title, e: blk.emoji, bl: blk.blurb },
  )
  const payload = { v: SHARE_VERSION, r: session.request, b }
  try {
    return toB64Url(JSON.stringify(payload))
  } catch {
    return ''
  }
}

/**
 * Decode a payload string back into a session with the same shape
 * buildSession produces. Drill display fields are rehydrated from the
 * library; a drill that's since vanished degrades gracefully. Block ids
 * are regenerated (recipient starts with fresh, untouched progress).
 * Returns null if the string isn't a valid share payload.
 */
export function decodeSession(str) {
  if (!str) return null
  let payload
  try {
    payload = JSON.parse(fromB64Url(str))
  } catch {
    return null
  }
  if (!payload || !Array.isArray(payload.b) || !payload.r) return null

  const blocks = payload.b.map((blk, i) => {
    const base = {
      id: `${blk.t}-${i}`,
      type: blk.t,
      duration: blk.u,
      startMin: blk.s,
    }
    if (blk.d) {
      const drill = getDrill(blk.d)
      return {
        ...base,
        drillId: blk.d,
        title: drill?.name || 'Drill',
        emoji: drill?.emoji || '⚽',
        blurb: drill?.blurb || '',
      }
    }
    return { ...base, title: blk.ti || '', emoji: blk.e || '', blurb: blk.bl || '' }
  })

  const totalPlanned = blocks.reduce((max, b) => Math.max(max, (b.startMin || 0) + (b.duration || 0)), 0)
  return { blocks, totalPlanned, request: payload.r, shared: true }
}

// ---- link building ----

/**
 * Absolute URL for a hash route on this deployment, e.g.
 * https://mitchbarwick.github.io/supercoach/#/shared?p=... — keeps the
 * app's base path (HashRouter) intact so links work wherever it's hosted.
 */
export function shareUrl(hashPath) {
  const { origin, pathname } = window.location
  return `${origin}${pathname}#${hashPath}`
}

/** Link that opens a full shared session plan. */
export function sessionShareUrl(session) {
  return shareUrl(`/shared?p=${encodeSession(session)}`)
}

/** Link that opens a single drill. */
export function drillShareUrl(drillId) {
  return shareUrl(`/drill/${drillId}`)
}

/**
 * Share a link the friendliest way the device allows: the native share
 * sheet (great for Messenger/WhatsApp/email on phones) when present,
 * otherwise copy to clipboard. Resolves to 'shared' | 'copied' | 'failed'.
 */
export async function shareLink({ title, text, url }) {
  try {
    if (navigator.share) {
      await navigator.share({ title, text, url })
      return 'shared'
    }
  } catch (err) {
    // AbortError = user dismissed the sheet; treat as a no-op, not a failure.
    if (err?.name === 'AbortError') return 'shared'
  }
  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

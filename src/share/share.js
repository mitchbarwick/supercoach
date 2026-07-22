// Self-contained sharing: a whole session plan is squeezed into a
// URL-safe string so a coach can send it by email / Messenger / text.
// No backend, no account, no expiry — the link *is* the plan.
//
// To keep links short we (1) strip everything derivable — a drill's
// block type is its library category, a block's start time is the
// running total of durations, and title/emoji/blurb come from the
// library — then (2) deflate-compress the rest. A ~12-block session
// drops from ~1000 URL chars to ~340.
import { getDrill } from '../data/drills.js'

const SHARE_VERSION = 2

// ---- base64url over raw bytes ----
function bytesToB64Url(bytes) {
  let s = ''
  for (const b of bytes) s += String.fromCharCode(b)
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
function b64UrlToBytes(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((str.length + 3) % 4)
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i)
  return out
}

// ---- deflate / inflate (native streams, no dependency) ----
async function deflate(str) {
  const cs = new CompressionStream('deflate-raw')
  const writer = cs.writable.getWriter()
  writer.write(new TextEncoder().encode(str))
  writer.close()
  const buf = await new Response(cs.readable).arrayBuffer()
  return new Uint8Array(buf)
}
async function inflate(bytes) {
  const ds = new DecompressionStream('deflate-raw')
  const writer = ds.writable.getWriter()
  writer.write(bytes)
  writer.close()
  const buf = await new Response(ds.readable).arrayBuffer()
  return new TextDecoder().decode(buf)
}

/**
 * Encode a session {blocks, request} into a compact, URL-safe string.
 * Each drill block becomes [1, drillId, duration] (type + display are
 * looked up on decode); each non-drill block (drink break) becomes
 * [0, type, duration, title, emoji, blurb]. Async because compression
 * is. Returns '' if anything goes wrong.
 */
export async function encodeSession(session) {
  if (!session?.blocks) return ''
  try {
    const b = session.blocks.map((blk) =>
      blk.drillId
        ? [1, blk.drillId, blk.duration]
        : [0, blk.type, blk.duration, blk.title, blk.emoji, blk.blurb],
    )
    const json = JSON.stringify([SHARE_VERSION, session.request, b])
    return bytesToB64Url(await deflate(json))
  } catch {
    return ''
  }
}

/**
 * Decode a share string back into a session with the same shape
 * buildSession produces. Block type/title/emoji/blurb and start times
 * are reconstructed; a drill that's since left the library degrades
 * gracefully. Recipient starts with fresh (untouched) block ids.
 * Async; resolves to null if the string isn't a valid share payload.
 */
export async function decodeSession(str) {
  if (!str) return null
  let payload
  try {
    payload = JSON.parse(await inflate(b64UrlToBytes(str)))
  } catch {
    return null
  }
  if (!Array.isArray(payload) || payload[0] !== SHARE_VERSION) return null
  const [, request, rawBlocks] = payload
  if (!request || !Array.isArray(rawBlocks)) return null

  let cursor = 0
  const blocks = rawBlocks.map((r, i) => {
    const startMin = cursor
    if (r[0] === 1) {
      const [, drillId, duration] = r
      const drill = getDrill(drillId)
      cursor += duration
      return {
        id: `${drill?.category || 'drill'}-${i}`,
        type: drill?.category || 'drill',
        drillId,
        title: drill?.name || 'Drill',
        emoji: drill?.emoji || '⚽',
        blurb: drill?.blurb || '',
        duration,
        startMin,
      }
    }
    const [, type, duration, title, emoji, blurb] = r
    cursor += duration
    return { id: `${type}-${i}`, type, title: title || '', emoji: emoji || '', blurb: blurb || '', duration, startMin }
  })

  return { blocks, totalPlanned: cursor, request, shared: true }
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

/** Link that opens a full shared session plan (async — plan is compressed). */
export async function sessionShareUrl(session) {
  const p = await encodeSession(session)
  return shareUrl(`/shared?p=${p}`)
}

/** Link that opens a single drill (short already — just the drill id). */
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

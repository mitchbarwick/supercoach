// Lightweight persistent store (localStorage) for the current
// session plan, tick-offs, notes, favourites, Azure config — and,
// since phase 3, the signed-in account, remembered setup choices
// (prefs) and the coach's program history (recent + saved sessions).
//
// Accounts are OPTIONAL: everything works logged out exactly as it
// always did. Signing in merges this device's data into the account
// and mirrors changes to the API (fire-and-forget — the UI never
// waits on the network).
import { useSyncExternalStore } from 'react'
import { api } from '../api/client.js'
import { AGE_GROUPS, FOCUS_AREAS } from '../data/drills.js'

const KEY = 'supercoach-v1'
const MAX_RECENT_UNSAVED = 10

const defaults = {
  session: null,        // {blocks, totalPlanned, request, createdAt}
  ticks: {},            // blockId -> true
  notes: {},            // drillId -> string
  favourites: [],       // [drillId]
  // Endpoint + deployment pre-filled for Mitch's Azure resource
  // (deployment is named "gpt-35-turbo" but runs gpt-4.1-mini).
  // Only the API key needs pasting in Settings.
  azure: { endpoint: 'https://mjbarwick.openai.azure.com', apiKey: '', deployment: 'gpt-35-turbo' },
  aiCache: {},          // cacheKey -> text
  // ---- phase 3 ----
  auth: null,           // {token, user:{name,email,picture,isAdmin}}
  prefs: null,          // {ageGroup, players, duration, equipment} — remembered setup choices
  programs: [],         // [{id,name,saved,createdAt,lastRunAt,runs,session}]
  currentProgramId: null,
  syncedAt: 0,
  // Ephemeral (never persisted): a signed-out visitor who chose "continue
  // as guest" for THIS session. Reset to false on every fresh load so the
  // landing keeps encouraging sign-in until they actually sign in.
  guestEntered: false,
}

let state = load()
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    // guestEntered is ephemeral — force it false on load regardless of what
    // may have been written to storage, so the landing shows on each visit.
    return raw ? { ...defaults, ...JSON.parse(raw), guestEntered: false } : { ...defaults }
  } catch {
    return { ...defaults }
  }
}

function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* storage full/blocked */ }
}

export function setState(patch) {
  state = { ...state, ...(typeof patch === 'function' ? patch(state) : patch) }
  persist()
  listeners.forEach((l) => l())
}

export function getState() { return state }

export function useStore(selector = (s) => s) {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb) },
    () => selector(state),
  )
}

// ---- helpers ----

const token = () => state.auth?.token || null

/** Mirror a change to the API when signed in. Never blocks the UI. */
function mirror(fn) {
  const t = token()
  if (!t) return
  Promise.resolve()
    .then(() => fn(t))
    .catch((err) => {
      // A 401 means the 30-day token expired — drop to guest quietly.
      if (err?.status === 401) setState({ auth: null })
    })
}

export function autoName(request) {
  const age = AGE_GROUPS.find((a) => a.id === request.ageGroup)?.label || request.ageGroup
  const focus = request.focus?.length
    ? request.focus.map((f) => FOCUS_AREAS.find((x) => x.id === f)?.label).filter(Boolean).join(', ')
    : 'Anything'
  return `${age} · ${request.duration} min · ${focus}`
}

function trimPrograms(programs) {
  // Saved programs are kept forever; unsaved "recents" are capped.
  const saved = programs.filter((p) => p.saved)
  const recent = programs.filter((p) => !p.saved)
    .sort((a, b) => b.lastRunAt - a.lastRunAt)
    .slice(0, MAX_RECENT_UNSAVED)
  return [...saved, ...recent].sort((a, b) => b.lastRunAt - a.lastRunAt)
}

let favTimer = null
function mirrorFavourites() {
  clearTimeout(favTimer)
  favTimer = setTimeout(() => mirror((t) => api.putFavourites(t, getState().favourites)), 800)
}

// ---- convenience actions ----
export const actions = {
  /** New session generated: becomes the live plan AND a program history entry. */
  saveSession(session, { remember = true } = {}) {
    const now = Date.now()
    const program = {
      id: crypto.randomUUID(),
      name: autoName(session.request),
      saved: false,
      createdAt: now,
      lastRunAt: now,
      runs: 1,
      session: { ...session, createdAt: now },
    }
    setState((s) => ({
      session: program.session,
      ticks: {},
      currentProgramId: program.id,
      programs: remember ? trimPrograms([program, ...s.programs]) : s.programs,
    }))
    if (remember) mirror((t) => api.pushPrograms(t, [program]))
    // Remember the coach's decisions so next time is prefilled.
    actions.setPrefs({
      ageGroup: session.request.ageGroup,
      players: session.request.players,
      duration: session.request.duration,
      equipment: session.request.equipment,
    })
  },

  /** Run a program from history again (fresh ticks). */
  runProgram(id) {
    const p = getState().programs.find((x) => x.id === id)
    if (!p) return
    const now = Date.now()
    const updated = { ...p, lastRunAt: now, runs: (p.runs || 1) + 1 }
    setState((s) => ({
      session: p.session,
      ticks: {},
      currentProgramId: id,
      programs: s.programs.map((x) => (x.id === id ? updated : x)).sort((a, b) => b.lastRunAt - a.lastRunAt),
    }))
    mirror((t) => api.updateProgram(t, id, { lastRunAt: now }))
  },

  /**
   * After editing (drill swaps), write blocks back to the live session
   * and its program. Block ids are stable across swaps so ticks survive.
   */
  updateProgramSession(id, session) {
    setState((s) => ({
      session,
      programs: id ? s.programs.map((x) => (x.id === id ? { ...x, session } : x)) : s.programs,
    }))
    if (id) mirror((t) => api.updateProgram(t, id, { session }))
  },

  toggleSaved(id) {
    const p = getState().programs.find((x) => x.id === id)
    if (!p) return
    const saved = !p.saved
    setState((s) => ({ programs: trimPrograms(s.programs.map((x) => (x.id === id ? { ...x, saved } : x))) }))
    mirror((t) => api.updateProgram(t, id, { saved }))
  },

  renameProgram(id, name) {
    setState((s) => ({ programs: s.programs.map((x) => (x.id === id ? { ...x, name } : x)) }))
    mirror((t) => api.updateProgram(t, id, { name }))
  },

  deleteProgram(id) {
    setState((s) => ({
      programs: s.programs.filter((x) => x.id !== id),
      currentProgramId: s.currentProgramId === id ? null : s.currentProgramId,
    }))
    mirror((t) => api.deleteProgram(t, id))
  },

  setPrefs(prefs) {
    setState((s) => ({ prefs: { ...s.prefs, ...prefs } }))
    mirror((t) => api.putPrefs(t, getState().prefs))
  },

  toggleTick(blockId) {
    setState((s) => ({ ticks: { ...s.ticks, [blockId]: !s.ticks[blockId] } }))
  },
  setTick(blockId, done) {
    setState((s) => ({ ticks: { ...s.ticks, [blockId]: done } }))
  },
  setNote(drillId, text) {
    setState((s) => ({ notes: { ...s.notes, [drillId]: text } }))
  },
  toggleFavourite(drillId) {
    setState((s) => ({
      favourites: s.favourites.includes(drillId)
        ? s.favourites.filter((id) => id !== drillId)
        : [...s.favourites, drillId],
    }))
    mirrorFavourites()
  },
  setAzure(cfg) { setState((s) => ({ azure: { ...s.azure, ...cfg } })) },
  cacheAi(key, text) { setState((s) => ({ aiCache: { ...s.aiCache, [key]: text } })) },

  // ---- account ----

  /**
   * Called with the /auth/google response. Merges this device's data
   * into the account: favourites union, local programs pushed up,
   * server prefs win when they exist.
   */
  async signedIn({ token: t, user, prefs, favourites }) {
    const local = getState()
    const mergedFavs = [...new Set([...(favourites || []), ...local.favourites])]
    setState({
      auth: { token: t, user },
      favourites: mergedFavs,
      prefs: prefs || local.prefs,
    })
    try {
      if (local.programs.length) await api.pushPrograms(t, local.programs)
      if (mergedFavs.length !== (favourites || []).length) await api.putFavourites(t, mergedFavs)
      if (!prefs && local.prefs) await api.putPrefs(t, local.prefs)
      const { programs } = await api.listPrograms(t)
      setState({ programs: trimPrograms(programs), syncedAt: Date.now() })
    } catch { /* sync is best-effort; local data is intact */ }
  },

  /** Refresh account data from the server (e.g. on app load). */
  async refresh() {
    const t = token()
    if (!t) return
    try {
      const [{ user, prefs, favourites }, { programs }] = await Promise.all([api.me(t), api.listPrograms(t)])
      setState((s) => ({
        auth: { ...s.auth, user },
        prefs: prefs || s.prefs,
        favourites: [...new Set([...(favourites || []), ...s.favourites])],
        programs: trimPrograms(programs),
        syncedAt: Date.now(),
      }))
    } catch (err) {
      if (err?.status === 401) setState({ auth: null })
    }
  },

  signOut() {
    // Keep everything local — her plans stay on this device.
    setState({ auth: null })
  },

  /** Signed-out visitor chose to continue as a guest for this session. */
  enterAsGuest() {
    setState({ guestEntered: true })
  },
}

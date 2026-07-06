// Lightweight persistent store (localStorage) for the current
// session plan, tick-offs, notes, favourites and Azure config.
import { useSyncExternalStore } from 'react'

const KEY = 'supercoach-v1'

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
}

let state = load()
const listeners = new Set()

function load() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...defaults, ...JSON.parse(raw) } : { ...defaults }
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

// ---- convenience actions ----
export const actions = {
  saveSession(session) {
    setState({ session: { ...session, createdAt: Date.now() }, ticks: {} })
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
  },
  setAzure(cfg) { setState((s) => ({ azure: { ...s.azure, ...cfg } })) },
  cacheAi(key, text) { setState((s) => ({ aiCache: { ...s.aiCache, [key]: text } })) },
}

// Thin fetch wrapper for the SuperCoach API (Azure Functions).
// Every call fails soft — callers decide whether an error matters.
import { API_BASE } from '../config.js'

class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

async function req(path, { method = 'GET', token, body } = {}) {
  if (!API_BASE) throw new ApiError('API not configured', 0)
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new ApiError(data.error || `Request failed (${res.status})`, res.status)
  return data
}

export const api = {
  authGoogle: (credential) => req('/auth/google', { method: 'POST', body: { credential } }),
  me: (token) => req('/me', { token }),
  putPrefs: (token, prefs) => req('/prefs', { method: 'PUT', token, body: prefs }),
  putFavourites: (token, favourites) => req('/favourites', { method: 'PUT', token, body: favourites }),
  listPrograms: (token) => req('/programs', { token }),
  pushPrograms: (token, programs) => req('/programs', { method: 'POST', token, body: programs }),
  updateProgram: (token, id, patch) => req(`/programs/${id}`, { method: 'PUT', token, body: patch }),
  deleteProgram: (token, id) => req(`/programs/${id}`, { method: 'DELETE', token }),
  sendFeedback: (token, payload) => req('/feedback', { method: 'POST', token, body: payload }),
  adminOverview: (token) => req('/dashboard/overview', { token }),
}

export { ApiError }

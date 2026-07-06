// ============================================================
// Azure AI Foundry (Azure OpenAI) layer.
// Enhances drill pages with age-specific coaching guidance.
// Fails soft: if not configured or the call errors, the app
// falls back to the curated library text.
// ============================================================
import { getState, actions } from '../store/useStore.js'

export function aiConfigured() {
  const { endpoint, apiKey, deployment } = getState().azure
  return Boolean(endpoint && apiKey && deployment)
}

// Azure accepts two kinds of keys, on two different routes:
//  - Foundry *project* keys (long, ~180+ chars) → the modern "v1" route,
//    `<endpoint>/openai/v1/chat/completions` with the deployment passed
//    as `model` in the body.
//  - Classic Cognitive Services *resource* keys (32 hex chars) → the
//    legacy `<endpoint>/openai/deployments/<name>/chat/completions` route.
// We build attempts in the order most likely to succeed for the stored
// key, fall through on 401/403, and remember what worked.
let workingAttempt = null

function buildAttempts({ base, apiKey, deployment }) {
  const looksLikeProjectKey = apiKey.length > 40
  const attempts = [
    {
      id: 'v1-apikey',
      url: `${base}/openai/v1/chat/completions`,
      headers: { 'api-key': apiKey },
      bodyExtra: { model: deployment },
    },
    {
      id: 'v1-bearer',
      url: `${base}/openai/v1/chat/completions`,
      headers: { Authorization: `Bearer ${apiKey}` },
      bodyExtra: { model: deployment },
    },
    {
      id: 'legacy-apikey',
      url: `${base}/openai/deployments/${deployment}/chat/completions?api-version=2024-10-21`,
      headers: { 'api-key': apiKey },
      bodyExtra: {},
    },
  ]
  if (!looksLikeProjectKey) attempts.push(attempts.shift()) // classic key: try legacy-style ordering sooner
  if (workingAttempt) {
    const i = attempts.findIndex((a) => a.id === workingAttempt)
    if (i > 0) attempts.unshift(attempts.splice(i, 1)[0])
  }
  return attempts
}

export async function chat(messages, { maxTokens = 500, responseFormat, temperature = 0.7, timeoutMs = 20000 } = {}) {
  const { endpoint, apiKey, deployment } = getState().azure
  const base = endpoint.replace(/\/+$/, '')
  const baseBody = { messages, max_tokens: maxTokens, temperature }
  if (responseFormat === 'json_object') baseBody.response_format = { type: 'json_object' }

  const attempts = buildAttempts({ base, apiKey: apiKey.trim(), deployment })
  let lastErr
  for (const attempt of attempts) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    try {
      const res = await fetch(attempt.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...attempt.headers },
        body: JSON.stringify({ ...baseBody, ...attempt.bodyExtra }),
        signal: controller.signal,
      })
      if (!res.ok) {
        const err = new Error(`Azure ${res.status}`)
        err.status = res.status
        // auth/route mismatch → try the next key/route combination
        if (res.status === 401 || res.status === 403 || res.status === 404) {
          lastErr = err
          continue
        }
        throw err
      }
      workingAttempt = attempt.id
      const data = await res.json()
      return data.choices?.[0]?.message?.content?.trim()
    } catch (err) {
      if (err.name === 'AbortError') {
        const timeoutErr = new Error('Azure request timed out')
        timeoutErr.timeout = true
        throw timeoutErr
      }
      if (err.status) { lastErr = err; continue }
      throw err
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr || new Error('Azure request failed')
}

/**
 * Age-tailored coaching tips for a drill. Cached per drill+age.
 * Returns null when AI is unavailable — caller falls back to curated text.
 */
export async function getCoachingTips(drill, ageGroup) {
  if (!aiConfigured()) return null
  const key = `tips:${drill.id}:${ageGroup}`
  const cached = getState().aiCache[key]
  if (cached) return cached
  try {
    const text = await chat([
      {
        role: 'system',
        content:
          'You are SuperCoach, a friendly assistant for volunteer grassroots football coaches with no coaching experience. Reply with exactly 3 short, practical tips (one line each, no numbering, separated by newlines). Warm, plain language. No jargon.',
      },
      {
        role: 'user',
        content: `Drill: "${drill.name}" — ${drill.blurb}. How to play: ${drill.howToPlay.join(' ')} Age group: ${ageGroup}. Give me 3 tips specific to coaching THIS age group through THIS drill (attention span, language to use, common mistakes).`,
      },
    ])
    if (text) actions.cacheAi(key, text)
    return text
  } catch {
    return null
  }
}

// Shared HTTP plumbing: CORS, JSON responses, auth guard.
// CORS is handled in code so nothing extra needs configuring on the
// Function App (leave the platform CORS list EMPTY or it will take over
// and strip these headers).
import { jwtVerify } from 'jose'

const ORIGINS = (process.env.ALLOWED_ORIGINS ||
  'https://mitchbarwick.github.io,http://localhost:5173,http://127.0.0.1:5173')
  .split(',').map((s) => s.trim()).filter(Boolean)

export function corsHeaders(request) {
  const origin = request.headers.get('origin') || ''
  const allowed = ORIGINS.includes(origin) ? origin : ORIGINS[0]
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin',
  }
}

export function json(request, status, body) {
  return { status, jsonBody: body, headers: corsHeaders(request) }
}

const secret = () => new TextEncoder().encode(process.env.JWT_SECRET || '')

/** Returns {sub, email, name, isAdmin} or null. Never throws. */
export async function userFrom(request) {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token || !process.env.JWT_SECRET) return null
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] })
    return {
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      isAdmin: isAdminEmail(payload.email),
    }
  } catch {
    return null
  }
}

export function isAdminEmail(email) {
  const admins = (process.env.ADMIN_EMAILS || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean)
  return Boolean(email) && admins.includes(String(email).toLowerCase())
}

/**
 * Wraps a handler with OPTIONS preflight, JSON error safety and
 * (optionally) an auth requirement: wrap(handler, {auth:true|'admin'|false}).
 * The handler is called as handler(request, context, user).
 */
export function wrap(handler, { auth = false } = {}) {
  return async (request, context) => {
    if (request.method === 'OPTIONS') return { status: 204, headers: corsHeaders(request) }
    try {
      const user = await userFrom(request)
      if (auth && !user) return json(request, 401, { error: 'Sign in required' })
      if (auth === 'admin' && !user.isAdmin) return json(request, 403, { error: 'Admins only' })
      return await handler(request, context, user)
    } catch (err) {
      context.error(err)
      return json(request, 500, { error: 'Something went wrong on the server.' })
    }
  }
}

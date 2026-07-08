// SuperCoach API — all routes.
//   POST /api/auth/google        Google ID token -> app JWT + profile
//   GET  /api/me                 profile + prefs + favourites
//   PUT  /api/prefs              save remembered setup choices
//   PUT  /api/favourites         replace favourite drill ids
//   GET  /api/programs           list my programs (recent + saved)
//   POST /api/programs           create one program, or an array (first-login merge)
//   PUT  /api/programs/{id}      update (rename / save flag / blocks / lastRunAt)
//   DELETE /api/programs/{id}
//   POST /api/feedback           free-text drill feedback + telemetry (auth optional)
//   GET  /api/dashboard/overview counts + recent feedback + recent users (admin)
//        NB: route must NOT start with 'admin' — Azure Functions reserves /admin
import { app } from '@azure/functions'
import { SignJWT, jwtVerify, createRemoteJWKSet } from 'jose'
import { getContainers, countAll } from './lib/db.js'
import { wrap, json, isAdminEmail } from './lib/http.js'

const GOOGLE_JWKS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'))
const MAX_PROGRAMS_PER_USER = 200

// ---------- auth ----------

app.http('authGoogle', {
  route: 'auth/google',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request) => {
    const { credential } = await request.json().catch(() => ({}))
    if (!credential) return json(request, 400, { error: 'Missing credential' })

    let payload
    try {
      ;({ payload } = await jwtVerify(credential, GOOGLE_JWKS, {
        issuer: ['https://accounts.google.com', 'accounts.google.com'],
        audience: process.env.GOOGLE_CLIENT_ID,
      }))
    } catch {
      return json(request, 401, { error: 'Google sign-in could not be verified' })
    }
    if (!payload.email_verified) return json(request, 401, { error: 'Google account email is not verified' })

    const { users } = await getContainers()
    const id = payload.sub
    const now = Date.now()
    let user
    try {
      const { resource } = await users.item(id, id).read()
      user = resource
    } catch { /* not found */ }
    user = {
      id,
      email: payload.email,
      name: payload.name || payload.email,
      picture: payload.picture || '',
      prefs: user?.prefs || null,
      favourites: user?.favourites || [],
      createdAt: user?.createdAt || now,
      lastLogin: now,
      logins: (user?.logins || 0) + 1,
    }
    await users.items.upsert(user)

    const token = await new SignJWT({ email: user.email, name: user.name })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(id)
      .setIssuedAt()
      .setExpirationTime('30d')
      .sign(new TextEncoder().encode(process.env.JWT_SECRET))

    return json(request, 200, {
      token,
      user: { name: user.name, email: user.email, picture: user.picture, isAdmin: isAdminEmail(user.email) },
      prefs: user.prefs,
      favourites: user.favourites,
    })
  }),
})

app.http('me', {
  route: 'me',
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const { users } = await getContainers()
    const { resource } = await users.item(user.sub, user.sub).read()
    return json(request, 200, {
      user: { name: resource.name, email: resource.email, picture: resource.picture, isAdmin: isAdminEmail(resource.email) },
      prefs: resource.prefs,
      favourites: resource.favourites || [],
    })
  }, { auth: true }),
})

// ---------- prefs & favourites ----------

async function patchUser(sub, patch) {
  const { users } = await getContainers()
  const { resource } = await users.item(sub, sub).read()
  await users.items.upsert({ ...resource, ...patch })
}

app.http('prefs', {
  route: 'prefs',
  methods: ['PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') return json(request, 400, { error: 'Bad prefs' })
    const prefs = {
      ageGroup: body.ageGroup ?? null,
      players: Number(body.players) || null,
      duration: Number(body.duration) || null,
      equipment: Array.isArray(body.equipment) ? body.equipment.slice(0, 20) : null,
    }
    await patchUser(user.sub, { prefs })
    return json(request, 200, { prefs })
  }, { auth: true }),
})

app.http('favourites', {
  route: 'favourites',
  methods: ['PUT', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const body = await request.json().catch(() => null)
    if (!Array.isArray(body)) return json(request, 400, { error: 'Expected an array of drill ids' })
    const favourites = body.filter((x) => typeof x === 'string').slice(0, 200)
    await patchUser(user.sub, { favourites })
    return json(request, 200, { favourites })
  }, { auth: true }),
})

// ---------- programs ----------

function cleanProgram(raw, userId) {
  if (!raw || typeof raw !== 'object' || !raw.session?.blocks) return null
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : crypto.randomUUID(),
    userId,
    name: String(raw.name || 'Training session').slice(0, 120),
    saved: Boolean(raw.saved),
    createdAt: Number(raw.createdAt) || Date.now(),
    lastRunAt: Number(raw.lastRunAt) || Number(raw.createdAt) || Date.now(),
    runs: Number(raw.runs) || 1,
    session: raw.session, // {blocks, totalPlanned, request, createdAt}
  }
}

app.http('programsList', {
  route: 'programs',
  methods: ['GET', 'POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const { programs } = await getContainers()

    if (request.method === 'GET') {
      const { resources } = await programs.items
        .query({
          query: 'SELECT * FROM c WHERE c.userId = @u ORDER BY c.lastRunAt DESC',
          parameters: [{ name: '@u', value: user.sub }],
        })
        .fetchAll()
      return json(request, 200, { programs: resources })
    }

    // POST — single program or array (first-login merge of local history)
    const body = await request.json().catch(() => null)
    const list = (Array.isArray(body) ? body : [body]).map((p) => cleanProgram(p, user.sub)).filter(Boolean)
    if (!list.length) return json(request, 400, { error: 'No valid programs in request' })
    const existing = await countAllFor(programs, user.sub)
    if (existing + list.length > MAX_PROGRAMS_PER_USER) return json(request, 400, { error: 'Program limit reached' })
    await Promise.all(list.map((p) => programs.items.upsert(p)))
    return json(request, 200, { programs: list })
  }, { auth: true }),
})

async function countAllFor(container, userId) {
  const { resources } = await container.items
    .query({ query: 'SELECT VALUE COUNT(1) FROM c WHERE c.userId = @u', parameters: [{ name: '@u', value: userId }] })
    .fetchAll()
  return resources[0] || 0
}

app.http('programItem', {
  route: 'programs/{id}',
  methods: ['PUT', 'DELETE', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const { programs } = await getContainers()
    const id = request.params.id

    if (request.method === 'DELETE') {
      await programs.item(id, user.sub).delete().catch(() => {})
      return json(request, 200, { ok: true })
    }

    const body = await request.json().catch(() => ({}))
    let resource
    try {
      ;({ resource } = await programs.item(id, user.sub).read())
    } catch {
      return json(request, 404, { error: 'Program not found' })
    }
    const updated = {
      ...resource,
      ...(typeof body.name === 'string' ? { name: body.name.slice(0, 120) } : {}),
      ...(typeof body.saved === 'boolean' ? { saved: body.saved } : {}),
      ...(body.session?.blocks ? { session: body.session } : {}),
      ...(body.lastRunAt ? { lastRunAt: Number(body.lastRunAt), runs: (resource.runs || 1) + 1 } : {}),
    }
    await programs.items.upsert(updated)
    return json(request, 200, { program: updated })
  }, { auth: true }),
})

// ---------- feedback ----------

app.http('feedback', {
  route: 'feedback',
  methods: ['POST', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request, _ctx, user) => {
    const body = await request.json().catch(() => null)
    const text = String(body?.text || '').trim()
    if (!text) return json(request, 400, { error: 'Feedback text is required' })
    const t = body.telemetry || {}
    const { feedback } = await getContainers()
    const item = {
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      text: text.slice(0, 4000),
      drillId: String(body.drillId || '').slice(0, 80) || null,
      drillName: String(body.drillName || '').slice(0, 120) || null,
      // telemetry — everything the app knew when the coach hit send
      ageGroup: t.ageGroup || null,
      players: Number(t.players) || null,
      duration: Number(t.duration) || null,
      focus: Array.isArray(t.focus) ? t.focus.slice(0, 6) : null,
      equipment: Array.isArray(t.equipment) ? t.equipment.slice(0, 20) : null,
      source: t.source || null, // 'plan' | 'library'
      aiGenerated: Boolean(t.aiGenerated),
      appVersion: String(t.appVersion || '').slice(0, 20) || null,
      // who (null for guests)
      userId: user?.sub || null,
      userEmail: user?.email || null,
      userName: user?.name || null,
    }
    await feedback.items.create(item)
    return json(request, 200, { ok: true })
  }),
})

// ---------- admin ----------

app.http('dashboardOverview', {
  route: 'dashboard/overview',
  methods: ['GET', 'OPTIONS'],
  authLevel: 'anonymous',
  handler: wrap(async (request) => {
    const { users, programs, feedback } = await getContainers()
    const [userCount, programCount, feedbackCount] = await Promise.all([
      countAll(users), countAll(programs), countAll(feedback),
    ])
    const [{ resources: recentFeedback }, { resources: recentUsers }, { resources: byUser }] = await Promise.all([
      feedback.items.query('SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT 100').fetchAll(),
      users.items.query('SELECT c.id, c.name, c.email, c.picture, c.createdAt, c.lastLogin, c.logins FROM c ORDER BY c.lastLogin DESC OFFSET 0 LIMIT 50').fetchAll(),
      programs.items.query('SELECT c.userId, COUNT(1) AS n FROM c GROUP BY c.userId').fetchAll(),
    ])
    const programCounts = Object.fromEntries(byUser.map((r) => [r.userId, r.n]))
    return json(request, 200, {
      counts: { users: userCount, programs: programCount, feedback: feedbackCount },
      recentFeedback,
      recentUsers: recentUsers.map((u) => ({ ...u, programs: programCounts[u.id] || 0 })),
    })
  }, { auth: 'admin' }),
})

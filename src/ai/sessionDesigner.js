// ============================================================
// AI whole-session designer. Given the coach's constraints, asks
// the LLM to choose drills (by id, from the real library only)
// for the whole session in one shot, then validates the response
// against the same hard constraints the rule-based engine uses
// before handing it to assembleTimeline() for final timing.
// Mirrors buildSession()'s contract: {blocks, totalPlanned, request}.
// ============================================================
import { DRILLS, getDrill, AGE_BLOCK_CAPS, drillDurationRange } from '../data/drills.js'
import { chat, aiConfigured } from './azure.js'
import { buildCtx, computeSkeleton, fits, assembleTimeline, sessionRoles, resolveShape } from '../engine/sessionBuilder.js'

export class SessionDesignError extends Error {
  constructor(message, opts) {
    super(message)
    this.name = 'SessionDesignError'
    if (opts?.cause) this.cause = opts.cause
  }
}

function trimForPrompt(drill) {
  const { id, name, category, focus, family, ages, equipment, players, baseDuration, blurb, good } = drill
  return { id, name, category, focus, family, ages, equipment, players, baseDuration, blurb, good }
}

const ROLE_LABEL = { warmup: 'warm-up', drill: 'main drill', game: 'small-sided game', cooldown: 'cool-down' }

// One line of the "exact structure" list per block role, annotating which
// game is the arrival / mid / closing game so the model places them correctly.
function describeRoles(roles) {
  const closingIdx = roles[roles.length - 2] === 'game' ? roles.length - 2 : -1
  return roles.map((role, i) => {
    let note = ''
    if (role === 'game') {
      if (i === 0) note = ' — the ARRIVAL game: kids play the moment they arrive, no instruction'
      else if (i === closingIdx) note = ' — the CLOSING game: end the session on a game, "let them play"'
      else note = ' — a mid-session game that breaks up the main drills'
    } else if (role === 'cooldown') {
      note = ', last'
    }
    return `${i + 1}. "${role}" (${ROLE_LABEL[role]})${note}.`
  })
}

function buildMessages(ctx, skeleton, pool) {
  // Drills the coach has seen in recent sessions (favourites excluded —
  // those are meant to recur). Fed to the model so it spreads variety
  // over time rather than reaching for the same drills every session.
  const recentlyUsed = Object.keys(ctx.recency || {})
    .filter((id) => ctx.recency[id] > 0.2 && !ctx.favourites.includes(id))
    .sort((a, b) => ctx.recency[b] - ctx.recency[a])

  const roles = sessionRoles(skeleton)
  const young = ctx.ageGroup === 'U6-U8' || ctx.ageGroup === 'U9-U11'

  const system =
    'You are SuperCoach, an assistant that plans full grassroots football training sessions for volunteer coaches. ' +
    'Choose drills ONLY from the approved library below, referencing them by their exact "id" — never invent a drill or an id that isn\'t listed. ' +
    'Respond with strict JSON only — no markdown fences, no commentary.'

  const structure = [
    'Design a training session with this exact block sequence, in this exact order — ' +
      'do not add, remove, or reorder sections:',
    ...describeRoles(roles),
    young && skeleton.openWithGame
      ? 'This is a young squad: games bookend the session, so it OPENS on a small-sided game (not a warm-up) and CLOSES on one — this is deliberate, keep it.'
      : 'Older squads open on a warm-up and (when present) close on a game.',
    'For each "game" slot choose a drill whose category is exactly "game".',
    'Never choose the same drillId more than once.',
    'Keep the session varied: avoid choosing two drills that share the same "family" — ' +
      'drills in one family train the same thing the same way, so repeating a family makes the ' +
      'session monotonous. Prefer a spread of different families across the main drills and games.',
    'The library below has already been filtered to drills that suit this squad\'s age and setup, ' +
      'so every listed drill is age-appropriate — just choose the best mix.',
  ].filter(Boolean).join('\n')

  const example = roles.map((role) => {
    if (role === 'warmup') return '  {"role": "warmup", "drillId": "...", "duration": 8, "blurb": "optional override — omit to keep the library default"}'
    if (role === 'drill') return '  {"role": "drill", "drillId": "...", "duration": 12}'
    if (role === 'game') return '  {"role": "game", "drillId": "..."}'
    return '  {"role": "cooldown", "drillId": "..."}'
  }).join(',\n')

  const user = [
    structure,
    '',
    'Coach\'s constraints:',
    `- Duration: ${skeleton.total} minutes total`,
    `- Players today: ${ctx.players}`,
    `- Age group: ${ctx.ageGroup}`,
    `- Equipment available: ${ctx.equipment.join(', ') || 'none'}`,
    `- Focus areas to prioritise (cover each at least once if possible): ${ctx.focus.join(', ')}`,
    `- Favourite drills (prefer these when appropriate): ${ctx.favourites.join(', ') || 'none'}`,
    `- Recently used — avoid these so the coach sees variety across sessions, unless one is a favourite or clearly the best fit: ${recentlyUsed.join(', ') || 'none'}`,
    '',
    'Timing guidance — the app inserts its own drink breaks and sizes the games and cool-down automatically; ' +
      'do not include breaks and don\'t worry about the exact length of any game or the cool-down:',
    skeleton.openWithGame
      ? `- The arrival game and any mid-session game are kept short automatically — just pick good games.`
      : `- Warm-up should be about ${skeleton.warmLen} minutes.`,
    `- The ${skeleton.targetDrillCount} main drills together should total about ${skeleton.mainBudget} minutes.`,
    `- Attention span: ${ctx.ageGroup} players can hold focus on one drill for at most ${(AGE_BLOCK_CAPS[ctx.ageGroup] || AGE_BLOCK_CAPS['U9-U11']).drill} minutes — never plan a single drill longer than that (games can run longer).`,
    `- Player grouping: some drills declare players.multiple (e.g. pairs need even numbers, triangles need multiples of 3). With ${ctx.players} players, only pick drills the squad can split into evenly.`,
    '',
    'Approved drill library (choose "drillId" only from these ids):',
    JSON.stringify(pool),
    '',
    'Respond with ONLY this JSON shape, no other text:',
    '{"choices": [',
    example,
    ']}',
  ].join('\n')

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]
}

export function extractJson(raw) {
  const s = raw.trim().replace(/^```(?:json)?/i, '').replace(/```$/, '').trim()
  const start = s.indexOf('{')
  const end = s.lastIndexOf('}')
  return start !== -1 && end > start ? s.slice(start, end + 1) : s
}

function coerceDuration(value, fallback) {
  const n = Number(value)
  if (!Number.isFinite(n) || n < 3 || n > 45) return fallback
  return Math.round(n)
}

function coerceBlurb(value, fallback) {
  if (typeof value !== 'string' || !value.trim()) return fallback
  return value.trim().slice(0, 300)
}

export function validateAiChoices(raw, ctx, skeleton) {
  let parsed
  try {
    parsed = JSON.parse(extractJson(raw))
  } catch (err) {
    throw new SessionDesignError('The AI coach\'s plan wasn\'t valid JSON — please try again.', { cause: err })
  }

  const choices = parsed?.choices
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new SessionDesignError('The AI coach\'s plan was missing choices — please try again.')
  }

  // The expected ordered block sequence for this squad — the shared contract
  // between the rule-based builder, this validator, and the prompt above.
  const roles = sessionRoles(skeleton)
  const closingGameIdx = roles[roles.length - 2] === 'game' ? roles.length - 2 : -1
  const expectedGames = roles.filter((r) => r === 'game').length

  if (choices[0]?.role !== roles[0] || choices[choices.length - 1]?.role !== 'cooldown') {
    throw new SessionDesignError('The AI coach\'s plan wasn\'t structured correctly — please try again.')
  }

  const middle = choices.slice(1, -1)
  const drillEntries = middle.filter((c) => c.role === 'drill')
  const gameEntries = middle.filter((c) => c.role === 'game')
  // A leading arrival game lives at index 0, so count every game across the
  // whole plan when checking the game count.
  const totalGames = choices.filter((c) => c.role === 'game').length
  if (totalGames !== expectedGames) {
    throw new SessionDesignError('The AI coach\'s plan had the wrong number of game blocks — please try again.')
  }
  if (drillEntries.length !== skeleton.targetDrillCount) {
    throw new SessionDesignError('The AI coach\'s plan had the wrong number of main drills — please try again.')
  }
  if (drillEntries.length + gameEntries.length !== middle.length) {
    throw new SessionDesignError('The AI coach\'s plan contained an unexpected block type — please try again.')
  }
  // Enforce the exact per-age block order (rejects, e.g., the old warm-up-first
  // shape for a young squad that should open on a game).
  for (let i = 0; i < roles.length; i++) {
    if (choices[i]?.role !== roles[i]) {
      throw new SessionDesignError('The AI coach\'s plan wasn\'t structured correctly — please try again.')
    }
  }

  const seen = new Set()
  const resolve = (choice, expectedCategory) => {
    const drill = getDrill(choice?.drillId)
    if (!drill) throw new SessionDesignError('The AI coach referenced a drill that doesn\'t exist — please try again.')
    if (drill.category !== expectedCategory) {
      throw new SessionDesignError('The AI coach put a drill in the wrong slot — please try again.')
    }
    if (seen.has(drill.id)) {
      throw new SessionDesignError('The AI coach picked the same drill twice — please try again.')
    }
    if (!fits(drill, ctx)) {
      throw new SessionDesignError('The AI coach picked a drill that doesn\'t fit your setup — please try again.')
    }
    seen.add(drill.id)
    return drill
  }

  const fixedBlocks = []
  let gameChoice = null
  let cooldownChoice = null

  roles.forEach((role, i) => {
    const choice = choices[i]
    if (role === 'warmup') {
      const drill = resolve(choice, 'warmup')
      fixedBlocks.push({
        type: 'warmup', drillId: drill.id, title: drill.name, emoji: drill.emoji,
        duration: coerceDuration(choice.duration, skeleton.warmLen),
        blurb: coerceBlurb(choice.blurb, drill.blurb),
      })
    } else if (role === 'drill') {
      const drill = resolve(choice, 'drill')
      // clamp whatever the AI proposed into the realistic range for this
      // drill and age group — attention spans are a hard constraint
      const range = drillDurationRange(drill, ctx.ageGroup)
      const proposed = coerceDuration(choice.duration, drill.baseDuration)
      fixedBlocks.push({
        type: 'drill', drillId: drill.id, title: drill.name, emoji: drill.emoji,
        duration: Math.max(range.min, Math.min(proposed, range.max)),
        blurb: coerceBlurb(choice.blurb, drill.blurb),
      })
    } else if (role === 'game') {
      const drill = resolve(choice, 'game')
      if (i === closingGameIdx) {
        // The closing game's duration is always computed as remaining time by
        // assembleTimeline — this keeps total session length matching the
        // coach's request regardless of what the AI proposes.
        gameChoice = { drillId: drill.id, title: drill.name, emoji: drill.emoji, blurb: coerceBlurb(choice.blurb, drill.blurb) }
      } else {
        // Arrival / mid-session games are fixed short blocks, sized by the
        // skeleton — not AI-chosen — so the budget stays predictable.
        const duration = i === 0 ? skeleton.arrivalLen : skeleton.midLen
        fixedBlocks.push({ type: 'game', drillId: drill.id, title: drill.name, emoji: drill.emoji, duration, blurb: coerceBlurb(choice.blurb, drill.blurb) })
      }
    } else if (role === 'cooldown') {
      const drill = resolve(choice, 'cooldown')
      // Cool-down duration is likewise always "remaining time" — never AI-chosen.
      cooldownChoice = { drillId: drill.id, title: drill.name, emoji: drill.emoji, blurb: coerceBlurb(choice.blurb, drill.blurb) }
    }
  })

  const openLen = skeleton.openWithGame ? skeleton.arrivalLen : skeleton.warmLen
  const plannedFixedMinutes = fixedBlocks.reduce((sum, b) => sum + b.duration, 0)
  if (plannedFixedMinutes > openLen + skeleton.mainBudget + skeleton.midLen + 6) {
    throw new SessionDesignError('The AI coach\'s plan overran your time budget — please try again.')
  }

  return { fixedBlocks, gameChoice, cooldownChoice }
}

export async function designSessionWithAI(opts) {
  if (!aiConfigured()) {
    throw new SessionDesignError('AI is not configured.')
  }

  const ctx = buildCtx(opts)
  const pool = DRILLS.filter((d) => fits(d, ctx))
  const gamesAvailable = pool.filter((d) => d.category === 'game').length
  // Downgrade the desired game shape to what this setup can actually supply,
  // so the prompt and validator agree on a buildable sequence.
  const skeleton = { ...resolveShape(computeSkeleton(opts.duration, ctx.players, ctx.ageGroup), gamesAvailable), total: opts.duration }

  if (!pool.some((d) => d.category === 'cooldown')) {
    throw new SessionDesignError('No cooldown drills match your current equipment/players — try adjusting your setup.')
  }
  // A warm-up is only needed when the session opens on one (older squads, or
  // young squads with no game available).
  if (!skeleton.openWithGame && !pool.some((d) => d.category === 'warmup')) {
    throw new SessionDesignError('No warmup drills match your current equipment/players — try adjusting your setup.')
  }

  let raw
  try {
    raw = await chat(buildMessages(ctx, skeleton, pool.map(trimForPrompt)), {
      maxTokens: 800,
      responseFormat: 'json_object',
      temperature: 0.5,
      timeoutMs: 25000,
    })
  } catch (err) {
    if (err.status === 401 || err.status === 403) {
      throw new SessionDesignError('Your Azure API key was rejected — check the key in Settings.', { cause: err })
    }
    if (err.status === 404) {
      throw new SessionDesignError('Azure couldn\'t find that deployment — check the endpoint/deployment name in Settings.', { cause: err })
    }
    if (err.timeout) {
      throw new SessionDesignError('The AI coach took too long to respond. Please try again.', { cause: err })
    }
    throw new SessionDesignError('Could not reach the AI coach. Check your connection and try again.', { cause: err })
  }
  if (!raw) {
    throw new SessionDesignError('The AI coach returned an empty response. Please try again.')
  }

  const { fixedBlocks, gameChoice, cooldownChoice } = validateAiChoices(raw, ctx, skeleton)
  const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, opts.duration, skeleton.coolLen, skeleton.gameMax)
  return { blocks, totalPlanned, request: { ...opts } }
}

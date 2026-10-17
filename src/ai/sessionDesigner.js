// ============================================================
// AI whole-session designer. Given the coach's constraints, asks
// the LLM to choose drills (by id, from the real library only)
// for the whole session in one shot, then validates the response
// against the same hard constraints the rule-based engine uses
// before handing it to assembleTimeline() for final timing.
// Mirrors buildSession()'s contract: {blocks, totalPlanned, request}.
// ============================================================
import { DRILLS, getDrill, AGE_BLOCK_CAPS, drillDurationRange, drillsClash, drillStyle, sameStyle } from '../data/drills.js'
import { chat, aiConfigured } from './azure.js'
import { buildCtx, computeSkeleton, fits, assembleTimeline, sessionRoles } from '../engine/sessionBuilder.js'

export class SessionDesignError extends Error {
  constructor(message, opts) {
    super(message)
    this.name = 'SessionDesignError'
    if (opts?.cause) this.cause = opts.cause
  }
}

function trimForPrompt(drill) {
  const { id, name, category, focus, family, ages, equipment, players, baseDuration, blurb, good, avoidWith } = drill
  return { id, name, category, focus, family, style: drillStyle(drill), ages, equipment, players, baseDuration, blurb, good, ...(avoidWith ? { avoidWith } : {}) }
}

const ROLE_LABEL = { warmup: 'warm-up', drill: 'hard work — main drill', game: 'fun game', cooldown: 'cool-down' }

// One line of the "exact structure" list per block role, annotating which
// game is the opening / closing game so the model places them correctly.
function describeRoles(roles) {
  const games = roles.reduce((acc, r, i) => (r === 'game' ? [...acc, i] : acc), [])
  const closingIdx = games.length ? games[games.length - 1] : -1
  const openingIdx = games.length === 2 ? games[0] : -1
  return roles.map((role, i) => {
    let note = ''
    if (role === 'game') {
      if (i === openingIdx) note = ' — the OPENING fun game, straight after the warm-up: energy up, minimal instruction'
      else if (i === closingIdx) note = ' — the CLOSING fun game: end the session on a game, "let them play"'
    } else if (role === 'warmup') {
      note = ' — prefer an injury-prevention (FIFA 11+-style) warm-up'
    } else if (role === 'drill') {
      note = ' — where the focus areas get coached'
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

  const system =
    'You are SuperCoach, an assistant that plans full grassroots football training sessions for volunteer coaches. ' +
    'Choose drills ONLY from the approved library below, referencing them by their exact "id" — never invent a drill or an id that isn\'t listed. ' +
    'Respond with strict JSON only — no markdown fences, no commentary.'

  const structure = [
    'Design a training session with this exact block sequence, in this exact order — ' +
      'do not add, remove, or reorder sections:',
    ...describeRoles(roles),
    'The pattern is deliberate: warm-up → fun game → hard work → fun game → cool-down (the cool-down is only included when there is time). Keep it.',
    skeleton.cooldown ? null : 'This session is too short for a cool-down — the closing game runs to the end.',
    'For each "game" slot choose a drill whose category is exactly "game".',
    'Never choose the same drillId more than once.',
    'Hard rule: a drill listing another drill\'s id in "avoidWith" is the SAME game under a different name — never pick both in one session.',
    'Hard rule: two blocks next to each other must NOT share the same "style" — the style is what the activity looks and feels like ' +
      '(e.g. Rondo and Defend the Castle are both "keep-ball" circles, so they can never run back to back).',
    'Keep the session varied: prefer a different "style" AND a different "family" for every block — ' +
      'repeating a format makes the session monotonous even when the drills have different names.',
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
    `- Warm-up should be about ${skeleton.warmLen} minutes; the opening game is kept short automatically.`,
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

export function validateAiChoices(raw, ctx, skeleton, pool = DRILLS.filter((d) => fits(d, ctx))) {
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

  // The expected ordered block sequence — the shared contract between the
  // rule-based builder, this validator, and the prompt above.
  const roles = sessionRoles(skeleton)
  if (choices.length !== roles.length || roles.some((r, i) => choices[i]?.role !== r)) {
    throw new SessionDesignError('The AI coach\'s plan wasn\'t structured correctly — please try again.')
  }
  const gameIdx = roles.reduce((acc, r, i) => (r === 'game' ? [...acc, i] : acc), [])
  const closingGameIdx = skeleton.wantGame ? gameIdx[gameIdx.length - 1] : -1

  const seen = new Set()
  let prev = null
  const resolve = (choice, expectedCategory) => {
    const drill = getDrill(choice?.drillId)
    if (!drill) throw new SessionDesignError('The AI coach referenced a drill that doesn\'t exist — please try again.')
    if (drill.category !== expectedCategory) {
      throw new SessionDesignError('The AI coach put a drill in the wrong slot — please try again.')
    }
    if (seen.has(drill.id)) {
      throw new SessionDesignError('The AI coach picked the same drill twice — please try again.')
    }
    // avoidWith pairs are the same game under different names — reject plans
    // that contain both (mirrors the rule-based builder's hard exclusion).
    if ([...seen].some((id) => drillsClash(getDrill(id), drill))) {
      throw new SessionDesignError('The AI coach picked two near-identical drills — please try again.')
    }
    if (!fits(drill, ctx)) {
      throw new SessionDesignError('The AI coach picked a drill that doesn\'t fit your setup — please try again.')
    }
    // Back-to-back same-style blocks — only rejected when the pool had a
    // different-style option for that slot (mirrors the rule-based builder).
    if (prev && sameStyle(prev, drill) && pool.some((d) => d.category === expectedCategory && !seen.has(d.id) && !sameStyle(d, prev))) {
      throw new SessionDesignError('The AI coach put two very similar activities back to back — please try again.')
    }
    seen.add(drill.id)
    prev = drill
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
        // The closing game's duration is always remaining time (assembleTimeline).
        gameChoice = { drillId: drill.id, title: drill.name, emoji: drill.emoji, blurb: coerceBlurb(choice.blurb, drill.blurb) }
      } else {
        // The opening game is a fixed short block sized by the skeleton.
        fixedBlocks.push({ type: 'game', drillId: drill.id, title: drill.name, emoji: drill.emoji, duration: skeleton.openGameLen, blurb: coerceBlurb(choice.blurb, drill.blurb) })
      }
    } else if (role === 'cooldown') {
      const drill = resolve(choice, 'cooldown')
      // Cool-down duration is likewise always "remaining time" — never AI-chosen.
      cooldownChoice = { drillId: drill.id, title: drill.name, emoji: drill.emoji, blurb: coerceBlurb(choice.blurb, drill.blurb) }
    }
  })

  const plannedFixedMinutes = fixedBlocks.reduce((sum, b) => sum + b.duration, 0)
  if (plannedFixedMinutes > skeleton.warmLen + skeleton.openGameLen + skeleton.mainBudget + 6) {
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
  // Fit the game slots to what this setup can actually supply, so the prompt
  // and validator agree on a buildable sequence.
  const skeleton = computeSkeleton(opts.duration, ctx.players, ctx.ageGroup, gamesAvailable)

  if (skeleton.cooldown && !pool.some((d) => d.category === 'cooldown')) {
    throw new SessionDesignError('No cooldown drills match your current equipment/players — try adjusting your setup.')
  }
  if (!pool.some((d) => d.category === 'warmup')) {
    throw new SessionDesignError('No warmup drills match your current equipment/players — try adjusting your setup.')
  }

  // One automatic retry when the reply breaks a planning rule (wrong shape,
  // two same-style activities back to back, …): the model gets told what
  // went wrong, so the coach rarely has to press "Try again" themselves.
  const messages = buildMessages(ctx, skeleton, pool.map(trimForPrompt))
  let lastError = null
  for (let attempt = 0; attempt < 2; attempt++) {
    let raw
    try {
      raw = await chat(messages, {
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
    try {
      const { fixedBlocks, gameChoice, cooldownChoice } = validateAiChoices(raw, ctx, skeleton, pool)
      const cool = cooldownChoice ? skeleton.coolLen : 0
      const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, opts.duration, cool, skeleton.gameMax)
      return { blocks, totalPlanned, request: { ...opts } }
    } catch (err) {
      if (!(err instanceof SessionDesignError)) throw err
      lastError = err
      messages.push(
        { role: 'assistant', content: raw },
        { role: 'user', content: `That plan was rejected: ${err.message.replace(/ — please try again\.?$/, '')}. Fix it and reply with the full corrected JSON only.` },
      )
    }
  }
  throw lastError
}

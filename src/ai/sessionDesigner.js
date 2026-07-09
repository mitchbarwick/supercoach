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
import { buildCtx, computeSkeleton, fits, assembleTimeline } from '../engine/sessionBuilder.js'

export class SessionDesignError extends Error {
  constructor(message, opts) {
    super(message)
    this.name = 'SessionDesignError'
    if (opts?.cause) this.cause = opts.cause
  }
}

function trimForPrompt(drill) {
  const { id, name, category, focus, family, equipment, players, baseDuration, blurb } = drill
  return { id, name, category, focus, family, equipment, players, baseDuration, blurb }
}

function buildMessages(ctx, skeleton, pool, wantGame) {
  const system =
    'You are SuperCoach, an assistant that plans full grassroots football training sessions for volunteer coaches. ' +
    'Choose drills ONLY from the approved library below, referencing them by their exact "id" — never invent a drill or an id that isn\'t listed. ' +
    'Respond with strict JSON only — no markdown fences, no commentary.'

  const structure = [
    'Design a training session with this exact structure — do not add or remove sections:',
    '1. Exactly 1 "warmup" entry.',
    `2. Exactly ${skeleton.targetDrillCount} "drill" entries (main activities), in run order.`,
    wantGame ? '3. Exactly 1 "game" entry.' : '3. No "game" entry.',
    '4. Exactly 1 "cooldown" entry, last.',
    'Never choose the same drillId more than once.',
    'Keep the session varied: avoid choosing two drills that share the same "family" — ' +
      'drills in one family train the same thing the same way, so repeating a family makes the ' +
      'session monotonous. Prefer a spread of different families across the main drills.',
    'The library below has already been filtered to drills that suit this squad\'s age and setup, ' +
      'so every listed drill is age-appropriate — just choose the best mix.',
  ].join('\n')

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
    '',
    'Timing guidance — the app inserts its own drink breaks and sizes the cool-down automatically; ' +
      'do not include breaks and don\'t worry about the cool-down\'s exact length:',
    `- Warm-up should be about ${skeleton.warmLen} minutes.`,
    `- The ${skeleton.targetDrillCount} main drills together should total about ${skeleton.mainBudget} minutes.`,
    `- Attention span: ${ctx.ageGroup} players can hold focus on one drill for at most ${(AGE_BLOCK_CAPS[ctx.ageGroup] || AGE_BLOCK_CAPS['U9-U11']).drill} minutes — never plan a single drill longer than that (games can run longer).`,
    `- Player grouping: some drills declare players.multiple (e.g. pairs need even numbers, triangles need multiples of 3). With ${ctx.players} players, only pick drills the squad can split into evenly.`,
    '',
    'Approved drill library (choose "drillId" only from these ids):',
    JSON.stringify(pool),
    '',
    'Respond with ONLY this JSON shape, no other text:',
    '{"choices": [',
    '  {"role": "warmup", "drillId": "...", "duration": 8, "blurb": "optional override — omit to keep the library default"},',
    '  {"role": "drill", "drillId": "...", "duration": 12},',
    '  ...',
    '  {"role": "cooldown", "drillId": "..."}',
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

export function validateAiChoices(raw, ctx, skeleton, wantGame) {
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
  if (choices[0]?.role !== 'warmup' || choices[choices.length - 1]?.role !== 'cooldown') {
    throw new SessionDesignError('The AI coach\'s plan wasn\'t structured correctly — please try again.')
  }

  const middle = choices.slice(1, -1)
  const drillEntries = middle.filter((c) => c.role === 'drill')
  const gameEntries = middle.filter((c) => c.role === 'game')
  if (gameEntries.length !== (wantGame ? 1 : 0)) {
    throw new SessionDesignError('The AI coach\'s plan had the wrong number of game blocks — please try again.')
  }
  if (drillEntries.length !== skeleton.targetDrillCount) {
    throw new SessionDesignError('The AI coach\'s plan had the wrong number of main drills — please try again.')
  }
  if (drillEntries.length + gameEntries.length !== middle.length) {
    throw new SessionDesignError('The AI coach\'s plan contained an unexpected block type — please try again.')
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

  const warmupDrill = resolve(choices[0], 'warmup')
  const warmupBlock = {
    type: 'warmup',
    drillId: warmupDrill.id,
    title: warmupDrill.name,
    emoji: warmupDrill.emoji,
    duration: coerceDuration(choices[0].duration, skeleton.warmLen),
    blurb: coerceBlurb(choices[0].blurb, warmupDrill.blurb),
  }

  const drillBlocks = drillEntries.map((choice) => {
    const drill = resolve(choice, 'drill')
    // clamp whatever the AI proposed into the realistic range for this
    // drill and age group — attention spans are a hard constraint
    const range = drillDurationRange(drill, ctx.ageGroup)
    const proposed = coerceDuration(choice.duration, drill.baseDuration)
    return {
      type: 'drill',
      drillId: drill.id,
      title: drill.name,
      emoji: drill.emoji,
      duration: Math.max(range.min, Math.min(proposed, range.max)),
      blurb: coerceBlurb(choice.blurb, drill.blurb),
    }
  })

  let gameChoice = null
  if (wantGame) {
    const gameDrill = resolve(gameEntries[0], 'game')
    // Game duration is always computed as remaining time by assembleTimeline,
    // regardless of what the AI proposes — this keeps the total session
    // length always matching what the coach requested.
    gameChoice = {
      drillId: gameDrill.id,
      title: gameDrill.name,
      emoji: gameDrill.emoji,
      blurb: coerceBlurb(gameEntries[0].blurb, gameDrill.blurb),
    }
  }

  const cooldownDrill = resolve(choices[choices.length - 1], 'cooldown')
  // Cool-down duration is likewise always "remaining time" — never AI-chosen.
  const cooldownChoice = {
    drillId: cooldownDrill.id,
    title: cooldownDrill.name,
    emoji: cooldownDrill.emoji,
    blurb: coerceBlurb(choices[choices.length - 1].blurb, cooldownDrill.blurb),
  }

  const plannedActivityMinutes = warmupBlock.duration + drillBlocks.reduce((sum, b) => sum + b.duration, 0)
  if (plannedActivityMinutes > skeleton.warmLen + skeleton.mainBudget + 6) {
    throw new SessionDesignError('The AI coach\'s plan overran your time budget — please try again.')
  }

  return { fixedBlocks: [warmupBlock, ...drillBlocks], gameChoice, cooldownChoice }
}

export async function designSessionWithAI(opts) {
  if (!aiConfigured()) {
    throw new SessionDesignError('AI is not configured.')
  }

  const ctx = buildCtx(opts)
  const skeleton = computeSkeleton(opts.duration, ctx.players, ctx.ageGroup)
  const pool = DRILLS.filter((d) => fits(d, ctx))

  for (const cat of ['warmup', 'cooldown']) {
    if (!pool.some((d) => d.category === cat)) {
      throw new SessionDesignError(`No ${cat} drills match your current equipment/players — try adjusting your setup.`)
    }
  }
  const wantGame = skeleton.wantGame && pool.some((d) => d.category === 'game')

  let raw
  try {
    raw = await chat(buildMessages(ctx, { ...skeleton, total: opts.duration }, pool.map(trimForPrompt), wantGame), {
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

  const { fixedBlocks, gameChoice, cooldownChoice } = validateAiChoices(raw, ctx, skeleton, wantGame)
  const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, opts.duration, skeleton.coolLen, skeleton.gameMax)
  return { blocks, totalPlanned, request: { ...opts } }
}

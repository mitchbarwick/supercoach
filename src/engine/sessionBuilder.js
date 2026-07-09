// ============================================================
// Rule-based session assembler.
// Takes what the coach has (time, players, kit, focus areas)
// and produces a fully timed plan from warm-up to cool-down,
// with drink breaks factored in.
// Favourited drills are preferred whenever they fit.
// ============================================================
import { DRILLS, FOCUS_AREAS, AGE_BLOCK_CAPS, drillDurationRange, drillSuitsAge } from '../data/drills.js'

const BREAK_EVERY_MIN = 18 // activity minutes between drink breaks
const BREAK_LEN = 3

export function fits(drill, ctx) {
  // equipment: every required item must be available
  if (!drill.equipment.every((e) => ctx.equipment.includes(e))) return false
  if (ctx.players < drill.players.min) return false
  // grouping: pairs drills need even numbers, triangle drills need
  // multiples of 3, etc. — never plan a drill the squad can't form.
  const mult = drill.players.multiple
  if (mult && ctx.players % mult !== 0) return false
  // U6-U8 teams don't have goalkeepers, so keeper-focused drills are out.
  if (ctx.ageGroup === 'U6-U8' && drill.focus.includes('goalkeeping')) return false
  // Age suitability: don't hand complex drills to little kids or baby
  // drills to older squads.
  if (!drillSuitsAge(drill, ctx.ageGroup)) return false
  return true
}

export function buildCtx(opts) {
  return {
    players: opts.players,
    ageGroup: opts.ageGroup,
    equipment: opts.equipment || [],
    // "Anything" (empty focus) puts every tag on equal footing rather than
    // secretly favouring teamwork — the pool is then shaped only by hard
    // constraints and favourites.
    focus: opts.focus?.length ? opts.focus : FOCUS_AREAS.map((f) => f.id),
    favourites: opts.favourites || [],
    // drillId -> 0..1 "seen recently" weight (see store's drillRecencyMap).
    recency: opts.recency || {},
  }
}

export function computeSkeleton(total, players, ageGroup) {
  const caps = AGE_BLOCK_CAPS[ageGroup] || AGE_BLOCK_CAPS['U9-U11']
  const warmLen = Math.min(total <= 45 ? Math.max(6, Math.round(total * 0.15)) : 10, caps.warmup)
  const coolLen = Math.min(total <= 45 ? 5 : 6, caps.cooldown)
  const wantGame = total >= 35 && players >= 6
  const gameLen = wantGame ? Math.min(Math.max(10, Math.round(total * 0.25)), caps.game) : 0
  let mainBudget = total - warmLen - coolLen - gameLen
  const expectedBreaks = Math.floor((mainBudget + gameLen) / (BREAK_EVERY_MIN + BREAK_LEN))
  mainBudget -= expectedBreaks * BREAK_LEN
  const targetDrillCount = Math.max(2, Math.min(4, Math.floor(mainBudget / 10)))
  return { warmLen, coolLen, wantGame, gameLen, mainBudget, targetDrillCount, gameMax: caps.game, drillMax: caps.drill }
}

/**
 * Assembles a fully timed session from already-decided content (drill
 * choices + durations/blurbs). Shared by the rule-based engine and the
 * AI session designer so break-insertion/startMin logic never diverges.
 * Game and cool-down durations are always computed as "remaining time"
 * here, regardless of who chose the drill, so the total always matches
 * the requested session length.
 */
export function assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, coolLen, gameMax = Infinity) {
  const blocks = []
  let cursor = 0
  let sinceBreak = 0

  const push = (block) => {
    blocks.push({ ...block, startMin: cursor, id: `${block.type}-${blocks.length}` })
    cursor += block.duration
    if (block.type !== 'break') sinceBreak += block.duration
  }
  const maybeBreak = (remainingAfter) => {
    if (sinceBreak >= BREAK_EVERY_MIN && remainingAfter > BREAK_LEN + 4) {
      push({ type: 'break', title: 'Drink break', emoji: '💧', duration: BREAK_LEN, blurb: 'Water, breathe, quick praise for what you\'ve seen so far.' })
      sinceBreak = 0
    }
  }

  for (const block of fixedBlocks) {
    push(block)
    if (block.type === 'drill') maybeBreak(total - cursor - coolLen)
  }

  if (gameChoice) {
    maybeBreak(total - cursor - coolLen)
    const len = total - cursor - coolLen
    // cap the game by the age group's attention span — any leftover
    // minutes flow into a longer, more relaxed cool-down
    push({ type: 'game', duration: Math.max(8, Math.min(len, gameMax)), ...gameChoice })
  }

  const coolActual = Math.max(4, total - cursor)
  push({ type: 'cooldown', duration: coolActual, ...cooldownChoice })

  return { blocks, totalPlanned: cursor }
}

function scoreDrill(drill, ctx, usedFocus, usedFamily) {
  let focusScore = 0
  for (const f of drill.focus) {
    if (ctx.focus.includes(f)) focusScore += usedFocus[f] ? 4 : 10 // unseen focus areas first
  }
  // Cap the focus contribution so a drill isn't favoured just for carrying
  // more tags — especially in "anything" mode where every focus counts and
  // 3-tag drills (Sharks, Rondo) would otherwise always win. Covering the
  // requested work matters; piling on extra tags shouldn't dominate.
  let s = Math.min(focusScore, 14)
  const fav = ctx.favourites.includes(drill.id)
  if (fav) s += 6
  // Similarity: a drill from a family we've already used this session is
  // a repeat of the same challenge — nudge towards something different so
  // the session stays varied. Soft penalty (never a hard filter), so it
  // only decides between otherwise comparable options.
  if (usedFamily?.has(drill.family)) s -= 7
  // Recency: fade out drills the coach has seen in recent sessions so the
  // rotation spreads across the whole library over time. A just-used drill
  // loses up to 20 points — more than any drill's positive score — so it
  // reliably steps aside for a fresher option, easing back in as the
  // penalty fades. Favourites lose only up to 4, because favouriting is the
  // coach's explicit "show me this one more often" signal.
  const rec = ctx.recency?.[drill.id] || 0 // 0..1, 1 = used most recently
  s -= rec * (fav ? 4 : 20)
  if (ctx.players > drill.players.max) s -= 3 // usable via multiple groups, slightly penalised
  s += Math.random() * 3 // gentle variety between otherwise-tied drills
  return s
}

function pickBest(pool, ctx, usedFocus, picked, usedFamily) {
  const candidates = pool.filter((d) => !picked.has(d.id) && fits(d, ctx))
  if (!candidates.length) return null
  candidates.sort((a, b) => scoreDrill(b, ctx, usedFocus, usedFamily) - scoreDrill(a, ctx, usedFocus, usedFamily))
  return candidates[0]
}

/**
 * @param {object} opts
 *  duration (min), players (int), ageGroup (id),
 *  equipment [ids], focus [ids], favourites [drill ids]
 * @returns {blocks: [{id,type,drillId?,title,emoji,duration,startMin,blurb}]}
 */
export function buildSession(opts) {
  const ctx = buildCtx(opts)
  const total = opts.duration
  const { warmLen, coolLen, wantGame, mainBudget: initialBudget, targetDrillCount, gameMax } = computeSkeleton(total, ctx.players, ctx.ageGroup)
  const usedFocus = {}
  const usedFamily = new Set()
  const picked = new Set()
  const fixedBlocks = []

  // ---- warm-up ----
  const warmups = DRILLS.filter((d) => d.category === 'warmup')
  const wu = pickBest(warmups, ctx, usedFocus, picked, usedFamily) || warmups[1]
  picked.add(wu.id)
  usedFamily.add(wu.family)
  // NB: warm-ups deliberately don't mark focus areas as covered —
  // each chosen focus should still get a dedicated main drill.
  fixedBlocks.push({ type: 'warmup', drillId: wu.id, title: wu.name, emoji: wu.emoji, duration: warmLen, blurb: wu.blurb })

  // ---- main drills ----
  const mains = DRILLS.filter((d) => d.category === 'drill')
  let mainBudget = initialBudget
  let slots = targetDrillCount
  while (mainBudget >= 8) {
    const drill = pickBest(mains, ctx, usedFocus, picked, usedFamily)
    if (!drill) break
    picked.add(drill.id)
    usedFamily.add(drill.family)
    drill.focus.forEach((f) => { if (ctx.focus.includes(f)) usedFocus[f] = true })
    // aim for the drill's base length (leaving ≥8 min per remaining
    // slot), then clamp to the realistic range for this age group —
    // young squads get more, shorter drills instead of marathon ones
    const range = drillDurationRange(drill, ctx.ageGroup)
    let len = slots > 1 ? Math.min(Math.max(8, drill.baseDuration), mainBudget - (slots - 1) * 8) : mainBudget
    len = Math.max(Math.min(len, range.max), Math.min(range.min, mainBudget))
    len = Math.round(Math.min(len, mainBudget))
    fixedBlocks.push({ type: 'drill', drillId: drill.id, title: drill.name, emoji: drill.emoji, duration: len, blurb: drill.blurb })
    mainBudget -= len
    slots = Math.max(1, slots - 1)
  }

  // ---- game ----
  let gameChoice = null
  if (wantGame) {
    const games = DRILLS.filter((d) => d.category === 'game')
    const game = pickBest(games, ctx, usedFocus, picked, usedFamily) || games[0]
    picked.add(game.id)
    usedFamily.add(game.family)
    gameChoice = { drillId: game.id, title: game.name, emoji: game.emoji, blurb: game.blurb }
  }

  // ---- cool-down ----
  const cools = DRILLS.filter((d) => d.category === 'cooldown')
  const cd = pickBest(cools, ctx, usedFocus, picked, usedFamily) || cools[0]
  const cooldownChoice = { drillId: cd.id, title: cd.name, emoji: cd.emoji, blurb: cd.blurb }

  const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, coolLen, gameMax)
  return { blocks, totalPlanned, request: { ...opts } }
}

export const BLOCK_STYLE = {
  warmup: { bg: 'var(--amber-100)', label: 'Warm-up' },
  drill: { bg: 'var(--green-100)', label: 'Drill' },
  game: { bg: 'var(--coral-100)', label: 'Game' },
  break: { bg: 'var(--blue-100)', label: 'Break' },
  cooldown: { bg: 'var(--blue-100)', label: 'Cool-down' },
}

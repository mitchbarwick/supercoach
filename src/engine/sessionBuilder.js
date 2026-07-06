// ============================================================
// Rule-based session assembler.
// Takes what the coach has (time, players, positions, kit,
// focus areas) and produces a fully timed plan from warm-up
// to cool-down, with drink breaks factored in.
// Favourited drills are preferred whenever they fit.
// ============================================================
import { DRILLS, FOCUS_AREAS } from '../data/drills.js'

const BREAK_EVERY_MIN = 18 // activity minutes between drink breaks
const BREAK_LEN = 3
const ALL_POSITIONS = { forwards: true, midfield: true, defence: true, goalkeeper: true }

export function fits(drill, ctx) {
  // equipment: every required item must be available
  if (!drill.equipment.every((e) => ctx.equipment.includes(e))) return false
  if (ctx.players < drill.players.min) return false
  if (drill.needsPositions?.some((p) => !ctx.positions[p])) return false
  return true
}

export function buildCtx(opts) {
  return {
    players: opts.players,
    ageGroup: opts.ageGroup,
    positions: opts.positions || ALL_POSITIONS,
    equipment: opts.equipment || [],
    // "Anything" (empty focus) puts every tag on equal footing rather than
    // secretly favouring teamwork — the pool is then shaped only by hard
    // constraints, favourites, and position preference.
    focus: opts.focus?.length ? opts.focus : FOCUS_AREAS.map((f) => f.id),
    favourites: opts.favourites || [],
  }
}

export function computeSkeleton(total, players) {
  const warmLen = total <= 45 ? Math.max(6, Math.round(total * 0.15)) : 10
  const coolLen = total <= 45 ? 5 : 6
  const wantGame = total >= 35 && players >= 6
  const gameLen = wantGame ? Math.max(10, Math.round(total * 0.25)) : 0
  let mainBudget = total - warmLen - coolLen - gameLen
  const expectedBreaks = Math.floor((mainBudget + gameLen) / (BREAK_EVERY_MIN + BREAK_LEN))
  mainBudget -= expectedBreaks * BREAK_LEN
  const targetDrillCount = Math.max(2, Math.min(4, Math.floor(mainBudget / 10)))
  return { warmLen, coolLen, wantGame, gameLen, mainBudget, targetDrillCount }
}

/**
 * Assembles a fully timed session from already-decided content (drill
 * choices + durations/blurbs). Shared by the rule-based engine and the
 * AI session designer so break-insertion/startMin logic never diverges.
 * Game and cool-down durations are always computed as "remaining time"
 * here, regardless of who chose the drill, so the total always matches
 * the requested session length.
 */
export function assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, coolLen) {
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
    push({ type: 'game', duration: Math.max(8, len), ...gameChoice })
  }

  const coolActual = Math.max(4, total - cursor)
  push({ type: 'cooldown', duration: coolActual, ...cooldownChoice })

  return { blocks, totalPlanned: cursor }
}

function scoreDrill(drill, ctx, usedFocus) {
  let s = 0
  for (const f of drill.focus) {
    if (ctx.focus.includes(f)) s += usedFocus[f] ? 4 : 10 // unseen focus areas first
  }
  if (ctx.favourites.includes(drill.id)) s += 6
  for (const p of drill.preferredPositions || []) {
    if (ctx.positions[p]) s += 5 // skews toward drills suited to who actually showed up
  }
  if (ctx.players > drill.players.max) s -= 3 // usable via multiple groups, slightly penalised
  s += Math.random() * 2 // gentle variety between sessions
  return s
}

function pickBest(pool, ctx, usedFocus, picked) {
  const candidates = pool.filter((d) => !picked.has(d.id) && fits(d, ctx))
  if (!candidates.length) return null
  candidates.sort((a, b) => scoreDrill(b, ctx, usedFocus) - scoreDrill(a, ctx, usedFocus))
  return candidates[0]
}

/**
 * @param {object} opts
 *  duration (min), players (int), ageGroup (id),
 *  positions {forwards, midfield, defence, goalkeeper},
 *  equipment [ids], focus [ids], favourites [drill ids]
 * @returns {blocks: [{id,type,drillId?,title,emoji,duration,startMin,blurb}]}
 */
export function buildSession(opts) {
  const ctx = buildCtx(opts)
  const total = opts.duration
  const { warmLen, coolLen, wantGame, mainBudget: initialBudget, targetDrillCount } = computeSkeleton(total, ctx.players)
  const usedFocus = {}
  const picked = new Set()
  const fixedBlocks = []

  // ---- warm-up ----
  const warmups = DRILLS.filter((d) => d.category === 'warmup')
  const wu = pickBest(warmups, ctx, usedFocus, picked) || warmups[1]
  picked.add(wu.id)
  // NB: warm-ups deliberately don't mark focus areas as covered —
  // each chosen focus should still get a dedicated main drill.
  fixedBlocks.push({ type: 'warmup', drillId: wu.id, title: wu.name, emoji: wu.emoji, duration: warmLen, blurb: wu.blurb })

  // ---- main drills ----
  const mains = DRILLS.filter((d) => d.category === 'drill')
  let mainBudget = initialBudget
  let slots = targetDrillCount
  while (slots > 0 && mainBudget >= 8) {
    const drill = pickBest(mains, ctx, usedFocus, picked)
    if (!drill) break
    picked.add(drill.id)
    drill.focus.forEach((f) => { if (ctx.focus.includes(f)) usedFocus[f] = true })
    let len = slots === 1 ? mainBudget : Math.min(Math.max(8, drill.baseDuration), mainBudget - (slots - 1) * 8)
    len = Math.round(len)
    fixedBlocks.push({ type: 'drill', drillId: drill.id, title: drill.name, emoji: drill.emoji, duration: len, blurb: drill.blurb })
    mainBudget -= len
    slots -= 1
  }

  // ---- game ----
  let gameChoice = null
  if (wantGame) {
    const games = DRILLS.filter((d) => d.category === 'game')
    const game = pickBest(games, ctx, usedFocus, picked) || games[0]
    picked.add(game.id)
    gameChoice = { drillId: game.id, title: game.name, emoji: game.emoji, blurb: game.blurb }
  }

  // ---- cool-down ----
  const cools = DRILLS.filter((d) => d.category === 'cooldown')
  const cd = pickBest(cools, ctx, usedFocus, picked) || cools[0]
  const cooldownChoice = { drillId: cd.id, title: cd.name, emoji: cd.emoji, blurb: cd.blurb }

  const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, coolLen)
  return { blocks, totalPlanned, request: { ...opts } }
}

export const BLOCK_STYLE = {
  warmup: { bg: 'var(--amber-100)', label: 'Warm-up' },
  drill: { bg: 'var(--green-100)', label: 'Drill' },
  game: { bg: 'var(--coral-100)', label: 'Game' },
  break: { bg: 'var(--blue-100)', label: 'Break' },
  cooldown: { bg: 'var(--blue-100)', label: 'Cool-down' },
}

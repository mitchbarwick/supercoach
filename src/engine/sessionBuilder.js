// ============================================================
// Rule-based session assembler.
// Takes what the coach has (time, players, kit, focus areas)
// and produces a fully timed plan from warm-up to cool-down,
// with drink breaks factored in.
// Favourited drills are preferred whenever they fit.
// ============================================================
import { DRILLS, FOCUS_AREAS, AGE_BLOCK_CAPS, drillDurationRange, drillSuitsAge, drillsClash, getDrill, drillStyle, sameStyle } from '../data/drills.js'

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
  // Age suitability: don't hand complex drills to little players or baby
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

// ---- Session shape ---------------------------------------------------
// Every session follows the same five-part pattern, for every age group:
//
//   1. warm-up      — injury-prevention / movement prep
//   2. fun game     — straight into a game, energy up
//   3. hard work    — the main drill(s), where the focus areas are coached
//   4. fun game     — the closing game, "let them play"
//   5. cool-down    — only when there's time for one
//
// Games drop out only when the squad/kit can't support them (closing game
// is kept before the opening one); the cool-down drops out for short
// sessions so the warm-up, both games and the hard work keep their minutes.
const COOLDOWN_MIN_SESSION = 40 // sessions shorter than this skip the cool-down

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))

export function computeSkeleton(total, players, ageGroup, gamesAvailable = Infinity) {
  const caps = AGE_BLOCK_CAPS[ageGroup] || AGE_BLOCK_CAPS['U9-U11']
  const young = ageGroup === 'U6-U8' || ageGroup === 'U9-U11'

  const gamesPossible = total >= 25 && players >= 4 ? Math.min(2, gamesAvailable) : 0
  const wantGame = gamesPossible >= 1 // closing game
  let openGame = gamesPossible >= 2   // opening fun game straight after the warm-up
  let cooldown = total >= COOLDOWN_MIN_SESSION

  const warmLen = clamp(Math.round(total * 0.13), 4, caps.warmup)
  let openGameLen = 0
  let coolLen = 0
  // The closing game absorbs the session's remainder in assembleTimeline, but
  // room for it is reserved here so the hard work doesn't eat it.
  const closingReserve = wantGame
    ? (young ? clamp(Math.round(total * 0.18), 8, caps.game) : clamp(Math.round(total * 0.2), 10, caps.game))
    : 0

  const minDrill = young ? 6 : 8
  const drillSlot = Math.min(10, caps.drill) // ~one main drill's worth of minutes
  const countCap = young ? 6 : 4 // young squads: more, shorter drills rather than an over-long closing game

  const budget = () => {
    openGameLen = openGame ? clamp(Math.round(total * 0.14), 5, caps.game) : 0
    coolLen = cooldown ? Math.min(total <= 50 ? 5 : 6, caps.cooldown) : 0
    let mb = total - warmLen - openGameLen - closingReserve - coolLen
    // Drink breaks fall between blocks up to the closing game (which runs
    // unbroken), so only that stretch of the session is budgeted for them.
    const act = warmLen + openGameLen + Math.max(0, mb)
    mb -= Math.floor(act / (BREAK_EVERY_MIN + BREAK_LEN)) * BREAK_LEN
    return Math.max(0, mb)
  }
  // Fit the drill count to the budget so the hard-work block actually fills
  // its share — otherwise leftover minutes spill into the closing game.
  const drillCount = (mb) => {
    const maxFit = Math.max(0, Math.floor(mb / minDrill))
    const raw = young ? Math.round(mb / drillSlot) : Math.floor(mb / drillSlot)
    return Math.max(mb >= minDrill ? 1 : 0, Math.min(countCap, maxFit, raw))
  }

  let mainBudget = budget()
  let targetDrillCount = drillCount(mainBudget)
  // The hard work is the point of the session — if it doesn't fit, give up
  // the cool-down first, then the opening game, to make room for it.
  if (targetDrillCount < 1 && cooldown) { cooldown = false; mainBudget = budget(); targetDrillCount = drillCount(mainBudget) }
  if (targetDrillCount < 1 && openGame) { openGame = false; mainBudget = budget(); targetDrillCount = drillCount(mainBudget) }

  return {
    total, players, ageGroup,
    warmLen, openGame, openGameLen, wantGame, gameLen: closingReserve,
    cooldown, coolLen, mainBudget, targetDrillCount,
    gameMax: caps.game, drillMax: caps.drill, minDrill,
  }
}

// The ordered block roles a session contains, e.g.
// ['warmup','game','drill','drill','game','cooldown'].
// The single source of truth for block sequence, shared by the rule-based
// builder, the AI designer's prompt, and its validator so all three agree.
// The first 'game' (when there are two) is the opening fun game; a 'game'
// that is the last activity is the closing game (absorbs remainder).
export function sessionRoles(skeleton) {
  const roles = ['warmup']
  if (skeleton.openGame) roles.push('game')
  for (let i = 0; i < skeleton.targetDrillCount; i++) roles.push('drill')
  if (skeleton.wantGame) roles.push('game')
  if (skeleton.cooldown) roles.push('cooldown')
  return roles
}

// Re-fit a skeleton to the number of distinct games this setup can supply
// (drops the opening game first, then the closing one) so a setup with few
// or no games still yields a valid, buildable session.
export function resolveShape(sk, gamesAvailable) {
  return computeSkeleton(sk.total, sk.players, sk.ageGroup, gamesAvailable)
}

/**
 * Assembles a fully timed session from already-decided content (drill
 * choices + durations/blurbs). Shared by the rule-based engine and the
 * AI session designer so break-insertion/startMin logic never diverges.
 * The closing game (and cool-down, when there is one) are sized as
 * "remaining time" here, so the total always matches the requested length.
 * Pass cooldownChoice = null for a session with no cool-down.
 */
export function assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, coolLen, gameMax = Infinity) {
  const blocks = []
  let cursor = 0
  let sinceBreak = 0
  const coolRes = cooldownChoice ? coolLen : 0

  const push = (block) => {
    blocks.push({ ...block, startMin: cursor, id: `${block.type}-${blocks.length}` })
    cursor += block.duration
    if (block.type !== 'break') sinceBreak += block.duration
  }
  const maybeBreak = (remainingAfter) => {
    // never squeeze a break in where it would cut the closing game short
    if (sinceBreak >= BREAK_EVERY_MIN && remainingAfter >= BREAK_LEN + (gameChoice ? 8 : 4)) {
      push({ type: 'break', title: 'Drink break', emoji: '💧', duration: BREAK_LEN, blurb: 'Water, breathe, quick praise for what you\'ve seen so far.' })
      sinceBreak = 0
    }
  }

  for (const block of fixedBlocks) {
    push(block)
    if (block.type !== 'warmup') maybeBreak(total - cursor - coolRes)
  }

  if (gameChoice) {
    if (sinceBreak >= BREAK_EVERY_MIN && total - cursor - coolRes >= BREAK_LEN + 8) {
      push({ type: 'break', title: 'Drink break', emoji: '💧', duration: BREAK_LEN, blurb: 'Water, breathe, quick praise for what you\'ve seen so far.' })
      sinceBreak = 0
    }
    // The closing game is the session's flexible "let them play" finale: it
    // absorbs the remaining time so the cool-down stays at its planned
    // (age-capped) length — or, with no cool-down, runs to the final whistle.
    void gameMax
    const len = Math.max(8, total - cursor - coolRes)
    push({ type: 'game', duration: len, ...gameChoice })
  }

  if (cooldownChoice) {
    const coolActual = Math.max(3, total - cursor)
    push({ type: 'cooldown', duration: coolActual, ...cooldownChoice })
  }

  return { blocks, totalPlanned: cursor }
}

function scoreDrill(drill, ctx, usedFocus, usedFamily, usedStyle) {
  let focusScore = 0
  for (const f of drill.focus) {
    if (ctx.focus.includes(f)) focusScore += usedFocus[f] ? 4 : 10 // unseen focus areas first
  }
  // Cap the focus contribution so a drill isn't favoured just for carrying
  // more tags — especially in "anything" mode where every focus counts.
  let s = Math.min(focusScore, 14)
  const fav = ctx.favourites.includes(drill.id)
  if (fav) s += 6
  // Injury-prevention (FIFA 11+-style) warm-ups are the squad's *standard*
  // warm-up: the bonus outweighs any focus match so they win the warm-up
  // slot, while staying below a focus-matched favourite.
  if (drill.injuryPrevention) s += 18
  // Similarity: a drill from a family we've already used this session is
  // a repeat of the same challenge — nudge towards something different.
  if (usedFamily?.has(drill.family)) s -= 7
  // Style: a session should feel like a run of DIFFERENT activities, not
  // the same format re-skinned. (Back-to-back repeats are filtered out in
  // pickBest; this soft penalty spreads styles across the whole session.)
  if (usedStyle?.has(drillStyle(drill))) s -= 6
  // Recency: fade out drills the coach has seen in recent sessions so the
  // rotation spreads across the whole library over time. Favourites and the
  // standard injury-prevention warm-up get a light touch.
  const rec = ctx.recency?.[drill.id] || 0 // 0..1, 1 = used most recently
  s -= rec * (fav || drill.injuryPrevention ? 4 : 20)
  if (ctx.players > drill.players.max) s -= 3 // usable via multiple groups, slightly penalised
  // GOOD-principle bonus for young squads (goals, opponent, opportunities
  // for all, directional) — kept below the focus-match weight.
  if ((ctx.ageGroup === 'U6-U8' || ctx.ageGroup === 'U9-U11') && drill.good) {
    const goodCount = ['goals', 'opponent', 'opportunities', 'directional'].filter((k) => drill.good[k]).length
    s += goodCount * 2
  }
  s += Math.random() * 3 // gentle variety between otherwise-tied drills
  return s
}

// `prev` is the activity block placed immediately before this one. Hard
// rules: never repeat a drill, never pair avoidWith twins, and — whenever
// any alternative exists — never run two same-style activities back to back.
function pickBest(pool, ctx, usedFocus, picked, usedFamily, usedStyle, prev) {
  const pickedDrills = [...picked].map(getDrill).filter(Boolean)
  const candidates = pool.filter((d) =>
    !picked.has(d.id) && fits(d, ctx) && !pickedDrills.some((p) => drillsClash(p, d)))
  if (!candidates.length) return null
  const varied = prev ? candidates.filter((d) => !sameStyle(d, prev)) : candidates
  const options = varied.length ? varied : candidates
  const scored = options.map((d) => [d, scoreDrill(d, ctx, usedFocus, usedFamily, usedStyle)])
  scored.sort((a, b) => b[1] - a[1])
  return scored[0][0]
}

// Re-orders the run of 'drill' blocks in place so that, as far as possible,
// no two neighbouring activities share a style — including the blocks either
// side of the hard work (opening game before, closing game after). Leaves the
// order alone when it's already varied or no better order exists.
function orderForVariety(fixedBlocks, after) {
  const start = fixedBlocks.findIndex((b) => b.type === 'drill')
  if (start === -1) return
  let end = start
  while (end < fixedBlocks.length && fixedBlocks[end].type === 'drill') end++
  const run = fixedBlocks.slice(start, end)
  if (run.length < 2 || run.length > 7) return
  const before = start > 0 ? getDrill(fixedBlocks[start - 1].drillId) : null
  const clashes = (order) => {
    const seq = [before, ...order.map((b) => getDrill(b.drillId)), after]
    let n = 0
    for (let i = 1; i < seq.length; i++) if (sameStyle(seq[i - 1], seq[i])) n++
    return n
  }
  let best = run
  let bestScore = clashes(run)
  if (bestScore === 0) return
  const permute = (arr, k = 0) => {
    if (bestScore === 0) return
    if (k === arr.length) {
      const sc = clashes(arr)
      if (sc < bestScore) { bestScore = sc; best = [...arr] }
      return
    }
    for (let i = k; i < arr.length; i++) {
      ;[arr[k], arr[i]] = [arr[i], arr[k]]
      permute(arr, k + 1)
      ;[arr[k], arr[i]] = [arr[i], arr[k]]
    }
  }
  permute([...run])
  fixedBlocks.splice(start, run.length, ...best)
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
  const gamesAvailable = DRILLS.filter((d) => d.category === 'game' && fits(d, ctx)).length
  const sk = computeSkeleton(total, ctx.players, ctx.ageGroup, gamesAvailable)
  const { warmLen, coolLen, openGame, openGameLen, wantGame, cooldown, mainBudget: initialBudget, targetDrillCount, gameMax, minDrill } = sk

  const usedFocus = {}
  const usedFamily = new Set()
  const usedStyle = new Set()
  const picked = new Set()
  const fixedBlocks = []
  let prev = null

  const take = (pool) => {
    const d = pickBest(pool, ctx, usedFocus, picked, usedFamily, usedStyle, prev)
    if (!d) return null
    picked.add(d.id)
    usedFamily.add(d.family)
    usedStyle.add(drillStyle(d))
    prev = d
    return d
  }
  const ofCategory = (c) => DRILLS.filter((d) => d.category === c)
  const block = (type, d, duration) => ({ type, drillId: d.id, title: d.name, emoji: d.emoji, duration, blurb: d.blurb })

  // ---- 1. warm-up ----
  // NB: warm-ups deliberately don't mark focus areas as covered — each
  // chosen focus should still get a dedicated hard-work drill.
  const warmups = ofCategory('warmup')
  const wu = take(warmups) || warmups.find((d) => d.injuryPrevention) || warmups[0]
  if (!picked.has(wu.id)) { picked.add(wu.id); usedFamily.add(wu.family); usedStyle.add(drillStyle(wu)); prev = wu }
  fixedBlocks.push(block('warmup', wu, warmLen))

  // ---- 2. opening fun game ----
  if (openGame) {
    const g = take(ofCategory('game'))
    if (g) fixedBlocks.push(block('game', g, openGameLen))
  }

  // ---- 3. hard work ----
  const mains = ofCategory('drill')
  let mainBudget = initialBudget
  let slots = targetDrillCount
  let placed = 0
  while (mainBudget >= minDrill && placed < targetDrillCount) {
    const drill = take(mains)
    if (!drill) break
    drill.focus.forEach((f) => { if (ctx.focus.includes(f)) usedFocus[f] = true })
    // aim for the drill's base length (leaving ≥minDrill per remaining
    // slot), then clamp to the realistic range for this age group
    const range = drillDurationRange(drill, ctx.ageGroup)
    let len = slots > 1 ? Math.min(Math.max(minDrill, drill.baseDuration), mainBudget - (slots - 1) * minDrill) : mainBudget
    len = Math.max(Math.min(len, range.max), Math.min(range.min, mainBudget))
    len = Math.round(Math.min(len, mainBudget))
    fixedBlocks.push(block('drill', drill, len))
    mainBudget -= len
    slots = Math.max(1, slots - 1)
    placed += 1
  }

  // ---- 4. closing fun game (absorbs the session's remaining time) ----
  // (picked before the hard work is finalised so the drill order below can
  // keep its last drill a different style from this game)
  let gameChoice = null
  if (wantGame) {
    const g = take(ofCategory('game'))
    if (g) gameChoice = { drillId: g.id, title: g.name, emoji: g.emoji, blurb: g.blurb }
  }

  // Greedy picking can corner itself (e.g. a small squad with only finishing
  // drills left), so re-order the hard-work drills to keep same-style
  // activities apart wherever any ordering allows it.
  orderForVariety(fixedBlocks, gameChoice && getDrill(gameChoice.drillId))

  // ---- 5. cool-down, if there's time (or nothing else can close) ----
  let cooldownChoice = null
  if (cooldown || !gameChoice) {
    const cools = ofCategory('cooldown')
    const cd = take(cools) || cools[0]
    cooldownChoice = { drillId: cd.id, title: cd.name, emoji: cd.emoji, blurb: cd.blurb }
  }

  const { blocks, totalPlanned } = assembleTimeline(fixedBlocks, gameChoice, cooldownChoice, total, cooldownChoice ? (coolLen || 3) : 0, gameMax)
  return { blocks, totalPlanned, request: { ...opts } }
}

export const BLOCK_STYLE = {
  warmup: { bg: 'var(--amber-100)', label: 'Warm-up' },
  drill: { bg: 'var(--green-100)', label: 'Hard work' },
  game: { bg: 'var(--coral-100)', label: 'Fun game' },
  break: { bg: 'var(--blue-100)', label: 'Break' },
  cooldown: { bg: 'var(--blue-100)', label: 'Cool-down' },
}
// end sessionBuilder

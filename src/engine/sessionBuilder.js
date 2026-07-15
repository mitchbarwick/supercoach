// ============================================================
// Rule-based session assembler.
// Takes what the coach has (time, players, kit, focus areas)
// and produces a fully timed plan from warm-up to cool-down,
// with drink breaks factored in.
// Favourited drills are preferred whenever they fit.
// ============================================================
import { DRILLS, FOCUS_AREAS, AGE_BLOCK_CAPS, drillDurationRange, drillSuitsAge, drillsClash, getDrill } from '../data/drills.js'

const BREAK_EVERY_MIN = 18 // activity minutes between drink breaks
const BREAK_LEN = 3
// (touch: game-bookended session shape)

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

export function computeSkeleton(total, players, ageGroup) {
  const caps = AGE_BLOCK_CAPS[ageGroup] || AGE_BLOCK_CAPS['U9-U11']
  const young = ageGroup === 'U6-U8' || ageGroup === 'U9-U11'
  // When time is tight the warm-up wins over the cool-down: short sessions
  // trim the cool-down to its 3-minute floor so the injury-prevention
  // warm-up always keeps its slot — cold muscles at kick-off are a bigger
  // risk than a brisk wind-down at the end.
  const coolLen = Math.min(total < 35 ? 3 : total <= 45 ? 5 : 6, caps.cooldown)

  // Relaxed game gate. The Gamesology framework (good-training-session.md)
  // wants games to bookend every session — yet the old gate (>=35 min AND
  // >=6 players) gave the youngest, shortest sessions zero games, the exact
  // inverse of the guide. Now: any session that's long enough to be worth it,
  // with enough players to form a small-sided game, gets one.
  const wantGame = total >= 25 && players >= 4

  // Young squads open (and, for the youngest, split) on a short small-sided
  // game rather than a technical warm-up; older squads keep the warm-up-first
  // shape. `warmLen` is always computed as the fallback used if no game fits.
  const openWithGame = young && wantGame
  const warmup = !openWithGame
  const shortBlock = Math.min(caps.game, Math.max(6, Math.round(total * 0.15)))
  const warmLen = Math.min(total <= 45 ? Math.max(6, Math.round(total * 0.15)) : 10, caps.warmup)
  const arrivalLen = openWithGame ? shortBlock : 0
  // Game-open sessions always open on a short movement-prep block (a
  // lightened FIFA 11+-style warm-up) BEFORE the arrival game —
  // injury-prevention work comes first, every time, then the kids get their
  // game. Short sessions shorten the prep rather than dropping it: the
  // warm-up outranks the cool-down when minutes are scarce.
  const prepLen = openWithGame ? Math.min(total < 35 ? 4 : 5, caps.warmup) : 0
  const gameMax = caps.game

  // The closing game absorbs the session's remainder in assembleTimeline, but
  // we must still reserve room for it here so the main drills don't eat it.
  const closingReserve = wantGame
    ? (young ? Math.max(8, shortBlock) : Math.min(gameMax, Math.max(10, Math.round(total * 0.25))))
    : 0
  const openLen = openWithGame ? arrivalLen + prepLen : (warmup ? warmLen : 0)

  // Mid-session game (youngest only) — only kept if there are >=2 drills for
  // it to separate; otherwise its minutes go back to the main drills.
  let midGame = ageGroup === 'U6-U8' && wantGame && total >= 34
  let midLen = midGame ? shortBlock : 0

  const drillSlot = Math.min(10, caps.drill) // ~one main drill's worth of minutes
  const budgetAfter = (mid) => {
    let mb = total - openLen - (mid ? midLen : 0) - closingReserve - coolLen
    const act = openLen + (mid ? midLen : 0) + closingReserve + Math.max(0, mb)
    mb -= Math.floor(act / (BREAK_EVERY_MIN + BREAK_LEN)) * BREAK_LEN
    return Math.max(0, mb)
  }
  const minDrill = young ? 6 : 8
  const countCap = 4
  // Fit the drill count to the budget so the main block actually fills its
  // share — otherwise leftover minutes spill into the closing game. `maxFit`
  // caps at the number of minimum-length drills that genuinely fit; young
  // squads round (their small drill cap means a budget just over a multiple
  // should still add a drill), older squads floor (unchanged behaviour).
  const drillCount = (mb) => {
    const maxFit = Math.max(0, Math.floor(mb / minDrill))
    const raw = young ? Math.round(mb / drillSlot) : Math.floor(mb / drillSlot)
    const floor = young ? (mb >= minDrill ? 1 : 0) : Math.min(2, maxFit)
    return Math.max(floor, Math.min(countCap, maxFit, raw))
  }

  let mainBudget = budgetAfter(midGame)
  let targetDrillCount = drillCount(mainBudget)
  if (midGame && targetDrillCount < 2) {
    midGame = false
    midLen = 0
    mainBudget = budgetAfter(false)
    targetDrillCount = drillCount(mainBudget)
  }

  return {
    warmLen, coolLen, wantGame, openWithGame, midGame, warmup,
    arrivalLen, prepLen, midLen, gameLen: closingReserve, mainBudget,
    targetDrillCount, gameMax, drillMax: caps.drill, minDrill,
  }
}

// The ordered block roles a session should contain, e.g.
// ['warmup','game','drill','drill','game','cooldown'] for a young squad or
// ['warmup','drill','drill','game','cooldown'] for an older one.
// The single source of truth for block sequence, shared by the rule-based
// builder, the AI designer's prompt, and its validator so all three agree.
// For a game-open session, a leading 'warmup' is the short injury-prevention
// movement prep and the first 'game' is the arrival game; a 'game'
// immediately before the final 'cooldown' is the closing game (the one that
// absorbs remainder); any other mid-list 'game' is the mid-session game.
export function sessionRoles(skeleton) {
  const roles = []
  if (skeleton.openWithGame && skeleton.prepLen > 0) roles.push('warmup')
  roles.push(skeleton.openWithGame ? 'game' : 'warmup')
  const n = skeleton.targetDrillCount
  const splitAt = skeleton.midGame && n >= 2 ? Math.ceil(n / 2) : -1
  for (let i = 0; i < n; i++) {
    roles.push('drill')
    if (i === splitAt - 1) roles.push('game')
  }
  if (skeleton.wantGame) roles.push('game')
  roles.push('cooldown')
  return roles
}

// Downgrade a skeleton's game shape to what the available game pool can
// actually supply (distinct games). Drops the mid game first, then the
// arrival game (reverting to a warm-up open), then the closing game — so a
// setup with few or no games still yields a valid, buildable session.
// `warmupsAvailable` likewise drops the post-arrival-game prep block when
// no warm-up drill fits today's setup (its minutes flow to the closing game).
export function resolveShape(sk, gamesAvailable, warmupsAvailable = 1) {
  let { openWithGame, midGame, wantGame, warmup, arrivalLen, prepLen, midLen } = sk
  const need = () => (openWithGame ? 1 : 0) + (midGame ? 1 : 0) + (wantGame ? 1 : 0)
  if (gamesAvailable < need() && midGame) { midGame = false; midLen = 0 }
  if (gamesAvailable < need() && openWithGame) { openWithGame = false; warmup = true; arrivalLen = 0; prepLen = 0 }
  if (gamesAvailable < need() && wantGame) { wantGame = false }
  if (openWithGame && warmupsAvailable < 1) { prepLen = 0 }
  return { ...sk, openWithGame, midGame, wantGame, warmup, arrivalLen, prepLen, midLen }
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
    // The closing game is the session's flexible "let them play" finale: it
    // absorbs the remaining time so the cool-down stays at its planned
    // (age-capped) length rather than ballooning into an over-long wind-down.
    // A small-sided game may run a little long — an over-long cool-down
    // shouldn't. (gameMax is retained for callers/back-compat.)
    void gameMax
    const len = Math.max(8, total - cursor - coolLen)
    push({ type: 'game', duration: len, ...gameChoice })
  }

  // 3-minute floor: short sessions deliberately run a trimmed cool-down so
  // the warm-up keeps its minutes (warm-up > cool-down under time pressure).
  const coolActual = Math.max(3, total - cursor)
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
  // Injury-prevention (FIFA 11+-style) warm-ups are the squad's *standard*
  // warm-up: the bonus outweighs any focus match (capped at 14) so they win
  // the warm-up slot regardless of the session's chosen focus, while staying
  // below a focus-matched favourite (14+6) so a favourited warm-up can still
  // rotate in occasionally.
  if (drill.injuryPrevention) s += 18
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
  // coach's explicit "show me this one more often" signal — and the standard
  // injury-prevention warm-up gets the same light touch, since a prevention
  // routine only works when it's repeated session after session.
  const rec = ctx.recency?.[drill.id] || 0 // 0..1, 1 = used most recently
  s -= rec * (fav || drill.injuryPrevention ? 4 : 20)
  if (ctx.players > drill.players.max) s -= 3 // usable via multiple groups, slightly penalised
  // GOOD-principle bonus for young squads: complete-GOOD drills (goals,
  // opponent, opportunities for all, directional) give young players more
  // game-realistic engagement than static reps, so nudge the builder
  // towards them — but keep it below the focus-match weight (max 14)
  // so covering the requested focus areas still dominates the pick.
  if ((ctx.ageGroup === 'U6-U8' || ctx.ageGroup === 'U9-U11') && drill.good) {
    const goodCount = ['goals', 'opponent', 'opportunities', 'directional'].filter((k) => drill.good[k]).length
    s += goodCount * 2
  }
  s += Math.random() * 3 // gentle variety between otherwise-tied drills
  return s
}

function pickBest(pool, ctx, usedFocus, picked, usedFamily) {
  // Hard rule: never pair drills that declare each other in `avoidWith` —
  // they're the same game under different names (Sharks & Minnows vs King
  // of the Ring), so one plan should only ever contain one of them.
  const pickedDrills = [...picked].map(getDrill).filter(Boolean)
  const candidates = pool.filter((d) =>
    !picked.has(d.id) && fits(d, ctx) && !pickedDrills.some((p) => drillsClash(p, d)))
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
  const games = DRILLS.filter((d) => d.category === 'game' && fits(d, ctx))
  const warmupsAvailable = DRILLS.filter((d) => d.category === 'warmup' && fits(d, ctx)).length
  const sk = resolveShape(computeSkeleton(total, ctx.players, ctx.ageGroup), games.length, warmupsAvailable)
  const { warmLen, coolLen, wantGame, openWithGame, midGame, arrivalLen, prepLen, midLen, mainBudget: initialBudget, targetDrillCount, gameMax, minDrill } = sk

  const usedFocus = {}
  const usedFamily = new Set()
  const picked = new Set()
  const fixedBlocks = []

  const pickGame = () => {
    const g = pickBest(DRILLS.filter((d) => d.category === 'game'), ctx, usedFocus, picked, usedFamily)
    if (!g) return null
    picked.add(g.id)
    usedFamily.add(g.family)
    return g
  }

  // ---- opening: arrival game (young) or warm-up (older) ----
  // The Gamesology framework bookends the session with games; young squads
  // therefore open on a short small-sided game instead of a technical drill.
  if (openWithGame) {
    // Short movement-prep block opens the session — the young squad's dose
    // of the FIFA 11+-style routine (the injuryPrevention score bonus means
    // that's what usually gets picked here) — then the arrival game.
    if (prepLen > 0) {
      const warmups = DRILLS.filter((d) => d.category === 'warmup')
      const prep = pickBest(warmups, ctx, usedFocus, picked, usedFamily)
      if (prep) {
        picked.add(prep.id)
        usedFamily.add(prep.family)
        fixedBlocks.push({ type: 'warmup', drillId: prep.id, title: prep.name, emoji: prep.emoji, duration: prepLen, blurb: prep.blurb })
      }
    }
    const ag = pickGame()
    if (ag) {
      fixedBlocks.push({ type: 'game', drillId: ag.id, title: ag.name, emoji: ag.emoji, duration: arrivalLen, blurb: ag.blurb })
    }
  }
  if (!fixedBlocks.length) {
    // warm-up open (older squads, or young squads with no game available)
    const warmups = DRILLS.filter((d) => d.category === 'warmup')
    const wu = pickBest(warmups, ctx, usedFocus, picked, usedFamily) || warmups[1]
    picked.add(wu.id)
    usedFamily.add(wu.family)
    // NB: warm-ups deliberately don't mark focus areas as covered —
    // each chosen focus should still get a dedicated main drill.
    fixedBlocks.push({ type: 'warmup', drillId: wu.id, title: wu.name, emoji: wu.emoji, duration: warmLen, blurb: wu.blurb })
  }

  // ---- main drills (with an optional mid-session game splitting them) ----
  const mains = DRILLS.filter((d) => d.category === 'drill')
  const splitAfter = midGame && targetDrillCount >= 2 ? Math.ceil(targetDrillCount / 2) : -1
  let mainBudget = initialBudget
  let slots = targetDrillCount
  let placed = 0
  while (mainBudget >= minDrill && placed < targetDrillCount) {
    const drill = pickBest(mains, ctx, usedFocus, picked, usedFamily)
    if (!drill) break
    picked.add(drill.id)
    usedFamily.add(drill.family)
    drill.focus.forEach((f) => { if (ctx.focus.includes(f)) usedFocus[f] = true })
    // aim for the drill's base length (leaving ≥minDrill per remaining
    // slot), then clamp to the realistic range for this age group —
    // young squads get more, shorter drills instead of marathon ones
    const range = drillDurationRange(drill, ctx.ageGroup)
    let len = slots > 1 ? Math.min(Math.max(minDrill, drill.baseDuration), mainBudget - (slots - 1) * minDrill) : mainBudget
    len = Math.max(Math.min(len, range.max), Math.min(range.min, mainBudget))
    len = Math.round(Math.min(len, mainBudget))
    fixedBlocks.push({ type: 'drill', drillId: drill.id, title: drill.name, emoji: drill.emoji, duration: len, blurb: drill.blurb })
    mainBudget -= len
    slots = Math.max(1, slots - 1)
    placed += 1
    // mid-session game to separate the main drills (youngest squads)
    if (placed === splitAfter) {
      const mg = pickGame()
      if (mg) {
        fixedBlocks.push({ type: 'game', drillId: mg.id, title: mg.name, emoji: mg.emoji, duration: midLen, blurb: mg.blurb })
      }
    }
  }

  // ---- closing game (absorbs the session's remaining time) ----
  let gameChoice = null
  if (wantGame) {
    const game = pickGame()
    if (game) {
      gameChoice = { drillId: game.id, title: game.name, emoji: game.emoji, blurb: game.blurb }
    }
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
// end sessionBuilder

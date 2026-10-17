// "End of session" finale for the session-complete card
// (src/components/SessionCelebration.jsx). NOT a drill: it plays ONCE
// and holds on the last frame.
//
// The story: the players (team colour from Settings) collect the cones
// and bring them back to the coach, thank the coach and bounce about,
// the coach says "See you next time!", then everyone runs back to their
// parents on the far touchline, who thank the coach too.
//
// Cones are NOT field kit here: the component draws them in a layer over
// the scene so they can be picked up, carried and stacked. The cone
// pick-ups below must therefore line up with these runs — each player
// arrives at a cone at the END of a beat (runs fill their beat).
import { scene, beat, player, coach, run, shout } from '../../anim/script.js'

const hop = (who, at, opts = {}) => run(who, at, { bounce: 3, bounceH: 2, dur: 1.4, ...opts })

// Where things are
export const COACH_AT = [40, 30]
export const STACK_AT = [40, 35.6]
const HUDDLE = { p7: [33, 26], p10: [47, 26], p9: [33, 35], p4: [47, 35] }
// Parents wait along the far touchline; each child runs to stand in
// front of their own grown-up (bubbles pop up above the parents).
const PARENTS = { m1: [54, 13], m2: [67, 13], m3: [80, 13], m4: [93, 13] }
const HOME = { p9: [54, 19.5], p7: [67, 19.5], p4: [80, 19.5], p10: [93, 19.5] }

// Cone pick-ups for the overlay: who collects which cone, at the end of
// which beat they reach it, and the beat they reach the coach (drop).
export const CONE_RUNS = [
  { at: [18, 12], who: 'p7', pick: 1, drop: 3 },
  { at: [40, 8], who: 'p7', pick: 2, drop: 3 },
  { at: [62, 25], who: 'p10', pick: 1, drop: 2 },
  { at: [18, 46], who: 'p9', pick: 1, drop: 3 },
  { at: [40, 51], who: 'p9', pick: 2, drop: 3 },
  { at: [62, 46], who: 'p4', pick: 1, drop: 2 },
]
// Beat at which the coach says goodbye — the scoreboard lands here.
export const GOODBYE_BEAT = 5

export const CELEBRATION = scene({
  area: null,
  trails: false,
  loop: 'cut',
  cast: {
    p7: player('a', '7', 24, 18, { face: [18, 12] }),
    p10: player('a', '10', 55, 20, { face: [62, 25] }),
    p9: player('a', '9', 24, 41, { face: [18, 46] }),
    p4: player('a', '4', 56, 42, { face: [62, 46] }),
    c: coach(...COACH_AT, { face: [40, 0] }),
    m1: player('x', '♥', ...PARENTS.m1, { face: [40, 30] }),
    m2: player('x', '♥', ...PARENTS.m2, { face: [40, 30] }),
    m3: player('x', '♥', ...PARENTS.m3, { face: [40, 30] }),
    m4: player('x', '♥', ...PARENTS.m4, { face: [40, 30] }),
  },
  balls: {},
  beats: [
    beat(0.3),
    // 1 — everyone grabs the nearest cone
    beat(1.0,
      run('p7', [18, 12], { pace: 'jog' }),
      run('p10', [62, 25], { pace: 'jog' }),
      run('p9', [18, 46], { pace: 'jog' }),
      run('p4', [62, 46], { pace: 'jog' }),
    ),
    // 2 — 7 and 9 fetch a second one; 10 and 4 bring theirs in
    beat(1.1,
      run('p7', [40, 8]),
      run('p9', [40, 51]),
      run('p10', HUDDLE.p10),
      run('p4', HUDDLE.p4),
    ),
    // 3 — the last cones come back to the coach
    beat(1.0,
      run('p7', HUDDLE.p7),
      run('p9', HUDDLE.p9),
    ),
    // 4 — thank the coach, bounce about
    beat(1.6,
      hop('p7', HUDDLE.p7),
      hop('p10', HUDDLE.p10, { delay: 0.1 }),
      hop('p9', HUDDLE.p9, { delay: 0.2 }),
      hop('p4', HUDDLE.p4, { delay: 0.05 }),
      shout('p10', 'Thanks coach!', { delay: 0.05, dur: 1.2 }),
      shout('p9', 'Thank you!', { delay: 0.45, dur: 1.1 }),
    ),
    // 5 — the coach waves them off
    beat(1.5,
      hop('c', COACH_AT, { bounce: 2, bounceH: 1.4, dur: 1.0 }),
      shout('c', 'See you next time!', { delay: 0.1, dur: 1.35 }),
    ),
    // 6 — back to mum and dad
    beat(1.8,
      run('p10', HOME.p10),
      run('p4', HOME.p4, { delay: 0.1 }),
      run('p7', [[38, 20.5], HOME.p7], { delay: 0.15 }),
      run('p9', [[31, 25], [44, 21], HOME.p9], { delay: 0.3 }),
    ),
    // 7 — the parents thank the coach too
    beat(3.5,
      hop('p7', HOME.p7, { bounce: 2, dur: 1.0 }),
      hop('p10', HOME.p10, { bounce: 2, dur: 1.0, delay: 0.15 }),
      hop('p9', HOME.p9, { bounce: 2, dur: 1.0, delay: 0.3 }),
      hop('p4', HOME.p4, { bounce: 2, dur: 1.0, delay: 0.1 }),
      shout('m1', 'Thanks coach!', { delay: 0.1, dur: 1.0 }),
      shout('m3', 'Great session!', { delay: 0.85, dur: 1.0 }),
      shout('m2', 'They loved it!', { delay: 1.6, dur: 1.0 }),
      shout('m4', 'See you next week!', { delay: 2.35, dur: 1.05 }),
    ),
    beat(0.3),
  ],
})

// Landing-page hero (src/components/LandingHero.jsx). NOT a drill:
// it sells the FUN of training. Two players knock a ball about —
// passes aren't always on the money so they step across for them,
// player 2 shows off some keepy-ups, and the coach bounces on the
// sideline cheering. No captions; the hero crops in on the middle
// of the pitch, so keep the action inside roughly x 24..76, y 12..44.
import { scene, beat, player, coach, run, pass, chip, juggle, shout } from '../../anim/script.js'

// The coach can't stand still: a few little hops on the spot.
const cheer = (text, opts = {}) => [
  shout('c', text, { dur: 1.2, ...opts }),
  run('c', [50, 42], { bounce: 2, bounceH: 1.6, dur: 0.9, ...opts }),
]

export const HERO = scene({
  area: null,
  trails: 'ball',
  cast: {
    p1: player('a', '1', 36, 25, { face: [64, 25] }),
    p2: player('a', '2', 64, 25, { face: [36, 25] }),
    c: coach(50, 42, { face: [50, 25] }),
  },
  balls: { ball: 'p1' },
  beats: [
    // a pass that drifts high — 2 shuffles up to meet it
    beat(1.5, pass('p1', 'p2', { delay: 0.2 }), run('p2', [64, 20], { delay: 0.3, dur: 0.9 })),
    beat(1.5, pass('p2', 'p1', { delay: 0.25 }), run('p2', [64, 25], { delay: 0.5, dur: 0.9 })),
    beat(1.3, pass('p1', 'p2', { delay: 0.15 })),
    // keepy-ups!
    beat(2.2, juggle('p2', { count: 3, each: 0.6, height: 4.5 }), ...cheer('Keepy-ups!', { delay: 0.6 })),
    // lofted return — 1 steps in to gather it
    beat(1.5, chip('p2', 'p1', { delay: 0.1 }), run('p1', [37.5, 27], { delay: 0.4, dur: 0.6 })),
    beat(1.3, run('p1', [36, 25], { dur: 0.6 }), pass('p1', 'p2', { delay: 0.35 }), run('p2', [64, 30], { delay: 0.45, dur: 0.75 })),
    // a low one — 2 drops for it, then sends it home
    beat(1.6, pass('p2', 'p1', { delay: 0.2 }), run('p2', [64, 25], { delay: 0.45, dur: 0.9 }), ...cheer('Great pass!', { delay: 0.5 })),
    beat(0.5),
  ],
})

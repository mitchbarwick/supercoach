// "Full time" finale for the session-complete celebration
// (src/components/SessionCelebration.jsx). NOT a drill: it plays ONCE
// and holds on the last frame. The coach's own team (team colour from
// Settings) works a three-player move, curls one into the top corner
// past a diving keeper, then sprints over to celebrate with the coach.
// The component reads the goal moment from the compiled effects to
// fire the confetti, so keep exactly one goal in here.
import { scene, beat, player, keeper, coach, run, pass, shoot, shout } from '../../anim/script.js'

// hops on the spot while celebrating
const bounce = (who, at, opts = {}) => run(who, at, { bounce: 3, bounceH: 2.2, dur: 1.5, ...opts })

export const CELEBRATION = scene({
  area: null,
  trails: 'ball',
  loop: 'cut',
  field: { goals: [{ x: 93, y: 30, facing: 'left' }] },
  cast: {
    p7: player('a', '7', 22, 44, { face: [46, 20] }),
    p10: player('a', '10', 46, 20, { face: [22, 44] }),
    p9: player('a', '9', 52, 46, { face: [80, 32] }),
    gk: keeper(88, 30, { face: [52, 46] }),
    c: coach(37, 51, { face: [70, 30] }),
  },
  balls: { ball: 'p7' },
  beats: [
    beat(0.25),
    // switch it out to the 10…
    beat(0.95, pass('p7', 'p10', { delay: 0.05 }), run('p9', [62, 40], { delay: 0.2, pace: 'jog' })),
    // …who slides the 9 in behind
    beat(0.95, pass('p10', 'p9', { delay: 0.05, curve: -3 }), run('p9', [72, 36], { delay: 0.1, pace: 'sprint' }), run('p10', [59, 29], { delay: 0.3 }), run('p7', [40, 42], { delay: 0.2 })),
    // top corner — the keeper guesses the wrong way
    beat(1.05,
      shoot('p9', 'goal:0', { aim: -4.6, curve: 3, delay: 0.08 }),
      run('gk', [88, 35.5], { dive: true, delay: 0.16, dur: 0.5 }),
    ),
    // everyone peels away to the coach on the touchline
    beat(1.5,
      run('p9', [48, 46], { pace: 'sprint', delay: 0.15 }),
      run('p10', [42, 37], { pace: 'sprint', delay: 0.05 }),
      run('p7', [29, 43], { pace: 'sprint', delay: 0.25 }),
      run('gk', [88, 31], { delay: 0.9, pace: 'walk' }),
      shout('p9', 'GET IN!', { delay: 0.1, dur: 1.1 }),
      bounce('c', [37, 51], { dur: 1.4 }),
    ),
    beat(1.7,
      bounce('p9', [48, 46]),
      bounce('p10', [42, 37], { delay: 0.12 }),
      bounce('p7', [29, 43], { delay: 0.24 }),
      bounce('c', [37, 51], { delay: 0.06 }),
      shout('c', 'What a session!', { delay: 0.15, dur: 1.5 }),
    ),
    beat(0.4),
  ],
})

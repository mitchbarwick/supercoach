// Test scenes for the dev-only animation lab (#/anim-lab?set=ball).
// Not drills: each isolates one thing the ball does, cropped in close
// (`view`) so its spin can be checked frame by frame.
import { scene, beat, player, coach, keeper, run, dribble, pass, chip, toss, shoot, juggle } from '../../anim/script.js'

const VIEW = '20 14 60 38.4' // keeps the pitch's 100:64 shape

export const BALL_LAB = {
  'slow-roll': {
    name: 'Slow roll — panels should tumble forward, never spin flat',
    view: VIEW,
    diagram: scene({
      cast: { a: player('a', '1', 28, 32), b: player('a', '2', 72, 32) },
      balls: { ball: 'a' },
      beats: [beat(2.2, pass('a', 'b', { dur: 2 })), beat(2.2, pass('b', 'a', { dur: 2 }))],
    }),
  },
  'hard-shot': {
    name: 'Hard shot — blurs at the strike, sharpens as it slows',
    view: VIEW,
    diagram: scene({
      field: { goals: [{ x: 80, y: 32, facing: 'left' }] },
      cast: { a: player('a', '9', 30, 32), gk: keeper(76, 32) },
      balls: { ball: 'a' },
      beats: [beat(0.6), beat(1.6, shoot('a', 'goal:0', { aim: 3 }))],
    }),
  },
  'chip-and-roll': {
    name: 'Chip — backspin in the air, rolls forward once it lands',
    view: VIEW,
    diagram: scene({
      cast: { a: player('a', '1', 28, 32) },
      balls: { ball: 'a' },
      beats: [beat(0.5), beat(2.5, chip('a', [64, 32])), beat(1.2)],
    }),
  },
  curl: {
    name: 'Curled pass — sidespin turns the pattern flat as it bends',
    view: VIEW,
    diagram: scene({
      cast: { a: player('a', '1', 28, 40), b: player('a', '2', 72, 40) },
      balls: { ball: 'a' },
      beats: [beat(2, pass('a', 'b', { curve: 8, dur: 1.6 })), beat(2, pass('b', 'a', { curve: 8, dur: 1.6 }))],
    }),
  },
  dribble: {
    name: 'Dribble — rolls with each touch, stops when the player stops',
    view: VIEW,
    diagram: scene({
      cast: { a: player('a', '7', 28, 32) },
      balls: { ball: 'a' },
      beats: [beat(2.2, dribble('a', [[44, 26], [60, 36], [70, 32]])), beat(0.8), beat(2.2, dribble('a', [[56, 38], [40, 28], [28, 32]]))],
    }),
  },
  'keepy-ups': {
    name: 'Keepy-ups — gentle backspin on each touch',
    view: '35 20 30 19.2',
    diagram: scene({
      cast: { a: player('a', '10', 50, 32, { face: 0 }) },
      balls: { ball: 'a' },
      beats: [beat(3, juggle('a', { count: 5, each: 0.55, height: 4.5 })), beat(0.6)],
    }),
  },
  throw: {
    name: 'Throw — no spin in the hands, little in the air',
    view: VIEW,
    diagram: scene({
      cast: { c: coach(30, 32), a: player('a', '1', 66, 32) },
      balls: { ball: { with: 'c', in: 'hands' } },
      beats: [beat(0.6), beat(1.6, toss('c', 'a')), beat(1.8, run('a', [70, 32]))],
    }),
  },
}

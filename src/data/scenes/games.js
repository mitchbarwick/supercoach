// Game scenes (category: 'game'). See docs/animation-system.md.
import {
  scene, beat, player, keeper, coach,
  run, dribble, pass, shoot, collect, tackle, leave, shout, highlight,
} from '../../anim/script.js'

const corners = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x0, y: y1 }, { x: x1, y: y1 }]

export default {
  'small-sided-game': scene({
    area: '4v4 small pitch',
    field: { goals: [{ x: 8, y: 32, facing: 'right', w: 12 }, { x: 92, y: 32, facing: 'left', w: 12 }], cones: corners(8, 8, 92, 56) },
    cast: {
      a1: player('a', '1', 24, 20),
      a2: player('a', '2', 26, 44),
      a3: player('a', '3', 42, 32),
      b1: player('b', '1', 54, 22),
      b2: player('b', '2', 56, 42),
      b3: player('b', '3', 74, 32),
    },
    balls: { ball: 'a1' },
    beats: [
      beat('Build up with passes…', 1.5, pass('a1', 'a2'), run('a3', [50, 30]), run('b1', [44, 22]), run('b2', [44, 42], { delay: 0.3 })),
      beat(1.4, pass('a2', 'a3'), run('a1', [44, 16]), run('a2', [40, 50], { delay: 0.3 }), run('b1', [50, 22]), run('b2', [52, 38])),
      beat('…triangle in the corner…', 1.5, pass('a3', 'a1'), run('a1', [62, 14]), run('a3', [64, 30], { delay: 0.3 }), run('b3', [72, 22]), run('b1', [56, 20], { delay: 0.2 })),
      beat(1.0, pass('a1', 'a3'), run('a3', [72, 34]), run('b3', [70, 18]), run('b2', [62, 40])),
      beat('GOAL!', 1.4, shoot('a3', 'goal:1', { aim: 4 }), run('b3', [76, 26])),
    ],
  }),

  'numbers-game': scene({
    area: '20 x 15 pitch',
    field: { goals: [{ x: 8, y: 32, facing: 'right', w: 10 }, { x: 92, y: 32, facing: 'left', w: 10 }], cones: corners(8, 10, 92, 54) },
    cast: {
      a1: player('a', '1', 12, 16),
      a2: player('a', '2', 12, 48),
      a3: player('a', '3', 5, 22),
      b1: player('b', '1', 88, 16),
      b2: player('b', '2', 88, 48),
      b3: player('b', '3', 95, 22),
      c: coach(50, 60),
    },
    balls: { ball: 'c' },
    beats: [
      beat('Roll a ball in and call a number…', 1.2, shout('c', 'TWO!'), pass('c', [48, 36], { delay: 0.3 })),
      beat('Number 1s and 2s sprint out!', 2.0, collect('a1', { dur: 1.9 }), run('b1', [58, 28]), run('a2', [40, 48]), run('b2', [64, 44])),
      beat('2v2 battle — beat them!', 1.4, pass('a1', 'a2'), run('a2', [58, 48]), run('a1', [58, 34], { delay: 0.3 }), run('b1', [60, 25], { delay: 0.2 }), run('b2', [70, 44])),
      beat(1.2, dribble('a2', [70, 50]), run('b2', [76, 42]), run('a1', [72, 34])),
      beat('Goal! Back to your line', 1.4, pass('a2', 'a1'), shoot('a1', 'goal:1', { aim: 3 })),
    ],
  }),

  'world-cup-shootout': scene({
    area: 'Shootout line',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }] },
    cast: { p1: player('a', '1', 34, 24), p2: player('b', '2', 30, 44), gk: keeper(86, 32) },
    balls: { b1: 'p1', b2: 'p2' },
    beats: [
      beat('Player 1 steps up…', 1.0, shout('p1', 'Brazil!'), dribble('p1', [38, 26])),
      beat('GOAL!', 1.3, shoot('p1', 'goal:0', { aim: 4 }), run('gk', [86, 35], { delay: 0.1, dur: 0.4, dive: true })),
      beat('Player 2\'s turn…', 1.3, shout('p2', 'France!'), run('gk', [86, 32]), dribble('p2', [38, 41])),
      beat('Saved! Most goals after two rounds goes through', 1.6, shoot('p2', 'goal:0', { aim: -4, save: 'gk' })),
    ],
  }),

  'possession-wars': (() => {
    // [passer, receiver, receiver's run, other runs…]
    const moves = [
      ['a1', 'a3', [44, 30], [['a1', [34, 16]], ['a2', [36, 46]], ['b1', [46, 23]], ['b2', [54, 40]]]],
      ['a3', 'a2', [48, 48], [['a3', [54, 34]], ['a1', [48, 14]], ['b1', [50, 22]], ['b2', [56, 43]]]],
      ['a2', 'a1', [64, 16], [['a2', [60, 48]], ['a3', [66, 32]], ['b1', [58, 21]], ['b2', [62, 41]]]],
      ['a1', 'a3', [74, 30], [['a1', [74, 18]], ['a2', [70, 46]], ['b1', [66, 24]], ['b2', [66, 39]]]],
      ['a3', 'a2', [76, 46], [['a3', [80, 32]], ['b1', [72, 25]], ['b2', [71, 40]]]],
    ]
    return scene({
      area: '3-zone pitch',
      field: {
        cones: [10, 40, 60, 90].flatMap((x) => [{ x, y: 8 }, { x, y: 56 }]),
        zones: [{ x: 60, y: 8, w: 30, h: 48 }],
        lines: [[40, 8, 40, 56, true], [60, 8, 60, 56, true]],
      },
      cast: {
        a1: player('a', '1', 20, 20),
        a2: player('a', '2', 22, 44),
        a3: player('a', '3', 34, 32),
        b1: player('b', '1', 52, 22),
        b2: player('b', '2', 56, 44),
      },
      balls: { ball: 'a1' },
      beats: moves.map(([from, to, runTo, others], i) =>
        beat(i === 0 ? 'Build through the middle…' : i === 2 ? 'Into their third — keep counting!' : undefined, 1.4,
          pass(from, to, { delay: 0.1 }), run(to, runTo), shout(from, `${i + 1}`, { dur: 0.7 }),
          ...others.map(([who, p]) => run(who, p, { delay: 0.15 }))),
      ).concat([beat('5 passes in their third — point!', 1.4, shout('a2', 'Point!'))]),
    })
  })(),

  'keepers-gauntlet': scene({
    area: 'Keeper gauntlet',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }] },
    cast: { a1: player('a', '1', 38, 24), a2: player('b', '2', 30, 44), gk: keeper(86, 32) },
    balls: { b1: 'a1', b2: 'a2' },
    beats: [
      beat('Attacker 1 rushes in…', 1.6, dribble('a1', [64, 27]), run('gk', [82, 30], { delay: 0.4 })),
      beat('Save!', 1.2, shoot('a1', 'goal:0', { aim: 3, save: 'gk', parry: [76, 12] })),
      beat('Reset fast — attacker 2 incoming!', 1.8, run('gk', [86, 33]), dribble('a2', [64, 40], { delay: 0.2 }), run('a1', [48, 16])),
      beat('Goal! Keeper gets straight back up', 1.2, shoot('a2', 'goal:0', { aim: 4 }), run('gk', [86, 30], { delay: 0.1, dur: 0.4, dive: true })),
    ],
  }),

  'king-of-the-ring': scene({
    area: 'The ring',
    field: { circle: { x: 50, y: 32, r: 22 } },
    cast: { p1: player('a', '1', 40, 24), p2: player('b', '2', 62, 38), p3: player('n', '3', 42, 42) },
    balls: { b1: 'p1', b2: 'p2', b3: 'p3' },
    beats: [
      beat('Keep yours close, hunt everyone else\'s…', 2.0, dribble('p1', [48, 28]), dribble('p2', [58, 34]), dribble('p3', [38, 38])),
      beat('Leave yours for a second…', 0.8, leave('p1'), dribble('p2', [60, 37]), dribble('p3', [36, 34])),
      beat('…and boot theirs out of the ring!', 0.9, tackle('p1', 'p2', { to: [82, 52] })),
      beat('Out! Five keepy-ups, then back in next round', 2.0, shout('p2', 'Out!'), run('p2', [78, 48]), collect('p1', { ball: 'b1', delay: 0.3, dur: 0.9 }), dribble('p3', [42, 28])),
    ],
  }),

  'four-goal-game': scene({
    area: 'Four-goal square',
    field: {
      gates: [[{ x: 8, y: 14 }, { x: 8, y: 24 }], [{ x: 8, y: 40 }, { x: 8, y: 50 }], [{ x: 92, y: 14 }, { x: 92, y: 24 }], [{ x: 92, y: 40 }, { x: 92, y: 50 }]],
      cones: corners(8, 6, 92, 58),
    },
    cast: {
      a1: player('a', '1', 40, 18),
      a2: player('a', '2', 36, 34),
      a3: player('a', '3', 52, 48),
      b1: player('b', '1', 72, 14),
      b2: player('b', '2', 78, 24),
      b3: player('b', '3', 62, 32),
    },
    balls: { ball: 'a1' },
    beats: [
      beat('Top goal is crowded…', 1.6, dribble('a1', [54, 20]), run('a2', [50, 34]), run('a3', [62, 48]), run('b1', [80, 17]), run('b2', [84, 24]), run('b3', [64, 26]), highlight([92, 19], { r: 7, dur: 1.6, color: '#ff8a8a' })),
      beat('…switch to the free one!', 1.6, pass('a1', 'a2', { delay: 0.1 }), pass('a2', 'a3'), run('a3', [72, 46]), run('b3', [62, 32], { delay: 0.4 }), highlight([92, 45], { r: 7, dur: 2.8 })),
      beat(1.2, dribble('a3', [82, 45]), run('b2', [84, 34], { delay: 0.2 })),
      beat('GOAL through the open door!', 1.4, shoot('a3', [99, 45])),
    ],
  }),

  'crossbar-challenge': scene({
    area: 'Crossbar range',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 35, y: 16 }, { x: 35, y: 48 }] },
    cast: { p1: player('a', '1', 30, 34), q1: player('b', '2', 26, 42), q2: player('a', '3', 21, 46) },
    balls: { ball: 'p1' },
    beats: [
      beat('Line it up…', 1.2, dribble('p1', [36, 33])),
      beat('CLANG! Off the bar!', 3.0, shoot('p1', 'goal:0', { bar: [70, 36], arc: 6 })),
      beat('3 points!', 1.2, shout('p1', '3 points!')),
    ],
  }),
}

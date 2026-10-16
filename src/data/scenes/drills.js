// Drill-block scenes (category: 'drill'). See docs/animation-system.md.
import {
  scene, beat, player, keeper, coach,
  run, dribble, face, pass, chip, cross, toss, shoot, rebound, collect, tackle, tag,
  pickUp, drop, leave, shout, highlight, rel,
} from '../../anim/script.js'

const square = (x0, y0, x1, y1) => [{ x: x0, y: y0 }, { x: x1, y: y0 }, { x: x0, y: y1 }, { x: x1, y: y1 }]

export default {
  'relay-races': scene({
    area: '20-step lanes',
    field: { cones: [{ x: 20, y: 22 }, { x: 80, y: 22 }, { x: 20, y: 44 }, { x: 80, y: 44 }] },
    cast: {
      r1: player('a', '1', 17, 22),
      q1: player('a', '2', 10, 22),
      q1b: player('a', '3', 4, 22),
      r2: player('b', '1', 17, 44),
      q2: player('b', '2', 10, 44),
      q2b: player('b', '3', 4, 44),
    },
    beats: [
      beat('Sprint to the turn cone…', 2.7, run('r1', [[76, 18.5], [84, 22], [78, 26.5]]), run('r2', [[76, 40.5], [84, 44], [78, 48.5]], { delay: 0.15, dur: 2.65 })),
      beat('…round it and race home!', 2.5, run('r1', [22, 26.5]), run('r2', [23, 48.5], { dur: 2.6 })),
      beat('High-five — next runner GO!', 0.5, tag('r1', 'q1', { dur: 0.4 }), tag('r2', 'q2', { delay: 0.1, dur: 0.4 })),
      beat(2.2, run('q1', [[50, 18.5]]), run('q2', [[48, 40.5]], { delay: 0.1 }), run('r1', [[16, 30], [4, 28]], { delay: 0.3, dur: 1.6 }), run('r2', [[16, 52], [4, 50]], { delay: 0.4, dur: 1.6 }), run('q1b', [10, 22], { delay: 0.6, dur: 1 }), run('q2b', [10, 44], { delay: 0.6, dur: 1 })),
    ],
  }),

  'slalom-circuit': scene({
    area: 'Slalom lines',
    field: { cones: [30, 40, 50, 60, 70].flatMap((x) => [{ x, y: 22 }, { x, y: 46 }]) },
    cast: {
      p1: player('a', '1', 21, 22),
      q1: player('a', '2', 14, 22),
      p2: player('b', '1', 21, 46),
      q2: player('b', '2', 14, 46),
    },
    balls: { b1: 'p1', b2: 'p2', b3: 'q1', b4: 'q2' },
    beats: [
      beat('Go — race the other line through the cones!', 3.4,
        dribble('p1', [[30, 16.5], [40, 27.5], [50, 16.5], [60, 27.5], [70, 16.5], [78, 22]]),
        dribble('p2', [[30, 40.5], [40, 51.5], [50, 40.5], [60, 51.5], [70, 40.5], [78, 46]], { delay: 0.2, dur: 3.3 })),
      beat('Turn and dribble straight home', 2.6, dribble('p1', [[84, 13], [26, 12]]), dribble('p2', [[84, 36], [26, 35]], { dur: 2.7 })),
      beat('Stop it on the line — next player goes!', 2.0, dribble('p1', [10, 14]), dribble('p2', [10, 36]), dribble('q1', [[30, 16.5], [36, 22]], { delay: 0.35, dur: 1.65 }), dribble('q2', [[30, 40.5], [35, 46]], { delay: 0.5, dur: 1.5 })),
    ],
  }),

  'ball-tag': scene({
    area: '25 x 25 square',
    field: { cones: square(22, 8, 78, 56) },
    cast: {
      t: player('b', 'T', 34, 30),
      r1: player('a', '1', 58, 42),
      r2: player('a', '2', 46, 16),
      r3: player('a', '3', 68, 18),
    },
    balls: { tb: 't', spare: [16, 60] },
    beats: [
      beat('Tagger hunts with the ball…', 2.0, dribble('t', [[42, 34], [50, 38]]), run('r1', [64, 44]), run('r2', [36, 18]), run('r3', [72, 30])),
      beat('Tag! The pass hits below the knee', 1.2, pass('t', 'r1', { hit: [72, 52] }), run('r1', [68, 47])),
      beat('Tagged — grab a ball and join the taggers', 2.4, shout('r1', 'Got me!', { dur: 1 }), run('t', [56, 36]), run('r3', [74, 22]), collect('r1', { delay: 0.6, dur: 1.2 })),
      beat(1.4, dribble('r1', [62, 40]), run('r2', [32, 24]), run('t', [50, 30])),
    ],
  }),

  '1v1-gates': scene({
    area: '15 x 15 duel square',
    field: {
      cones: square(30, 10, 70, 54),
      gates: [[{ x: 24, y: 24 }, { x: 24, y: 38 }], [{ x: 76, y: 24 }, { x: 76, y: 38 }]],
    },
    cast: { att: player('a', 'A', 50, 14), def: player('b', 'D', 50, 50) },
    balls: { ball: 'def' },
    beats: [
      beat('Defender passes across to start the duel', 1.5, pass('def', 'att'), run('def', [50, 40], { delay: 0.35 })),
      beat('Attacker drives at the defender', 1.0, dribble('att', [50, 23]), run('def', [50, 36], { pace: 'walk' })),
      beat('Fake towards the left gate…', 0.8, dribble('att', [43, 27]), run('def', [43, 34])),
      beat('…explode the other way through the right gate!', 1.6, dribble('att', [[56, 27], [70, 31], [84, 31]]), run('def', [[52, 34], [62, 36]], { delay: 0.25 })),
    ],
  }),

  '1v1-channel': scene({
    area: '10 x 20 channel',
    field: {
      cones: [{ x: 18, y: 18 }, { x: 18, y: 46 }, { x: 82, y: 18 }, { x: 82, y: 46 }, { x: 70, y: 18 }, { x: 70, y: 46 }],
      zones: [{ x: 70, y: 18, w: 12, h: 28 }],
    },
    cast: { att: player('a', 'A', 22, 32), def: player('b', 'D', 66, 32) },
    balls: { ball: 'att' },
    beats: [
      beat('Drive at the defender', 1.6, dribble('att', [42, 32]), run('def', [54, 32])),
      beat('Drop the shoulder…', 0.6, dribble('att', [46, 36]), run('def', [55, 38])),
      beat('…cut past!', 1.3, dribble('att', [[52, 26], [64, 23]]), run('def', [58, 31], { delay: 0.3 })),
      beat('Stop it dead in the end zone — score!', 1.4, dribble('att', [75, 24], { dur: 0.8 }), run('def', [64, 28]), shout('att', 'Score!', { delay: 0.8, dur: 0.8 })),
    ],
  }),

  'defend-the-castle': scene({
    area: '15-step circle',
    field: { circle: { x: 50, y: 32, r: 20 }, cones: [{ x: 50, y: 32 }] },
    cast: {
      a1: player('a', '1', 26, 18),
      a2: player('a', '2', 74, 16),
      a3: player('a', '3', 76, 46),
      a4: player('a', '4', 26, 48),
      d: player('b', 'D', 56, 26),
    },
    balls: { ball: 'a1' },
    beats: [
      beat('Pass around the outside…', 1.6, pass('a1', 'a2'), run('d', [58, 28]), highlight([50, 32], { r: 3, dur: 1.6 })),
      beat(1.5, pass('a2', 'a3'), run('d', [57, 37])),
      beat('Defender shifts across…', 1.6, pass('a3', 'a4'), run('d', [43, 40], { delay: 0.2 })),
      beat('…so switch it — gap on the far side!', 1.2, pass('a4', 'a1'), run('d', [42, 34], { delay: 0.3 })),
      beat('Shoot at the castle!', 1.4, shoot('a1', [54, 34.5]), shout('a1', 'Castle down!', { delay: 0.6, dur: 0.8 }), run('d', [46, 30], { delay: 0.1, dur: 0.6 })),
    ],
  }),

  'pass-move-triangles': scene({
    area: '15-step channel',
    field: { cones: square(10, 12, 90, 52) },
    cast: { p1: player('a', '1', 14, 22), p2: player('a', '2', 14, 42), p3: player('a', '3', 22, 32) },
    balls: { ball: 'p3' },
    beats: [
      beat('Pass to a team-mate who is moving', 1.4, pass('p3', 'p1', { delay: 0.2 }), run('p1', [30, 22]), run('p2', [28, 44]), run('p3', [34, 34], { delay: 0.3, dur: 1.1 })),
      beat(1.4, pass('p1', 'p2', { delay: 0.1 }), run('p1', [46, 22], { delay: 0.2, dur: 1.2 }), run('p2', [42, 44]), run('p3', [50, 34])),
      beat('Keep the triangle shape!', 1.4, pass('p2', 'p3', { delay: 0.1 }), run('p2', [58, 44], { delay: 0.2, dur: 1.2 }), run('p3', [64, 33]), run('p1', [62, 22])),
      beat(1.4, pass('p3', 'p1', { delay: 0.1 }), run('p3', [76, 33], { delay: 0.2, dur: 1.2 }), run('p1', [78, 21]), run('p2', [72, 44])),
      beat('Reach the end — turn and come back', 1.2, dribble('p1', [84, 26]), run('p2', [80, 42]), run('p3', [72, 32])),
    ],
  }),

  'rebounder-returns': scene({
    area: 'Rebounder net',
    field: { rebounders: [{ x: 88, y: 32, facing: 'left', w: 12 }], cones: [{ x: 44, y: 22 }, { x: 44, y: 42 }] },
    cast: { p1: player('a', '1', 40, 32), q1: player('a', '2', 26, 22), q2: player('a', '3', 20, 26) },
    balls: { ball: 'p1' },
    beats: [
      beat('Pass firmly into the net…', pass('p1', 'rebounder:0')),
      beat('…control the return…', rebound('p1')),
      beat('…and go again — first time!', pass('p1', 'rebounder:0')),
      beat(rebound('p1')),
      beat('Count your clean touches', 0.6),
    ],
  }),

  'gate-finish': scene({
    area: 'Gate finishing zone',
    field: {
      gates: [[{ x: 80, y: 12 }, { x: 80, y: 20 }], [{ x: 84, y: 28 }, { x: 84, y: 36 }], [{ x: 80, y: 44 }, { x: 80, y: 52 }]],
      cones: [{ x: 30, y: 12 }, { x: 30, y: 52 }],
    },
    cast: { p1: player('a', '1', 26, 32), q1: player('a', '2', 20, 38), q2: player('a', '3', 14, 42) },
    balls: { ball: 'p1' },
    beats: [
      beat('Dribble at speed', 1.8, dribble('p1', [56, 30])),
      beat('Eyes up — pick a gate…', 0.8, dribble('p1', [63, 27]), highlight([80, 16], { r: 6, dur: 1.6 })),
      beat('Finish through it — outside gates score 3!', 1.0, pass('p1', [92, 13])),
      beat('Collect it, jog back round the outside', 2.0, run('p1', [76, 22]), run('q1', [26, 32]), run('q2', [20, 38])),
    ],
  }),

  'free-kick-wall': scene({
    area: 'Free-kick wall',
    field: {
      goals: [{ x: 90, y: 32, facing: 'left' }],
      mannequins: [{ x: 60, y: 28 }, { x: 60, y: 32.5 }, { x: 60, y: 37 }],
      cones: [{ x: 35, y: 14 }, { x: 35, y: 50 }],
    },
    cast: { k1: player('a', 'K', 26, 39), gk: keeper(86, 32) },
    balls: { ball: [34, 34] },
    beats: [
      beat('Short run-up…', 1.0, collect('k1', { dur: 1.0 })),
      beat('Bend it over the wall!', 1.6, shoot('k1', 'goal:0', { aim: 5, arc: 7, curve: -3 }), run('gk', [86, 29], { delay: 0.8, dur: 0.45, dive: true })),
      beat('Top corner!', 0.8),
    ],
  }),

  'speed-spring-circuit': scene({
    area: 'Speed circuit',
    field: {
      ladders: [{ x: 18, y: 32, len: 20 }],
      hurdles: [46, 54, 62].map((x) => ({ x, y: 32, dir: 'v' })),
      cones: [{ x: 12, y: 32 }, { x: 82, y: 32 }],
    },
    cast: { p1: player('a', '1', 12, 32), q1: player('a', '2', 6, 38), q2: player('a', '3', 6, 44) },
    beats: [
      beat('Quick feet through the ladder…', 2.0, run('p1', [[18, 32], [38, 32], [42, 32]], { bounce: 10, bounceH: 0.4 })),
      beat('…spring over the hurdles…', 1.5,
        run('p1', [50, 32], { dur: 0.5, hop: 2.6 }),
        run('p1', [58, 32], { delay: 0.5, dur: 0.5, hop: 2.6 }),
        run('p1', [66, 32], { delay: 1.0, dur: 0.5, hop: 2.6 })),
      beat('…and SPRINT through the finish!', 0.9, run('p1', [84, 32])),
      beat('Jog back round the outside', 3.8, run('p1', [[86, 46], [40, 48], [6, 50]]), run('q1', [12, 32], { delay: 2.4, dur: 1.2 }), run('q2', [6, 38], { delay: 2.6, dur: 1.2 })),
    ],
  }),

  'turn-and-burn': scene({
    area: 'Turning lanes',
    field: { cones: [{ x: 25, y: 32 }, { x: 75, y: 32 }] },
    cast: { p1: player('a', '1', 22, 30), q1: player('a', '2', 15, 34), q2: player('a', '3', 9, 34) },
    balls: { b1: 'p1', b2: 'q1' },
    beats: [
      beat('Cruise out at a controlled pace…', 2.6, dribble('p1', [70, 29])),
      beat('…snap the turn — drag it back…', 0.7, dribble('p1', [68, 31])),
      beat('…and BURN home at full speed!', 1.9, dribble('p1', [26, 35])),
      beat('Stop it dead — next player goes', 1.8, dribble('p1', [21, 42], { dur: 0.6 }), dribble('q1', [[24, 29], [40, 28]], { delay: 0.6, dur: 1.2 }), run('q2', [15, 34], { delay: 0.6, dur: 1 })),
    ],
  }),

  '2v1-overload': scene({
    area: '2v1 to goal',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 25, y: 14 }, { x: 25, y: 50 }] },
    cast: { a1: player('a', '1', 26, 24), a2: player('a', '2', 26, 44), d: player('b', 'D', 62, 32), gk: keeper(86, 32) },
    balls: { ball: 'a1' },
    beats: [
      beat('Drive at the defender…', 2.0, dribble('a1', [50, 28]), run('a2', [50, 45]), run('d', [57, 31])),
      beat('They commit to the ball — release it!', 1.0, pass('a1', 'a2'), run('a2', [64, 42]), run('a1', [60, 25], { delay: 0.2 }), run('d', [58, 35], { delay: 0.35, dur: 0.65 })),
      beat('First-time finish — far post!', 1.2, shoot('a2', 'goal:0', { aim: 5 }), run('gk', [86, 35], { dur: 0.35 }), run('a1', [72, 24])),
    ],
  }),

  'passing-golf': scene({
    area: 'Hole 1 — match play',
    field: { hoops: [{ x: 78, y: 20, r: 4 }], flags: [{ x: 82.5, y: 16, color: '#ffe066' }], cones: [{ x: 18, y: 48 }] },
    cast: { p2: player('b', '2', 15, 53), p1: player('a', '1', 13, 42) },
    balls: { ball2: 'p2', ball: 'p1' },
    beats: [
      beat('Your opponent drives first…', 2.0, chip('p2', [61, 33], { arc: 7 })),
      beat('…now it\'s your turn', 2.2, chip('p1', [70, 26], { arc: 8 })),
      beat('Walk up to your own ball', 2.6, collect('p1', { ball: 'ball', pace: 'walk', dur: 2.4 }), collect('p2', { ball: 'ball2', delay: 0.2, dur: 2.4 })),
      beat('Tap it in — fewer passes wins the hole!', 1.2, pass('p1', [78, 20])),
      beat(1.0, shout('p1', 'Two shots!', { dur: 1 })),
    ],
  }),

  'one-two-finish': scene({
    area: 'One-two zone',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], mannequins: [{ x: 58, y: 32 }], cones: [{ x: 28, y: 20 }, { x: 28, y: 44 }] },
    cast: { p1: player('a', '1', 28, 32), wall: player('a', '2', 58, 15), q1: player('a', '3', 22, 38) },
    balls: { ball: 'p1' },
    beats: [
      beat('Drive at the dummy…', 1.4, dribble('p1', [45, 31])),
      beat('Give…', 1.3, pass('p1', 'wall', { delay: 0.05 }), run('p1', [[53, 25], [66, 25]], { delay: 0.2, dur: 1.5 })),
      beat('…and go! It comes back first time', 0.8, pass('wall', 'p1')),
      beat('Finish!', 1.2, shoot('p1', 'goal:0', { aim: -4 })),
    ],
  }),

  'switch-play': scene({
    area: '30 x 25 switch pitch',
    field: { cones: square(12, 8, 88, 56), gates: [[{ x: 90, y: 42 }, { x: 90, y: 52 }]] },
    cast: {
      a1: player('a', '1', 22, 16),
      a2: player('a', '2', 34, 34),
      a3: player('a', '3', 76, 44),
      b1: player('b', '1', 44, 22),
      b2: player('b', '2', 50, 38),
    },
    balls: { ball: 'a1' },
    beats: [
      beat('Draw them to one side…', 1.5, pass('a1', 'a2'), run('b1', [34, 24]), run('b2', [43, 37])),
      beat(1.4, pass('a2', 'a1'), run('b1', [29, 20]), run('b2', [41, 28])),
      beat('SWITCH! The diagonal flies over…', 2.8, chip('a1', 'a3', { arc: 9 }), run('a3', [79, 46]), run('b1', [48, 30], { delay: 0.6 }), run('b2', [58, 40], { delay: 0.5 })),
      beat('Control and dribble through the gate!', 1.6, dribble('a3', [[85, 47], [95, 47]]), run('b2', [70, 42]), run('b1', [60, 34])),
    ],
  }),

  'toss-volley': scene({
    area: 'Volley zone',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 45, y: 16 }, { x: 45, y: 48 }] },
    cast: { srv: player('n', 'S', 74, 14), st: player('a', '9', 57, 35), gk: keeper(86, 33), q1: player('a', '2', 48, 44) },
    balls: { ball: { with: 'srv', in: 'hands' } },
    beats: [
      beat('The toss floats in…', toss('srv', 'st', { at: 'knee', arc: 5 }), run('st', [60, 33], { dur: 1 })),
      beat('VOLLEY! Laces through it', 1.2, shoot('st', 'goal:0', { aim: 5 }), run('gk', [86, 30], { delay: 0.15, dur: 0.45, dive: true })),
      beat('Three each, then rotate', 1.4, run('st', [64, 44]), run('q1', [57, 35], { delay: 0.3 })),
    ],
  }),

  'cross-and-finish': scene({
    area: 'Crossing zone',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], flags: [{ x: 93, y: 6 }], zones: [{ x: 62, y: 4, w: 30, h: 12 }] },
    cast: { w: player('a', 'W', 30, 11), r1: player('a', '9', 50, 28), r2: player('a', '10', 46, 44), gk: keeper(86, 32) },
    balls: { ball: 'w' },
    beats: [
      beat('Winger drives down the flank…', 2.2, dribble('w', [74, 10]), run('r1', [60, 28], { pace: 'jog' }), run('r2', [58, 43], { pace: 'jog' })),
      beat('Whip the cross in — near and far post runs', 1.5, cross('w', 'r2', { at: 'knee', arc: 7, delay: 0.1 }), run('r1', [79, 28]), run('r2', [79, 38]), run('gk', [86, 30])),
      beat('Met at the far post — finish!', 1.2, shoot('r2', 'goal:0', { aim: -4 }), run('gk', [86, 34], { delay: 0.1, dur: 0.3 })),
    ],
  }),

  'jockey-delay': scene({
    area: '8 x 20 channel',
    field: { cones: square(18, 20, 84, 44) },
    cast: { att: player('a', 'A', 22, 32), def: player('b', 'D', 38, 32), rec: player('b', 'R', 50, 52) },
    balls: { ball: 'att' },
    beats: [
      beat('Jockey — side-on, on your toes, don\'t dive in', 2.2, dribble('att', [38, 30]), run('def', [47, 30]), face('def', 'att')),
      beat('Delay… delay… help is coming!', 1.6, dribble('att', [48, 27]), run('def', [56, 27]), face('def', 'att'), run('rec', [56, 37], { delay: 0.3, dur: 1.3 }), shout('rec', 'Coming!', { delay: 0.3 })),
      beat('Two v one — win it!', 0.9, tackle('rec', 'att'), run('def', [57, 23]), face('def', 'att')),
      beat('Ball won — clear it away', 1.4, dribble('rec', [70, 38]), run('def', [62, 28])),
    ],
  }),

  'keeper-hands-circuit': scene({
    area: 'Handling circuit',
    field: { goals: [{ x: 10, y: 32, facing: 'right' }] },
    cast: { srv: player('n', 'S', 46, 32), gk: keeper(15, 32), q1: player('a', '2', 54, 46) },
    balls: { ball: { with: 'srv', in: 'hands' } },
    beats: [
      beat('Rolled ball — scoop it up', drop('srv'), pass('srv', 'gk', { at: 'hands', delay: 0.2 })),
      beat(toss('gk', 'srv', { at: 'hands', arc: 3 })),
      beat('Chest-high — make a W with your hands', toss('srv', 'gk', { at: 'chest', arc: 2 })),
      beat(toss('gk', 'srv', { at: 'hands', arc: 3 })),
      beat('High ball — claim it at the highest point!', 1.4, toss('srv', 'gk', { at: 'hands', arc: 9, dur: 1.4 }), run('gk', [17, 32], { delay: 0.85, dur: 0.6, hop: 2.4 })),
      beat(toss('gk', 'srv', { at: 'hands', arc: 3 }), run('gk', [15, 32], { dur: 0.6 })),
    ],
  }),

  'dingoes-and-rabbits': scene({
    area: '25 x 25 square',
    field: { cones: square(22, 8, 78, 56) },
    cast: {
      p1: player('a', '1', 34, 18),
      p2: player('a', '2', 66, 46),
      p3: player('a', '3', 34, 46),
      d1: player('b', 'D', 52, 30),
      d2: player('b', 'D', 64, 18),
    },
    balls: { b1: 'p1', b2: 'p2', b3: 'p3' },
    beats: [
      beat('Dribble free, rabbits!', 1.8, dribble('p1', [42, 24]), dribble('p2', [62, 38]), dribble('p3', [40, 50]), run('d1', [50, 28]), run('d2', [70, 26])),
      beat('Tagged — freeze, ball in hands, legs apart!', 1.4, tag('d1', 'p1', { dur: 0.6 }), run('d1', [62, 18], { delay: 0.65, dur: 1.6 }), pickUp('p1', { delay: 0.7 }), shout('p1', 'Frozen!', { delay: 0.6 }), dribble('p2', [60, 34]), dribble('p3', [36, 46])),
      beat('A team-mate comes to the rescue…', 1.4, dribble('p2', [50, 30]), run('d2', [70, 40])),
      beat('…through the legs!', 1.7, pass('p2', [37, 21]), run('p2', [[50, 20], [44, 15], [38, 17]], { delay: 0.2, dur: 1.5 })),
      beat('You\'re free — off you go!', 1.6, collect('p2', { dur: 0.4 }), drop('p1'), shout('p1', 'Free!'), dribble('p1', [46, 32], { delay: 0.3, dur: 1.3 }), run('d1', [58, 24])),
    ],
  }),

  'rob-the-nest': scene({
    area: 'Four-corner nests',
    field: {
      goals: [
        { x: 9, y: 14, facing: 'right', w: 10, depth: 3 },
        { x: 91, y: 14, facing: 'left', w: 10, depth: 3 },
        { x: 9, y: 50, facing: 'right', w: 10, depth: 3 },
        { x: 91, y: 50, facing: 'left', w: 10, depth: 3 },
      ],
    },
    cast: {
      a1: player('a', '1', 16, 20),
      b1: player('b', '1', 84, 20),
      c1: player('n', '1', 16, 44),
      k1: player('k', '1', 84, 44),
    },
    balls: { pa: [48, 30], pb: [52, 34], pc: [48, 34], pd: [52, 30] },
    beats: [
      beat('Grab a ball from the pile!', 1.8, collect('a1', { ball: 'pa' }), collect('b1', { ball: 'pd' }), collect('c1', { ball: 'pc' }), collect('k1', { ball: 'pb' })),
      beat('Dribble it home…', 2.0, dribble('a1', [22, 18]), dribble('b1', [78, 18]), dribble('c1', [22, 46]), dribble('k1', [78, 46])),
      beat('…and score in your own nest', 0.9, shoot('a1', 'goal:0'), shoot('b1', 'goal:1'), shoot('c1', 'goal:2'), shoot('k1', 'goal:3')),
      beat('Pile\'s empty — raid another nest!', 2.6, run('a1', [42, 30], { dur: 1.4 }), collect('b1', { ball: 'pa', dur: 2.4 })),
      beat('Steal it and score in yours!', 2.6, dribble('b1', [[22, 7], [52, 7], [76, 16]]), run('a1', [[34, 18], [50, 15]], { delay: 0.6, dur: 2.0 })),
      beat(1.0, shoot('b1', 'goal:1')),
    ],
  }),

  'snatch-and-grab': scene({
    area: 'Two end zones',
    field: { zones: [{ x: 4, y: 6, w: 16, h: 52 }, { x: 80, y: 6, w: 16, h: 52 }] },
    cast: { p1: player('a', '1', 14, 20), p2: player('b', '1', 86, 44) },
    balls: { l1: [10, 34], l2: [14, 46], l3: [9, 54], r1: [86, 26], r2: [90, 14], r3: [91, 36] },
    beats: [
      beat('Go — sprint into their zone!', 2.6, collect('p1', { ball: 'r1' }), collect('p2', { ball: 'l1' })),
      beat('Grab ONE ball…', 0.5, pickUp('p1'), pickUp('p2')),
      beat('…and race it back home!', 2.6, run('p1', [12, 24]), run('p2', [88, 40])),
      beat('Drop it in your zone — go again!', 1.2, leave('p1'), leave('p2'), run('p1', [18, 20], { delay: 0.3, dur: 0.9 }), run('p2', [82, 44], { delay: 0.3, dur: 0.9 })),
    ],
  }),

  'knock-it-off': scene({
    area: 'Target strike zone',
    field: { cones: [20, 32, 44].flatMap((y) => [{ x: 12, y }, { x: 88, y }]) },
    cast: { p1: player('a', '1', 34, 42), p2: player('a', '2', 50, 22), d1: player('b', 'D', 66, 32) },
    balls: { ball: 'p1', t1: [88, 20], t2: [88, 32], t3: [88, 44], o1: [12, 20], o2: [12, 32], o3: [12, 44] },
    beats: [
      beat('Move it — find a clear lane', 1.5, pass('p1', 'p2'), run('p1', [44, 38]), run('d1', [70, 28])),
      beat(1.3, pass('p2', 'p1'), run('p2', [56, 18]), run('d1', [72, 36], { delay: 0.2 })),
      beat('Strike!', 1.4, shoot('p1', 'ball:t1', { knock: [96, 14] })),
      beat('Knocked off — that\'s one down!', 1.2, shout('p1', 'Yes!')),
    ],
  }),

  'get-it-back': scene({
    area: 'Numbered pairs',
    field: { goals: [{ x: 8, y: 32, facing: 'right', w: 10, depth: 3 }, { x: 92, y: 32, facing: 'left', w: 10, depth: 3 }] },
    cast: {
      ...Object.fromEntries([1, 2, 3, 4].flatMap((n, i) => [[`a${n}`, player('a', String(n), 38, 14 + i * 12)], [`b${n}`, player('b', String(n), 62, 14 + i * 12)]])),
      c: coach(50, 61),
    },
    balls: { x1: [50, 14], x2: [50, 26], x3: [50, 38], x4: [50, 50] },
    beats: [
      beat('"Number 3!"', 0.8, shout('c', 'Number 3!')),
      beat('Race for the ball!', 1.0, collect('a3', { ball: 'x3', dur: 0.85 }), run('b3', [56, 41], { dur: 0.95 })),
      beat('Win it, turn, dribble back to your goal', 2.2, dribble('a3', [[44, 42], [26, 38], [18, 33]]), run('b3', [[50, 44], [30, 40]], { delay: 0.25, dur: 1.95 })),
      beat('Score!', 1.4, shoot('a3', 'goal:0'), run('b3', [24, 38])),
    ],
  }),

  'football-rush': scene({
    area: 'Breakout zone',
    field: { zones: [{ x: 4, y: 6, w: 12, h: 52 }, { x: 84, y: 6, w: 12, h: 52 }], goals: [{ x: 4, y: 32, facing: 'right', w: 10, depth: 3 }] },
    cast: { a1: player('a', '1', 12, 18), a2: player('a', '2', 12, 46), d1: player('b', 'D', 54, 42), d2: player('b', 'D', 56, 22) },
    balls: { ba1: 'a1', ba2: 'a2' },
    beats: [
      beat('Go — dribble through the defenders!', 2.0, dribble('a1', [40, 18]), dribble('a2', [36, 44]), run('d1', [46, 42]), run('d2', [52, 22])),
      beat('Defender wins one…', 0.9, tackle('d1', 'a2'), dribble('a1', [[50, 13], [60, 13]]), run('d2', [54, 19])),
      beat('…and counter-attacks the goal!', 2.0, dribble('d1', [[40, 36], [26, 35], [16, 33]]), dribble('a1', [88, 16]), run('a2', rel(1, 5), { delay: 0.1, dur: 0.6 })),
      beat('Score — then swap roles', 1.4, shoot('d1', 'goal:0'), run('a2', [44, 38])),
    ],
  }),

  // ---- reviewed pilots ----
  'triangle-passing': scene({
    area: '8-step triangle',
    field: { cones: [{ x: 50, y: 12 }, { x: 28, y: 48 }, { x: 72, y: 48 }] },
    cast: {
      p1: player('a', '1', 50, 16),
      p2: player('a', '2', 31, 45),
      d: player('b', 'D', 56, 34),
    },
    balls: { ball: 'p1' },
    beats: [
      beat('Shadow — jog along, don\'t press yet', 2.0, pass('p1', 'p2'), run('p1', [69, 45]), run('d', [45, 37], { pace: 'walk' })),
      beat(2.0, pass('p2', 'p1'), run('p2', [50, 16]), run('d', [57, 40], { pace: 'walk' })),
      beat(2.0, pass('p1', 'p2'), run('p1', [31, 45]), run('d', [49, 31], { pace: 'walk' })),
      beat('Go — press for real!', 1.3, pass('p2', 'p1'), run('d', [40, 40])),
      beat(0.8, tackle('d', 'p1')),
      beat('Won it — swap roles!', 1.6, run('p1', [[29, 37], [50, 33]]), dribble('d', [37, 48], { pace: 'walk' })),
    ],
  }),

  rondo: scene({
    area: '10-step rondo circle',
    field: { circle: { x: 50, y: 32, r: 21 } },
    cast: {
      p1: player('a', '1', 50, 11),
      p2: player('a', '2', 70, 25),
      p3: player('a', '3', 63, 49),
      p4: player('a', '4', 37, 49),
      p5: player('a', '5', 30, 25),
      pig: player('b', 'P', 50, 32),
    },
    balls: { ball: 'p1' },
    beats: [
      beat('Zip it around — keep it moving', 1.0, pass('p1', 'p2'), run('pig', [57, 27])),
      beat(1.0, pass('p2', 'p3'), run('pig', [57, 39])),
      beat('Piggy closes in…', 1.0, run('pig', [55, 45]), pass('p3', 'p2', { delay: 0.35 })),
      beat('…so switch it the other way!', 1.4, pass('p2', 'p5'), run('pig', [47, 33], { delay: 0.2 })),
      beat(1.1, pass('p5', 'p1'), run('pig', [50, 32])),
    ],
  }),

  'shooting-gallery': scene({
    area: 'Shooting zone',
    field: { goals: [{ x: 92, y: 32, facing: 'left' }], cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }] },
    cast: {
      sh: player('a', 'S', 36, 32),
      srv: coach(58, 14),
      gk: keeper(88, 32),
      q1: player('a', '2', 28, 38),
      q2: player('a', '3', 22, 42),
    },
    balls: { ball: 'sh' },
    beats: [
      beat('Pass to the server…', 1.0, pass('sh', 'srv')),
      beat('…sprint onto the return…', 1.6, run('sh', [62, 30]), pass('srv', 'sh', { delay: 0.35 })),
      beat('SHOOT! Then follow in', 0.9, shoot('sh', 'goal:0', { aim: 5 }), run('gk', [88, 35], { delay: 0.15, dur: 0.4, dive: true })),
      beat(1.2, run('sh', [78, 30]), run('gk', [88, 32], { delay: 0.5 })),
      beat('Next shooter steps up', 1.2, run('q1', [36, 32]), run('q2', [28, 38])),
    ],
  }),

  '1v1-to-goal': scene({
    area: '1v1 to goal',
    field: { goals: [{ x: 90, y: 32, facing: 'left' }], cones: [{ x: 30, y: 16 }, { x: 30, y: 48 }] },
    cast: {
      att: player('a', 'A', 30, 32),
      def: player('b', 'D', 70, 34),
      gk: keeper(86, 32),
    },
    balls: { ball: 'def' },
    beats: [
      beat('Defender serves and closes…', 1.5, pass('def', 'att'), run('def', [53, 32], { delay: 0.35 })),
      beat('Take them on!', 1.0, dribble('att', [42, 31]), run('def', [51, 32], { pace: 'walk' })),
      beat('Drop the shoulder…', 0.7, dribble('att', [44, 35]), run('def', [51, 37.5])),
      beat('…and burst past!', 1.25, dribble('att', [[48, 28], [62, 24]]), run('def', [55, 34], { delay: 0.25 })),
      beat('Beaten — finish!', 1.0, shoot('att', 'goal:0', { aim: -5 }), run('gk', [86, 35], { delay: 0.12, dur: 0.4, dive: true })),
    ],
  }),

  'keeper-wars': scene({
    area: 'Keeper duel arena',
    field: { goals: [{ x: 10, y: 32, facing: 'right' }, { x: 90, y: 32, facing: 'left' }] },
    cast: {
      k1: keeper(16, 32),
      k2: keeper(84, 32),
    },
    balls: { ball: 'k1' },
    beats: [
      beat('Keeper 1 attacks…', 1.6, shoot('k1', 'goal:1', { aim: 5, arc: 3, save: 'k2' })),
      beat('Save!', 0.7),
      beat('Instant counter-attack!', 1.6, shoot('k2', 'goal:0', { aim: -4, arc: 2.5, save: 'k1' })),
      beat('Save! Reset for the next one', 1.0, run('k1', [16, 32], { delay: 0.3 }), run('k2', [84, 32], { delay: 0.2 })),
    ],
  }),
}

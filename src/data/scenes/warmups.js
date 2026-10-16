// Warm-up scenes (category: 'warmup'). See docs/animation-system.md.
import { scene, beat, player, coach, run, dribble, pass, tackle, tag, shout, face, leave, collect, rel } from '../../anim/script.js'

// FIFA 11+ lane: two lanes of cones, two runners, coach calling moves.
// Each age version shows the three moves that define it.
const elevenPlus = ({ area, x0, x1, moves }) => {
  const beats = []
  let out = true
  for (const m of moves) {
    const to = out ? x1 : x0
    beats.push(
      beat(m.say, m.dur, shout('c', m.call, { dur: 1.1 }),
        run('p1', [to, 20], m.opts),
        run('p2', [to, 44], { ...m.opts, delay: 0.35, dur: m.dur - 0.4 })),
    )
    out = !out
  }
  const jog = Math.max(2.6, (x1 - x0) / 20)
  if (!out) beats.push(beat('Slow jog back to the start', jog, run('p1', [x0, 20]), run('p2', [x0, 44], { delay: 0.3, dur: jog - 0.3 })))
  return scene({
    area,
    field: { cones: [{ x: x0 + 4, y: 20 }, { x: x1 + 4, y: 20 }, { x: x0 + 4, y: 44 }, { x: x1 + 4, y: 44 }] },
    cast: { p1: player('a', '1', x0, 20), p2: player('a', '2', x0, 44), c: coach(50, 57) },
    beats,
  })
}

export default {
  'eleven-plus-kids-prep': elevenPlus({
    area: 'Cone lane, 15 steps',
    x0: 14,
    x1: 80,
    moves: [
      { say: 'High knees down the lane…', call: 'High knees!', dur: 3.4, opts: { bounce: 12, bounceH: 0.5 } },
      { say: 'Kangaroo hops back — soft landings!', call: 'Kangaroo!', dur: 3.6, opts: { bounce: 6, bounceH: 1.8 } },
      { say: 'Full speed down the lane!', call: 'Full speed!', dur: 2.8 },
    ],
  }),

  'eleven-plus-lite': elevenPlus({
    area: 'Cone lane, 20 steps',
    x0: 11,
    x1: 83,
    moves: [
      { say: 'Open the gates — knee up, swing it out', call: 'Gates!', dur: 3.6, opts: { bounce: 8, bounceH: 0.7 } },
      { say: 'Jump for the header — land soft!', call: 'Header!', dur: 3.2, opts: { bounce: 3, bounceH: 2.6 } },
      { say: 'Full speed!', call: 'Go!', dur: 3.0 },
    ],
  }),

  'eleven-plus-senior': elevenPlus({
    area: 'Cone lane, 25 steps',
    x0: 8,
    x1: 86,
    moves: [
      { say: 'Lunges — long, controlled steps', call: 'Lunges!', dur: 4.2, opts: { bounce: 6, bounceH: 0.4 } },
      { say: '75% pace…', call: '75%!', dur: 3.6 },
      { say: '…then full speed!', call: 'Full speed!', dur: 3.0 },
    ],
  }),

  'traffic-lights': scene({
    area: '20 x 20 square',
    field: { cones: [{ x: 25, y: 12 }, { x: 75, y: 12 }, { x: 25, y: 52 }, { x: 75, y: 52 }] },
    cast: {
      p1: player('a', '1', 34, 20),
      p2: player('a', '2', 64, 46),
      p3: player('a', '3', 66, 20),
      c: coach(14, 32),
    },
    balls: { b1: 'p1', b2: 'p2', b3: 'p3' },
    beats: [
      beat('Green light — dribble!', 2.4, shout('c', 'GREEN!'),
        dribble('p1', [[44, 24], [52, 34]]),
        dribble('p2', [[54, 48], [40, 42]]),
        dribble('p3', [[70, 30], [64, 38]])),
      beat('Red light — stop it dead under your sole!', 1.4, shout('c', 'RED!')),
      beat('Amber — slow, tiny touches', 1.8, shout('c', 'AMBER!'),
        dribble('p1', [50, 28]), dribble('p2', [36, 36]), dribble('p3', [62, 30])),
      beat('Green light — go again!', 2.4, shout('c', 'GREEN!'),
        dribble('p1', [[42, 18], [34, 20]]),
        dribble('p2', [[44, 46], [64, 46]]),
        dribble('p3', [[68, 22], [66, 20]])),
    ],
  }),

  'dynamic-warmup': scene({
    area: '15-step channel',
    field: {
      cones: [10, 24, 38, 52].flatMap((y) => [{ x: 20, y }, { x: 80, y }]),
    },
    cast: {
      p1: player('a', '1', 18, 17),
      p2: player('a', '2', 18, 31),
      p3: player('a', '3', 18, 45),
      c: coach(50, 58),
    },
    beats: [
      beat('High knees across', 3.2, shout('c', 'High knees!'),
        ...['p1', 'p2', 'p3'].map((p, i) => run(p, [82, 17 + i * 14], { bounce: 11, bounceH: 0.5, delay: i * 0.15, dur: 3.05 - i * 0.15 }))),
      beat('Side-steps back — hips facing the coach', 3.4, shout('c', 'Side-steps!'),
        ...['p1', 'p2', 'p3'].map((p, i) => [run(p, [18, 17 + i * 14], { delay: i * 0.15, dur: 3.2 - i * 0.15 }), face(p, [50, 64])])),
      beat('Sprint!', 2.6, shout('c', 'Sprint!'),
        ...['p1', 'p2', 'p3'].map((p, i) => run(p, [82, 17 + i * 14], { delay: i * 0.1, dur: 2.4 }))),
      beat('Jog back — listen for the next move', 3.0,
        ...['p1', 'p2', 'p3'].map((p, i) => run(p, [18, 17 + i * 14], { delay: i * 0.1, dur: 2.8 }))),
    ],
  }),

  'sharks-minnows': scene({
    area: '25 x 25 square',
    field: { cones: [{ x: 22, y: 8 }, { x: 78, y: 8 }, { x: 22, y: 56 }, { x: 78, y: 56 }] },
    cast: {
      m1: player('a', '1', 32, 11),
      m2: player('a', '2', 50, 11),
      m3: player('a', '3', 68, 11),
      s: player('b', 'S', 42, 36),
    },
    balls: { b1: 'm1', b2: 'm2', b3: 'm3' },
    beats: [
      beat('Swim, minnows! Dribble across', 1.8, dribble('m1', [30, 26]), dribble('m2', [52, 24]), dribble('m3', [70, 25]), run('s', [45, 31], { pace: 'walk' })),
      beat('Shark hunts a ball…', 0.9, dribble('m1', [28, 36]), dribble('m2', [57, 31]), dribble('m3', [72, 36]), tackle('s', 'm2', { to: [92, 34] })),
      beat('…and kicks it out!', 1.5, dribble('m1', [30, 52]), dribble('m3', [70, 52]), shout('m2', 'I\'m a shark!'), run('s', [56, 41], { delay: 0.15, dur: 1.1 })),
      beat('Lose your ball — you join the sharks', 1.4, run('m2', [44, 28]), run('s', [64, 42])),
    ],
  }),

  'passing-pairs-warmup': (() => {
    const xs = [32, 44, 56, 68, 78]
    const back = [66, 54, 42, 30, 20]
    const pairStep = (i, x, dur, say, oneTouch) => {
      const [from, to] = i % 2 ? ['p2', 'p1'] : ['p1', 'p2']
      const [fromB, toB] = i % 2 ? ['p4', 'p3'] : ['p3', 'p4']
      return beat(say, dur,
        run('p1', [x, 22]), run('p2', [x, 34]),
        run('p3', [x - 6, 46]), run('p4', [x - 6, 56]),
        pass(from, to, { delay: oneTouch ? 0.05 : 0.2 }), pass(fromB, toB, { delay: oneTouch ? 0.1 : 0.35 }))
    }
    return scene({
      area: '20-step channel',
      field: { cones: [{ x: 18, y: 14 }, { x: 18, y: 60 }, { x: 82, y: 14 }, { x: 82, y: 60 }] },
      cast: {
        p1: player('a', '1', 20, 22),
        p2: player('a', '2', 20, 34),
        p3: player('b', '3', 14, 46),
        p4: player('b', '4', 14, 56),
      },
      balls: { ball: 'p1', ball2: 'p3' },
      beats: [
        ...xs.slice(0, 4).map((x, i) => pairStep(i, x, 1.2, i === 0 ? 'Jog and pass down the channel…' : undefined)),
        ...back.map((x, i) => pairStep(i, x, 0.95, i === 0 ? '…one-touch on the way back' : undefined, true)),
      ],
    })
  })(),

  'crab-attack': scene({
    area: '15 x 15 square',
    field: { cones: [{ x: 30, y: 12 }, { x: 70, y: 12 }, { x: 30, y: 52 }, { x: 70, y: 52 }] },
    cast: {
      p1: player('a', '1', 40, 22),
      p2: player('b', '2', 60, 22),
      p3: player('a', '3', 42, 42),
      p4: player('b', '4', 60, 42),
    },
    beats: [
      beat('Stay low — shuffle and hunt a tag', 2.0,
        run('p1', [46, 30], { bounce: 7, bounceH: 0.35 }), run('p2', [56, 18], { bounce: 7, bounceH: 0.35 }),
        run('p3', [36, 38], { bounce: 7, bounceH: 0.35 }), run('p4', [62, 34], { bounce: 7, bounceH: 0.35 })),
      beat('Tag below the knee!', 1.0, tag('p1', 'p4', { bounce: 4, bounceH: 0.35 }), run('p3', [40, 46], { bounce: 4, bounceH: 0.35 })),
      beat('Tagged — freeze with a hand up', 1.6, shout('p4', 'Frozen!'), run('p1', [48, 26], { bounce: 5, bounceH: 0.35 }), run('p2', [60, 22], { bounce: 5, bounceH: 0.35 })),
      beat('A teammate crawls under to thaw them', 1.4, tag('p2', 'p4')),
      beat('Back in the game!', 1.4, run('p4', [62, 42], { bounce: 4, bounceH: 0.35 }), run('p2', [54, 30], { bounce: 4, bounceH: 0.35 })),
    ],
  }),

  'mirror-match': (() => {
    const moves = [[48, 0], [48, -5], [36, -5], [32, 0], [40, 0]]
    const moves2 = [[66, 0], [58, 0], [58, 2], [70, 2], [64, 0]]
    return scene({
      area: 'Partner pairs',
      cast: {
        l1: player('a', 'L', 40, 22, { face: 90 }),
        f1: player('b', 'F', 40, 34, { face: -90 }),
        l2: player('a', 'L', 64, 40, { face: 90 }),
        f2: player('b', 'F', 64, 52, { face: -90 }),
      },
      beats: moves.map(([x, dy], i) =>
        beat(i === 0 ? 'Leader moves — on your toes…' : i === 2 ? '…follower copies like a reflection!' : undefined, 0.9,
          run('l1', [x, 22 + dy]), run('f1', [x, 34 - dy], { delay: 0.15, dur: 0.75 }), face('l1', 'f1'), face('f1', 'l1'),
          run('l2', [moves2[i][0], 40 + moves2[i][1]]), run('f2', [moves2[i][0], 52 - moves2[i][1]], { delay: 0.15, dur: 0.75 }), face('l2', 'f2'), face('f2', 'l2')),
      ),
    })
  })(),

  'ladder-activation': scene({
    area: 'Ladder lane',
    field: { ladders: [{ x: 30, y: 32, len: 32 }], cones: [{ x: 24, y: 32 }, { x: 80, y: 32 }] },
    cast: {
      p1: player('a', '1', 20, 32),
      q1: player('a', '2', 14, 32),
      q2: player('a', '3', 8, 32),
    },
    beats: [
      beat('Quick feet through the ladder…', 2.6, run('p1', [[30, 32], [62, 32]], { bounce: 16, bounceH: 0.4 }), run('q1', [20, 32], { delay: 0.6, dur: 0.8 }), run('q2', [14, 32], { delay: 0.8, dur: 0.8 })),
      beat('…explode out and SPRINT to the cone!', 1.1, run('p1', [80, 32])),
      beat('Jog back round the outside', 4.2, run('p1', [[84, 42], [40, 44], [10, 40]])),
      beat('Next one goes — new pattern', 2.2, run('q1', [[30, 32], [46, 32]], { bounce: 10, bounceH: 0.4 }), run('p1', [8, 32], { delay: 0.2, dur: 1.4 }), run('q2', [20, 32], { delay: 0.6, dur: 0.8 })),
    ],
  }),

  'follow-the-leader': (() => {
    const route = [[38, 28], [44, 44], [62, 48], [74, 34], [66, 20], [44, 16]]
    return scene({
      area: 'Open area',
      cast: { lead: player('a', 'L', 26, 20), fol: player('b', 'F', 16, 14) },
      balls: { lb: 'lead', fb: 'fol' },
      beats: [
        beat('Leader invents the route…', 3.2, dribble('lead', route.slice(0, 3)), dribble('fol', [[26, 20], ...route.slice(0, 2)], { delay: 0.6, dur: 2.6 })),
        beat('…the duckling copies every turn!', 3.4, dribble('lead', route.slice(3)), dribble('fol', route.slice(2, 5), { dur: 3.4 })),
      ],
    })
  })(),

  'gate-hunters': scene({
    area: 'Gate maze',
    field: {
      gates: [
        [{ x: 25, y: 15 }, { x: 25, y: 23 }],
        [{ x: 48, y: 32 }, { x: 56, y: 32 }],
        [{ x: 72, y: 14 }, { x: 72, y: 22 }],
        [{ x: 30, y: 46 }, { x: 38, y: 46 }],
        [{ x: 70, y: 44 }, { x: 70, y: 52 }],
      ],
    },
    cast: { p1: player('a', '1', 14, 19), p2: player('b', '2', 80, 22) },
    balls: { b1: 'p1', b2: 'p2' },
    beats: [
      beat('Hunt the gates — through under control!', 1.4, dribble('p1', [32, 19]), dribble('p2', [[76, 18], [64, 18]])),
      beat(1.9, dribble('p1', [[46, 24], [52, 37]]), dribble('p2', [[64, 30], [64, 48], [77, 48]])),
      beat('Heads up — plan the next one', 2.0, dribble('p1', [[36, 38], [34, 53]]), dribble('p2', [[86, 38], [84, 26]])),
      beat('Never the same gate twice in a row', 2.0, dribble('p1', [[22, 48], [14, 30], [14, 19]]), dribble('p2', [80, 22])),
    ],
  }),

  'simon-says-ball-feet': scene({
    area: '20 x 20 area',
    field: { cones: [{ x: 25, y: 12 }, { x: 75, y: 12 }, { x: 25, y: 52 }, { x: 75, y: 52 }] },
    cast: { p1: player('a', '1', 36, 20), p2: player('a', '2', 62, 44), p3: player('a', '3', 64, 20), c: coach(14, 32) },
    balls: { b1: 'p1', b2: 'p2', b3: 'p3' },
    beats: [
      beat('"Simon says… dribble!"', 2.2, shout('c', 'Simon says dribble!', { dur: 1.6 }), dribble('p1', [[44, 30], [40, 40]]), dribble('p2', [[52, 36], [56, 26]]), dribble('p3', [[70, 30], [64, 40]])),
      beat('"Simon says… stop it, left foot!"', 1.6, shout('c', 'Simon says STOP!', { dur: 1.4 })),
      beat('"Sit on your ball!" — no Simon says…', 1.6, shout('c', 'Sit on your ball!', { dur: 1.4 }), shout('p2', 'Oops!', { delay: 0.8, dur: 0.8 })),
      beat('Caught out — 3 toe-taps, then rejoin', 1.6, run('p2', [56, 27], { bounce: 3, bounceH: 0.6, dur: 1.4 })),
      beat('"Simon says… dribble!"', 2.2, shout('c', 'Simon says dribble!', { dur: 1.6 }), dribble('p1', [[34, 30], [36, 20]]), dribble('p2', [[52, 36], [62, 44]]), dribble('p3', [[66, 30], [64, 20]])),
    ],
  }),

  'partner-tag': scene({
    area: 'Pairs area',
    field: { cones: [{ x: 25, y: 12 }, { x: 75, y: 12 }, { x: 25, y: 52 }, { x: 75, y: 52 }] },
    cast: { p1: player('a', '1', 40, 28), p2: player('b', '2', 30, 18) },
    balls: { b1: 'p1' },
    beats: [
      beat('Dribble away from your partner!', 2.2, dribble('p1', [[52, 34], [60, 44]]), run('p2', [[42, 28], [52, 38]])),
      beat('Tagged — swap roles!', 0.8, tag('p2', 'p1')),
      beat(0.6, leave('p1'), run('p1', rel(5, -4))),
      beat('Now the tagger takes the ball…', 2.0, collect('p2', { dur: 0.5 }), run('p1', [60, 26], { delay: 0.5, dur: 1.5 })),
      beat('…and the chase is on again', 2.0, dribble('p2', [[48, 46], [36, 38]]), run('p1', [[46, 38], [42, 34]], { delay: 0.3, dur: 1.7 })),
    ],
  }),
}

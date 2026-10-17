// Cool-down scenes (category: 'cooldown'). See docs/animation-system.md.
import {
  scene, beat, player, keeper, coach, figure,
  run, dribble, pass, chip, toss, juggle, shout, pose, highlight,
} from '../../anim/script.js'

// Players evenly spaced on a circle (angle 0 = top, clockwise).
const ring = (n, r, cx = 50, cy = 32, from = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = from + (i / n) * Math.PI * 2
    return [Math.round((cx + Math.sin(a) * r) * 10) / 10, Math.round((cy - Math.cos(a) * r) * 10) / 10]
  })

export default {
  // Illustrated kids (src/anim/kid.js). Figures are side-on people, so the
  // "circle" is shown as the front arc of it, coach included.
  'cooldown-circle': (() => {
    const spots = { c: [15, 50], f1: [38, 54], f2: [62, 54], f3: [85, 50] }
    const who = Object.keys(spots)
    const all = (name, dur = 0.8) => who.map((w) => pose(w, name, { dur }))
    // one slow lap: out along the back of the area and round to the spot
    const lap = (w, i) => run(w, [[spots[w][0] + 6, 36], [50 + (i - 1.5) * 12, 27], [spots[w][0] - 4, 36], spots[w]], { pace: 'jog', delay: i * 0.12 })
    return scene({
      area: 'Team circle',
      cast: {
        c: figure('n', ...spots.c),
        f1: figure('a', ...spots.f1),
        f2: figure('a', ...spots.f2, { flip: true }),
        f3: figure('a', ...spots.f3, { flip: true }),
      },
      beats: [
        beat('One slow lap together…', 4.2, ...who.map(lap)),
        beat('Reach for the sky — side to side', 3.0, ...all('reachUp')),
        beat('Toe touch — fold forward, legs straight', 3.0, ...all('toeTouch')),
        beat('Quad hold — hold your foot, balance!', 3.0, ...all('quadHold'), shout('f2', 'Wobbly!', { delay: 1.3, dur: 1 })),
        beat('Arm across — hold it at the elbow', 3.0, ...all('armAcross')),
        beat('Butterfly sit — share your favourite moment', 3.6, ...all('butterfly'), shout('f1', 'My goal!', { delay: 0.9, dur: 1.2 }), shout('f3', 'The save!', { delay: 2.1, dur: 1.2 })),
        beat('Team cheer on three!', 2.0, ...all('cheer', 0.6), shout('c', '1, 2, 3…', { dur: 0.9 }), shout('f2', 'TEAM!', { delay: 1.0, dur: 0.9 })),
        beat(0.8, ...all('stand', 0.6)),
      ],
    })
  })(),

  'keepy-up-cooldown': scene({
    area: 'Open space',
    cast: { p1: player('a', '1', 36, 30), p2: player('b', '2', 64, 36) },
    balls: { b1: 'p1', b2: 'p2' },
    beats: [
      beat('Soft touches — keep it floating', 3.6, juggle('p1', { count: 6, each: 0.55, height: 3 }), juggle('p2', { count: 5, each: 0.66, height: 3.6, delay: 0.2 })),
      beat('Count them — beat your record', 1.0, shout('p1', '6!', { dur: 0.9 }), shout('p2', '5!', { dur: 0.9, delay: 0.1 })),
    ],
  }),

  // Pairs sit facing each other, soles together (hips 17.4 apart at the
  // figures' scale, so the boots meet in the middle).
  'partner-stretch': (() => {
    // Facing pairs, soles together: at the kids' scale (1.8) their hips sit
    // 26 apart so the boots meet in the middle.
    const A1 = [17, 36], A2 = [43, 36], B1 = [53, 55], B2 = [79, 55]
    const seated = ['f1', 'f2', 'f3', 'f4']
    const all = (name, dur = 0.9) => seated.map((w) => pose(w, name, { dur }))
    // Back-to-back as a coach sees it: one partner faces us, the other sits
    // right behind them (further up the screen = further away).
    const behind = (p) => [p[0], p[1] - 3.2]
    const swap = (who, from, to) => run(who, [[from[0] - 3, from[1] - 6], [to[0] + 8, to[1] - 1], to], { delay: 0.5, pace: 'jog' })
    return scene({
      area: 'Partner pairs',
      cast: {
        f1: figure('a', ...A1, { pose: 'sitReach' }),
        f2: figure('a', ...A2, { pose: 'sitReach', flip: true }),
        f3: figure('a', ...B1, { pose: 'sitReach' }),
        f4: figure('a', ...B2, { pose: 'sitReach', flip: true }),
      },
      beats: [
        beat('Hamstring reach — legs long, hold your feet', 3.4,
          shout('f1', 'Best bit today?', { delay: 0.6, dur: 1.3 }), shout('f2', 'My tackle!', { delay: 2.0, dur: 1.2 })),
        beat('Butterfly — soles together, gentle press', 3.4, ...all('butterfly'),
          shout('f4', 'Your turn first!', { delay: 1.1, dur: 1.3 })),
        beat('Back-to-back — swap seats', 2.9,
          pose('f1', 'sitCross'), pose('f3', 'sitCross'),
          pose('f2', 'stand', { dur: 0.5 }), pose('f4', 'stand', { dur: 0.5 }),
          swap('f2', A2, behind(A1)), swap('f4', B2, behind(B1)),
          pose('f2', 'sitCrossBack', { delay: 2.3, dur: 0.5 }), pose('f4', 'sitCrossBack', { delay: 2.3, dur: 0.5 })),
        beat('Gentle twist — high five behind!', 3.2,
          pose('f1', 'twistFront'), pose('f3', 'twistFront'), pose('f2', 'twistBack'), pose('f4', 'twistBack'),
          shout('f3', 'One thing that went well?', { delay: 0.7, dur: 1.4 }), shout('f4', 'Our passing!', { delay: 2.0, dur: 1.1 })),
        beat('Stand tall — arms round for the team cheer', 3.0,
          ...all('stand', 0.5),
          run('f2', [A1[0] + 12, A1[1]], { delay: 0.4 }), run('f4', [B1[0] + 12, B1[1]], { delay: 0.4 }),
          ...seated.map((w) => pose(w, 'armsAround', { delay: 1.3, dur: 0.6 })),
          shout('f1', '1, 2, 3…', { delay: 1.5, dur: 0.7 }), shout('f2', 'TEAM!', { delay: 2.2, dur: 0.7 })),
      ],
    })
  })(),

  'chip-catch-cooldown': scene({
    area: 'Partner pairs',
    cast: { p1: player('a', '1', 32, 32), p2: player('a', '2', 62, 32) },
    balls: { ball: 'p1' },
    beats: [
      beat('Soft chip with the laces…', chip('p1', 'p2', { at: 'hands', arc: 6 })),
      beat('…gentle catch', 0.6),
      beat('Lob it back underarm', toss('p2', 'p1', { arc: 4.5 })),
      beat(0.6),
    ],
  }),

  'keeper-cooldown': scene({
    area: 'Partner pairs',
    cast: { p1: player('a', '1', 34, 32), gk: keeper(60, 32) },
    balls: { ball: 'p1' },
    beats: [
      beat('Roll it along the ground…', pass('p1', 'gk', { at: 'hands', dur: 1.4 })),
      beat('…scoop and gather', 0.7),
      beat('Gentle underarm back', toss('gk', 'p1', { arc: 3 })),
      beat('Swap knees each time', 0.6),
    ],
  }),

  'silent-circle': (() => {
    const spots = ring(7, 20)
    const ids = ['c', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6']
    return scene({
      area: 'Team circle',
      field: { circle: { x: 50, y: 32, r: 20 } },
      cast: Object.fromEntries(ids.map((id, i) => [id, id === 'c' ? coach(...spots[i], { face: [50, 32] }) : player('a', String(i), ...spots[i], { face: [50, 32] })])),
      beats: [
        beat('Breathe in… 2… 3… 4…', 4.0, highlight([50, 32], { r: 10, rate: Math.PI / 4, dur: 8, color: '#bfe6ff' })),
        beat('…and slowly out… 2… 3… 4…', 4.0),
        beat('One word each: how do you feel?', 3.6, shout('p1', 'Calm', { dur: 1.1 }), shout('p3', 'Tired!', { delay: 1.1, dur: 1.1 }), shout('p5', 'Happy', { delay: 2.2, dur: 1.1 })),
      ],
    })
  })(),

  'walking-football': scene({
    area: 'Walking pitch',
    field: { gates: [[{ x: 10, y: 26 }, { x: 10, y: 38 }], [{ x: 90, y: 26 }, { x: 90, y: 38 }]] },
    cast: {
      a1: player('a', '1', 30, 26),
      a2: player('a', '2', 36, 44),
      b1: player('b', '1', 56, 28),
      b2: player('b', '2', 62, 42),
      c: coach(50, 58),
    },
    balls: { ball: 'a1' },
    beats: [
      beat('Walking pace only!', 2.4, dribble('a1', [40, 27], { pace: 'walk' }), run('a2', [44, 45]), run('b1', [52, 29]), run('b2', [58, 40])),
      beat(1.6, pass('a1', 'a2'), run('a1', [46, 22]), run('b1', [52, 30])),
      beat('Someone breaks into a jog…', 0.9, run('b2', [51, 42])),
      beat('…free kick! No zoomies — pass instead', 1.6, shout('c', 'No running!', { dur: 1.4 }), run('b2', [56, 38], { delay: 0.4, dur: 1.2 })),
      beat(1.8, pass('a2', 'a1'), dribble('a1', [56, 24], { delay: 0.8, dur: 1.0 }), run('a2', [50, 44]), run('b1', [52, 32], { delay: 0.4 })),
    ],
  }),

  'pass-and-praise': (() => {
    const spots = ring(6, 20)
    const ids = ['c', 'p1', 'p2', 'p3', 'p4', 'p5']
    const route = [
      ['c', 'p3', 'Great defending, Zoe!'],
      ['p3', 'p1', 'Loved your passing, Sam!'],
      ['p1', 'p4', 'Brave tackle, Ali!'],
      ['p4', 'c', 'Thanks, coach!'],
    ]
    return scene({
      area: 'Praise circle',
      field: { circle: { x: 50, y: 32, r: 20 } },
      cast: Object.fromEntries(ids.map((id, i) => [id, id === 'c' ? coach(...spots[i]) : player('a', String(i), ...spots[i])])),
      balls: { ball: 'c' },
      beats: route.map(([from, to, words]) =>
        beat(`"${words}"`, 2.4, shout(from, words, { dur: 1.3 }), pass(from, to, { delay: 1.1, dur: 1.1 })),
      ),
    })
  })(),
}

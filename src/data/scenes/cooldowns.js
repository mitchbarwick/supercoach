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
  'cooldown-circle': (() => {
    const who = ['c', 'f1', 'f2', 'f3']
    const all = (name) => who.map((w) => pose(w, name, { dur: 0.8 }))
    return scene({
      area: 'Team circle',
      cast: {
        c: figure('n', 22, 50),
        f1: figure('a', 42, 50),
        f2: figure('a', 60, 50, { flip: true }),
        f3: figure('a', 79, 50),
      },
      beats: [
        beat('Reach for the sky — tall as you can!', 3.2, ...all('reachUp')),
        beat('Toe touch — fold forward, legs straight', 3.2, ...all('toeTouch')),
        beat('Quad hold — heel to bottom, balance!', 3.2, ...all('quadHold'), shout('f2', 'Wobbly!', { delay: 1.4, dur: 1 })),
        beat('Butterfly sit — share your favourite moment', 3.6, ...all('butterfly'), shout('f1', 'My goal!', { delay: 1.0, dur: 1.2 }), shout('f3', 'The save!', { delay: 2.2, dur: 1.2 })),
        beat('Stand tall — team cheer on three!', 1.6, ...all('stand')),
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

  'partner-stretch': (() => {
    const all = (name) => ['f1', 'f2', 'f3', 'f4'].map((w) => pose(w, name, { dur: 0.9 }))
    return scene({
      area: 'Partner pairs',
      cast: {
        f1: figure('a', 30, 34, { pose: 'sitReach' }),
        f2: figure('a', 47, 34, { pose: 'sitReach', flip: true }),
        f3: figure('b', 56, 52, { pose: 'sitReach' }),
        f4: figure('b', 73, 52, { pose: 'sitReach', flip: true }),
      },
      beats: [
        beat('Hamstring reach — legs long, ease forward', 3.4, shout('f1', 'Best bit today?', { delay: 0.6, dur: 1.3 }), shout('f2', 'My tackle!', { delay: 2.0, dur: 1.2 })),
        beat('Butterfly — soles together, gentle press', 3.6, ...all('butterfly'), shout('f4', 'Your turn first!', { delay: 1.2, dur: 1.3 })),
        beat('Back to the reach — swap who talks first', 1.6, ...all('sitReach')),
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

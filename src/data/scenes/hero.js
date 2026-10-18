// Landing-page hero (src/components/LandingHero.jsx). NOT a drill:
// it shows what SuperCoach is for. The coach checks the session on
// their phone, calls out the next drill, and the kids set the cones
// out themselves and play it: a cone weave, then triangle passing,
// then round again.
//
// The kids carry the cones, so cones are NOT field kit here: the hero
// draws them in a layer over the grass (see CONES below), as does the
// end-of-session celebration. Each pick-up / drop lines up with these
// runs — a kid reaches a cone at the END of a beat (runs fill their beat).
//
// The coach stands at the bottom of the hero's stage (y = COACH_Y).
// Keep the kids inside x 26..74 and y 10..34 (above the coach's speech
// bubble) so they fit on a phone.
import { scene, beat, player, coach, run, dribble, pass, face, shout } from '../../anim/script.js'

export const COACH_Y = 44
const C = [50, COACH_Y]
const LOOK_AT_PHONE = [57, 47] // the phone is in the coach's right hand
const LOOK_AT_KIDS = [50, 24]

// The two set-ups the cones move between
const LINE = { a: [42, 26], b: [50, 26], c: [58, 26] }
const TRI = { lb: [42, 29.5], ap: [50, 18], rb: [58, 29.5] }
// Where the kids stand for each drill
const AT = {
  lb: [37.5, 32], ap: [50, 12.5], rb: [62.5, 32], // around the triangle
  l: [33.5, 25.5], r: [68, 26], q: [31.5, 32], // weave: start, far end, next in line
}

// Named beats, so the cone pick-ups below can refer to them.
const beats = []
const add = (...b) => { beats.push(beat(...b)); return beats.length - 1 }

const checkPhone = () => add(1.4, face('c', LOOK_AT_PHONE))
const call = (text) => add(1.2, face('c', LOOK_AT_KIDS), shout('c', text, { delay: 0.1, dur: 1.05 }), run('c', C, { bounce: 1, bounceH: 1.2, dur: 0.5 }))

// Cones: where each starts, then who carries it where. `pick` / `drop`
// are beats: the kid has it from the end of `pick` to the end of `drop`.
export const CONES = [{ start: TRI.lb, legs: [] }, { start: TRI.ap, legs: [] }, { start: TRI.rb, legs: [] }]
// Beats where the coach is reading their phone (its screen lights up).
export const PHONE_BEATS = []

// One round: weave, then triangle. `k` says who starts round the
// triangle (the ball with the bottom-left kid). The weave sends the
// first kid to the far end and brings the second back to the start, so
// they each take the cone nearest them and end the round swapped:
// two rounds bring everyone home.
function round(k) {
  // ---- Cone weave ----
  PHONE_BEATS.push(checkPhone())
  call('Cone weave!')
  const pickW = add(1.0,
    dribble(k.lb, [40, 29.5]),
    run(k.rb, [60, 29.5]),
    face(k.ap, TRI.ap),
  )
  const dropW = add(1.2,
    dribble(k.lb, [40, 25]),
    run(k.ap, [50, 24]),
    run(k.rb, [60, 25]),
  )
  add(1.3,
    dribble(k.lb, AT.l),
    run(k.ap, [[44, 31], AT.q]),
    run(k.rb, AT.r),
    face(k.lb, AT.r, { delay: 1.2 }),
  )
  // out through the cones…
  add(2.6,
    dribble(k.lb, [[38, 25.5], [42, 22.5], [50, 29.5], [58, 22.5], [61.5, 26]]),
    face(k.rb, [61.5, 26]),
    shout('c', 'Close control!', { delay: 1.2, dur: 1.0 }),
  )
  add(1.0,
    pass(k.lb, k.rb, { delay: 0.1 }),
    run(k.lb, [62, 19.5], { delay: 0.35, dur: 0.6 }),
  )
  // …and back
  add(2.6, dribble(k.rb, [[58, 29.5], [50, 22.5], [42, 29.5], [38, 26.5]]))
  add(0.9, pass(k.rb, k.ap, { delay: 0.05 }))

  // ---- Triangle passing ----
  const w = { l: k.rb, r: k.lb, q: k.ap } // where the weave left them
  PHONE_BEATS.push(checkPhone())
  call('Triangle passing!')
  const pickT = add(1.1,
    run(w.l, [40, 23.5]),
    run(w.r, [60, 24]),
    dribble(w.q, [[40, 34], [47, 29.5]]),
  )
  const dropT = add(1.4,
    run(w.l, AT.lb),
    run(w.r, AT.rb),
    dribble(w.q, AT.ap),
  )
  add(
    pass(w.q, w.l, { delay: 0.2 }),
    pass(w.l, w.r),
    pass(w.r, w.q),
    pass(w.q, w.l),
    shout('c', 'Great passing!', { delay: 1.6, dur: 1.0 }),
  )
  add(0.6, face(w.l, TRI.ap), face(w.r, TRI.ap), face(w.q, LOOK_AT_KIDS))

  const [lb, ap, rb] = CONES
  lb.legs.push({ who: k.lb, pick: pickW, drop: dropW, to: LINE.a }, { who: w.l, pick: pickT, drop: dropT, to: TRI.lb })
  ap.legs.push({ who: k.ap, pick: pickW, drop: dropW, to: LINE.b }, { who: w.q, pick: pickT, drop: dropT, to: TRI.ap })
  rb.legs.push({ who: k.rb, pick: pickW, drop: dropW, to: LINE.c }, { who: w.r, pick: pickT, drop: dropT, to: TRI.rb })
  return { lb: w.l, ap: w.q, rb: w.r }
}

const k = { lb: 'p1', ap: 'p3', rb: 'p2' }
round(round(k))

export const HERO = scene({
  area: null,
  trails: 'ball',
  cast: {
    [k.lb]: player('a', '1', ...AT.lb, { face: TRI.ap }),
    [k.ap]: player('a', '3', ...AT.ap, { face: LOOK_AT_KIDS }),
    [k.rb]: player('a', '2', ...AT.rb, { face: TRI.ap }),
    c: coach(...C, { face: LOOK_AT_KIDS }),
  },
  balls: { ball: k.lb },
  beats,
})

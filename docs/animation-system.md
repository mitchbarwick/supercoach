# Drill animation system ("Drill Script")

Every drill diagram in SuperCoach is a **scene**: a short script of football
events — run, dribble, pass, shoot, tackle, save — that the engine turns into
an animated, top-down coaching board. Authors never place the ball by hand.

```
src/anim/script.js       authoring vocabulary (scene, beat, run, pass, …)
src/anim/compile.js      compiler + physics: resolves the script into frames
src/anim/Field.jsx       pitch + kit components (cones, goals, ladders, …)
src/anim/Actors.jsx      player tokens, ball, stick figures, pressed grass, effects
src/anim/figures.js      stretch poses for cool-down figures
src/anim/ball.js         ball panels + spin maths (quaternions)
src/anim/theme.js        colours for teams, kit, lines — restyle everything here
src/components/PitchAnimation.jsx   the player (controls, step bar, slow-mo)
src/data/scenes/*.js     one scene per drill, keyed by drill id
scripts/check-scenes.mjs validator — `npm run check:scenes`
#/anim-lab               dev-only gallery of every animation with warnings
#/anim-lab?set=ball      ball test scenes (src/data/scenes/lab.js), cropped close
```

## Why it works this way

The old diagrams gave every player *and* the ball its own keyframe path. Nothing
tied them together, so a ball could set off before anyone kicked it, or arrive
where the receiver used to be. In Drill Script:

- **The ball has no path of its own.** On every frame it is either *held*
  (at someone's feet or in their hands), *in flight* (one kick, from where it
  was to where the receiver actually is when it arrives), or *loose* (resting
  where it stopped). A ball can't move unless something touches it.
- **Ball actions chain.** A pass can't leave until the ball has reached the
  passer, so `pass(a,b), pass(b,c), pass(c,a)` in one beat plays as three
  first-time passes with no timing maths.
- **The ball spins like a ball.** It's a classic 12-pentagon football drawn in
  3D. On the grass it rolls exactly with the distance it travels (the panels
  tumble over, never spin flat); in the air it keeps the kick's spin —
  backspin on chips, sidespin on curled balls; in the hands it's still. Too
  fast to follow (shots, the instant of a strike) and the panels blur to grey.
- **Players are aware.** Each token has a facing "nose". Players turn to face
  where they run, the pass they're about to play, or the ball they're watching.
  Defenders watch the ball by default.
- **Players move like people.** Runs accelerate from rest, cruise, round
  corners, and brake to a stop. Dribblers push the ball a little ahead and
  gather it each stride.
- **The validator catches what a coach would notice**: a pass by someone who
  hasn't got the ball, players touching, superhuman speeds, leaving the pitch,
  "dribbling" without a ball, a beat whose action overruns.

## Coordinates

The pitch is **100 × 64 units**, origin top-left, y pointing down. The white
boundary sits at 3..97 × 3..61. A player token has radius 2.5; keep players at
least ~6 units apart unless they are tackling/tagging. Rough pace: a jog is
~11 units/s, a sprint up to ~30.

## Anatomy of a scene

```js
import { scene, beat, player, keeper, run, dribble, pass, shoot } from '../../anim/script.js'

'1v1-to-goal': scene({
  area: '1v1 to goal',                              // pill in the control bar
  field: {                                          // static kit (see below)
    goals: [{ x: 90, y: 32, facing: 'left' }],
    cones: [{ x: 30, y: 16 }, { x: 30, y: 48 }],
  },
  cast: {
    att: player('a', 'A', 30, 32),                   // team, label, x, y
    def: player('b', 'D', 70, 34),
    gk: keeper(86, 32),
  },
  balls: { ball: 'def' },                           // who starts with it (or [x, y])
  beats: [
    beat('Defender serves and closes…', 1.5,         // caption, seconds
      pass('def', 'att'),
      run('def', [53, 32], { delay: 0.35 })),
    beat('Take them on!', 1.0, dribble('att', [42, 31])),
    beat('Beaten — finish!', 1.0, shoot('att', 'goal:0', { aim: -5 })),
  ],
}),
```

- A **beat** is one step of the story. Its caption shows under the pitch and it
  gets a segment in the tap-to-jump step bar. Beats without a caption continue
  the previous step. Omit the duration to size a beat from its ball actions.
- Everything in a beat starts together; use `delay` to stagger within it.
- A run/dribble without `dur` fills the rest of the beat.
- Scenes **loop**. If everyone ends where they started (and the ball is back
  with its first holder) the loop is seamless; otherwise the engine holds the
  last frame briefly and cross-fades. Don't contort a drill to make it seamless.

## Vocabulary

| Action | What it does |
| --- | --- |
| `run(who, to, opts)` | Move without the ball. `to`: `[x,y]`, a route `[[x,y],…]`, a cast id, or `rel(dx,dy)`. Opts: `delay`, `dur`, `pace` (`walk`/`jog`/`run`/`sprint`), `hop` (one jump — hurdles), `bounce` + `bounceH` (repeated hops — ladders, high knees), `dive` (keeper stretch). |
| `dribble(who, to, opts)` | Same as run, with the ball at their feet (wavy trail). Validator complains if they don't have it. |
| `face(who, target)` | Turn to look at a player/point for the beat — combine with `run` for side-steps and jockeying. |
| `pass(from, to, opts)` | Ground pass. To a player: lands at their feet wherever they are on arrival (so passing to a runner plays it into their stride). To a point: rolls there and stops. Opts: `dur`, `delay`, `arc`, `curve`, `at` (`feet`/`knee`/`chest`/`head`/`hands`), `hit: [x,y]` (ball strikes the receiver and ricochets — ball tag). |
| `chip` / `cross` | Lofted pass (default `arc` 6 / 7). |
| `toss(from, to, opts)` | Thrown from the hands (coach serves, keeper throws). |
| `shoot(from, target, opts)` | `target`: `'goal:0'` or a point. Opts: `aim` (along the goal mouth), `save: 'gk'` (keeper dives and catches), `parry: [x,y]`, `miss`, `bar` (crossbar — `true` or the rebound spot), `arc`, `curve`. Nets ripple and show GOAL!. |
| `pass/shoot(from, 'ball:t1', { knock })` | Strike a resting ball (balls on cones) and send it flying. |
| `rebound(to)` | A ball resting against something with no player (rebounder, wall) is sent on. |
| `collect(who, opts)` | Run onto a loose ball and take it. `ball: id` to choose which. |
| `tackle(who, victim, opts)` | Close in and win it (`win`, default) or poke it away (`to: [x,y]`). |
| `tag(who, victim)` | Touch-tag, no ball. |
| `juggle(who, { count, each, height })` | Keepy-ups. |
| `pickUp(who)` / `drop(who)` / `leave(who)` | Ball to hands / to feet / left resting where it is. |
| `shout(who, text)` | Speech bubble — commands ("RED!"), counts, praise. |
| `highlight(target, { r, rate, color })` | Pulsing ring on a spot or player; slow `rate` for breathing. |
| `pose(who, name)` | Stretch figures morph to a pose (`figures.js`). |

Cast helpers: `player(team, label, x, y, opts)`, `keeper(x, y)`, `coach(x, y)`,
`figure(team, x, y, { pose, flip })`. Teams: `a` coral, `b` blue, `n` amber
(coach/neutral), `k` purple (keeper), `x` grey (passive). `opts.face` sets the
starting facing (degrees, a point, or a cast id).

Ball start: `balls: { b: 'p1' }` (at p1's feet), `{ b: [x, y] }` (resting),
or `{ b: { with: 'srv', in: 'hands' } }`.

## Field kit

All drawn top-down, as a coach sees them looking at the grass.

| Key | Shape |
| --- | --- |
| `cones` | `[{x, y}]` marker cones |
| `discs` | `[{x, y}]` flat markers |
| `gates` | `[[{x,y},{x,y}]]` two cones + dashed opening |
| `goals` | `[{x, y, facing, w?, depth?}]` — `x,y` is the centre of the goal line; `facing` is the way the mouth opens (`right`/`left`/`up`/`down`). Referenced as `'goal:0'`… |
| `rebounders` | `[{x, y, facing, w?}]` — `'rebounder:0'` |
| `zones` | `[{x, y, w, h}]` shaded areas |
| `circle` | `{x, y, r}` dashed circle (rondos, rings) |
| `lines` | `[[x1, y1, x2, y2, dashed?]]` |
| `ladders` | `[{x, y, len, w?, gap?}]` |
| `hurdles` | `[{x, y, w?, dir: 'v'|'h'}]` — bar across the running line |
| `hoops` | `[{x, y, r}]` |
| `mannequins` | `[{x, y}]` |
| `flags` | `[{x, y, color?}]` |

## Workflow

1. Add or edit the scene in `src/data/scenes/<category>.js` under the drill's id.
2. `npm run check:scenes` (or `npm run check:scenes <id>`) until it says clean.
3. Look at it: `npm run dev`, open `#/anim-lab?id=<id>`.
   `&t=2.4` freezes at 2.4 s; `?cat=game&frac=0.5&cols=2` is a contact sheet.
4. Watch it at ½× once — that's how coaches will study it.

## Style notes

- Show the **one idea** the drill teaches, with only the players needed to show
  it (2–6 is typical). Queues of 1–2 waiting players give context cheaply.
- Captions are short and action-led ("Drop the shoulder…", "…burst past!").
  Split a move across two beats with ellipses so the step bar tells the story.
- Use `shout` for things the coach or players actually say; use captions for
  what the viewer should notice.
- Trails are automatic and "in the world": a passed or shot ball flattens a
  pale streak in the grass while it runs along the ground (not in the air, and
  not while dribbled — the footprints show that) and players leave footprints.
  The grass springs back from the oldest end: ~2.6 s for a normal pass, less
  for a soft one, up to ~1.5× for a shot; ~1.8 s for feet (tune in `WAKE`,
  theme.js). `trails: 'ball'` shows only the
  ball's streak; `false` turns them off.
- Prefer a fade loop over an unnatural "everyone jogs back to start" ending.

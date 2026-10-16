// Compiles every drill scene and reports anything that would look
// wrong to a coach (ball played by someone who hasn't got it,
// players overlapping, impossible speeds, dribbling without a ball…).
//   npm run check:scenes            all scenes
//   npm run check:scenes rondo      just one
import { SCENES } from '../src/data/scenes/index.js'
import { compileScene } from '../src/anim/compile.js'

const only = process.argv[2]
let bad = 0
for (const [id, s] of Object.entries(SCENES)) {
  if (only && id !== only) continue
  let out
  try {
    out = compileScene(s)
  } catch (e) {
    bad++
    console.log(`✗ ${id}: crashed — ${e.stack}`)
    continue
  }
  const loop = out.fade ? 'fade loop' : 'seamless loop'
  if (out.warnings.length) {
    bad++
    console.log(`✗ ${id} (${out.duration.toFixed(1)}s, ${loop})`)
    for (const w of out.warnings) console.log(`    · ${w}`)
  } else console.log(`✓ ${id} (${out.duration.toFixed(1)}s, ${loop})`)
}
console.log(bad ? `\n${bad} scene(s) need attention` : '\nAll scenes clean')
process.exitCode = bad ? 1 : 0

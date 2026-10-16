// Every drill's animation, keyed by drill id. drills.js attaches
// these as `drill.diagram`. Authoring guide: docs/animation-system.md
import warmups from './warmups.js'
import drills from './drills.js'
import games from './games.js'
import cooldowns from './cooldowns.js'

export const SCENES = {
  ...warmups,
  ...drills,
  ...games,
  ...cooldowns,
}

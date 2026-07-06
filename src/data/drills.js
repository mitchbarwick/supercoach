// ============================================================
// SuperCoach curated drill library.
// Every drill carries a `diagram` spec consumed by the
// PitchAnimation system (top-down pitch, 100 x 64 unit space).
// Teams: 'a' = coral, 'b' = blue, 'n' = amber (neutral/coach),
// 'k' = keeper (purple). Paths are keyframes {t: 0..1, x, y}.
//
// Physics notes for path authors:
// - Balls default to decelerating 'out' easing (a kick starts fast
//   and slows). Author each kick/pass/shot as ONE segment — never
//   split a single flight across keyframes or it will visibly
//   stop and restart mid-air.
// - Destination keyframes may carry `ease: 'linear'|'in'|'out'|'inout'`
//   and `arc: <peak height in units>` for lofted balls (chips,
//   shots over walls, juggling). Shadows shrink with arc height.
// - Repeat identical coords across two keyframes to hold a ball still.
//
// `kidExplanation` is keyed by age group so younger squads get a
// simpler, more imaginative script and older squads get straight
// football language. Use sayToKids(drill, ageGroup) to read it.
// ============================================================

export const FOCUS_AREAS = [
  { id: 'fitness', label: 'Fitness & agility', emoji: '⚡' },
  { id: 'dribbling', label: 'Dribbling & ball skills', emoji: '🎯' },
  { id: '1v1', label: '1 v 1 skills', emoji: '🤺' },
  { id: 'passing', label: 'Passing', emoji: '🔁' },
  { id: 'triangles', label: 'Triangles & movement', emoji: '🔺' },
  { id: 'shooting', label: 'Shooting & finishing', emoji: '🥅' },
  { id: 'defending', label: 'Defending', emoji: '🛡️' },
  { id: 'goalkeeping', label: 'Goalkeeping', emoji: '🧤' },
  { id: 'teamwork', label: 'Teamwork & games', emoji: '🤝' },
];

export const EQUIPMENT = [
  { id: 'balls', label: 'Balls', emoji: '⚽' },
  { id: 'cones', label: 'Cones', emoji: '🔶' },
  { id: 'vests', label: 'Bibs / vests', emoji: '🦺' },
  { id: 'goals', label: 'Goals', emoji: '🥅' },
  { id: 'ladder', label: 'Agility ladder', emoji: '🪜' },
  { id: 'hurdles', label: 'Hurdles', emoji: '🚧' },
  { id: 'discs', label: 'Marker discs', emoji: '⭕' },
  { id: 'flags', label: 'Corner flags', emoji: '🚩' },
  { id: 'rebounder', label: 'Rebounder / kickback net', emoji: '🕸️' },
  { id: 'mannequins', label: 'Training mannequins', emoji: '🧍' },
  { id: 'hoops', label: 'Flat hoops / rings', emoji: '🔵' },
];

export const AGE_GROUPS = [
  { id: 'U6-U8', label: 'Under 6–8' },
  { id: 'U9-U11', label: 'Under 9–11' },
  { id: 'U12-U14', label: 'Under 12–14' },
  { id: 'U15+', label: 'Under 15+' },
];

// helper for a static entity
const still = (x, y) => [{ t: 0, x, y }, { t: 1, x, y }];

export const DRILLS = [
  // ================= WARM-UPS =================
  {
    id: 'traffic-lights',
    name: 'Traffic Lights',
    emoji: '🚦',
    category: 'warmup',
    focus: ['dribbling', 'fitness'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 30 },
    baseDuration: 8,
    blurb: 'Dribbling warm-up where players react to your calls.',
    setup: [
      'Mark out a square roughly 20 x 20 steps with cones.',
      'Every player has a ball inside the square.',
      'You stand at the edge where everyone can hear you.',
    ],
    howToPlay: [
      'Players dribble anywhere inside the square.',
      '"Green light" = dribble at speed. "Amber" = slow, small touches. "Red" = stop the ball dead with the sole of the foot.',
      'Add fun calls: "roundabout" = spin with the ball, "reverse" = dribble backwards.',
      'Anyone who bumps a ball or misses a call does 3 star jumps and rejoins.',
    ],
    coachingPoints: [
      'Little touches — the ball should stay within one step of the player.',
      'Heads up between touches so they don\'t crash.',
      'Praise quick reactions loudly — speed of response matters more than speed of running.',
    ],
    kidExplanation: {
      'U6-U8': 'Your ball is your little car! Green means drive fast, amber means drive slowly, and red means park your car with your foot on top. Ready? Green light!',
      'U9-U11': 'Your ball is your car and this square is the town. When I shout a traffic light colour, your car has to obey it — red means stop the ball dead under your foot!',
      'U12-U14': 'Dribble anywhere in the square and react to my calls — red means kill the ball dead under your sole instantly. Quick reactions, quick feet, eyes up between touches.',
      'U15+': 'Free dribbling in the grid — respond to every call instantly. I\'m watching your first touch after each change of pace and whether your head\'s up between touches.',
    },
    adaptations: {
      easier: ['Make the square bigger so there\'s more space.', 'Walk-pace only for the first two minutes.'],
      harder: ['Shrink the square.', 'Weak foot only.', 'Add "swap" — leave your ball and find a new one.'],
    },
    diagram: {
      duration: 8,
      areaLabel: '20 x 20 square',
      cones: [{ x: 25, y: 12 }, { x: 75, y: 12 }, { x: 25, y: 52 }, { x: 75, y: 52 }],
      phases: [
        { t: 0, label: 'Green light — dribble!' },
        { t: 0.45, label: 'Red light — stop the ball!' },
        { t: 0.65, label: 'Green light — go again' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 35, y: 20 }, { t: 0.45, x: 60, y: 40 }, { t: 0.65, x: 60, y: 40 }, { t: 1, x: 40, y: 28 }] },
        { id: 'b1', kind: 'ball', path: [{ t: 0, x: 37, y: 22 }, { t: 0.45, x: 62, y: 42 }, { t: 0.65, x: 62, y: 42 }, { t: 1, x: 42, y: 30 }] },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 65, y: 45 }, { t: 0.45, x: 40, y: 22 }, { t: 0.65, x: 40, y: 22 }, { t: 1, x: 66, y: 34 }] },
        { id: 'b2', kind: 'ball', path: [{ t: 0, x: 63, y: 43 }, { t: 0.45, x: 38, y: 20 }, { t: 0.65, x: 38, y: 20 }, { t: 1, x: 64, y: 32 }] },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 50, y: 48 }, { t: 0.45, x: 52, y: 18 }, { t: 0.65, x: 52, y: 18 }, { t: 1, x: 34, y: 44 }] },
        { id: 'b3', kind: 'ball', path: [{ t: 0, x: 52, y: 46 }, { t: 0.45, x: 54, y: 20 }, { t: 0.65, x: 54, y: 20 }, { t: 1, x: 36, y: 46 }] },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(14, 32) },
      ],
    },
  },
  {
    id: 'dynamic-warmup',
    name: 'Dynamic Warm-Up Lines',
    emoji: '🏃',
    category: 'warmup',
    focus: ['fitness'],
    equipment: ['cones'],
    players: { min: 4, max: 30 },
    baseDuration: 6,
    blurb: 'Jogging, skipping and stretching between two cone lines.',
    setup: [
      'Two lines of cones about 15 steps apart.',
      'Players line up along the first line, spread out.',
    ],
    howToPlay: [
      'Players travel to the far line and jog back, one move per trip:',
      'Jog → high knees → heel flicks → side steps (both ways) → skips with arm circles → lunges → 70% run → sprint.',
      'Call the next move as they return.',
    ],
    coachingPoints: [
      'Quality over speed until the final two runs.',
      'Knees drive up on high-knees; heels touch bottoms on flicks.',
      'Use the trips back to take a headcount and set the tone.',
    ],
    kidExplanation: {
      'U6-U8': 'Copy my moves across the grass — high knees like a marching band, kicky heels, giant skips! Every trip across wakes up a new sleepy body part.',
      'U9-U11': 'We\'re robots being switched on one body part at a time. Every trip across wakes up a new part — by the last sprint you\'ll be fully charged!',
      'U12-U14': 'Down and back, one movement per length — quality first, pace later. We build from jog to sprint so your muscles are ready for the real work.',
      'U15+': 'Standard activation lengths — jog through to sprint. Do each movement properly; this is injury prevention, not a race until the final two runs.',
    },
    adaptations: {
      easier: ['Shorten the distance to 10 steps.'],
      harder: ['Add a ball for the final runs — dribble at speed and stop it on the line.'],
    },
    diagram: {
      duration: 6,
      areaLabel: '15-step channel',
      cones: [{ x: 20, y: 10 }, { x: 20, y: 24 }, { x: 20, y: 38 }, { x: 20, y: 52 }, { x: 80, y: 10 }, { x: 80, y: 24 }, { x: 80, y: 38 }, { x: 80, y: 52 }],
      phases: [
        { t: 0, label: 'High knees across' },
        { t: 0.5, label: 'Jog back — listen for the next move' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 22, y: 14 }, { t: 0.45, x: 78, y: 14 }, { t: 0.55, x: 78, y: 14 }, { t: 1, x: 22, y: 14 }] },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 22, y: 28 }, { t: 0.45, x: 78, y: 28 }, { t: 0.55, x: 78, y: 28 }, { t: 1, x: 22, y: 28 }] },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 22, y: 42 }, { t: 0.45, x: 78, y: 42 }, { t: 0.55, x: 78, y: 42 }, { t: 1, x: 22, y: 42 }] },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(50, 58) },
      ],
    },
  },
  {
    id: 'sharks-minnows',
    name: 'Sharks & Minnows',
    emoji: '🦈',
    category: 'warmup',
    focus: ['dribbling', '1v1', 'fitness'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 5, max: 24 },
    baseDuration: 8,
    blurb: 'Dribblers try to cross the square without a shark stealing their ball.',
    setup: [
      'Square about 25 x 25 steps.',
      'Everyone with a ball ("minnows") lines up on one side.',
      '1–2 players without balls wear bibs — they are the "sharks" in the middle.',
    ],
    howToPlay: [
      'On your call, minnows dribble across to the far side.',
      'Sharks try to kick their balls out of the square.',
      'Lose your ball and you become a shark next round.',
      'Last minnow swimming wins!',
    ],
    coachingPoints: [
      'Keep the ball on the far side of your body from the shark.',
      'Look up, spot the gaps, change speed to escape.',
      'Sharks: stay low, watch the ball not the eyes.',
    ],
    kidExplanation: {
      'U6-U8': 'You\'re a little fish and your ball is your shiny tail! Swim across without letting the shark kick your tail away — if they do, you grow fins and become a shark too!',
      'U9-U11': 'You\'re little fish swimming across shark waters — your ball is your tail! If a shark kicks your tail away, you grow fins and join the shark team.',
      'U12-U14': 'Dribble across the square without the defenders winning your ball. Shield it, change speed, pick your moment. Lose it and you join the defenders.',
      'U15+': 'Ball-carriers cross the grid under pressure; defenders hunt. Work on shielding, scanning before you go, and exploding through gaps. Lose the ball, switch roles.',
    },
    adaptations: {
      easier: ['One shark only.', 'Sharks walk for round one.'],
      harder: ['Add more sharks.', 'Minnows must dribble through a gate on the far line.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '25 x 25 square',
      cones: [{ x: 22, y: 8 }, { x: 78, y: 8 }, { x: 22, y: 56 }, { x: 78, y: 56 }],
      phases: [
        { t: 0, label: 'Swim, minnows!' },
        { t: 0.55, label: 'Shark steals a ball!' },
      ],
      entities: [
        { id: 'm1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 30, y: 12 }, { t: 0.6, x: 34, y: 38 }, { t: 1, x: 30, y: 52 }] },
        { id: 'bm1', kind: 'ball', path: [{ t: 0, x: 32, y: 14 }, { t: 0.6, x: 36, y: 40 }, { t: 1, x: 32, y: 54 }] },
        { id: 'm2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 55, y: 12 }, { t: 0.55, x: 58, y: 34 }, { t: 1, x: 62, y: 52 }] },
        { id: 'bm2', kind: 'ball', path: [{ t: 0, x: 57, y: 14 }, { t: 0.55, x: 60, y: 36 }, { t: 0.85, x: 86, y: 24 }, { t: 1, x: 86, y: 24 }] },
        { id: 's1', kind: 'player', team: 'b', label: 'S', path: [{ t: 0, x: 50, y: 32 }, { t: 0.55, x: 58, y: 35 }, { t: 0.75, x: 68, y: 31 }, { t: 1, x: 55, y: 30 }] },
      ],
    },
  },

  {
    id: 'passing-pairs-warmup',
    name: 'Passing Pairs Warm-Up',
    emoji: '🔁',
    category: 'warmup',
    focus: ['passing', 'fitness'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 30 },
    baseDuration: 7,
    blurb: 'Jog and pass in pairs down a channel, feet moving before the whistle even blows.',
    setup: [
      'Cone channel about 20 steps long, cones every 5 steps to mark lanes.',
      'Pairs line up at one end, one ball between two.',
    ],
    howToPlay: [
      'Pairs jog together down the channel, passing back and forth every few steps.',
      'At the far cone, switch to one-touch passes on the jog back.',
      'Add movement: shuffle sideways while passing, then backwards jog while passing.',
      'Increase pace each length until it\'s a fast jog.',
    ],
    coachingPoints: [
      'Pass ahead of your partner\'s movement, not at their feet.',
      'Open hips to the target before the ball arrives.',
      'Talk to each other — call for it every time.',
    ],
    kidExplanation: {
      'U6-U8': 'You and your buddy pass the ball back and forth while you walk down the path — the ball loves to travel, so keep it moving between you!',
      'U9-U11': 'You and your partner are on a conveyor belt that only moves if the ball keeps moving between you. Keep it rolling all the way down and back!',
      'U12-U14': 'Jog the channel in pairs, passing on the move. Pass ahead of your partner, call for it every time, and open your hips before the ball arrives.',
      'U15+': 'Passing on the move, building to one-touch. Weight the pass into your partner\'s stride and get your body shape open before receiving.',
    },
    adaptations: {
      easier: ['Walk instead of jog.', 'Stop the ball before every pass.'],
      harder: ['One-touch only both ways.', 'Add a second ball per pair.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '20-step channel',
      cones: [{ x: 20, y: 12 }, { x: 20, y: 52 }, { x: 80, y: 12 }, { x: 80, y: 52 }],
      phases: [
        { t: 0, label: 'Jog and pass down...' },
        { t: 0.5, label: 'One-touch on the way back' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 22, y: 20 }, { t: 0.45, x: 78, y: 20 }, { t: 0.55, x: 78, y: 24 }, { t: 1, x: 22, y: 24 }] },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 22, y: 32 }, { t: 0.45, x: 78, y: 32 }, { t: 0.55, x: 78, y: 28 }, { t: 1, x: 22, y: 28 }] },
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 22, y: 26 }, { t: 0.12, x: 22, y: 26 }, { t: 0.22, x: 35, y: 20 }, { t: 0.34, x: 50, y: 32 }, { t: 0.46, x: 65, y: 20 }, { t: 0.5, x: 78, y: 26 }, { t: 0.62, x: 65, y: 26 }, { t: 0.74, x: 50, y: 30 }, { t: 0.86, x: 35, y: 26 }, { t: 1, x: 22, y: 26 }] },
        { id: 'p3', kind: 'player', team: 'b', label: '3', path: [{ t: 0, x: 22, y: 44 }, { t: 0.5, x: 78, y: 44 }, { t: 1, x: 22, y: 44 }] },
        { id: 'p4', kind: 'player', team: 'b', label: '4', path: [{ t: 0, x: 22, y: 48 }, { t: 0.5, x: 78, y: 48 }, { t: 1, x: 22, y: 48 }] },
      ],
    },
  },
  {
    id: 'crab-attack',
    name: 'Crab Attack',
    emoji: '🦀',
    category: 'warmup',
    focus: ['fitness', 'defending'],
    equipment: ['cones'],
    players: { min: 4, max: 30 },
    baseDuration: 6,
    blurb: 'Low crab-walk tag game that switches on defensive footwork.',
    setup: [
      'Square about 15 x 15 steps.',
      'Everyone starts on hands and feet in a low crab position (or a low defensive squat for older groups) inside the square.',
    ],
    howToPlay: [
      'On "go", everyone shuffles low and tries to tag others below the knee with a foot, without being tagged themselves.',
      'Tagged players freeze with one hand up — unfreeze by a teammate crawling under their legs.',
      'Reset every 45 seconds and call a new rule: only sideways tags count, or freeze needs two teammates to thaw.',
      'Finish with 20 seconds of everyone frozen at once to see who\'s left moving.',
    ],
    coachingPoints: [
      'Stay low the whole time — hips down, like getting ready to defend.',
      'Small quick shuffles beat big lunges.',
      'Heads up — watch for tags coming from the side, not just in front.',
    ],
    kidExplanation: {
      'U6-U8': 'You\'re crabs in a rock pool! Scuttle around nice and low and try to tap someone\'s foot with yours — and don\'t let anyone tap you!',
      'U9-U11': 'You\'re all crabs in a rock pool defending your patch. Stay low, stay sneaky, and don\'t get tapped by another crab\'s claw!',
      'U12-U14': 'Low tag game — stay in a defensive crouch, tag below the knee without getting tagged. It\'s defensive footwork in disguise.',
      'U15+': 'Stay in a low defensive stance the whole round — small lateral shuffles, tag below the knee. This is exactly the footwork you need when jockeying an attacker.',
    },
    adaptations: {
      easier: ['Allow a standing low squat instead of full crab position.', 'Bigger square, slower pace.'],
      harder: ['Smaller square.', 'Only weak-side tags count.'],
    },
    diagram: {
      duration: 6,
      areaLabel: '15 x 15 square',
      cones: [{ x: 30, y: 14 }, { x: 70, y: 14 }, { x: 30, y: 50 }, { x: 70, y: 50 }],
      phases: [
        { t: 0, label: 'Stay low, shuffle and tag!' },
        { t: 0.55, label: 'Tagged — freeze!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 40, y: 24 }, { t: 0.5, x: 52, y: 34 }, { t: 0.6, x: 52, y: 34 }, { t: 1, x: 44, y: 28 }] },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 60, y: 40 }, { t: 0.5, x: 48, y: 30 }, { t: 1, x: 58, y: 44 }] },
        { id: 'p3', kind: 'player', team: 'b', label: '3', path: [{ t: 0, x: 38, y: 44 }, { t: 0.5, x: 44, y: 36 }, { t: 1, x: 36, y: 42 }] },
        { id: 'p4', kind: 'player', team: 'b', label: '4', path: still(64, 22) },
      ],
    },
  },
  {
    id: 'mirror-match',
    name: 'Mirror Match',
    emoji: '🪞',
    category: 'warmup',
    focus: ['1v1', 'dribbling'],
    equipment: ['cones'],
    players: { min: 4, max: 30 },
    baseDuration: 6,
    blurb: 'Partners mirror each other\'s movements to switch on quick feet and defensive stance.',
    setup: [
      'Pairs face each other about 2 steps apart, spread across the area.',
      'No balls needed for round one.',
    ],
    howToPlay: [
      'One partner leads, moving side to side, forwards and back, on their toes — the other mirrors exactly like a reflection.',
      'Switch leader every 20 seconds.',
      'Round 2: leader has a ball and dribbles side to side; follower mirrors the defensive shuffle without a ball.',
      'Round 3: follower tries to actually win the ball once they\'ve read the pattern.',
    ],
    coachingPoints: [
      'Stay on the balls of your feet, knees bent, arms out for balance.',
      'Followers: watch the hips, not the feet — hips show where they\'re really going.',
      'Small, sharp movements beat big lazy ones.',
    ],
    kidExplanation: {
      'U6-U8': 'Copy your partner like a magic mirror! When they wiggle left, you wiggle left. When they hop, you hop — quick as a flash!',
      'U9-U11': 'Your partner is your mirror image — copy every wiggle, shuffle and dodge instantly, like you\'re both looking through a window at each other!',
      'U12-U14': 'Face your partner and mirror every movement instantly. Followers, watch the hips not the feet — hips tell the truth.',
      'U15+': '1v1 reaction work — mirror the leader\'s movements at match speed. Read the hips, stay on your toes, and when the ball comes in round three, time your press to win it.',
    },
    adaptations: {
      easier: ['Slow motion only.', 'Bigger movements, more time to react.'],
      harder: ['Add the ball straight away.', 'Followers try to steal the ball once confident.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Partner pairs',
      cones: [],
      phases: [
        { t: 0, label: 'Leader moves...' },
        { t: 0.5, label: '...mirror copies exactly!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: 'L', path: [{ t: 0, x: 40, y: 24 }, { t: 0.25, x: 48, y: 24 }, { t: 0.5, x: 40, y: 24 }, { t: 0.75, x: 32, y: 24 }, { t: 1, x: 40, y: 24 }] },
        { id: 'p2', kind: 'player', team: 'b', label: 'F', path: [{ t: 0, x: 40, y: 34 }, { t: 0.25, x: 48, y: 34 }, { t: 0.5, x: 40, y: 34 }, { t: 0.75, x: 32, y: 34 }, { t: 1, x: 40, y: 34 }] },
        { id: 'p3', kind: 'player', team: 'a', label: 'L', path: [{ t: 0, x: 65, y: 44 }, { t: 0.3, x: 70, y: 38 }, { t: 0.6, x: 60, y: 44 }, { t: 1, x: 65, y: 44 }] },
        { id: 'p4', kind: 'player', team: 'b', label: 'F', path: [{ t: 0, x: 65, y: 54 }, { t: 0.3, x: 70, y: 48 }, { t: 0.6, x: 60, y: 54 }, { t: 1, x: 65, y: 54 }] },
      ],
    },
  },

  {
    id: 'ladder-activation',
    name: 'Agility Ladder Activation',
    emoji: '🪜',
    category: 'warmup',
    focus: ['fitness'],
    equipment: ['ladder', 'cones'],
    players: { min: 4, max: 20 },
    baseDuration: 8,
    blurb: 'Fast feet through the ladder, sprint out the end, new pattern every trip.',
    setup: [
      'Lay the ladder flat, a start cone 3 steps before it and a sprint cone 5 steps after.',
      'Players queue behind the start cone.',
    ],
    howToPlay: [
      'One at a time, players work through the ladder and jog around the outside back to the queue.',
      'Change the footwork each round: one foot per square → two feet → side steps → in-in-out-out → hops.',
      'ALWAYS sprint from the last square to the sprint cone.',
      'Two ladders side by side turns it into a race.',
    ],
    coachingPoints: [
      'Balls of the feet, quick light taps — the grass should barely feel you.',
      'Arms pump with the feet; rhythm beats raw speed.',
      'Eyes forward over the last few squares, not down at your feet.',
    ],
    kidExplanation: {
      'U6-U8': 'The ladder is a hot bridge — tippy-tap across super fast so your toes don\'t get toasty, then zoom to the cone!',
      'U9-U11': 'Quick feet through the ladder like the ground is lava — light little taps, then explode out the end like a rocket!',
      'U12-U14': 'Fast feet through the ladder, new pattern every round, and always finish with the sprint — the burst out is the football part.',
      'U15+': 'Ladder activation — crisp rhythm, balls of the feet, arms driving. The pattern warms you up; the acceleration out of the last rung is the point.',
    },
    adaptations: {
      easier: ['Walk each pattern through once before going at speed.'],
      harder: ['Race two queues.', 'Coach points left or right as they exit — sprint to that side.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Ladder lane',
      ladders: [{ x: 30, y: 32, len: 32 }],
      cones: [{ x: 22, y: 32 }, { x: 78, y: 32 }],
      phases: [
        { t: 0, label: 'Quick feet through the ladder…' },
        { t: 0.5, label: '…explode out and sprint!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 23, y: 32 }, { t: 0.1, x: 30, y: 32, ease: 'in' }, { t: 0.5, x: 62, y: 32, ease: 'linear' }, { t: 0.62, x: 78, y: 32, ease: 'out' }, { t: 0.78, x: 70, y: 44 }, { t: 1, x: 28, y: 44 }],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(17, 32) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(12, 32) },
      ],
    },
  },
  {
    id: 'follow-the-leader',
    name: 'Follow the Leader',
    emoji: '🦆',
    category: 'warmup',
    focus: ['dribbling', 'fitness'],
    equipment: ['balls'],
    players: { min: 4, max: 30 },
    baseDuration: 7,
    blurb: 'Pairs dribble in a duckling line — the leader invents, the follower copies.',
    setup: [
      'Pairs, both with a ball, spread anywhere in your area.',
      'One is the leader, one follows about 3 steps behind.',
    ],
    howToPlay: [
      'Leaders dribble wherever they like — turns, stops, toe-taps, changes of speed. Followers copy everything.',
      'Swap roles every 60 seconds.',
      'Round 3: leaders try to lose their follower; followers must stay within 5 steps.',
      'Finish with the coach as leader and the whole team following.',
    ],
    coachingPoints: [
      'Leaders: change speed AND direction — that\'s what makes it hard to follow.',
      'Followers: heads up, watch the leader not your own ball.',
      'Praise inventive moves loudly so they spread around the group.',
    ],
    kidExplanation: {
      'U6-U8': 'You\'re a mummy duck and your partner is your duckling! Waddle and wiggle anywhere you like — your duckling has to copy every single move.',
      'U9-U11': 'Leader invents, shadow copies — every trick, turn and burst. Then we swap and you get your revenge!',
      'U12-U14': 'Dribble anywhere; your partner mirrors you 3 steps behind. Leaders, use real match moves — feints, cuts, bursts. Followers, scan constantly.',
      'U15+': 'Paired shadow dribbling — leaders vary speed and direction to shake the follower, followers keep touch-tight control while scanning up at the leader. Both jobs are match skills.',
    },
    adaptations: {
      easier: ['Follower without a ball for round one.'],
      harder: ['Follower must stay within 2 steps.', 'Leader calls a sudden "swap!" and roles flip instantly.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Open area',
      cones: [],
      phases: [
        { t: 0, label: 'Leader invents the route…' },
        { t: 0.5, label: '…duckling copies everything!' },
      ],
      entities: [
        {
          id: 'lead', kind: 'player', team: 'a', label: 'L',
          path: [{ t: 0, x: 25, y: 20 }, { t: 0.25, x: 45, y: 28 }, { t: 0.45, x: 40, y: 44 }, { t: 0.7, x: 62, y: 48 }, { t: 0.85, x: 72, y: 34 }, { t: 1, x: 66, y: 22 }],
        },
        {
          id: 'lb', kind: 'ball',
          path: [{ t: 0, x: 27, y: 22 }, { t: 0.25, x: 47, y: 30 }, { t: 0.45, x: 42, y: 46 }, { t: 0.7, x: 64, y: 50 }, { t: 0.85, x: 74, y: 36 }, { t: 1, x: 68, y: 24 }],
        },
        {
          id: 'fol', kind: 'player', team: 'b', label: 'F',
          path: [{ t: 0, x: 18, y: 16 }, { t: 0.25, x: 36, y: 24 }, { t: 0.45, x: 36, y: 38 }, { t: 0.7, x: 54, y: 46 }, { t: 0.85, x: 66, y: 40 }, { t: 1, x: 62, y: 28 }],
        },
        {
          id: 'fb', kind: 'ball',
          path: [{ t: 0, x: 20, y: 18 }, { t: 0.25, x: 38, y: 26 }, { t: 0.45, x: 38, y: 40 }, { t: 0.7, x: 56, y: 48 }, { t: 0.85, x: 68, y: 42 }, { t: 1, x: 64, y: 30 }],
        },
      ],
    },
  },
  {
    id: 'gate-hunters',
    name: 'Gate Hunters',
    emoji: '🚪',
    category: 'warmup',
    focus: ['dribbling', 'fitness'],
    equipment: ['balls', 'discs'],
    players: { min: 4, max: 30 },
    baseDuration: 7,
    blurb: 'Dribble through as many disc gates as you can in 60 seconds.',
    setup: [
      'Scatter 8–12 small gates (two discs, 2 steps apart) all over your area.',
      'Every player has a ball anywhere in the space.',
    ],
    howToPlay: [
      'On "go", players dribble through as many different gates as possible in 60 seconds.',
      'A gate only counts if the ball goes through under control.',
      'You can\'t go through the same gate twice in a row.',
      'Rounds: count your score, rest 30 seconds, then beat it.',
    ],
    coachingPoints: [
      'Heads up between gates — plan the next two gates, not just one.',
      'Turn tight after each gate; wide loops waste seconds.',
      'Both feet — the fastest route often needs the weaker foot.',
    ],
    kidExplanation: {
      'U6-U8': 'The gates are magic doorways! Drive your ball through as many doorways as you can before the timer beeps — every doorway is a treasure!',
      'U9-U11': 'You\'re gate hunters — 60 seconds to raid as many gates as you can. Plan your route like a treasure map and count your loot!',
      'U12-U14': 'Sixty seconds, as many different gates as possible, ball under control through each. Scan while dribbling and plan two gates ahead.',
      'U15+': 'Timed gate count — route planning, scanning and tight turns under fatigue. If your head is down you\'re losing gates; know your next two before you finish this one.',
    },
    adaptations: {
      easier: ['Wider gates, longer round.', 'Walk-pace round to learn the map.'],
      harder: ['Weak foot only.', 'Remove two gates each round so it gets more crowded.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Gate maze',
      gates: [
        [{ x: 25, y: 15 }, { x: 25, y: 23 }],
        [{ x: 48, y: 32 }, { x: 56, y: 32 }],
        [{ x: 72, y: 14 }, { x: 72, y: 22 }],
        [{ x: 30, y: 46 }, { x: 38, y: 46 }],
        [{ x: 70, y: 44 }, { x: 70, y: 52 }],
      ],
      cones: [],
      phases: [
        { t: 0, label: 'Hunt the gates!' },
        { t: 0.5, label: 'Heads up — plan the next one' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 18, y: 19 }, { t: 0.2, x: 30, y: 19 }, { t: 0.45, x: 50, y: 28 }, { t: 0.55, x: 52, y: 36 }, { t: 0.8, x: 66, y: 48 }, { t: 1, x: 78, y: 48 }],
        },
        {
          id: 'b1', kind: 'ball',
          path: [{ t: 0, x: 20, y: 19 }, { t: 0.2, x: 32, y: 19 }, { t: 0.45, x: 52, y: 30 }, { t: 0.55, x: 52, y: 38 }, { t: 0.8, x: 68, y: 48 }, { t: 1, x: 80, y: 48 }],
        },
        {
          id: 'p2', kind: 'player', team: 'a', label: '2',
          path: [{ t: 0, x: 76, y: 26 }, { t: 0.3, x: 72, y: 16 }, { t: 0.6, x: 52, y: 20 }, { t: 1, x: 34, y: 40 }],
        },
        {
          id: 'b2', kind: 'ball',
          path: [{ t: 0, x: 74, y: 24 }, { t: 0.3, x: 70, y: 18 }, { t: 0.6, x: 50, y: 22 }, { t: 1, x: 32, y: 42 }],
        },
      ],
    },
  },

  // ================= FITNESS =================
  {
    id: 'relay-races',
    name: 'Cone Relay Races',
    emoji: '🏁',
    category: 'drill',
    focus: ['fitness', 'teamwork'],
    equipment: ['cones'],
    players: { min: 6, max: 24 },
    baseDuration: 10,
    blurb: 'Teams race in relay legs — sprint, weave, and turn.',
    setup: [
      'Split into teams of 3–4, one cone lane per team.',
      'Each lane: start cone, then a turn cone 15–20 steps away.',
      'Teams queue behind their start cone.',
    ],
    howToPlay: [
      'First runner sprints to the turn cone, rounds it, sprints back and high-fives the next runner.',
      'First team sitting down wins the round.',
      'Change the movement each round: sprint, side-step, backwards jog, hop.',
      'Add a ball for dribbling relays in later rounds.',
    ],
    coachingPoints: [
      'Turn tight around the cone — decelerate, low body, push off hard.',
      'Cheer teams loudly; energy is the point.',
      'Keep queues short (max 4) so rest time stays low.',
    ],
    kidExplanation: {
      'U6-U8': 'Your team is a pit crew and you\'re the race cars! Zoom to the cone, zoom back, high-five the next driver. First team sitting down wins!',
      'U9-U11': 'Your team is a race car pit crew — each of you drives one lap flat out, and the whole crew has to finish the race to win!',
      'U12-U14': 'Relay legs — sprint out, turn tight around the cone, hand over fast. Winning the turn wins the race.',
      'U15+': 'Competitive relay lengths. Focus on acceleration off the line and braking late into a tight turn — the turn is where races are won and lost.',
    },
    adaptations: {
      easier: ['Shorten the lanes.', 'All runs are jogs.'],
      harder: ['Two turn cones per lane.', 'Dribble a ball and stop it dead on the line for the handover.'],
    },
    diagram: {
      duration: 6,
      areaLabel: '20-step lanes',
      cones: [{ x: 20, y: 16 }, { x: 80, y: 16 }, { x: 20, y: 32 }, { x: 80, y: 32 }, { x: 20, y: 48 }, { x: 80, y: 48 }],
      phases: [
        { t: 0, label: 'Sprint to the cone…' },
        { t: 0.5, label: '…round it and race home!' },
      ],
      entities: [
        { id: 'r1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 20, y: 12 }, { t: 0.45, x: 80, y: 12 }, { t: 0.55, x: 80, y: 20 }, { t: 1, x: 20, y: 20 }] },
        { id: 'r2', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 20, y: 28 }, { t: 0.5, x: 80, y: 28 }, { t: 0.6, x: 80, y: 36 }, { t: 1, x: 22, y: 36 }] },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(14, 16) },
        { id: 'q2', kind: 'player', team: 'b', label: '2', path: still(14, 32) },
        { id: 'r3', kind: 'player', team: 'n', label: '1', path: [{ t: 0, x: 20, y: 44 }, { t: 0.48, x: 80, y: 44 }, { t: 0.58, x: 80, y: 52 }, { t: 1, x: 21, y: 52 }] },
        { id: 'q3', kind: 'player', team: 'n', label: '2', path: still(14, 48) },
      ],
    },
  },
  {
    id: 'slalom-circuit',
    name: 'Slalom Dribble Circuit',
    emoji: '🌀',
    category: 'drill',
    focus: ['fitness', 'dribbling'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 20 },
    baseDuration: 10,
    blurb: 'Weave through cones with the ball, sprint back without it.',
    setup: [
      'Lines of 5–6 cones, 2 steps apart, one line per group of 3–4 players.',
      'Each group queues at the start of their line with one ball each.',
    ],
    howToPlay: [
      'First player weaves through the cones with the ball.',
      'At the end, they turn, dribble straight back down the side, and hand over.',
      'Round 2: weave down, leave the ball at the end, sprint back — next player sprints out to collect it.',
      'Time each full group lap and challenge them to beat it.',
    ],
    coachingPoints: [
      'Both feet! Inside and outside of the boot.',
      'Small touches into the turns, bigger touch out of the last cone.',
      'Knees bent, arms out for balance.',
    ],
    kidExplanation: {
      'U6-U8': 'The cones are sleepy dragons! Tiptoe your ball past every single one with tiny little touches — touch a dragon and it wakes up!',
      'U9-U11': 'The cones are defenders frozen in ice. Wiggle past every single one without waking them up — touch a cone and it wakes up!',
      'U12-U14': 'Weave the slalom with both feet, inside and outside. Small touches into the turns, a bigger touch out of the last cone, then race back.',
      'U15+': 'Slalom at the fastest speed you can control — both feet, tight touches, explode out of the final cone. We\'re timing group laps, so clean beats flashy.',
    },
    adaptations: {
      easier: ['Space cones 3–4 steps apart.', 'No timing pressure.'],
      harder: ['Weak foot only.', 'Cones 1 step apart.', 'Race two lines head-to-head.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Slalom lines',
      cones: [{ x: 30, y: 22 }, { x: 40, y: 22 }, { x: 50, y: 22 }, { x: 60, y: 22 }, { x: 70, y: 22 }, { x: 30, y: 44 }, { x: 40, y: 44 }, { x: 50, y: 44 }, { x: 60, y: 44 }, { x: 70, y: 44 }],
      phases: [
        { t: 0, label: 'Weave through every gap' },
        { t: 0.6, label: 'Turn and bring it home' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [
            { t: 0, x: 22, y: 22 }, { t: 0.1, x: 30, y: 18 }, { t: 0.2, x: 40, y: 26 }, { t: 0.3, x: 50, y: 18 }, { t: 0.4, x: 60, y: 26 }, { t: 0.5, x: 70, y: 18 }, { t: 0.6, x: 78, y: 22 }, { t: 1, x: 22, y: 14 },
          ],
        },
        {
          id: 'b1', kind: 'ball',
          path: [
            { t: 0, x: 24, y: 22 }, { t: 0.1, x: 32, y: 18 }, { t: 0.2, x: 42, y: 26 }, { t: 0.3, x: 52, y: 18 }, { t: 0.4, x: 62, y: 26 }, { t: 0.5, x: 72, y: 18 }, { t: 0.6, x: 80, y: 22 }, { t: 1, x: 24, y: 14 },
          ],
        },
        {
          id: 'p2', kind: 'player', team: 'b', label: '1',
          path: [
            { t: 0, x: 22, y: 44 }, { t: 0.12, x: 30, y: 40 }, { t: 0.24, x: 40, y: 48 }, { t: 0.36, x: 50, y: 40 }, { t: 0.48, x: 60, y: 48 }, { t: 0.6, x: 70, y: 40 }, { t: 0.7, x: 78, y: 44 }, { t: 1, x: 22, y: 36 },
          ],
        },
        {
          id: 'b2', kind: 'ball',
          path: [
            { t: 0, x: 24, y: 44 }, { t: 0.12, x: 32, y: 40 }, { t: 0.24, x: 42, y: 48 }, { t: 0.36, x: 52, y: 40 }, { t: 0.48, x: 62, y: 48 }, { t: 0.6, x: 72, y: 40 }, { t: 0.7, x: 80, y: 44 }, { t: 1, x: 24, y: 36 },
          ],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(16, 22) },
        { id: 'q2', kind: 'player', team: 'b', label: '2', path: still(16, 44) },
      ],
    },
  },
  {
    id: 'ball-tag',
    name: 'Ball Tag',
    emoji: '🏷️',
    category: 'drill',
    focus: ['fitness', 'dribbling', 'teamwork'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 24 },
    baseDuration: 8,
    blurb: 'Taggers dribble and try to hit runners below the knee with a pass.',
    setup: [
      'Square about 25 x 25 steps.',
      '2–3 taggers in bibs, each with a ball. Everyone else spreads out inside, no ball.',
    ],
    howToPlay: [
      'Taggers dribble and try to pass their ball so it touches a runner below the knee.',
      'Tagged runners grab a ball and join the taggers.',
      'Last runner free wins and starts as a tagger next game.',
    ],
    coachingPoints: [
      'Taggers must dribble close before passing — long hopeful hits rarely work.',
      'Runners: sharp changes of direction beat pure speed.',
      'Sneaky teamwork between taggers — trap runners in corners.',
    ],
    kidExplanation: {
      'U6-U8': 'It\'s stuck in the mud, but the taggers tag you by rolling their ball to touch your feet! Dodge and dart like a squirrel and don\'t get cornered!',
      'U9-U11': 'It\'s stuck-in-the-mud but the taggers have footballs. They can only tag you by passing the ball against your feet or shins — so dodge, dart and don\'t get cornered!',
      'U12-U14': 'Taggers hunt with a ball each and tag by passing against your feet or shins. Runners: sharp cuts beat straight-line speed.',
      'U15+': 'Taggers must dribble close and hit runners below the knee with a pass — that\'s passing accuracy under fatigue. Runners work on evasive movement and scanning.',
    },
    adaptations: {
      easier: ['Taggers roll the ball by hand to start.', 'Bigger square.'],
      harder: ['Runners also dribble a ball while escaping.', 'Smaller square.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '25 x 25 square',
      cones: [{ x: 22, y: 8 }, { x: 78, y: 8 }, { x: 22, y: 56 }, { x: 78, y: 56 }],
      phases: [
        { t: 0, label: 'Taggers hunt with the ball' },
        { t: 0.6, label: 'Tag! Pass hits below the knee' },
      ],
      entities: [
        { id: 't1', kind: 'player', team: 'b', label: 'T', path: [{ t: 0, x: 35, y: 30 }, { t: 0.5, x: 52, y: 38 }, { t: 0.62, x: 55, y: 40 }, { t: 1, x: 45, y: 26 }] },
        { id: 'tb', kind: 'ball', path: [{ t: 0, x: 37, y: 32 }, { t: 0.5, x: 54, y: 40 }, { t: 0.62, x: 64, y: 44 }, { t: 0.75, x: 64, y: 44 }, { t: 1, x: 47, y: 28 }] },
        { id: 'r1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 60, y: 42 }, { t: 0.62, x: 66, y: 45 }, { t: 1, x: 70, y: 20 }] },
        { id: 'r2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 44, y: 16 }, { t: 0.5, x: 30, y: 46 }, { t: 1, x: 38, y: 14 }] },
        { id: 'r3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 68, y: 14 }, { t: 0.5, x: 72, y: 34 }, { t: 1, x: 56, y: 16 }] },
      ],
    },
  },

  // ================= 1 v 1 =================
  {
    id: '1v1-gates',
    name: '1v1 Through the Gates',
    emoji: '🚪',
    category: 'drill',
    focus: ['1v1', 'dribbling', 'defending'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 4, max: 16 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'defence'],
    blurb: 'Score by dribbling through either of two cone gates.',
    setup: [
      'Square about 15 x 15 steps per pair of players.',
      'Two cone gates (2 steps wide) on opposite sides of the square.',
      'Attacker starts with the ball on one side, defender opposite.',
    ],
    howToPlay: [
      'Defender passes the ball across to the attacker to start the duel.',
      'Attacker scores by dribbling through EITHER gate in control.',
      'Defender scores by winning the ball and dribbling through a gate themselves.',
      'Play 45-second rounds, then swap roles. Rotate opponents every few rounds.',
    ],
    coachingPoints: [
      'Attackers: change of pace beats any trick — slow, slow, EXPLODE.',
      'Use fakes — pretend to go one way, push the ball the other.',
      'Defenders: stay low and patient, force them to one side.',
    ],
    kidExplanation: {
      'U6-U8': 'You\'re a wizard escaping the castle and there are two magic doors! The guard can only watch one door — trick them, then dash through the other!',
      'U9-U11': 'You\'re a wizard trying to escape a castle with two doors. The guard can\'t watch both doors at once — trick them into guarding the wrong one!',
      'U12-U14': '1v1 duel with two gates to attack. Sell the fake, shift the ball the other way, and explode through. Defenders — stay patient and force one way.',
      'U15+': '1v1 with two exits — use change of pace and disguise to commit the defender, then attack the far gate. Defenders: angle your approach to kill one option early.',
    },
    adaptations: {
      easier: ['Make the gates 4 steps wide.', 'Defender walks only.'],
      harder: ['One gate only.', 'Defender starts closer.', 'Winner stays on.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '15 x 15 duel square',
      cones: [{ x: 30, y: 10 }, { x: 70, y: 10 }, { x: 30, y: 54 }, { x: 70, y: 54 }],
      gates: [
        [{ x: 24, y: 24 }, { x: 24, y: 38 }],
        [{ x: 76, y: 24 }, { x: 76, y: 38 }],
      ],
      phases: [
        { t: 0, label: 'Attacker takes on the defender' },
        { t: 0.4, label: 'Fake left…' },
        { t: 0.6, label: '…explode right through the gate!' },
      ],
      entities: [
        {
          id: 'att', kind: 'player', team: 'a', label: 'A',
          path: [{ t: 0, x: 50, y: 14 }, { t: 0.4, x: 44, y: 30 }, { t: 0.5, x: 40, y: 33 }, { t: 0.62, x: 56, y: 36 }, { t: 0.85, x: 74, y: 31 }, { t: 1, x: 80, y: 31 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 52, y: 16 }, { t: 0.4, x: 46, y: 32 }, { t: 0.5, x: 42, y: 35 }, { t: 0.62, x: 58, y: 38 }, { t: 0.85, x: 76, y: 31 }, { t: 1, x: 82, y: 31 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 50, y: 44 }, { t: 0.4, x: 46, y: 38 }, { t: 0.55, x: 38, y: 38 }, { t: 0.8, x: 52, y: 40 }, { t: 1, x: 58, y: 40 }],
        },
      ],
    },
  },
  {
    id: '1v1-channel',
    name: '1v1 End Zone Battle',
    emoji: '⚔️',
    category: 'drill',
    focus: ['1v1', 'dribbling', 'defending'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 16 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'defence'],
    blurb: 'Attack down a channel and stop the ball in the end zone to score.',
    setup: [
      'Channels about 10 steps wide and 20 long, one per pair.',
      'Mark a 2-step "end zone" at each end with cones.',
      'Attacker at one end with the ball, defender guards the far end zone.',
    ],
    howToPlay: [
      'Attacker dribbles down the channel and scores by stopping the ball dead inside the end zone.',
      'Defender wins by kicking the ball out of the channel.',
      'Swap roles each turn. First to 5 wins the channel.',
    ],
    coachingPoints: [
      'Attack the defender\'s front foot to unbalance them.',
      'Shield with your body when the defender lunges.',
      'Score in the corner of the zone furthest from the defender.',
    ],
    kidExplanation: {
      'U6-U8': 'It\'s rugby with your feet! Dribble into the end zone and squash the ball flat with your foot to score a try!',
      'U9-U11': 'It\'s rugby with your feet! Carry the ball into the try zone and stop it dead to score a try. The defender is the last guard — beat them and glory is yours.',
      'U12-U14': 'Attack the channel and score by stopping the ball dead in the end zone. Attack the defender\'s front foot and shield when they lunge.',
      'U15+': 'Directional 1v1 — the value is control over the line, not just beating your man. Unbalance the defender by attacking their front foot; finish in the corner furthest from them.',
    },
    adaptations: {
      easier: ['Widen the channel.', 'Defender can\'t leave the end zone.'],
      harder: ['Narrow the channel.', 'Add a second defender halfway.'],
    },
    diagram: {
      duration: 6,
      areaLabel: '10 x 20 channel',
      cones: [{ x: 18, y: 18 }, { x: 18, y: 46 }, { x: 82, y: 18 }, { x: 82, y: 46 }, { x: 70, y: 18 }, { x: 70, y: 46 }],
      zones: [{ x: 70, y: 18, w: 12, h: 28 }],
      phases: [
        { t: 0, label: 'Drive at the defender' },
        { t: 0.55, label: 'Cut past!' },
        { t: 0.85, label: 'Stop it in the zone — score!' },
      ],
      entities: [
        {
          id: 'att', kind: 'player', team: 'a', label: 'A',
          path: [{ t: 0, x: 22, y: 32 }, { t: 0.45, x: 48, y: 32 }, { t: 0.6, x: 56, y: 24 }, { t: 0.85, x: 74, y: 22 }, { t: 1, x: 75, y: 22 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 24, y: 32 }, { t: 0.45, x: 50, y: 32 }, { t: 0.6, x: 58, y: 24 }, { t: 0.85, x: 76, y: 22 }, { t: 1, x: 76, y: 22 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 66, y: 32 }, { t: 0.45, x: 56, y: 33 }, { t: 0.6, x: 54, y: 34 }, { t: 0.85, x: 66, y: 30 }, { t: 1, x: 68, y: 28 }],
        },
      ],
    },
  },
  {
    id: 'defend-the-castle',
    name: 'Defend the Castle',
    emoji: '🏰',
    category: 'drill',
    focus: ['defending', '1v1', 'teamwork'],
    equipment: ['balls', 'cones'],
    players: { min: 6, max: 18 },
    baseDuration: 10,
    preferredPositions: ['defence'],
    blurb: 'Attackers try to knock the cone-castle over; defenders protect it.',
    setup: [
      'Circle about 15 steps across, a tall cone (the castle) in the middle.',
      '1–2 defenders inside the circle, attackers spread around the outside, one ball between 3–4 attackers.',
    ],
    howToPlay: [
      'Attackers pass around the outside and shoot when they see a gap, trying to knock the castle cone over.',
      'Defenders block shots and clear balls away.',
      'Knock it down = attackers win the round; survive 60 seconds = defenders win.',
      'Rotate defenders every round.',
    ],
    coachingPoints: [
      'Attackers: quick passing moves the defender — shoot after a fast switch.',
      'Defenders: stay between ball and castle, side-on stance.',
      'Shots along the ground only — this is passing accuracy, not power.',
    ],
    kidExplanation: {
      'U6-U8': 'The tall cone is your castle and you\'re the brave knights! The other team fires cannonballs at it — block them with your feet and be the hero!',
      'U9-U11': 'The cone is a castle and the defenders are knights! The attacking team fires cannonballs (passes) at it — knights, throw your bodies (well, feet) in the way!',
      'U12-U14': 'Attackers move the ball fast around the circle and shoot when a gap opens; defenders stay between ball and cone. Quick switches create the gap.',
      'U15+': 'Possession versus a screening defender — shift the ball quickly to move them, strike when the lane opens. Defenders: side-on stance, constantly adjusting your cover line.',
    },
    adaptations: {
      easier: ['Bigger circle, two castles.', 'More defenders.'],
      harder: ['Two balls at once.', 'Attackers limited to two touches.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '15-step circle',
      cones: [{ x: 50, y: 32 }],
      circleRadius: 20,
      phases: [
        { t: 0, label: 'Pass around the outside' },
        { t: 0.55, label: 'Gap! Shoot at the castle!' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: still(24, 18) },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: still(74, 16) },
        { id: 'a3', kind: 'player', team: 'a', label: '3', path: still(78, 46) },
        { id: 'a4', kind: 'player', team: 'a', label: '4', path: still(26, 48) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 26, y: 20 }, { t: 0.25, x: 72, y: 18 }, { t: 0.5, x: 76, y: 44 }, { t: 0.62, x: 76, y: 44 }, { t: 0.8, x: 52, y: 34 }, { t: 1, x: 30, y: 46 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 44, y: 26 }, { t: 0.25, x: 56, y: 26 }, { t: 0.5, x: 58, y: 36 }, { t: 0.8, x: 52, y: 38 }, { t: 1, x: 44, y: 36 }],
        },
      ],
    },
  },
  // ================= PASSING / TRIANGLES =================
  {
    id: 'triangle-passing',
    name: 'Triangle Passing',
    emoji: '🔺',
    category: 'drill',
    focus: ['triangles', 'passing'],
    equipment: ['balls', 'cones'],
    players: { min: 3, max: 24 },
    baseDuration: 10,
    preferredPositions: ['midfield'],
    blurb: 'Groups of three pass around a cone triangle — the shape of football.',
    setup: [
      'Cone triangles with sides about 8 steps, one per group of three.',
      'One player at each cone, one ball per group.',
    ],
    howToPlay: [
      'Pass around the triangle: pass, then FOLLOW your pass to the next cone.',
      'Switch direction on your call.',
      'Progress: receiver takes their first touch AROUND the cone before passing on.',
      'Challenge: how many passes in 60 seconds without a mistake?',
    ],
    coachingPoints: [
      'Pass with the inside of the foot, ankle locked, follow through at the target.',
      'First touch out of your feet, in the direction you\'re going next.',
      'Call the receiver\'s name before every pass.',
    ],
    kidExplanation: {
      'U6-U8': 'Pass the ball around your triangle, then run after it like it\'s your puppy that got loose — chase your pass to the next cone!',
      'U9-U11': 'Triangles are football\'s magic shape — pros make them everywhere. Pass the ball around your triangle, then chase your own pass like it owes you pocket money!',
      'U12-U14': 'Pass and follow around the triangle. Lock the ankle on the pass and take your first touch around the cone, in the direction you\'re playing next.',
      'U15+': 'Triangle rotations — the receiving touch is the point. Take it around the cone at pace, build to one-touch, switch direction on the call.',
    },
    adaptations: {
      easier: ['Smaller triangle.', 'Stop the ball before passing on.'],
      harder: ['One touch only.', 'Two balls in the triangle at once (chaos mode!).'],
    },
    diagram: {
      duration: 6,
      areaLabel: '8-step triangles',
      cones: [{ x: 50, y: 12 }, { x: 28, y: 48 }, { x: 72, y: 48 }],
      phases: [
        { t: 0, label: 'Pass…' },
        { t: 0.33, label: '…and follow your pass' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 50, y: 16 }, { t: 0.08, x: 50, y: 16 }, { t: 0.38, x: 32, y: 46 }, { t: 1, x: 32, y: 46 }],
        },
        {
          id: 'p2', kind: 'player', team: 'a', label: '2',
          path: [{ t: 0, x: 32, y: 46 }, { t: 0.36, x: 32, y: 46 }, { t: 0.42, x: 32, y: 46 }, { t: 0.72, x: 68, y: 46 }, { t: 1, x: 68, y: 46 }],
        },
        {
          id: 'p3', kind: 'player', team: 'a', label: '3',
          path: [{ t: 0, x: 68, y: 46 }, { t: 0.7, x: 68, y: 46 }, { t: 0.76, x: 68, y: 46 }, { t: 1, x: 50, y: 18 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 52, y: 18 }, { t: 0.08, x: 52, y: 18 }, { t: 0.3, x: 34, y: 48 }, { t: 0.42, x: 34, y: 48 }, { t: 0.64, x: 70, y: 48 }, { t: 0.76, x: 70, y: 48 }, { t: 1, x: 54, y: 20 }],
        },
      ],
    },
  },
  {
    id: 'rondo',
    name: 'Rondo (Piggy in the Middle)',
    emoji: '🐷',
    category: 'drill',
    focus: ['triangles', 'passing', 'teamwork', 'defending'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 5, max: 16 },
    baseDuration: 10,
    preferredPositions: ['midfield'],
    blurb: 'Keep-ball in a circle — the classic possession game.',
    setup: [
      'Circle or square about 10–12 steps across per group of 5–7.',
      '4–6 passers around the outside, 1–2 "piggies" in bibs inside.',
    ],
    howToPlay: [
      'Outside players keep the ball away from the piggies.',
      'Piggy touches the ball → the passer who lost it swaps in.',
      '10 passes in a row = a point for the passers (celebrate loudly).',
      'Limit touches as they improve: 3-touch → 2-touch.',
    ],
    coachingPoints: [
      'Open your body — receive with the back foot so you can play both ways.',
      'Move a step or two after passing to make a new angle (that\'s the triangle!).',
      'Disguise passes — look one way, pass the other.',
    ],
    kidExplanation: {
      'U6-U8': 'Piggy in the middle! Keep passing the ball to your friends so the piggy can\'t catch it — the ball is faster than anyone\'s legs!',
      'U9-U11': 'Piggy in the middle with the world\'s most famous rule: the ball does the running, not you. Barcelona play this every single morning — today, so do we.',
      'U12-U14': 'Rondo — keep the ball off the defenders. Receive on your back foot, make a new angle after every pass, and count your passing streak.',
      'U15+': 'Rondo, building to two-touch. Back-foot receptions, disguised passes, constant small movements to keep lanes open. Ten unanswered passes is the win.',
    },
    adaptations: {
      easier: ['Bigger circle, unlimited touches, one piggy.'],
      harder: ['Two-touch max.', 'Two piggies who can pass to each other to escape.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '10-step rondo circle',
      circleRadius: 21,
      cones: [],
      phases: [
        { t: 0, label: 'Zip it around — keep it moving' },
        { t: 0.5, label: 'Piggy closes in… switch it!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(50, 9) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(75, 25) },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: still(68, 52) },
        { id: 'p4', kind: 'player', team: 'a', label: '4', path: still(32, 52) },
        { id: 'p5', kind: 'player', team: 'a', label: '5', path: still(25, 25) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 52, y: 11 }, { t: 0.18, x: 74, y: 26 }, { t: 0.36, x: 67, y: 51 }, { t: 0.55, x: 34, y: 51 }, { t: 0.75, x: 27, y: 26 }, { t: 1, x: 52, y: 11 }],
        },
        {
          id: 'pig', kind: 'player', team: 'b', label: 'P',
          path: [{ t: 0, x: 56, y: 26 }, { t: 0.25, x: 64, y: 34 }, { t: 0.5, x: 50, y: 44 }, { t: 0.75, x: 38, y: 32 }, { t: 1, x: 50, y: 24 }],
        },
      ],
    },
  },
  {
    id: 'pass-move-triangles',
    name: 'Pass & Move Triangle Chains',
    emoji: '🔗',
    category: 'drill',
    focus: ['triangles', 'passing', 'fitness', 'teamwork'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 18 },
    baseDuration: 12,
    preferredPositions: ['midfield'],
    blurb: 'Teams of three move up the pitch keeping a triangle shape.',
    setup: [
      'A channel about 15 steps wide running the length of your area.',
      'Groups of three, one ball each group, spread across the start line.',
    ],
    howToPlay: [
      'Each trio moves up the channel passing the ball, ALWAYS keeping a triangle.',
      'Rule: you can\'t pass to someone standing still — the receiver must be moving into space.',
      'Reach the far end, turn, and come back.',
      'Progress: add a floating defender in bibs who tries to intercept any group.',
    ],
    coachingPoints: [
      'After every pass, sprint into a new triangle position — pass and MOVE.',
      'Keep good distances: close enough to reach, far enough to hurt the defence.',
      'Communication: point and call where you want the ball.',
    ],
    kidExplanation: {
      'U6-U8': 'Your team of three is a flock of birds flying up the field — pass the ball, fly to a new spot, and keep your V shape all the way!',
      'U9-U11': 'Your trio is a flock of geese flying up the pitch — always in a V shape, never in a straight line. Pass, fly forward, make a new V!',
      'U12-U14': 'Trios advance the channel keeping a triangle. Never pass to a statue — the receiver must be moving into space.',
      'U15+': 'Move the ball up the channel as a rotating triangle — pass and immediately re-position. Support at angles, not flat lines; a defender joins soon, so make it match-real.',
    },
    adaptations: {
      easier: ['Walk pace first trip.', 'No defender.'],
      harder: ['Two-touch max.', 'Two defenders hunting all groups.'],
    },
    diagram: {
      duration: 8,
      areaLabel: '15-step channel',
      cones: [{ x: 10, y: 10 }, { x: 10, y: 54 }, { x: 90, y: 10 }, { x: 90, y: 54 }],
      phases: [
        { t: 0, label: 'Pass and move up the channel' },
        { t: 0.5, label: 'Keep the triangle shape!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 16, y: 20 }, { t: 0.3, x: 36, y: 28 }, { t: 0.6, x: 58, y: 20 }, { t: 1, x: 82, y: 26 }],
        },
        {
          id: 'p2', kind: 'player', team: 'a', label: '2',
          path: [{ t: 0, x: 14, y: 40 }, { t: 0.3, x: 34, y: 46 }, { t: 0.6, x: 56, y: 42 }, { t: 1, x: 78, y: 44 }],
        },
        {
          id: 'p3', kind: 'player', team: 'a', label: '3',
          path: [{ t: 0, x: 24, y: 30 }, { t: 0.3, x: 46, y: 36 }, { t: 0.6, x: 68, y: 32 }, { t: 1, x: 88, y: 34 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 18, y: 22 }, { t: 0.15, x: 26, y: 31 }, { t: 0.3, x: 36, y: 47 }, { t: 0.45, x: 48, y: 37 }, { t: 0.6, x: 60, y: 22 }, { t: 0.78, x: 70, y: 33 }, { t: 1, x: 80, y: 45 }],
        },
      ],
    },
  },
  {
    id: 'rebounder-returns',
    name: 'Rebounder Rapid Returns',
    emoji: '🪃',
    category: 'drill',
    focus: ['passing', 'fitness'],
    equipment: ['balls', 'rebounder'],
    players: { min: 2, max: 16 },
    baseDuration: 10,
    preferredPositions: ['midfield'],
    blurb: 'Fast one-touch passing against a rebounder net — the ball never stops moving.',
    setup: [
      'Set up the rebounder net with a passing line about 6-8 steps back.',
      'One ball per player in the queue; rotate every 30-45 seconds.',
    ],
    howToPlay: [
      'Pass firmly into the rebounder and control the return with one touch, then pass again immediately.',
      'Count consecutive clean touches without the ball escaping control — beat your own record.',
      'Vary the pass: both feet, first-time returns, half-volley control.',
      'Partners: stand either side and pass through each other via the rebounder for a one-touch triangle.',
    ],
    coachingPoints: [
      'Body shape open to the rebounder so you can see it arrive before it does.',
      'Soft first touch to kill the pace, firm pass to send it back.',
      'Quick feet — get side-on and ready for the next return immediately.',
    ],
    kidExplanation: {
      'U6-U8': 'The bouncy net is your best friend — it always passes back! Kick the ball to the net, catch it back with your foot, and do it again!',
      'U9-U11': 'The rebounder is a wall that passes back exactly as good as you send it — pass it lazy, get a lazy return; pass it sharp, get a rocket back. Keep the rally going!',
      'U12-U14': 'One-touch control, one-touch return off the rebounder. Soft touch to kill it, firm pass back, body open to the net the whole time.',
      'U15+': 'Rebounder rallies — the net returns exactly what you give it. Work both feet, first-time returns, half-volley control. Count consecutive clean actions and beat your record.',
    },
    adaptations: {
      easier: ['Stand closer to the net.', 'Allow two touches before returning.'],
      harder: ['One-touch only.', 'Weak-foot passes only.', 'Time challenge: most clean touches in 30 seconds.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Rebounder net',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }],
      phases: [
        { t: 0, label: 'Pass into the net...' },
        { t: 0.5, label: '...control and go again!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(36, 32) },
        // The net fires the ball straight back — no pause at the rebounder.
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 38, y: 32 }, { t: 0.08, x: 38, y: 32 }, { t: 0.42, x: 84, y: 31, ease: 'linear' }, { t: 0.82, x: 40, y: 32 }, { t: 1, x: 40, y: 32 }] },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(20, 20) },
      ],
    },
  },

  // ================= SHOOTING =================
  {
    id: 'shooting-gallery',
    name: 'Shooting Gallery',
    emoji: '🎯',
    category: 'drill',
    focus: ['shooting'],
    equipment: ['balls', 'cones', 'goals'],
    players: { min: 4, max: 16 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'goalkeeper'],
    blurb: 'Touch out of your feet, strike, follow in for the rebound.',
    setup: [
      'A goal (or cone goal) with a shooting line about 10–12 steps out.',
      'Queue of shooters with balls, a server (you or a player) to the side.',
      'If you have a goalkeeper, they go in goal and rotate too.',
    ],
    howToPlay: [
      'Shooter passes to the server, sprints onto the return pass, and shoots first or second touch.',
      'Follow every shot in for a rebound before joining the back of the queue.',
      'Score: 1 point for on target, 3 for a goal, 5 for a corner finish.',
      'No keeper? Split the goal into corners with cones — corners are worth more.',
    ],
    coachingPoints: [
      'Plant foot beside the ball, head steady and over it.',
      'Strike through the middle of the ball with the laces — no toe-pokes!',
      'Placement beats power — pick a corner before the ball arrives.',
    ],
    kidExplanation: {
      'U6-U8': 'It\'s a fairground game! Pass to the helper, run fast onto the ball, and BOOM — shoot at the goal. The corners win the biggest prizes!',
      'U9-U11': 'It\'s a fairground shooting gallery and the corners of the goal are the big prizes. Pass, run onto the return like a striker, and pick your prize!',
      'U12-U14': 'Pass, sprint onto the return, finish first or second touch, then follow in for the rebound. Corners score triple.',
      'U15+': 'Wall pass into a finish — set your body before the return arrives, strike through the laces, and always follow your shot. Placement over power.',
    },
    adaptations: {
      easier: ['Shoot a stationary ball first.', 'Move the line closer.'],
      harder: ['One-touch finish only.', 'Server\'s pass is bounced or lofted.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Shooting zone',
      goals: [{ x: 92, y: 32 }],
      cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }],
      phases: [
        { t: 0, label: 'Pass to the server…' },
        { t: 0.35, label: '…sprint onto the return…' },
        { t: 0.7, label: 'SHOOT! Then follow in' },
      ],
      entities: [
        {
          id: 'sh', kind: 'player', team: 'a', label: 'S',
          path: [{ t: 0, x: 36, y: 32 }, { t: 0.35, x: 52, y: 28 }, { t: 0.65, x: 64, y: 30 }, { t: 1, x: 80, y: 30 }],
        },
        { id: 'srv', kind: 'player', team: 'n', label: 'C', path: still(58, 14) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 38, y: 32 }, { t: 0.3, x: 58, y: 17 }, { t: 0.42, x: 58, y: 17 }, { t: 0.62, x: 63, y: 31 }, { t: 0.72, x: 66, y: 31 }, { t: 1, x: 90, y: 26 }],
        },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 32 }, { t: 0.7, x: 89, y: 30 }, { t: 1, x: 89, y: 37 }] },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(28, 38) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(22, 42) },
      ],
    },
  },
  {
    id: 'gate-finish',
    name: 'Dribble & Finish Through Gates',
    emoji: '🏹',
    category: 'drill',
    focus: ['shooting', 'dribbling'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 16 },
    baseDuration: 10,
    preferredPositions: ['forwards'],
    blurb: 'No goals needed — dribble at speed and pass through a small gate to score.',
    setup: [
      'Three cone gates (2 steps wide) spread along a "goal line".',
      'Shooting line 12 steps back. Queue of players with balls.',
    ],
    howToPlay: [
      'Dribble from the line at speed and "finish" by passing the ball cleanly through any gate.',
      'The middle gate is worth 1, outer gates worth 3 (harder angle).',
      'Collect your ball, jog back around the outside.',
      'Round 2: a defender jogs across to pressure the finish.',
    ],
    coachingPoints: [
      'Last touch sets the shot — push it out of your feet, then strike.',
      'Finish with the inside of the foot for accuracy.',
      'Eyes up before the finish — pick your gate early.',
    ],
    kidExplanation: {
      'U6-U8': 'Dribble fast, then shoot your ball through the little cone door like posting a letter! Which door will you pick?',
      'U9-U11': 'The gates are goal corners in disguise. Real strikers don\'t blast at the keeper — they slide it past into the side netting. Thread it through the gate like a golden arrow!',
      'U12-U14': 'Dribble at pace, look up early, and finish through a gate with the inside of your foot. Outer gates pay triple for the harder angle.',
      'U15+': 'Finishing without goals — your last touch sets the strike. Eyes up two touches before you finish, and pass the ball through the gate like you\'d pass into the side netting.',
    },
    adaptations: {
      easier: ['Wider gates, shorter run.'],
      harder: ['Weak foot finishes.', 'Time limit: 5 seconds from first touch.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Gate finishing zone',
      gates: [
        [{ x: 80, y: 12 }, { x: 80, y: 20 }],
        [{ x: 84, y: 28 }, { x: 84, y: 36 }],
        [{ x: 80, y: 44 }, { x: 80, y: 52 }],
      ],
      cones: [{ x: 30, y: 12 }, { x: 30, y: 52 }],
      phases: [
        { t: 0, label: 'Dribble at speed' },
        { t: 0.55, label: 'Eyes up, pick a gate…' },
        { t: 0.75, label: 'Finish through it!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 26, y: 32 }, { t: 0.55, x: 56, y: 30 }, { t: 0.75, x: 64, y: 26 }, { t: 1, x: 66, y: 24 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 28, y: 32 }, { t: 0.55, x: 58, y: 30 }, { t: 0.72, x: 62, y: 26 }, { t: 1, x: 86, y: 16 }],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(20, 38) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(15, 42) },
      ],
    },
  },
  {
    id: 'free-kick-wall',
    name: 'Free-Kick Wall Practice',
    emoji: '🧱',
    category: 'drill',
    focus: ['shooting'],
    equipment: ['balls', 'goals', 'mannequins'],
    players: { min: 2, max: 12 },
    baseDuration: 10,
    preferredPositions: ['forwards'],
    blurb: 'Curl and dip free kicks over a mannequin wall into the top corner.',
    setup: [
      'Set up a goal with a mannequin wall about 9-10 steps out from a free-kick spot.',
      'Balls lined up at the free-kick spot; queue of takers.',
    ],
    howToPlay: [
      'Each player takes a free kick, aiming to curl or dip it over the wall and in.',
      'Score: 1 point over the wall on target, 3 for a goal, 5 for hitting inside either post.',
      'Rotate takers after every kick; keeper optional in goal.',
      'Progress: move the wall closer, or add a second mannequin to narrow the gap.',
    ],
    coachingPoints: [
      'Standing foot beside the ball, non-kicking arm out for balance.',
      'Strike with the inside or outside of the foot to generate curl — follow through across your body.',
      'Pick your corner before you run up, and commit to it.',
    ],
    kidExplanation: {
      'U6-U8': 'The pretend players are frozen statues guarding the goal — can you make your ball fly right over their heads and into the net?',
      'U9-U11': 'The wall of mannequins is frozen defenders guarding the goal — bend it around them like the pros do, and find the gap they can\'t reach!',
      'U12-U14': 'Free kicks over the wall — strike across the ball for curl or under it for dip. Pick your corner on the walk back and commit to it.',
      'U15+': 'Dead-ball reps — consistent run-up, strike for curl or dip, same routine every time. We\'re building a repeatable technique, not highlight-reel attempts.',
    },
    adaptations: {
      easier: ['Move the wall closer to the taker, further from goal.', 'No wall for the first few kicks.'],
      harder: ['Two mannequins in the wall.', 'Must score top corner only.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Free-kick wall',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 35, y: 14 }, { x: 35, y: 50 }],
      phases: [
        { t: 0, label: 'Run up...' },
        { t: 0.5, label: 'Bend it over the wall!' },
      ],
      entities: [
        { id: 'k1', kind: 'player', team: 'a', label: 'K', path: [{ t: 0, x: 30, y: 36 }, { t: 0.4, x: 34, y: 33 }, { t: 1, x: 36, y: 31 }] },
        // Ball waits for the run-up, then one flighted strike up and over the wall.
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 36, y: 33 }, { t: 0.4, x: 36, y: 33 }, { t: 0.85, x: 88, y: 26, arc: 7 }, { t: 1, x: 88, y: 26 }] },
        { id: 'w1', kind: 'player', team: 'n', label: 'W', path: still(55, 28) },
        { id: 'w2', kind: 'player', team: 'n', label: 'W', path: still(58, 32) },
        { id: 'w3', kind: 'player', team: 'n', label: 'W', path: still(61, 36) },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 32 }, { t: 0.6, x: 89, y: 22 }, { t: 1, x: 89, y: 24 }] },
      ],
    },
  },

  // ================= GOALKEEPING =================
  {
    id: 'keeper-wars',
    name: 'Keeper Wars',
    emoji: '🧤',
    category: 'drill',
    focus: ['goalkeeping', 'shooting'],
    equipment: ['balls', 'cones', 'goals'],
    players: { min: 2, max: 8 },
    needsPositions: ['goalkeeper'],
    baseDuration: 10,
    blurb: 'Two keepers face off, throwing and kicking to score past each other.',
    setup: [
      'Two goals (or cone goals) facing each other, 12–15 steps apart.',
      'One keeper in each goal, pile of balls beside each.',
    ],
    howToPlay: [
      'Keepers take turns trying to score past each other — roll, throw, volley, or drive along the ground.',
      'Saves can be caught, parried, or blocked. Rebounds are live!',
      'First to 5 goals. Rotate challengers in.',
    ],
    coachingPoints: [
      'Set position before every shot: feet shoulder-width, hands ready, on your toes.',
      'Get your body behind the ball — hands are the second barrier.',
      'Recover FAST after a save — the rebound is still live.',
    ],
    kidExplanation: {
      'U6-U8': 'Two keepers, two goals, one ball! Roll or throw the ball to score in your friend\'s goal, then jump up quick to save theirs!',
      'U9-U11': 'Two goalkeepers enter, one leaves victorious! It\'s a wild-west duel — save their shot, then fire back before they\'re ready.',
      'U12-U14': 'Keeper v keeper — score past each other any legal way; saves and rebounds are live. Set position before every shot.',
      'U15+': 'Keeper duel — set before each strike, save, recover instantly, and counter while they reset. First to five. Handling and recovery speed are the focus.',
    },
    adaptations: {
      easier: ['Underarm rolls only.', 'Move the goals closer.'],
      harder: ['Volleys allowed.', 'One-hand saves = 2 points.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Keeper duel arena',
      goals: [{ x: 10, y: 32, facing: 'right' }, { x: 90, y: 32, facing: 'left' }],
      cones: [],
      phases: [
        { t: 0, label: 'Keeper 1 attacks…' },
        { t: 0.4, label: 'Save!' },
        { t: 0.55, label: 'Instant counter-attack!' },
      ],
      entities: [
        { id: 'k1', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 16, y: 32 }, { t: 0.15, x: 20, y: 32 }, { t: 1, x: 14, y: 30 }] },
        { id: 'k2', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 86, y: 32 }, { t: 0.4, x: 85, y: 26 }, { t: 0.55, x: 84, y: 30 }, { t: 1, x: 86, y: 32 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 19, y: 32 }, { t: 0.05, x: 19, y: 32 }, { t: 0.38, x: 84, y: 27, arc: 3 }, { t: 0.48, x: 80, y: 30 }, { t: 0.58, x: 82, y: 31 }, { t: 0.62, x: 82, y: 31 }, { t: 0.95, x: 16, y: 36, arc: 4 }, { t: 1, x: 16, y: 36 }],
        },
      ],
    },
  },

  {
    id: 'speed-spring-circuit',
    name: 'Speed & Spring Circuit',
    emoji: '🦘',
    category: 'drill',
    focus: ['fitness'],
    equipment: ['ladder', 'hurdles', 'cones'],
    players: { min: 4, max: 20 },
    baseDuration: 10,
    blurb: 'Ladder feet into hurdle jumps into a flat-out sprint — one flowing circuit.',
    setup: [
      'In a line: agility ladder, then three mini hurdles 2 steps apart, then a sprint cone 8 steps beyond.',
      'Start cone before the ladder; players queue behind it.',
    ],
    howToPlay: [
      'Quick feet through the ladder, two-footed jumps over each hurdle, then sprint through the finish cone.',
      'Jog back around the outside and rejoin the queue.',
      'Change ladder pattern each round; later rounds swap jumps for single-leg hops.',
      'Finish with two timed laps — whole group, fastest total wins.',
    ],
    coachingPoints: [
      'Land softly between hurdles — bend the knees, spring straight into the next jump.',
      'No stutter steps between ladder and hurdles; keep the rhythm flowing.',
      'Drive the arms in the sprint — the circuit earns the sprint.',
    ],
    kidExplanation: {
      'U6-U8': 'Tippy-toes through the ladder, then boing-boing-boing over the little fences like a kangaroo, then whoosh — rocket to the finish!',
      'U9-U11': 'You\'re a kangaroo commando: quick feet through the ladder, spring over every hurdle, then a flat-out sprint to base. Soft landings, big bounces!',
      'U12-U14': 'Flow through the circuit — fast feet, two-footed springs, straight into the sprint. Soft landings; the rhythm shouldn\'t break anywhere.',
      'U15+': 'Plyometric circuit — quality footwork, soft reactive landings, immediate transition to max acceleration. The change from spring to sprint is the training effect.',
    },
    adaptations: {
      easier: ['Step over hurdles instead of jumping.', 'Shorter sprint.'],
      harder: ['Single-leg hops.', 'Race two circuits side by side.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Speed circuit',
      ladders: [{ x: 18, y: 32, len: 20 }],
      hurdles: [{ x: 46, y: 32 }, { x: 54, y: 32 }, { x: 62, y: 32 }],
      cones: [{ x: 12, y: 32 }, { x: 80, y: 32 }],
      phases: [
        { t: 0, label: 'Quick feet…' },
        { t: 0.3, label: '…spring over the hurdles…' },
        { t: 0.6, label: '…and SPRINT!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [
            { t: 0, x: 13, y: 32 }, { t: 0.28, x: 42, y: 32, ease: 'linear' },
            { t: 0.38, x: 50, y: 32, arc: 2 }, { t: 0.48, x: 58, y: 32, arc: 2 }, { t: 0.58, x: 66, y: 32, arc: 2 },
            { t: 0.72, x: 80, y: 32, ease: 'out' }, { t: 0.85, x: 74, y: 44 }, { t: 1, x: 30, y: 44 },
          ],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(8, 38) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(8, 44) },
      ],
    },
  },
  {
    id: 'turn-and-burn',
    name: 'Turn & Burn',
    emoji: '🔥',
    category: 'drill',
    focus: ['dribbling', 'fitness'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 20 },
    baseDuration: 10,
    blurb: 'Dribble out, snap a turn at the cone, burst back at full speed.',
    setup: [
      'Pairs of cones 15–20 steps apart, one lane per group of 3–4.',
      'Queue at the start cone, every player with a ball.',
    ],
    howToPlay: [
      'Dribble at a controlled pace to the far cone.',
      'Perform the called turn — drag-back, inside cut, outside cut, Cruyff — then BURST back at full speed.',
      'Stop the ball dead on the start line for the next player to go.',
      'New turn every round; finish with "your choice" and a race.',
    ],
    coachingPoints: [
      'Slow into the turn, explosive out of it — the change of pace is the weapon.',
      'Keep the turn tight; the ball shouldn\'t escape more than one step.',
      'Low body position through the turn, first two steps out are sprints.',
    ],
    kidExplanation: {
      'U6-U8': 'Drive your car to the cone, do a magic spin move, then zoooom home as fast as lightning and park the ball on the line!',
      'U9-U11': 'Cruise out, snap your turn like a secret trick, then BURN home full speed — the turn is slow and sneaky, the escape is lightning.',
      'U12-U14': 'Controlled dribble out, sharp turn at the cone, explode into the first two steps home. Slow-slow-FAST is the pattern.',
      'U15+': 'Turning reps at match intensity — decelerate late, keep the turn within one touch, and win the first two steps out. The acceleration after the turn is what beats defenders.',
    },
    adaptations: {
      easier: ['Walk-through each new turn first.', 'Shorter lane.'],
      harder: ['Weak foot turns.', 'Defender jogs in from the side after the turn to chase them home.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Turning lanes',
      cones: [{ x: 25, y: 32 }, { x: 75, y: 32 }],
      phases: [
        { t: 0, label: 'Cruise out…' },
        { t: 0.45, label: '…snap the turn…' },
        { t: 0.6, label: '…and BURN home!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 26, y: 30 }, { t: 0.45, x: 72, y: 30 }, { t: 0.56, x: 74, y: 34 }, { t: 0.88, x: 27, y: 34, ease: 'out' }, { t: 1, x: 26, y: 34 }],
        },
        {
          id: 'b1', kind: 'ball',
          path: [{ t: 0, x: 28, y: 30 }, { t: 0.45, x: 74, y: 30 }, { t: 0.56, x: 72, y: 34 }, { t: 0.86, x: 26, y: 34 }, { t: 1, x: 26, y: 34 }],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(19, 32) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(13, 32) },
      ],
    },
  },
  {
    id: '1v1-to-goal',
    name: '1v1 Finish at Goal',
    emoji: '🥊',
    category: 'drill',
    focus: ['1v1', 'shooting', 'defending'],
    equipment: ['balls', 'cones', 'goals'],
    players: { min: 4, max: 16 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'defence'],
    blurb: 'Beat one defender, then beat the goal — the full striker\'s job in one rep.',
    setup: [
      'A goal with a starting gate about 20 steps out; attacker queue at the gate with balls.',
      'Defender queue beside the goal; keeper optional.',
    ],
    howToPlay: [
      'The defender passes out to the attacker and immediately closes them down — that pass starts the duel.',
      'Attacker tries to beat the defender and finish; defender wins by stealing the ball or forcing them wide.',
      'Everyone rotates: attack → defend → queue.',
      'Score 2 points for a goal after a move that beats the defender, 1 for any other goal.',
    ],
    coachingPoints: [
      'Attack at speed BEFORE the defender is set — hesitation helps the defence.',
      'Use the move to unbalance, then shoot early — the extra touch invites the tackle.',
      'Defenders: close fast, slow late — sprint, then short steps as you arrive.',
    ],
    kidExplanation: {
      'U6-U8': 'One guard stands between you and the treasure goal! Trick the guard with your best move, then shoot the treasure home!',
      'U9-U11': 'It\'s you against one defender and the goal behind them. Beat them with a trick or a burst, then finish the job — striker school!',
      'U12-U14': 'Receive, drive at the defender before they\'re set, beat them either side and finish early. Defenders: close fast, arrive slow, force them wide.',
      'U15+': 'Game-real 1v1s — attack the defender\'s approach at pace, commit them, finish with minimal touches. Defenders work pressing angles and delaying until support would arrive.',
    },
    adaptations: {
      easier: ['Defender starts further away.', 'No keeper, bigger goal.'],
      harder: ['Touch limit: beat them within 4 touches.', 'Second defender recovers after 3 seconds.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '1v1 to goal',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 30, y: 16 }, { x: 30, y: 48 }],
      phases: [
        { t: 0, label: 'Defender serves and closes…' },
        { t: 0.45, label: 'Take them on!' },
        { t: 0.75, label: 'Beaten — finish!' },
      ],
      entities: [
        {
          id: 'att', kind: 'player', team: 'a', label: 'A',
          path: [{ t: 0, x: 30, y: 32 }, { t: 0.25, x: 30, y: 32 }, { t: 0.5, x: 52, y: 30 }, { t: 0.62, x: 58, y: 24 }, { t: 0.78, x: 68, y: 26 }, { t: 1, x: 72, y: 26 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 68, y: 34 }, { t: 0.05, x: 68, y: 34 }, { t: 0.22, x: 32, y: 32 }, { t: 0.5, x: 54, y: 30 }, { t: 0.62, x: 60, y: 24 }, { t: 0.72, x: 66, y: 26 }, { t: 0.78, x: 66, y: 26 }, { t: 0.92, x: 88, y: 36, arc: 1.5 }, { t: 1, x: 88, y: 36 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 70, y: 34 }, { t: 0.25, x: 70, y: 34 }, { t: 0.5, x: 58, y: 32 }, { t: 0.66, x: 56, y: 30 }, { t: 1, x: 62, y: 32 }],
        },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 32 }, { t: 0.8, x: 89, y: 32 }, { t: 0.95, x: 89, y: 37 }, { t: 1, x: 89, y: 37 }] },
      ],
    },
  },
  {
    id: '2v1-overload',
    name: '2v1 Overload Attack',
    emoji: '➕',
    category: 'drill',
    focus: ['1v1', 'passing', 'teamwork', 'shooting'],
    equipment: ['balls', 'cones', 'goals'],
    players: { min: 6, max: 18 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'midfield'],
    blurb: 'Two attackers, one defender — learn the oldest question in football: pass or go?',
    setup: [
      'A goal and a start line about 20 steps out.',
      'Attackers queue in pairs with a ball; defenders queue by the goal.',
    ],
    howToPlay: [
      'Two attackers advance against one defender and try to score.',
      'The golden rule: if the defender comes to the ball, pass; if they hold off, drive on and shoot.',
      'Defender scores a point by winning the ball or forcing a bad miss.',
      'Rotate roles constantly; play first to 10 goals as a squad.',
    ],
    coachingPoints: [
      'Ball carrier: attack the defender to COMMIT them — the pass only works if they bite.',
      'Second attacker: stay wide and slightly behind, never level or hiding behind the defender.',
      'One pass is usually enough — extra passes invite recovery.',
    ],
    kidExplanation: {
      'U6-U8': 'You and your buddy versus ONE guard — if the guard chases you, give the ball to your buddy. If the guard stays home, keep driving and shoot!',
      'U9-U11': 'Two of you, one of them — the maths is on your side! Make the defender pick you, then pass… or if they don\'t, keep going and score yourself.',
      'U12-U14': 'Classic 2v1 — drive at the defender until they commit, then release. Support runner: hold width and stay onside-shaped, ready to finish first time.',
      'U15+': 'Overload decision-making — engage the defender at speed, read their commitment, execute pass-or-drive. Supporting angle and timing decide whether one pass finishes it.',
    },
    adaptations: {
      easier: ['Defender walks.', 'Bigger goal, no keeper.'],
      harder: ['Recovery defender chases from behind after 2 seconds.', 'Finish within 8 seconds.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '2v1 to goal',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 25, y: 14 }, { x: 25, y: 50 }],
      phases: [
        { t: 0, label: 'Drive at the defender…' },
        { t: 0.45, label: 'They commit — release it!' },
        { t: 0.7, label: 'First-time finish!' },
      ],
      entities: [
        {
          id: 'a1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 26, y: 24 }, { t: 0.45, x: 52, y: 28 }, { t: 0.7, x: 60, y: 24 }, { t: 1, x: 64, y: 24 }],
        },
        {
          id: 'a2', kind: 'player', team: 'a', label: '2',
          path: [{ t: 0, x: 26, y: 44 }, { t: 0.45, x: 56, y: 44 }, { t: 0.66, x: 68, y: 40 }, { t: 1, x: 74, y: 38 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 28, y: 24 }, { t: 0.45, x: 54, y: 28 }, { t: 0.6, x: 66, y: 40 }, { t: 0.68, x: 68, y: 40 }, { t: 0.82, x: 88, y: 34, arc: 1.5 }, { t: 1, x: 88, y: 34 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 62, y: 32 }, { t: 0.45, x: 56, y: 30 }, { t: 0.7, x: 62, y: 36 }, { t: 1, x: 66, y: 36 }],
        },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 32 }, { t: 0.7, x: 89, y: 32 }, { t: 0.85, x: 89, y: 36 }, { t: 1, x: 89, y: 36 }] },
      ],
    },
  },

  {
    id: 'passing-golf',
    name: 'Passing Golf',
    emoji: '⛳',
    category: 'drill',
    focus: ['passing'],
    equipment: ['balls', 'hoops', 'flags'],
    players: { min: 2, max: 20 },
    baseDuration: 12,
    blurb: 'A golf course of hoop targets — fewest passes to stop the ball inside each "hole" wins.',
    setup: [
      'Lay out 4–6 flat hoops around your area as "holes", with a flag or tall cone beside each so they\'re easy to spot.',
      'Mark a tee spot a good distance from each hole. Players go round in pairs, one ball each.',
    ],
    howToPlay: [
      'From each tee, players take turns "driving" a long pass towards the hoop, then keep passing from wherever it stops.',
      'The hole is complete when the ball stops INSIDE the hoop. Count your passes like golf strokes.',
      'Long holes reward a lofted drive then a short rolled "putt".',
      'Lowest total after the full course wins the round.',
    ],
    coachingPoints: [
      'Drives: strike under the ball for height and distance; putts: inside of the foot, weighted to die in the hoop.',
      'Pick a landing spot, not just a direction — pros aim where the ball will STOP.',
      'Weight of pass is today\'s whole lesson — power is easy, weight is skill.',
    ],
    kidExplanation: {
      'U6-U8': 'The hoops are nests and your ball is an egg! Kick your egg on big adventures across the field, then roll it gently into the nest to keep it safe.',
      'U9-U11': 'It\'s golf with your feet! Big booming drive to get close, then a soft little putt that stops the ball asleep inside the hoop. Count your kicks!',
      'U12-U14': 'Passing golf — a driven or lofted long ball to get near, then a perfectly weighted pass to finish inside the hoop. Fewest passes wins; weight beats power.',
      'U15+': 'Long passing with consequence — pick your technique per distance (driven, clipped, lofted), then kill the hole with a weighted pass that dies in the ring. Track your strokes.',
    },
    adaptations: {
      easier: ['Bigger hoops or a circle of discs.', 'Shorter holes.'],
      harder: ['Weak foot only on the putts.', 'Par scores per hole; over par = a lap.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Hole 1 — par 2',
      hoops: [{ x: 78, y: 20, r: 4 }],
      cones: [{ x: 18, y: 46 }],
      phases: [
        { t: 0, label: 'Big lofted drive…' },
        { t: 0.55, label: '…then a soft putt…' },
        { t: 0.85, label: 'In the hole!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 16, y: 46 }, { t: 0.12, x: 16, y: 46 }, { t: 0.6, x: 64, y: 30 }, { t: 1, x: 68, y: 28 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 18, y: 44 }, { t: 0.12, x: 18, y: 44 }, { t: 0.5, x: 66, y: 26, arc: 9 }, { t: 0.62, x: 66, y: 26 }, { t: 0.85, x: 78, y: 20 }, { t: 1, x: 78, y: 20 }],
        },
        { id: 'p2', kind: 'player', team: 'b', label: '2', path: still(12, 52) },
      ],
    },
  },
  {
    id: 'one-two-finish',
    name: 'One-Two & Finish',
    emoji: '🤜',
    category: 'drill',
    focus: ['passing', 'shooting', 'triangles'],
    equipment: ['balls', 'cones', 'goals', 'mannequins'],
    players: { min: 4, max: 16 },
    baseDuration: 12,
    preferredPositions: ['midfield', 'forwards'],
    blurb: 'Play the wall pass around a mannequin defender and finish first time.',
    setup: [
      'Goal, a mannequin about 12 steps out as the "defender", and a start cone 10 steps before it.',
      'A wall player stands level with the mannequin, off to one side. Queue with balls at the start cone.',
    ],
    howToPlay: [
      'Dribble at the mannequin, play the pass to the wall player, and sprint round the other side.',
      'The wall player returns it first time into your path — finish first or second touch.',
      'Rotate: shooter becomes wall player, wall player joins the queue.',
      'Swap sides halfway so the one-two works both directions.',
    ],
    coachingPoints: [
      'Pass firm to the wall player\'s FRONT foot, then sprint — the pass and run are one action.',
      'Wall player: one touch, weighted into the runner\'s stride, not back where they came from.',
      'Finish early — the one-two has already beaten the defender, don\'t let them recover.',
    ],
    kidExplanation: {
      'U6-U8': 'The statue can\'t catch you if you play magic pass-and-run! Give the ball to your friend, run round the statue super fast, get it back — GOAL!',
      'U9-U11': 'The one-two is football\'s secret handshake: pass, sprint round the dummy, get it back and finish before anyone knows what happened!',
      'U12-U14': 'Wall pass around the mannequin — firm pass, explosive run, first-time return into the path, early finish. The run starts the moment the ball leaves your foot.',
      'U15+': 'Give-and-go under pattern speed — the pass tempo and the timing of your run beat the defender, not the return pass. Finish inside two touches, both sides.',
    },
    adaptations: {
      easier: ['No mannequin — just pass, run and finish.', 'Take a touch before finishing.'],
      harder: ['Replace the mannequin with a real (passive → active) defender.', 'One-touch finish only.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'One-two zone',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 28, y: 20 }, { x: 28, y: 44 }],
      phases: [
        { t: 0, label: 'Drive at the dummy…' },
        { t: 0.35, label: 'Give…' },
        { t: 0.6, label: '…go! And finish!' },
      ],
      entities: [
        { id: 'dummy', kind: 'player', team: 'n', label: 'M', path: still(58, 32) },
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 28, y: 32 }, { t: 0.35, x: 48, y: 32 }, { t: 0.62, x: 68, y: 26 }, { t: 0.75, x: 72, y: 28 }, { t: 1, x: 74, y: 28 }],
        },
        { id: 'wall', kind: 'player', team: 'a', label: '2', path: still(58, 16) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 30, y: 32 }, { t: 0.35, x: 50, y: 32 }, { t: 0.48, x: 58, y: 18 }, { t: 0.52, x: 58, y: 18 }, { t: 0.68, x: 70, y: 27 }, { t: 0.75, x: 70, y: 27 }, { t: 0.88, x: 88, y: 36, arc: 1.5 }, { t: 1, x: 88, y: 36 }],
        },
      ],
    },
  },
  {
    id: 'switch-play',
    name: 'Switch the Play',
    emoji: '🔀',
    category: 'drill',
    focus: ['passing', 'triangles', 'teamwork'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 8, max: 20 },
    baseDuration: 12,
    preferredPositions: ['midfield'],
    blurb: 'Draw the defence to one side, then ping the big diagonal to the free winger.',
    setup: [
      'Wide pitch about 30 x 25 steps with a target gate in each far corner.',
      'Attacking team spreads across the width; 2–3 defenders in bibs start central.',
    ],
    howToPlay: [
      'Attackers pass on one side to draw the defenders across.',
      'When the far side opens, hit the big switch pass — lofted or driven — to the free winger.',
      'The winger controls and dribbles through their corner gate to score.',
      'Defenders win by intercepting; rotate defenders every few points.',
    ],
    coachingPoints: [
      'Be patient — the switch only works AFTER the defence has shifted over.',
      'The far winger stays wide and ready; don\'t drift in and close your own space.',
      'First touch after the switch goes forward, not backwards — attack the space you just made.',
    ],
    kidExplanation: {
      'U6-U8': 'Trick the sleepy giants — everybody pass on ONE side until the giants wander over, then send the ball flying across the sky to your friend on the empty side!',
      'U9-U11': 'It\'s a magician\'s trick: make the defenders watch one hand (short passes), then — whoosh — the ball flies to the other side where your winger is free!',
      'U12-U14': 'Pull the defence with short passes, then hit the diagonal when the far side opens. Wingers: stay wide, attack forward with your first touch.',
      'U15+': 'Overload to isolate — circulate to shift the defensive block, then release the switch with the right technique for the distance. The receiving touch must go forward at pace.',
    },
    adaptations: {
      easier: ['Switch can be two shorter passes through a middle player.'],
      harder: ['Switch must be one pass and arrive in the air.', 'Add a defender who guards the far gate.'],
    },
    diagram: {
      duration: 8,
      areaLabel: '30 x 25 switch pitch',
      cones: [{ x: 12, y: 8 }, { x: 88, y: 8 }, { x: 12, y: 56 }, { x: 88, y: 56 }],
      gates: [[{ x: 90, y: 42 }, { x: 90, y: 52 }]],
      phases: [
        { t: 0, label: 'Draw them to one side…' },
        { t: 0.5, label: 'SWITCH! The diagonal flies…' },
        { t: 0.8, label: 'Through the gate!' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 22, y: 16 }, { t: 0.4, x: 26, y: 20 }, { t: 1, x: 30, y: 18 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 34, y: 34 }, { t: 0.4, x: 30, y: 30 }, { t: 1, x: 36, y: 32 }] },
        {
          id: 'a3', kind: 'player', team: 'a', label: '3',
          path: [{ t: 0, x: 78, y: 40 }, { t: 0.5, x: 78, y: 42 }, { t: 0.72, x: 80, y: 44 }, { t: 1, x: 92, y: 47 }],
        },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 42, y: 22 }, { t: 0.45, x: 32, y: 22 }, { t: 0.7, x: 44, y: 28 }, { t: 1, x: 56, y: 34 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 48, y: 36 }, { t: 0.45, x: 38, y: 32 }, { t: 0.7, x: 50, y: 36 }, { t: 1, x: 62, y: 40 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 24, y: 18 }, { t: 0.2, x: 32, y: 32 }, { t: 0.38, x: 28, y: 22 }, { t: 0.5, x: 28, y: 22 }, { t: 0.72, x: 78, y: 43, arc: 9 }, { t: 0.82, x: 82, y: 45 }, { t: 1, x: 94, y: 47 }],
        },
      ],
    },
  },
  {
    id: 'toss-volley',
    name: 'Toss & Volley',
    emoji: '💥',
    category: 'drill',
    focus: ['shooting'],
    equipment: ['balls', 'goals'],
    players: { min: 4, max: 16 },
    baseDuration: 10,
    preferredPositions: ['forwards'],
    blurb: 'Partner tosses, striker volleys — clean technique on a moving, bouncing ball.',
    setup: [
      'A goal with a server standing beside the post area, arms full of balls (or one ball, retrieved each turn).',
      'Striker queue about 10 steps out, slightly angled.',
    ],
    howToPlay: [
      'The server underarm-tosses a gentle looping ball into the striker\'s path.',
      'Striker volleys or half-volleys it at goal — laces, not toes.',
      'Three attempts each, then rotate striker → server → queue.',
      'Progress: alternate feet, then a bouncing serve, then a header round.',
    ],
    coachingPoints: [
      'Watch the ball ONTO the foot — eyes on it until contact.',
      'Ankle locked, toes pointed down, strike the middle of the ball.',
      'A controlled downward volley beats a wild blast over the bar — keep it under the crossbar height.',
    ],
    kidExplanation: {
      'U6-U8': 'Your partner throws a gentle rainbow ball — kick it out of the air like a superhero before it lands! Pointy toes down, boot like a hammer!',
      'U9-U11': 'The serve floats in like a balloon — smash the volley with your laces while it\'s still flying. Eyes on the ball until your boot booms it!',
      'U12-U14': 'Volley technique — locked ankle, laces through the middle, over the ball to keep it down. Watch it onto your foot every single time.',
      'U15+': 'Striking a moving ball out of the air — body shape side-on, head steady, compact swing, contact above the ball\'s midline to keep it under the bar. Both feet.',
    },
    adaptations: {
      easier: ['Let it bounce once first (half-volley).', 'Bigger, softer serve.'],
      harder: ['Serve from behind the striker so they adjust feet.', 'Call the corner before the serve.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Volley zone',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 45, y: 16 }, { x: 45, y: 48 }],
      phases: [
        { t: 0, label: 'The toss floats in…' },
        { t: 0.5, label: 'VOLLEY!' },
      ],
      entities: [
        { id: 'srv', kind: 'player', team: 'n', label: 'S', path: still(72, 14) },
        {
          id: 'st', kind: 'player', team: 'a', label: '9',
          path: [{ t: 0, x: 56, y: 34 }, { t: 0.4, x: 60, y: 31 }, { t: 0.55, x: 62, y: 30 }, { t: 1, x: 62, y: 30 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 72, y: 16 }, { t: 0.15, x: 72, y: 16 }, { t: 0.5, x: 63, y: 30, arc: 5 }, { t: 0.68, x: 88, y: 28, arc: 2 }, { t: 1, x: 88, y: 28 }],
        },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 34 }, { t: 0.5, x: 89, y: 34 }, { t: 0.68, x: 89, y: 29 }, { t: 1, x: 89, y: 29 }] },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(48, 42) },
      ],
    },
  },

  {
    id: 'cross-and-finish',
    name: 'Cross & Finish',
    emoji: '🎪',
    category: 'drill',
    focus: ['shooting', 'teamwork', 'passing'],
    equipment: ['balls', 'goals', 'flags', 'cones'],
    players: { min: 6, max: 16 },
    baseDuration: 12,
    preferredPositions: ['forwards', 'midfield'],
    blurb: 'Wingers whip in crosses, runners attack the near and far post.',
    setup: [
      'A goal, a corner flag marking the crossing zone on one wing, and a winger queue with balls out wide.',
      'Two runner queues centrally, 20 steps out: one attacks the near post, one the far post.',
    ],
    howToPlay: [
      'The winger dribbles down the flank into the crossing zone and whips a lofted cross into the box.',
      'Two runners time their runs — near post and far post — and finish the cross.',
      'Any finish counts: foot, volley, or (older groups) a header.',
      'Rotate winger → near runner → far runner → queue. Swap wings halfway.',
    ],
    coachingPoints: [
      'Winger: get your head up before the cross — pick a runner, don\'t just hoof it in.',
      'Runners: start your run LATE and arrive fast; standing in the box gets you marked.',
      'Cross into the space in front of the runner, never behind them.',
    ],
    kidExplanation: {
      'U6-U8': 'The winger is a pirate firing the cannonball across, and you\'re racing in to catch the treasure and boot it home! Run in fast when the ball flies!',
      'U9-U11': 'The cross is a flying delivery — time your run like a train arriving exactly when the parcel lands. Near post or far post, then BANG!',
      'U12-U14': 'Whip the cross in front of the runners; runners split near and far post and arrive at speed. Late run, fast arrival — that\'s what loses markers.',
      'U15+': 'Crossing and box movement — delivery picks a zone (near, penalty spot, far), runners stagger their timing and attack the ball\'s flight. Finish first time; rebounds are live.',
    },
    adaptations: {
      easier: ['Cross along the ground.', 'No keeper.'],
      harder: ['Add a defender in the box.', 'Winger must beat a cone "full-back" before crossing.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Crossing zone',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 92, y: 8 }, { x: 60, y: 8 }],
      phases: [
        { t: 0, label: 'Winger drives down the flank…' },
        { t: 0.45, label: 'The cross flies in…' },
        { t: 0.7, label: 'Met at the far post!' },
      ],
      entities: [
        {
          id: 'w', kind: 'player', team: 'a', label: 'W',
          path: [{ t: 0, x: 34, y: 12 }, { t: 0.42, x: 74, y: 10 }, { t: 0.55, x: 78, y: 12 }, { t: 1, x: 78, y: 12 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 36, y: 13 }, { t: 0.42, x: 76, y: 11 }, { t: 0.48, x: 76, y: 11 }, { t: 0.68, x: 80, y: 38, arc: 7 }, { t: 0.74, x: 80, y: 38 }, { t: 0.86, x: 88, y: 33, arc: 1 }, { t: 1, x: 88, y: 33 }],
        },
        {
          id: 'r1', kind: 'player', team: 'a', label: '9',
          path: [{ t: 0, x: 52, y: 34 }, { t: 0.45, x: 62, y: 30 }, { t: 0.68, x: 79, y: 39 }, { t: 1, x: 80, y: 39 }],
        },
        {
          id: 'r2', kind: 'player', team: 'a', label: '10',
          path: [{ t: 0, x: 48, y: 44 }, { t: 0.5, x: 60, y: 44 }, { t: 0.75, x: 72, y: 44 }, { t: 1, x: 74, y: 44 }],
        },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 32 }, { t: 0.6, x: 89, y: 29 }, { t: 0.86, x: 89, y: 34 }, { t: 1, x: 89, y: 34 }] },
      ],
    },
  },
  {
    id: 'jockey-delay',
    name: 'Jockey & Delay',
    emoji: '🐎',
    category: 'drill',
    focus: ['defending', '1v1', 'fitness'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 16 },
    baseDuration: 10,
    preferredPositions: ['defence'],
    blurb: 'Defenders learn the art of NOT tackling — delay the attacker until help arrives.',
    setup: [
      'Channels about 8 steps wide and 20 long.',
      'Attacker with a ball at one end, defender facing them a third of the way in.',
      'A "recovery" teammate waits at the side, halfway down.',
    ],
    howToPlay: [
      'The attacker tries to dribble the length of the channel; the defender\'s job is only to SLOW them down.',
      'On "go", the recovery defender counts three seconds, then sprints to help — two v one wins the ball.',
      'The defender scores by delaying long enough; the attacker scores by reaching the end line first.',
      'Rotate all three roles.',
    ],
    coachingPoints: [
      'Side-on, knees bent, on your toes — show them one way and shuffle with them.',
      'Stay a stride away: close enough to press, far enough not to be beaten.',
      'No dive-ins! Patience wins this game — the tackle comes when help arrives.',
    ],
    kidExplanation: {
      'U6-U8': 'You\'re a sheepdog and the attacker is a runaway sheep — don\'t bite, just herd! Stay in front of the sheep until the farmer arrives to help.',
      'U9-U11': 'Defending is sneaky patience: stay side-on like a crab, herd them where YOU want, and stall them until your partner charges in — then pounce together!',
      'U12-U14': 'Jockey side-on, a stride off, showing them one direction. Your job is delay, not the tackle — win time, then win the ball two v one.',
      'U15+': 'Defensive delay work — approach fast, arrive slow, angle your body to force them to the weak side, and stall until recovery arrives. Timing the pounce is the skill.',
    },
    adaptations: {
      easier: ['Attacker at half speed.', 'Recovery arrives after 2 seconds.'],
      harder: ['Recovery arrives after 5 seconds.', 'Attacker scores double for beating the defender cleanly.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '8 x 20 channel',
      cones: [{ x: 18, y: 20 }, { x: 18, y: 44 }, { x: 84, y: 20 }, { x: 84, y: 44 }],
      phases: [
        { t: 0, label: 'Jockey — delay them…' },
        { t: 0.55, label: 'Help is coming…' },
        { t: 0.8, label: 'Two v one — win it!' },
      ],
      entities: [
        {
          id: 'att', kind: 'player', team: 'a', label: 'A',
          path: [{ t: 0, x: 22, y: 32 }, { t: 0.35, x: 40, y: 30 }, { t: 0.6, x: 52, y: 26 }, { t: 0.8, x: 60, y: 24 }, { t: 1, x: 62, y: 26 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 24, y: 32 }, { t: 0.35, x: 42, y: 30 }, { t: 0.6, x: 54, y: 26 }, { t: 0.8, x: 62, y: 24 }, { t: 0.92, x: 74, y: 18 }, { t: 1, x: 74, y: 18 }],
        },
        {
          id: 'def', kind: 'player', team: 'b', label: 'D',
          path: [{ t: 0, x: 34, y: 32 }, { t: 0.35, x: 46, y: 30 }, { t: 0.6, x: 57, y: 27 }, { t: 0.85, x: 64, y: 25 }, { t: 1, x: 66, y: 24 }],
        },
        {
          id: 'rec', kind: 'player', team: 'b', label: 'R',
          path: [{ t: 0, x: 50, y: 50 }, { t: 0.55, x: 50, y: 50 }, { t: 0.85, x: 60, y: 28, ease: 'out' }, { t: 1, x: 62, y: 26 }],
        },
      ],
    },
  },
  {
    id: 'keeper-hands-circuit',
    name: 'Keeper\'s Handling Circuit',
    emoji: '🫳',
    category: 'drill',
    focus: ['goalkeeping'],
    equipment: ['balls', 'goals'],
    players: { min: 2, max: 8 },
    needsPositions: ['goalkeeper'],
    baseDuration: 10,
    blurb: 'Scoop, W-catch, high claim — the keeper\'s three hand shapes in one rolling circuit.',
    setup: [
      'Keeper in goal, server 10 steps out with a pile of balls.',
      'Spare players collect and feed balls back to the server.',
    ],
    howToPlay: [
      'The server works a repeating sequence: rolled ball (scoop), waist-high throw (basket catch), chest-high (W-catch), then a looping high ball (claim at the highest point).',
      'Keeper returns each ball with a throw or pass and resets before the next serve.',
      'Two circuits, then rotate keepers (everyone benefits from handling).',
      'Speed up serves as hands warm up.',
    ],
    coachingPoints: [
      'Scoop: long barrier, little fingers together, gather to the chest.',
      'W-catch: thumbs behind the ball, fingers spread, elbows soft.',
      'High claim: attack the ball at its HIGHEST point, knee up for protection, shout "keeper\'s!"',
    ],
    kidExplanation: {
      'U6-U8': 'Your hands are a crocodile\'s mouth — SNAP the rolling ball in the scoop, catch the tummy-high ball in your basket, and jump like a rocket to grab the sky ball!',
      'U9-U11': 'Three super-catches to master: the scoop for rollers, the W for chest balls, and the big leap to claim the high one at the very top — shout "KEEPER\'S!" like you own the sky.',
      'U12-U14': 'Handling circuit — long barrier scoop, basket, W-shape, then attack the high ball at its peak with a knee up. Loud "keeper\'s!" call on everything you claim.',
      'U15+': 'Repetition handling under increasing tempo — clean technique on all four catches, reset footwork between serves, and dominant communication. Hands are habits; build them here.',
    },
    adaptations: {
      easier: ['Softer, slower serves.', 'High balls thrown lower.'],
      harder: ['Serves alternate randomly.', 'Add a passive attacker standing near the high-ball zone.'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'Handling circuit',
      goals: [{ x: 10, y: 32, facing: 'right' }],
      cones: [],
      phases: [
        { t: 0, label: 'Rolled ball — scoop it up…' },
        { t: 0.35, label: 'Chest ball — W-catch…' },
        { t: 0.7, label: 'High ball — claim it at the top!' },
      ],
      entities: [
        { id: 'srv', kind: 'player', team: 'n', label: 'S', path: still(45, 32) },
        {
          id: 'gk', kind: 'player', team: 'k', label: 'GK',
          path: [{ t: 0, x: 15, y: 32 }, { t: 0.3, x: 15, y: 32 }, { t: 0.65, x: 15, y: 30 }, { t: 0.82, x: 18, y: 30, arc: 2 }, { t: 1, x: 15, y: 32 }],
        },
        {
          id: 'ball', kind: 'ball',
          path: [
            { t: 0, x: 43, y: 32 }, { t: 0.05, x: 43, y: 32 }, { t: 0.18, x: 16, y: 32 }, { t: 0.28, x: 16, y: 32 },
            { t: 0.42, x: 43, y: 32, arc: 3 }, { t: 0.5, x: 43, y: 32 }, { t: 0.62, x: 16, y: 31, arc: 3 }, { t: 0.72, x: 16, y: 31 },
            { t: 0.85, x: 43, y: 32, arc: 3 }, { t: 0.9, x: 43, y: 32 }, { t: 1, x: 18, y: 30, arc: 8 },
          ],
        },
        { id: 'q1', kind: 'player', team: 'a', label: '2', path: still(52, 44) },
      ],
    },
  },

  // ================= GAMES =================
  {
    id: 'small-sided-game',
    name: 'Small-Sided Game',
    emoji: '🏆',
    category: 'game',
    focus: ['teamwork', 'fitness', 'passing', 'defending', '1v1', 'triangles', 'shooting'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 22 },
    baseDuration: 15,
    blurb: 'The match they\'ve been waiting for — small teams, lots of touches.',
    setup: [
      'Pitch sized to your numbers: roughly 25 x 20 steps for 4v4, bigger for more.',
      'Cone goals (2 steps wide) or real goals at each end.',
      'Split into even teams with bibs. 4v4 or 5v5 is the sweet spot — make two pitches rather than one big game.',
    ],
    howToPlay: [
      'Normal football, no offside, kick-ins instead of throw-ins.',
      'Sneaky rule to reinforce today\'s topic: e.g. "goals after 3+ passes count double" or "you must beat one player before scoring".',
      'Keep score, keep it flowing, referee loosely.',
    ],
    coachingPoints: [
      'Stand back and let them play — save coaching for natural breaks.',
      'Praise the behaviours from today\'s drills the moment you see them.',
      'Small pitches + small teams = everyone touches the ball constantly.',
    ],
    kidExplanation: {
      'U6-U8': 'It\'s a real match! Show me all your best moves from today — every trick you learned counts double!',
      'U9-U11': 'Game time! Everything you practised today counts double if we see it in the match. Show me those moves!',
      'U12-U14': 'Match time — normal rules plus today\'s twist. Show me today\'s topic in the game and it counts double.',
      'U15+': 'Small-sided game with a constraint tied to today\'s topic. Play at match intensity — I\'m looking for today\'s work appearing under real pressure.',
    },
    adaptations: {
      easier: ['Bigger pitch, bigger goals.'],
      harder: ['Two-touch zones.', 'Silent football (no shouting) to force scanning.'],
    },
    diagram: {
      duration: 8,
      areaLabel: '4v4 small pitch',
      goals: [{ x: 8, y: 32, facing: 'right' }, { x: 92, y: 32, facing: 'left' }],
      cones: [{ x: 8, y: 8 }, { x: 92, y: 8 }, { x: 8, y: 56 }, { x: 92, y: 56 }],
      phases: [
        { t: 0, label: 'Build up with passes…' },
        { t: 0.6, label: '…triangle in the corner…' },
        { t: 0.85, label: 'GOAL!' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 25, y: 22 }, { t: 0.4, x: 40, y: 24 }, { t: 0.8, x: 55, y: 20 }, { t: 1, x: 60, y: 22 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 30, y: 44 }, { t: 0.4, x: 48, y: 44 }, { t: 0.7, x: 62, y: 40 }, { t: 1, x: 70, y: 36 }] },
        { id: 'a3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 45, y: 32 }, { t: 0.5, x: 60, y: 30 }, { t: 0.8, x: 74, y: 28 }, { t: 1, x: 78, y: 30 }] },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 55, y: 26 }, { t: 0.5, x: 52, y: 30 }, { t: 1, x: 66, y: 30 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 62, y: 42 }, { t: 0.5, x: 58, y: 40 }, { t: 1, x: 72, y: 38 }] },
        { id: 'b3', kind: 'player', team: 'b', label: '3', path: [{ t: 0, x: 78, y: 32 }, { t: 0.6, x: 76, y: 34 }, { t: 1, x: 84, y: 32 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 27, y: 24 }, { t: 0.25, x: 32, y: 44 }, { t: 0.45, x: 50, y: 44 }, { t: 0.6, x: 62, y: 31 }, { t: 0.75, x: 72, y: 39 }, { t: 0.85, x: 76, y: 30 }, { t: 1, x: 91, y: 30 }],
        },
      ],
    },
  },
  {
    id: 'numbers-game',
    name: 'The Numbers Game',
    emoji: '🔢',
    category: 'game',
    focus: ['teamwork', '1v1', 'fitness', 'shooting'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 20 },
    baseDuration: 12,
    blurb: 'Call a number — that many players from each team sprint out to battle.',
    setup: [
      'Pitch about 20 x 15 steps, small goal at each end.',
      'Two teams line up beside their own goal, numbered off 1, 2, 3…',
      'You stand at halfway with all the balls.',
    ],
    howToPlay: [
      'Roll a ball in and shout a number — "TWO!" means two from each team sprint out and play 2v2 until a goal or the ball leaves.',
      'Everyone else stays ready on their line.',
      'Shout "EVERYONE!" for chaos rounds.',
      'First team to 10 goals wins.',
    ],
    coachingPoints: [
      'React fast — first to the ball usually wins the duel.',
      'In 2v2/3v3, one attacks the ball, one finds space.',
      'Waiting players: cheer your teammates — bench energy wins games.',
    ],
    kidExplanation: {
      'U6-U8': 'You have a secret number! When I shout it, run out super fast and try to score in the mini match — then zoom back home!',
      'U9-U11': 'You each have a secret agent number. When I shout yours, you burst onto the pitch for an instant mini-match. Stay sharp — your number could be next!',
      'U12-U14': 'Numbered off — when your number\'s called, sprint out and battle. First to the ball usually decides it, so react on the shout.',
      'U15+': 'Wave game — react to the call, win the first ball, and in small numbers create the overload: one engages, one finds space. Expect uneven calls.',
    },
    adaptations: {
      easier: ['1v1 and 2v2 only.', 'Bigger goals.'],
      harder: ['Call uneven numbers ("two v three!") to teach overloads.'],
    },
    diagram: {
      duration: 7,
      areaLabel: '20 x 15 pitch',
      goals: [{ x: 8, y: 32, facing: 'right' }, { x: 92, y: 32, facing: 'left' }],
      cones: [{ x: 8, y: 10 }, { x: 92, y: 10 }, { x: 8, y: 54 }, { x: 92, y: 54 }],
      phases: [
        { t: 0, label: '"TWO!" — sprint out!' },
        { t: 0.5, label: '2v2 battle' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 12, y: 14 }, { t: 0.3, x: 38, y: 28 }, { t: 0.7, x: 55, y: 30 }, { t: 1, x: 70, y: 28 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 12, y: 50 }, { t: 0.3, x: 36, y: 40 }, { t: 0.7, x: 52, y: 42 }, { t: 1, x: 64, y: 40 }] },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 88, y: 14 }, { t: 0.3, x: 60, y: 28 }, { t: 0.7, x: 58, y: 32 }, { t: 1, x: 72, y: 32 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 88, y: 50 }, { t: 0.3, x: 62, y: 40 }, { t: 0.7, x: 60, y: 44 }, { t: 1, x: 74, y: 42 }] },
        { id: 'aq', kind: 'player', team: 'a', label: '3', path: still(6, 20) },
        { id: 'bq', kind: 'player', team: 'b', label: '3', path: still(94, 20) },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(50, 60) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 50, y: 58 }, { t: 0.15, x: 48, y: 34 }, { t: 0.4, x: 40, y: 30 }, { t: 0.7, x: 56, y: 32 }, { t: 0.88, x: 72, y: 30 }, { t: 1, x: 91, y: 31 }],
        },
      ],
    },
  },

  {
    id: 'world-cup-shootout',
    name: 'World Cup Shootout',
    emoji: '🌍',
    category: 'game',
    focus: ['shooting', '1v1', 'teamwork'],
    equipment: ['balls', 'goals'],
    players: { min: 4, max: 20 },
    baseDuration: 12,
    preferredPositions: ['forwards'],
    blurb: 'A knockout shooting tournament where every player picks a country and battles to be champion.',
    setup: [
      'One goal, shooting line about 10 steps out.',
      'Everyone picks a country name. Line up single file with balls.',
      'Goalkeeper optional — use a smaller cone goal if going keeper-less.',
    ],
    howToPlay: [
      'Two players go head-to-head: each gets one shot, most goals from 2 rounds advances.',
      'Loser is out (or joins a consolation bracket for younger groups so nobody just watches).',
      'Keep pairing up winners until you have a champion.',
      'Add pressure rounds: winner must score, loser just needs to match them.',
    ],
    coachingPoints: [
      'Same routine every shot: plant foot beside the ball, eyes on your target spot, follow through.',
      'Placement in the corners beats blasting the middle.',
      'Handle the pressure — a deep breath before you strike.',
    ],
    kidExplanation: {
      'U6-U8': 'Pick your favourite country — you\'re their star player in the World Cup final! Take your shot, and don\'t forget your goal celebration!',
      'U9-U11': 'Pick your country, walk out to "your" World Cup final, and see who\'s still standing when the trophy\'s handed out!',
      'U12-U14': 'Pick a country, win your head-to-head shootouts, survive and advance. Same routine every shot: spot, breath, strike.',
      'U15+': 'Tournament shooting under pressure — routine is everything. Pick your spot before the run-up, control your breathing, and repeat the exact same process every kick.',
    },
    adaptations: {
      easier: ['Move the shooting line closer.', 'Best of 3 shots each.'],
      harder: ['Weak foot only.', 'Add a goalkeeper for the final four.'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'Shootout line',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }],
      phases: [
        { t: 0, label: 'Player 1 steps up...' },
        { t: 0.4, label: 'GOAL!' },
        { t: 0.6, label: 'Player 2\'s turn...' },
      ],
      entities: [
        // Run-up, then ONE continuous strike into the net — the ball never
        // stalls mid-flight. Slight arc lifts the shot off the grass.
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 32, y: 25 }, { t: 0.1, x: 37, y: 24 }, { t: 1, x: 37, y: 24 }] },
        { id: 'b1', kind: 'ball', path: [{ t: 0, x: 39, y: 24 }, { t: 0.1, x: 39, y: 24 }, { t: 0.38, x: 88, y: 20, arc: 2.5 }, { t: 1, x: 88, y: 20 }] },
        { id: 'p2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 34, y: 44 }, { t: 0.55, x: 34, y: 44 }, { t: 0.63, x: 37, y: 41 }, { t: 1, x: 37, y: 41 }] },
        { id: 'b2', kind: 'ball', path: [{ t: 0, x: 39, y: 41 }, { t: 0.63, x: 39, y: 41 }, { t: 0.9, x: 88, y: 40, arc: 2.5 }, { t: 1, x: 88, y: 40 }] },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 89, y: 30 }, { t: 0.38, x: 89, y: 24 }, { t: 0.6, x: 89, y: 32 }, { t: 0.9, x: 89, y: 38 }, { t: 1, x: 89, y: 32 }] },
      ],
    },
  },
  {
    id: 'possession-wars',
    name: 'Possession Wars',
    emoji: '👑',
    category: 'game',
    focus: ['passing', 'triangles', 'teamwork'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 8, max: 24 },
    baseDuration: 14,
    blurb: 'Two teams battle for territory — score by stringing together passes inside the opponent\'s zone.',
    setup: [
      'Pitch about 30 x 20 steps split into three zones with cones: your third, no-man\'s-land, their third.',
      'Two even teams in bibs, one ball.',
    ],
    howToPlay: [
      'Score a point every time your team completes 5 passes in a row while at least one of you stands in the far third.',
      'Losing the ball resets the count to zero — for both teams.',
      'No tackling in your own defensive third — force the game to build through the middle.',
      'First team to 5 points wins; play best of 3 rounds.',
    ],
    coachingPoints: [
      'Spread the pitch — good possession needs width and depth, not everyone bunched on the ball.',
      'Support every pass from two angles, not just one.',
      'Defending team: press together, don\'t chase alone.',
    ],
    kidExplanation: {
      'U6-U8': 'Keep the ball in your team like pirate treasure! Five passes without the other pirates stealing it wins your team a gold coin!',
      'U9-U11': 'It\'s a territory battle — every zone you hold with clean passing is a point closer to ruling the whole pitch. Keep the ball, keep the crown!',
      'U12-U14': 'Score by stringing five passes with a teammate in the far third. Width and depth win it — don\'t crowd the ball.',
      'U15+': 'Territory possession — five unanswered passes with presence in the far zone scores. Stretch the pitch, support each pass from two angles, press together on the turnover.',
    },
    adaptations: {
      easier: ['3 passes needed instead of 5.', 'No zones — anywhere counts.'],
      harder: ['Two-touch max.', '7 passes needed, and it must include every teammate once.'],
    },
    diagram: {
      duration: 9,
      areaLabel: '3-zone pitch',
      cones: [{ x: 10, y: 8 }, { x: 10, y: 56 }, { x: 40, y: 8 }, { x: 40, y: 56 }, { x: 60, y: 8 }, { x: 60, y: 56 }, { x: 90, y: 8 }, { x: 90, y: 56 }],
      zones: [{ x: 60, y: 8, w: 30, h: 48 }],
      phases: [
        { t: 0, label: 'Build through the middle...' },
        { t: 0.6, label: 'Into their third!' },
        { t: 0.8, label: '5 passes — point!' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 20, y: 20 }, { t: 0.4, x: 45, y: 24 }, { t: 0.7, x: 68, y: 20 }, { t: 1, x: 72, y: 22 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 22, y: 44 }, { t: 0.4, x: 48, y: 44 }, { t: 0.7, x: 70, y: 44 }, { t: 1, x: 76, y: 40 }] },
        { id: 'a3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 35, y: 32 }, { t: 0.4, x: 55, y: 32 }, { t: 0.7, x: 74, y: 32 }, { t: 1, x: 80, y: 30 }] },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 55, y: 24 }, { t: 0.5, x: 58, y: 28 }, { t: 1, x: 64, y: 24 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 58, y: 44 }, { t: 0.5, x: 62, y: 40 }, { t: 1, x: 66, y: 44 }] },
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 22, y: 22 }, { t: 0.25, x: 24, y: 44 }, { t: 0.4, x: 47, y: 44 }, { t: 0.55, x: 50, y: 33 }, { t: 0.7, x: 70, y: 20 }, { t: 0.85, x: 72, y: 44 }, { t: 1, x: 78, y: 32 }] },
      ],
    },
  },
  {
    id: 'keepers-gauntlet',
    name: 'Keeper\'s Gauntlet',
    emoji: '🥅',
    category: 'game',
    focus: ['goalkeeping', 'shooting', 'teamwork'],
    equipment: ['balls', 'goals'],
    players: { min: 4, max: 14 },
    needsPositions: ['goalkeeper'],
    preferredPositions: ['forwards'],
    baseDuration: 10,
    blurb: 'Outfield players take turns rushing the keeper in waves — great pressure practice for everyone.',
    setup: [
      'One goal, keeper in it. Outfield players queue with balls about 15 steps out.',
    ],
    howToPlay: [
      'One at a time, a player dribbles in and shoots or takes on the keeper 1v1 — keeper must deal with wave after wave.',
      'Score a goal = 1 point for outfield. Keeper save/claim = 1 point for the keeper.',
      'Swap the keeper every 90 seconds so everyone gets a turn in goal.',
      'Speed round: cut the gap between attackers to 5 seconds — keeper has to reset fast.',
    ],
    coachingPoints: [
      'Keeper: reset your position after every action, don\'t stay down.',
      'Attackers: commit to your decision early — shoot or dribble past, don\'t dither.',
      'Keeper: talk yourself through it — "set, save, up, reset."',
    ],
    kidExplanation: {
      'U6-U8': 'The keeper guards the castle gate and everyone else is the dragon army! Attack one at a time and try to sneak the ball past into the castle!',
      'U9-U11': 'The keeper is a castle gate facing an endless army — wave after wave attacks, and the keeper has to hold the line every single time!',
      'U12-U14': 'Waves of 1v1s at the keeper. Attackers, decide early — shoot or take them on. Keepers, reset your set position after every single action.',
      'U15+': 'Keeper pressure training — wave after wave with shrinking recovery time. "Set, save, up, reset." Attackers: commit to your decision before your third touch.',
    },
    adaptations: {
      easier: ['Slow the pace between attackers.', 'Bigger goal for the keeper to feel successful early.'],
      harder: ['Attackers get 2 touches only before shooting.', 'Two attackers arrive at once.'],
    },
    diagram: {
      duration: 7,
      areaLabel: 'Keeper gauntlet',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 40, y: 14 }, { x: 40, y: 50 }],
      phases: [
        { t: 0, label: 'Attacker 1 rushes in...' },
        { t: 0.4, label: 'Save!' },
        { t: 0.55, label: 'Reset — attacker 2 incoming' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 38, y: 24 }, { t: 0.4, x: 70, y: 26 }, { t: 1, x: 74, y: 24 }] },
        { id: 'b1', kind: 'ball', path: [{ t: 0, x: 40, y: 24 }, { t: 0.35, x: 72, y: 26, ease: 'inout' }, { t: 0.42, x: 84, y: 28 }, { t: 0.52, x: 78, y: 24 }, { t: 1, x: 78, y: 24 }] },
        { id: 'a2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 30, y: 44 }, { t: 0.55, x: 30, y: 44 }, { t: 1, x: 65, y: 42 }] },
        { id: 'gk', kind: 'player', team: 'k', label: 'GK', path: [{ t: 0, x: 88, y: 32 }, { t: 0.4, x: 84, y: 26 }, { t: 0.55, x: 88, y: 32 }, { t: 1, x: 88, y: 32 }] },
      ],
    },
  },

  {
    id: 'king-of-the-ring',
    name: 'King of the Ring',
    emoji: '👑',
    category: 'game',
    focus: ['dribbling', '1v1', 'defending', 'fitness'],
    equipment: ['balls', 'cones'],
    players: { min: 4, max: 20 },
    baseDuration: 10,
    blurb: 'Everyone dribbles inside the ring — protect your ball, kick everyone else\'s out.',
    setup: [
      'A circle about 15–20 steps across marked with cones.',
      'Every player inside with a ball.',
    ],
    howToPlay: [
      'Keep your own ball under control while trying to kick everyone else\'s out of the ring.',
      'If your ball leaves the ring — even by accident — you\'re out (do 5 keepy-up attempts, then rejoin next round).',
      'Shrink the ring as players go out.',
      'Last player with a ball is King (or Queen) of the Ring.',
    ],
    coachingPoints: [
      'Body between your ball and danger — shield constantly.',
      'Head on a swivel: attack when others aren\'t looking, defend when they are.',
      'Play the last three players tight — the endgame is pure 1v1 craft.',
    ],
    kidExplanation: {
      'U6-U8': 'Your ball is your puppy — keep it safe on its lead! Try to shoo the other puppies out of the park, but if yours runs out, you\'re out too!',
      'U9-U11': 'Protect your ball with your life and boot everyone else\'s into the wilderness. Last one standing takes the crown — sneaky beats strong!',
      'U12-U14': 'Shield your ball, hunt the others. It\'s scanning, shielding and timing tackles all in one game — and the shrinking ring punishes anyone hiding in the corner.',
      'U15+': 'Simultaneous attack and defence under chaos — constant scanning, ball-side body position, and choosing the right moment to leave your ball to attack someone else\'s. The trade-off IS the game.',
    },
    adaptations: {
      easier: ['Bigger ring.', 'Coach is the only "shark" for round one.'],
      harder: ['Weak foot only.', 'Two rings — winners move up, "champions ring" plays for the title.'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'The ring',
      circleRadius: 22,
      cones: [],
      phases: [
        { t: 0, label: 'Shield yours, hunt theirs…' },
        { t: 0.55, label: 'One ball booted out!' },
      ],
      entities: [
        {
          id: 'p1', kind: 'player', team: 'a', label: '1',
          path: [{ t: 0, x: 40, y: 26 }, { t: 0.3, x: 48, y: 34 }, { t: 0.55, x: 56, y: 30 }, { t: 0.8, x: 50, y: 24 }, { t: 1, x: 44, y: 28 }],
        },
        {
          id: 'b1', kind: 'ball',
          path: [{ t: 0, x: 42, y: 28 }, { t: 0.3, x: 50, y: 36 }, { t: 0.55, x: 58, y: 32 }, { t: 0.8, x: 52, y: 26 }, { t: 1, x: 46, y: 30 }],
        },
        {
          id: 'p2', kind: 'player', team: 'a', label: '2',
          path: [{ t: 0, x: 58, y: 40 }, { t: 0.45, x: 52, y: 38 }, { t: 0.6, x: 56, y: 42 }, { t: 1, x: 60, y: 38 }],
        },
        {
          id: 'b2', kind: 'ball',
          path: [{ t: 0, x: 60, y: 42 }, { t: 0.45, x: 54, y: 40 }, { t: 0.55, x: 56, y: 43 }, { t: 0.78, x: 84, y: 52 }, { t: 1, x: 84, y: 52 }],
        },
        {
          id: 'p3', kind: 'player', team: 'a', label: '3',
          path: [{ t: 0, x: 44, y: 42 }, { t: 0.45, x: 50, y: 41 }, { t: 0.6, x: 54, y: 44 }, { t: 0.85, x: 60, y: 48 }, { t: 1, x: 58, y: 46 }],
        },
      ],
    },
  },
  {
    id: 'four-goal-game',
    name: 'Four-Goal Game',
    emoji: '🧭',
    category: 'game',
    focus: ['teamwork', 'passing', 'dribbling', 'triangles'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 20 },
    baseDuration: 14,
    blurb: 'Each team can score in TWO goals — if one\'s blocked, switch to the other.',
    setup: [
      'Square pitch about 25 x 25 steps with a cone goal in each corner (or side).',
      'Two teams in bibs; each team attacks two goals and defends the other two.',
    ],
    howToPlay: [
      'Normal football, but your team can score through either of your two target goals.',
      'When defenders crowd one goal, the smart play is switching to the other.',
      'Kick-ins, no keepers, quick restarts.',
      'First to 5, then swap which goals each team attacks.',
    ],
    coachingPoints: [
      'Heads up before you receive: which goal is free RIGHT NOW?',
      'One switch pass beats five dribbles into traffic.',
      'Praise the players who spot the empty goal, not just the scorers.',
    ],
    kidExplanation: {
      'U6-U8': 'You have TWO treasure doors to score in! If pirates are guarding one door, sneak the ball to the other one — the empty door is the magic door!',
      'U9-U11': 'Two goals each — the defenders can\'t guard both! When they crowd one, switch the ball to the empty one. Smartest team wins, not fastest.',
      'U12-U14': 'Two targets each way — scan before you receive and attack whichever is free. Crowded goal? One switch pass changes everything.',
      'U15+': 'Decision game — the two-goal rule rewards scanning and switching play under pressure. If you\'re dribbling into a crowd, you missed the picture two passes ago.',
    },
    adaptations: {
      easier: ['Wider goals.', '3 passes before scoring so everyone touches it.'],
      harder: ['Goals only count after a switch (ball must cross the halfway width first).', 'Two-touch max.'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'Four-goal square',
      gates: [
        [{ x: 8, y: 14 }, { x: 8, y: 24 }],
        [{ x: 8, y: 40 }, { x: 8, y: 50 }],
        [{ x: 92, y: 14 }, { x: 92, y: 24 }],
        [{ x: 92, y: 40 }, { x: 92, y: 50 }],
      ],
      cones: [{ x: 8, y: 6 }, { x: 92, y: 6 }, { x: 8, y: 58 }, { x: 92, y: 58 }],
      phases: [
        { t: 0, label: 'Top goal is crowded…' },
        { t: 0.45, label: '…switch to the free one!' },
        { t: 0.85, label: 'GOAL through the open door!' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 40, y: 18 }, { t: 0.4, x: 52, y: 20 }, { t: 1, x: 60, y: 24 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 36, y: 34 }, { t: 0.45, x: 48, y: 36 }, { t: 0.75, x: 62, y: 40 }, { t: 1, x: 70, y: 42 }] },
        { id: 'a3', kind: 'player', team: 'a', label: '3', path: [{ t: 0, x: 52, y: 46 }, { t: 0.5, x: 64, y: 46 }, { t: 1, x: 76, y: 45 }] },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 72, y: 16 }, { t: 0.4, x: 66, y: 20 }, { t: 1, x: 70, y: 28 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 78, y: 24 }, { t: 0.5, x: 74, y: 30 }, { t: 1, x: 78, y: 38 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 42, y: 18 }, { t: 0.25, x: 54, y: 21 }, { t: 0.45, x: 50, y: 37 }, { t: 0.62, x: 66, y: 46 }, { t: 0.72, x: 68, y: 46 }, { t: 0.88, x: 93, y: 45 }, { t: 1, x: 93, y: 45 }],
        },
      ],
    },
  },
  {
    id: 'crossbar-challenge',
    name: 'Crossbar Challenge',
    emoji: '🎯',
    category: 'game',
    focus: ['shooting', 'passing'],
    equipment: ['balls', 'goals'],
    players: { min: 2, max: 20 },
    baseDuration: 10,
    preferredPositions: ['forwards', 'midfield'],
    blurb: 'The classic — hit the crossbar from distance, loudest CLANG wins.',
    setup: [
      'One goal, a shooting line 12–18 steps out depending on age.',
      'Everyone with a ball in a queue (or two queues racing).',
    ],
    howToPlay: [
      'Take turns trying to hit the crossbar with a lofted strike.',
      'Scoring: 3 points for the bar, 1 point for hitting either post, 1 bonus if your ball goes in off the bar.',
      'Team version: teams alternate, first team to 10 points.',
      'Trick-shot final round: chips only.',
    ],
    coachingPoints: [
      'Lean back slightly and strike under the ball to lift it — but follow through at the TARGET.',
      'This is disguised technique practice: every attempt is a lofted pass rep.',
      'Let them celebrate the clangs — this game builds striking confidence fast.',
    ],
    kidExplanation: {
      'U6-U8': 'The crossbar is a sleeping dragon\'s tail — can you make your ball fly up and BONK it? Biggest BONK of the day gets the loudest cheer!',
      'U9-U11': 'Hit the bar, hear the CLANG, win the glory. Three points for the bar — chip it, curl it, blast it, your choice!',
      'U12-U14': 'Crossbar challenge — lofted technique with a target. Strike under the ball, follow through at the bar. Three for the bar, one for a post.',
      'U15+': 'Precision lofted striking — pick your technique (chip, driven rise, curler) and repeat it. It\'s a party game that\'s secretly long-range passing accuracy.',
    },
    adaptations: {
      easier: ['Move the line closer.', 'Points for hitting anywhere on goal frame or net.'],
      harder: ['One attempt each, sudden death.', 'Weak foot doubles the points.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Crossbar range',
      goals: [{ x: 90, y: 32, facing: 'left' }],
      cones: [{ x: 35, y: 16 }, { x: 35, y: 48 }],
      phases: [
        { t: 0, label: 'Line it up…' },
        { t: 0.45, label: 'CLANG! Off the bar!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 30, y: 34 }, { t: 0.1, x: 33, y: 32 }, { t: 1, x: 34, y: 32 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 35, y: 32 }, { t: 0.12, x: 35, y: 32 }, { t: 0.45, x: 89, y: 32, arc: 9 }, { t: 0.8, x: 66, y: 34, arc: 5 }, { t: 1, x: 62, y: 35 }],
        },
        { id: 'q1', kind: 'player', team: 'b', label: '2', path: still(28, 40) },
        { id: 'q2', kind: 'player', team: 'a', label: '3', path: still(23, 44) },
      ],
    },
  },

  // ================= COOL-DOWNS =================
  {
    id: 'cooldown-circle',
    name: 'Cool-Down Circle',
    emoji: '🧘',
    category: 'cooldown',
    focus: ['fitness'],
    equipment: [],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'Gentle jog, stretches, and a team huddle to finish.',
    setup: [
      'Everyone in a big circle, arms-width apart. You join it too.',
    ],
    howToPlay: [
      'One slow lap jog around the area together, then back to the circle.',
      'Stretch sequence, 15 seconds each: reach for the sky → toe touch → quad hold (balance!) → butterfly sit → arm-across shoulder.',
      'While stretching, go around the circle: everyone says their favourite moment of today.',
      'Finish with the team cheer on three.',
    ],
    coachingPoints: [
      'Slow everything down — breathing back to normal.',
      'Use the round-the-circle chat to reinforce one thing each player did well.',
      'End on the cheer — always finish on a high.',
    ],
    kidExplanation: {
      'U6-U8': 'Time to land our rocket ship back on Earth — slow jog, biiiig stretches, and then tell everyone your favourite bit of today!',
      'U9-U11': 'Time to land the plane. Slow jog, big stretches, and I want to hear the best thing you did today — brag away!',
      'U12-U14': 'Slow lap, stretch sequence, then one favourite moment each around the circle. Bring the heart rate down properly.',
      'U15+': 'Cool-down lap and stretch holds — do it properly, your body will thank you Thursday. One reflection each: what went well, what you\'d work on next.',
    },
    adaptations: {
      easier: ['Skip the lap; stretches only.'],
      harder: ['Add gentle ball juggling in pairs while cooling down.'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'Team circle',
      circleRadius: 20,
      cones: [],
      phases: [
        { t: 0, label: 'Stretch together' },
        { t: 0.5, label: 'Favourite moment of today?' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(50, 12) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(69, 19) },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: still(76, 36) },
        { id: 'p4', kind: 'player', team: 'a', label: '4', path: still(64, 50) },
        { id: 'p5', kind: 'player', team: 'a', label: '5', path: still(36, 50) },
        { id: 'p6', kind: 'player', team: 'a', label: '6', path: still(24, 36) },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(31, 19) },
      ],
    },
  },
  {
    id: 'keepy-up-cooldown',
    name: 'Keepy-Up Wind-Down',
    emoji: '🎈',
    category: 'cooldown',
    focus: ['dribbling'],
    equipment: ['balls'],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'Relaxed juggling challenges while heart rates come down.',
    setup: [
      'Players spread out, one ball each (or one between two).',
    ],
    howToPlay: [
      'Personal best challenge: count your keepy-ups, any body part. Drop = restart the count.',
      'Younger players: let the ball bounce between touches.',
      'Pairs: one throw, partner returns it with one touch — thigh, foot, or head.',
      'Finish with a slow walk-in while you recap the session.',
    ],
    coachingPoints: [
      'Soft ankles — cushion the ball, don\'t kick it.',
      'Eyes on the ball, relaxed shoulders.',
      'This is calm-down time — keep your voice low and warm.',
    ],
    kidExplanation: {
      'U6-U8': 'The ball turned into a balloon! Give it soft little taps to keep it floating — you can let it bounce on the grass in between.',
      'U9-U11': 'The ball is a balloon now — keep it floating gently. Beat your own record, nobody else\'s.',
      'U12-U14': 'Relaxed juggling — soft ankles, eyes on the ball, beat your personal best while your heart rate comes down.',
      'U15+': 'Wind-down juggling — clean technique, both feet, thigh mixes. Chase your own record, keep it calm.',
    },
    adaptations: {
      easier: ['Catch between each touch.'],
      harder: ['Left foot, right foot, thigh sequence.'],
    },
    diagram: {
      duration: 5,
      areaLabel: 'Open space',
      cones: [],
      phases: [{ t: 0, label: 'Soft touches — keep it floating' }],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(35, 30) },
        // Juggling = repeated little hops in place; height comes from `arc`,
        // so the shadow stays under the ball and shrinks on every touch.
        { id: 'b1', kind: 'ball', path: [{ t: 0, x: 35, y: 27 }, { t: 0.25, x: 35, y: 27, arc: 3 }, { t: 0.5, x: 35, y: 27, arc: 3 }, { t: 0.75, x: 35, y: 27, arc: 3 }, { t: 1, x: 35, y: 27, arc: 3 }] },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(65, 38) },
        { id: 'b2', kind: 'ball', path: [{ t: 0, x: 65, y: 35 }, { t: 0.33, x: 65, y: 35, arc: 4 }, { t: 0.66, x: 65, y: 35, arc: 4 }, { t: 1, x: 65, y: 35, arc: 4 }] },
      ],
    },
  },
  {
    id: 'partner-stretch',
    name: 'Partner Stretch & Share',
    emoji: '🤝',
    category: 'cooldown',
    focus: ['teamwork', 'fitness'],
    equipment: [],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'Partner-assisted stretches paired with a quick chat about today\'s best moment.',
    setup: [
      'Pairs sit facing each other, spread out across the area.',
    ],
    howToPlay: [
      'Seated partner stretches: hamstring reach with gentle partner-assisted push, butterfly stretch, gentle back-to-back twist.',
      'Hold each stretch 15-20 seconds while chatting about one thing that went well today.',
      'Swap who talks first each stretch so everyone gets heard.',
      'Finish standing, arms around shoulders for the team cheer.',
    ],
    coachingPoints: [
      'Partner-assisted stretches: gentle pressure only, never bounce or force it.',
      'This is a listening moment — really hear what your partner says.',
      'Keep your own voice calm and quiet to bring the energy down.',
    ],
    kidExplanation: {
      'U6-U8': 'Sit with your buddy and stretch like sleepy cats — nice and gentle — while you tell each other the best thing you did today!',
      'U9-U11': 'Your partner helps stretch you out gently while you both swap stories about today\'s best bits — teamwork doesn\'t stop just because the whistle did.',
      'U12-U14': 'Partner-assisted stretching — gentle pressure, no bouncing — while you each share one thing that went well today.',
      'U15+': 'Assisted stretch holds, 15–20 seconds each, easy pressure only. Use the time to give your partner one honest piece of positive feedback from the session.',
    },
    adaptations: {
      easier: ['Stretches without partner assistance if preferred.'],
      harder: ['Add a partner-resisted core stretch (gentle sit-up holds).'],
    },
    diagram: {
      duration: 8,
      areaLabel: 'Partner pairs',
      cones: [],
      phases: [
        { t: 0, label: 'Gentle stretch...' },
        { t: 0.5, label: 'Swap and share!' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(38, 26) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(46, 26) },
        { id: 'p3', kind: 'player', team: 'b', label: '3', path: still(60, 42) },
        { id: 'p4', kind: 'player', team: 'b', label: '4', path: still(68, 42) },
      ],
    },
  },
  {
    id: 'chip-catch-cooldown',
    name: 'Chip & Catch Wind-Down',
    emoji: '🤲',
    category: 'cooldown',
    focus: ['passing', 'shooting'],
    equipment: ['balls'],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'Gentle partner chipping and catching to bring the energy down with soft touches.',
    setup: [
      'Pairs about 6 steps apart, one ball each pair.',
    ],
    howToPlay: [
      'Partner A chips the ball softly using the laces so it arcs; Partner B catches or cushions it on the chest/thigh.',
      'Swap after 5 chips each.',
      'Progress: catch and return with a gentle volley instead of catching by hand.',
      'Finish with everyone in for a slow walk and recap of today\'s session.',
    ],
    coachingPoints: [
      'Soft, lofted technique — get under the ball, follow through upward not through it.',
      'Catchers: give with the surface, don\'t catch it rigid.',
      'Low energy, quiet voices — this is the wind-down.',
    ],
    kidExplanation: {
      'U6-U8': 'Make the ball float like a little cloud over to your partner — and catch theirs as softly as catching a bubble without popping it!',
      'U9-U11': 'Float the ball up like a gentle cloud for your partner to catch — no power needed, just a soft little lift and a calm catch.',
      'U12-U14': 'Soft chips to your partner, cushioned catches or chest control back. Technique and touch, zero power.',
      'U15+': 'Gentle chipping technique — get under the ball, soft upward follow-through. Receivers cushion on chest or thigh. Keep everything low-energy.',
    },
    adaptations: {
      easier: ['Roll the ball instead of chipping.'],
      harder: ['Volley the return instead of catching.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Partner pairs',
      cones: [],
      phases: [
        { t: 0, label: 'Soft chip up...' },
        { t: 0.5, label: '...gentle catch' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(34, 30) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(58, 30) },
        // Lofted chip across, caught and held, then chipped gently back.
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 36, y: 30 }, { t: 0.08, x: 36, y: 30 }, { t: 0.45, x: 56, y: 30, arc: 6 }, { t: 0.58, x: 56, y: 30 }, { t: 0.95, x: 36, y: 30, arc: 6 }, { t: 1, x: 36, y: 30 }] },
      ],
    },
  },
  {
    id: 'keeper-cooldown',
    name: 'Keeper\'s Cool-Down',
    emoji: '🤾',
    category: 'cooldown',
    focus: ['goalkeeping', 'fitness'],
    equipment: ['balls'],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'Gentle rolling and scoop catches to bring keepers (and everyone else) down slowly.',
    setup: [
      'Pairs facing each other about 5 steps apart.',
    ],
    howToPlay: [
      'Partner A rolls the ball along the ground; Partner B gets down on one knee in "keeper\'s scoop" shape to collect it.',
      'Swap sides so both practice left and right knee down.',
      'Progress: gentle underarm throw for a two-handed catch at chest height.',
      'Everyone finishes together with slow shoulder rolls and ankle shakes.',
    ],
    coachingPoints: [
      'Scoop shape: knee down, hands form a long barrier down to the ground, little fingers together.',
      'Soft hands on every catch — cushion, don\'t stab at it.',
      'Nice and slow — heart rates are coming down now.',
    ],
    kidExplanation: {
      'U6-U8': 'Everyone\'s a goalie now! Make a big scoop shape with your hands like a digger and gently gather the rolling ball.',
      'U9-U11': 'Every player gets to be a keeper for a minute — get down into your scoop shape and gather the ball like it\'s made of glass.',
      'U12-U14': 'Scoop collections and soft catches to wind down — knee down, long barrier, little fingers together.',
      'U15+': 'Low-intensity handling — long-barrier scoops both sides, soft chest-height catches. Good habits at low speed become instincts at full speed.',
    },
    adaptations: {
      easier: ['Roll the ball slower and closer.'],
      harder: ['Add a gentle bounce for a catch at head height.'],
    },
    diagram: {
      duration: 6,
      areaLabel: 'Partner pairs',
      cones: [],
      phases: [
        { t: 0, label: 'Roll it along the ground...' },
        { t: 0.5, label: 'Scoop and gather' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(34, 30) },
        { id: 'p2', kind: 'player', team: 'k', label: 'GK', path: still(58, 30) },
        { id: 'ball', kind: 'ball', path: [{ t: 0, x: 36, y: 30 }, { t: 0.1, x: 36, y: 30 }, { t: 0.7, x: 56, y: 30 }, { t: 1, x: 56, y: 30 }] },
      ],
    },
  },
  {
    id: 'silent-circle',
    name: 'Silent Circle',
    emoji: '🌙',
    category: 'cooldown',
    focus: ['teamwork', 'fitness'],
    equipment: [],
    players: { min: 2, max: 30 },
    baseDuration: 5,
    blurb: 'A few minutes of quiet breathing and stillness in a circle to fully calm down before home time.',
    setup: [
      'Everyone in a circle, arms-width apart, sitting or standing.',
    ],
    howToPlay: [
      'Slow breathing together: in for 4 counts, hold for 2, out for 4 — repeat 5 times.',
      'Total silence during the breathing — no talking, just settling.',
      'After breathing, one word each around the circle: how do you feel right now?',
      'Finish with a quiet round of applause for each other — no shouting needed.',
    ],
    coachingPoints: [
      'Model it yourself — coaches breathing loudly and visibly helps the group settle.',
      'Some players find silence hard at first — that\'s normal, keep it short the first few times.',
      'This works best right after something high-energy — the contrast is the point.',
    ],
    kidExplanation: {
      'U6-U8': 'We\'re going to be quiet as sleeping lions — breathe in slowly, breathe out slowly, and see who can be the calmest lion of all.',
      'U9-U11': 'We\'re turning the volume all the way down to zero for a minute, just breathing together like one big team of statues — then we\'ll turn it back up with a quiet clap for everyone.',
      'U12-U14': 'A couple of minutes of quiet breathing together — in for four, hold for two, out for four. Then one word each for how you feel.',
      'U15+': 'Controlled breathing to finish — 4-2-4 pattern, full silence. Recovery starts now; one word each on the way out.',
    },
    adaptations: {
      easier: ['Shorten to 3 breaths for younger groups.'],
      harder: ['Extend the silence to a full minute before the check-in.'],
    },
    diagram: {
      duration: 10,
      areaLabel: 'Team circle',
      circleRadius: 20,
      cones: [],
      phases: [
        { t: 0, label: 'Breathe in... and out...' },
        { t: 0.6, label: 'How do you feel?' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(50, 12) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(69, 19) },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: still(76, 36) },
        { id: 'p4', kind: 'player', team: 'a', label: '4', path: still(64, 50) },
        { id: 'p5', kind: 'player', team: 'a', label: '5', path: still(36, 50) },
        { id: 'p6', kind: 'player', team: 'a', label: '6', path: still(24, 36) },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(31, 19) },
      ],
    },
  },
  {
    id: 'walking-football',
    name: 'Walking Football',
    emoji: '🚶',
    category: 'cooldown',
    focus: ['teamwork', 'passing'],
    equipment: ['balls', 'cones', 'vests'],
    players: { min: 6, max: 22 },
    baseDuration: 6,
    blurb: 'The match continues — but strictly at walking pace. Brains on, heart rates down.',
    setup: [
      'Small pitch with cone goals, two teams in bibs — reuse whatever\'s already set up.',
    ],
    howToPlay: [
      'Normal football but EVERYONE must walk — one foot on the ground at all times.',
      'Running (or jogging, or that suspicious speed-walk) = free kick to the other team.',
      'No slide tackles, no shooting from your own half.',
      'Play 4–5 relaxed minutes while bodies wind down.',
    ],
    coachingPoints: [
      'With no speed, passing and positioning decide everything — point that out as it happens.',
      'Keep the tone light — laugh at the speed-walkers, award theatrical free kicks.',
      'It\'s a cool-down: any walking is fine, winning is optional.',
    ],
    kidExplanation: {
      'U6-U8': 'The whole pitch turned to sticky honey — nobody can run! Waddle like penguins, pass the ball, and NO zoomies or the other team gets a free kick!',
      'U9-U11': 'Football in slow motion — walking only! With no running allowed, the cleverest passers win. Catch someone jogging and it\'s your free kick.',
      'U12-U14': 'Walking football — no running, so the game becomes pure positioning and passing angles. Find the picture you\'d normally sprint past.',
      'U15+': 'Active recovery disguised as a game — walking pace forces you to solve everything with scanning, support angles and pass weight. Notice how much the game slows down when you think faster.',
    },
    adaptations: {
      easier: ['Bigger goals, smaller pitch.'],
      harder: ['Two-touch max — passing brains only.'],
    },
    diagram: {
      duration: 9,
      areaLabel: 'Walking pitch',
      gates: [[{ x: 10, y: 26 }, { x: 10, y: 38 }], [{ x: 90, y: 26 }, { x: 90, y: 38 }]],
      cones: [],
      phases: [
        { t: 0, label: 'Walking pace only!' },
        { t: 0.55, label: 'No zoomies — pass instead' },
      ],
      entities: [
        { id: 'a1', kind: 'player', team: 'a', label: '1', path: [{ t: 0, x: 32, y: 26 }, { t: 0.5, x: 40, y: 28 }, { t: 1, x: 46, y: 26 }] },
        { id: 'a2', kind: 'player', team: 'a', label: '2', path: [{ t: 0, x: 38, y: 42 }, { t: 0.5, x: 46, y: 40 }, { t: 1, x: 52, y: 42 }] },
        { id: 'b1', kind: 'player', team: 'b', label: '1', path: [{ t: 0, x: 56, y: 30 }, { t: 0.5, x: 52, y: 32 }, { t: 1, x: 58, y: 30 }] },
        { id: 'b2', kind: 'player', team: 'b', label: '2', path: [{ t: 0, x: 62, y: 40 }, { t: 0.5, x: 58, y: 42 }, { t: 1, x: 64, y: 40 }] },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 34, y: 28 }, { t: 0.3, x: 44, y: 40, ease: 'out' }, { t: 0.45, x: 46, y: 40 }, { t: 0.75, x: 44, y: 28 }, { t: 1, x: 48, y: 27 }],
        },
      ],
    },
  },
  {
    id: 'pass-and-praise',
    name: 'Pass & Praise Circle',
    emoji: '💬',
    category: 'cooldown',
    focus: ['passing', 'teamwork'],
    equipment: ['balls'],
    players: { min: 4, max: 30 },
    baseDuration: 5,
    blurb: 'Gentle circle passing where every pass travels with a compliment.',
    setup: [
      'Everyone in one big circle, coach included. One ball.',
    ],
    howToPlay: [
      'Pass gently across or around the circle — but first say the receiver\'s name and one thing they did well today.',
      '"Great shielding today, Alfie!" … pass … Alfie controls it and picks someone new.',
      'Everyone must receive the ball (and a compliment) before anyone gets a second turn.',
      'Finish when it comes back to the coach for the final word and the team cheer.',
    ],
    coachingPoints: [
      'Model good compliments first — specific beats generic ("brilliant turn in the last game" beats "played well").',
      'Quietly steer the ball toward kids who had a tough session.',
      'Soft passes, soft voices — hearts and heads are landing.',
    ],
    kidExplanation: {
      'U6-U8': 'The ball is a friendship parcel! Before you pass it, say your friend\'s name and something awesome they did today — then send the parcel gently over.',
      'U9-U11': 'Every pass needs a password: the receiver\'s name plus one thing they did brilliantly today. No compliment, no pass!',
      'U12-U14': 'Circle passing to wind down — name the receiver and one specific thing they did well today. Everyone gets the ball, everyone gets heard.',
      'U15+': 'Cool-down circle — keep the passes soft and the feedback specific. Recognising each other\'s work is a team skill; practise it like one.',
    },
    adaptations: {
      easier: ['Roll the ball by hand.'],
      harder: ['Receiver must return a compliment before passing on.'],
    },
    diagram: {
      duration: 9,
      areaLabel: 'Praise circle',
      circleRadius: 20,
      cones: [],
      phases: [
        { t: 0, label: '"Great defending today, Zoe!"' },
        { t: 0.5, label: '"Loved your passing, Sam!"' },
      ],
      entities: [
        { id: 'p1', kind: 'player', team: 'a', label: '1', path: still(50, 11) },
        { id: 'p2', kind: 'player', team: 'a', label: '2', path: still(70, 20) },
        { id: 'p3', kind: 'player', team: 'a', label: '3', path: still(74, 40) },
        { id: 'p4', kind: 'player', team: 'a', label: '4', path: still(58, 52) },
        { id: 'p5', kind: 'player', team: 'a', label: '5', path: still(38, 50) },
        { id: 'p6', kind: 'player', team: 'a', label: '6', path: still(27, 32) },
        { id: 'coach', kind: 'player', team: 'n', label: 'C', path: still(34, 16) },
        {
          id: 'ball', kind: 'ball',
          path: [{ t: 0, x: 50, y: 13 }, { t: 0.1, x: 50, y: 13 }, { t: 0.28, x: 72, y: 40 }, { t: 0.42, x: 72, y: 40 }, { t: 0.6, x: 38, y: 48 }, { t: 0.74, x: 38, y: 48 }, { t: 0.92, x: 68, y: 21 }, { t: 1, x: 68, y: 21 }],
        },
      ],
    },
  },
];

export const getDrill = (id) => DRILLS.find((d) => d.id === id);

// Age-appropriate "say this to the kids" line, with nearest-band fallback
// so a drill missing a band still gets the closest-aged script.
export const sayToKids = (drill, ageGroup) => {
  const k = drill.kidExplanation
  if (!k) return ''
  if (typeof k === 'string') return k
  if (k[ageGroup]) return k[ageGroup]
  const order = AGE_GROUPS.map((a) => a.id)
  const i = Math.max(0, order.indexOf(ageGroup))
  const nearest = order
    .filter((id) => k[id])
    .sort((x, y) => Math.abs(order.indexOf(x) - i) - Math.abs(order.indexOf(y) - i))[0]
  return nearest ? k[nearest] : Object.values(k)[0] || ''
}

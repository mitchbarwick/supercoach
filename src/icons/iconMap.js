// ============================================================
// Emoji → icon mapping (draft for review in #/icon-lab).
//
// Every entry is { icon, match, note? }:
//   icon   a Lucide name (kebab-case, as on lucide.dev) or the name
//          of a custom icon still to be drawn in src/icons/custom/
//   match  'lucide' — Lucide has a direct equivalent
//          'close'  — nearest Lucide icon; a custom one may suit better
//          'custom' — nothing in Lucide fits; must be drawn
//
// Drills keep their emoji: each one is a memorable, unique marker,
// and anyone adding a drill can pick one without new artwork.
//
// Emojis in written copy ("Welcome back 👋", "All done 🎉", share
// text) are content, not icons, and stay as they are.
// ============================================================

// Icons drawn in-house to Lucide's spec (24×24, 2px round stroke).
// Until one is drawn, <Icon> renders a labelled placeholder.
export const CUSTOM_ICONS = {
  football: 'Football (ball)',
  'football-goal': 'Football goal with net',
  bib: 'Training bib / vest',
  'agility-ladder': 'Flat agility ladder',
  'marker-disc': 'Flat marker disc (saucer cone)',
  hurdle: 'Mini hurdle',
  'corner-flag': 'Corner flag on a pole',
  rebounder: 'Rebounder / kickback net',
  'gk-glove': 'Goalkeeper glove',
  runner: 'Running person',
  dribble: 'Ball at a foot, curved path',
  'one-v-one': 'Two players facing off',
  leg: 'Leg and knee',
  shorts: 'Shorts (groin area)',
  tooth: 'Tooth',
  lungs: 'Lungs',
}

// Keyed by FOCUS_AREAS id (src/data/drills.js).
export const FOCUS_ICONS = {
  fitness: { icon: 'activity', match: 'lucide' },
  dribbling: { icon: 'dribble', match: 'custom' },
  '1v1': { icon: 'one-v-one', match: 'custom' },
  passing: { icon: 'arrow-right-left', match: 'lucide' },
  triangles: { icon: 'share-2', match: 'lucide', note: 'Three linked points' },
  shooting: { icon: 'football-goal', match: 'custom' },
  defending: { icon: 'shield', match: 'lucide' },
  goalkeeping: { icon: 'gk-glove', match: 'custom' },
  teamwork: { icon: 'handshake', match: 'lucide' },
}

// Keyed by EQUIPMENT id (src/data/drills.js).
export const EQUIPMENT_ICONS = {
  balls: { icon: 'football', match: 'custom' },
  cones: { icon: 'traffic-cone', match: 'close', note: 'Lucide’s is a road cone; a training cone is squatter' },
  vests: { icon: 'bib', match: 'custom' },
  goals: { icon: 'football-goal', match: 'custom' },
  ladder: { icon: 'agility-ladder', match: 'custom' },
  hurdles: { icon: 'hurdle', match: 'custom' },
  discs: { icon: 'marker-disc', match: 'custom' },
  flags: { icon: 'corner-flag', match: 'custom' },
  rebounder: { icon: 'rebounder', match: 'custom' },
  mannequins: { icon: 'person-standing', match: 'close' },
  hoops: { icon: 'circle', match: 'close' },
}

// Keyed by INJURY_CATEGORIES id (src/data/injuries.js).
export const INJURY_CATEGORY_ICONS = {
  head: { icon: 'brain', match: 'lucide' },
  leg: { icon: 'leg', match: 'custom' },
  arm: { icon: 'biceps-flexed', match: 'lucide' },
  body: { icon: 'person-standing', match: 'close' },
  medical: { icon: 'stethoscope', match: 'lucide' },
}

// Keyed by INJURIES id (src/data/injuries.js).
export const INJURY_ICONS = {
  concussion: { icon: 'brain', match: 'lucide' },
  'neck-back': { icon: 'bone', match: 'close', note: 'A spine would be clearer' },
  collapse: { icon: 'triangle-alert', match: 'lucide' },
  ankle: { icon: 'footprints', match: 'close' },
  knee: { icon: 'leg', match: 'custom' },
  hamstring: { icon: 'runner', match: 'custom' },
  calf: { icon: 'leg', match: 'custom' },
  groin: { icon: 'shorts', match: 'custom' },
  'dead-leg': { icon: 'hand-fist', match: 'close' },
  cramp: { icon: 'zap', match: 'lucide' },
  winded: { icon: 'wind', match: 'lucide' },
  fracture: { icon: 'bone-fracture', match: 'lucide' },
  shoulder: { icon: 'biceps-flexed', match: 'lucide' },
  'finger-wrist': { icon: 'hand', match: 'lucide' },
  nosebleed: { icon: 'droplet', match: 'lucide' },
  cuts: { icon: 'bandage', match: 'lucide' },
  eye: { icon: 'eye', match: 'lucide' },
  dental: { icon: 'tooth', match: 'custom' },
  asthma: { icon: 'lungs', match: 'custom' },
  heat: { icon: 'thermometer-sun', match: 'lucide' },
}

// App chrome, keyed by a semantic name the components will use.
// `was` is the emoji or symbol it replaces; `where` is a pointer
// for the migration step.
export const UI_ICONS = {
  // navigation
  home: { icon: 'house', was: '⚽', where: 'App nav' },
  plan: { icon: 'clipboard-list', was: '📋', where: 'App nav' },
  library: { icon: 'library', was: '📚', where: 'App nav, Landing' },
  settings: { icon: 'settings', was: '⚙️', where: 'App nav' },
  admin: { icon: 'chart-column', was: '📊', where: 'App nav' },
  emergency: { icon: 'siren', was: '🚨', where: 'App nav, Emergency' },
  menu: { icon: 'menu', was: '☰', where: 'App menu, DrillDetail' },
  close: { icon: 'x', was: '✕', where: 'App menu, PlanView, EmergencyGuide' },
  back: { icon: 'arrow-left', was: '←', where: 'DrillDetail, EmergencyGuide, GuestInfo' },
  next: { icon: 'arrow-right', was: '→', where: 'Buttons across pages' },

  // actions
  share: { icon: 'share-2', was: '🔗', where: 'ShareButton, DrillDetail' },
  favourite: { icon: 'heart', was: '❤️ / 🤍', where: 'Filled when on, outline when off' },
  rate: { icon: 'star', was: '⭐', where: 'SessionCelebration, DrillLibrary' },
  feedback: { icon: 'message-square', was: '💬', where: 'DrillFeedback' },
  edit: { icon: 'pencil', was: '✎', where: 'Home, PlanView' },
  delete: { icon: 'trash-2', was: '🗑', where: 'Home' },
  swap: { icon: 'arrow-left-right', was: '⇄', where: 'PlanView' },
  replay: { icon: 'rotate-ccw', was: '↺', where: 'SessionCelebration' },
  play: { icon: 'play', was: '▶️', where: 'PitchAnimation, DrillDetail' },
  pause: { icon: 'pause', was: '⏸', where: 'PitchAnimation' },
  slow: { icon: 'turtle', was: '🐢', where: 'PitchAnimation speed' },
  normalSpeed: { icon: 'rabbit', was: '🐇', where: 'PitchAnimation speed' },
  call: { icon: 'phone', was: '📞', where: 'Emergency, EmergencyGuide' },
  search: { icon: 'search', was: '🔍 / 🔎', where: 'Emergency, DrillLibrary, EmergencyGuide' },
  saved: { icon: 'pin', was: '📌', where: 'Home' },
  unsaved: { icon: 'map-pin', was: '📍', where: 'Home' },

  // status
  check: { icon: 'check', was: '✓', where: 'Tags, GuestInfo, Settings' },
  cross: { icon: 'x', was: '✗', where: 'DrillDetail tags' },
  done: { icon: 'circle-check', was: '✅', where: 'EmergencyGuide' },
  dont: { icon: 'ban', was: '⛔', where: 'EmergencyGuide' },
  warning: { icon: 'triangle-alert', was: '⚠️', where: 'SessionSetup, Admin, EmergencyGuide' },
  redFlag: { icon: 'flag', was: '🚩', where: 'EmergencyGuide' },
  locked: { icon: 'lock', was: '🔒 / 🔐', where: 'Emergency, DrillDetail, Admin' },
  hidden: { icon: 'eye-off', was: '🙈', where: 'Admin' },
  notFound: { icon: 'circle-help', was: '🤔', where: 'DrillDetail, EmergencyGuide' },
  easier: { icon: 'arrow-down', was: '↓', where: 'DrillDetail adaptations' },
  harder: { icon: 'arrow-up', was: '↑', where: 'DrillDetail adaptations' },

  // labels and meta
  players: { icon: 'users', was: '👥', where: 'DrillDetail, Admin' },
  duration: { icon: 'timer', was: '⏱', where: 'DrillDetail, Home, Admin' },
  age: { icon: 'baby', was: '🧒 / 👶', where: 'DrillDetail, DrillLibrary, Admin' },
  account: { icon: 'user-round', was: '👤', where: 'Admin, GuestInfo, Settings' },
  email: { icon: 'mail', was: '✉️', where: 'Admin' },
  sync: { icon: 'cloud', was: '☁️', where: 'Landing, GuestInfo, Home' },
  recent: { icon: 'history', was: '🕐', where: 'Home' },
  team: { icon: 'shirt', was: '👕', where: 'Settings, SessionSetup' },
  kit: { icon: 'backpack', was: '🎒', where: 'Settings, SessionSetup' },
  anything: { icon: 'dices', was: '🌈', where: 'SessionSetup focus' },
  drinkBreak: { icon: 'droplet', was: '💧', where: 'Session break blocks' },
  ai: { icon: 'sparkles', was: '✨', where: 'DrillDetail, SessionSetup, Settings' },
  sharedWithYou: { icon: 'gift', was: '🎁', where: 'SharedPlan banner' },
  fast: { icon: 'zap', was: '⚡', where: 'Landing feature' },

  // drill page section headers
  sayThis: { icon: 'speech', was: '🗣️', where: 'DrillDetail' },
  setUp: { icon: 'ruler', was: '📐', where: 'DrillDetail' },
  coachJob: { icon: 'clipboard-check', was: '🧑‍🏫', where: 'DrillDetail' },
  adjust: { icon: 'sliders-horizontal', was: '🎚️', where: 'DrillDetail' },
  notes: { icon: 'notebook-pen', was: '📝', where: 'DrillDetail' },
  coachingPoints: { icon: 'target', was: '🎯', where: 'DrillDetail, Admin' },
}

// Copy that keeps its emoji (content, not interface).
export const CONTENT_EMOJIS = [
  { text: 'Drill emojis (🦈 Sharks & Minnows, 🦀 Crab Attack…)', where: 'data/drills.js' },
  { text: 'Welcome back 👋', where: 'Home' },
  { text: 'All done 🎉', where: 'DrillDetail' },
  { text: '💚 Thanks — that goes straight to SuperCoach HQ.', where: 'DrillFeedback' },
  { text: 'Shared-message text', where: 'share/share.js' },
  { text: '♥ in the celebration animation', where: 'data/scenes/celebration.js' },
]

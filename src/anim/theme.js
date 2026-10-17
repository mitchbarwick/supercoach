// Visual tokens shared by every drill animation. Change the look of
// all 60+ diagrams here.
export const TEAM = {
  a: { fill: '#ff5a5f', dark: '#b8363b', light: '#ffb0b2' }, // coral
  b: { fill: '#2f6fed', dark: '#1d47a3', light: '#a9c3fb' }, // blue
  n: { fill: '#f5a623', dark: '#a86c0c', light: '#ffd892' }, // coach / neutral
  k: { fill: '#8e5cd9', dark: '#5b3696', light: '#cfb6f3' }, // keeper
  x: { fill: '#b7c0c7', dark: '#6f7a83', light: '#e3e8eb' }, // mannequin / passive
}

export const PITCH = {
  grass: '#2f8f58',
  stripe: 'rgba(255,255,255,0.045)',
  line: 'rgba(255,255,255,0.6)',
  zone: 'rgba(255,214,0,0.15)',
  zoneLine: 'rgba(255,214,0,0.7)',
}

export const KIT = {
  cone: '#ff9d2e',
  coneDark: '#c4650a',
  coneHole: '#ffd39a',
  disc: '#ffd54d',
  discDark: '#b89100',
  gateLine: 'rgba(255,255,255,0.7)',
  hoop: '#7cc4ff',
  ladder: '#ffd54d',
}

// Pressed grass left by the ball and by players' feet. Flattened blades
// catch the light, so marks are a pale sheen that fades as the grass
// springs back (`life` seconds; `ease` > 1 = recovers fast, then lingers).
export const WAKE = {
  ball: { color: '#e4f7d2', opacity: 0.42, width: 1.5, life: 2.6, ease: 1.6 },
  feet: { color: '#e4f7d2', opacity: 0.34, rx: 0.55, ry: 0.32, life: 1.8, ease: 1.4 },
}

export const LIMB = '#24333b'

// ---- Team colours ----------------------------------------------------
// The coach picks their team colour in Settings; it becomes team `a` (our
// players) in every diagram. When a drill needs a second team, `b` is the
// complementary opposite on the colour wheel. Keeper and coach tokens then
// take whichever accent colours sit furthest from both teams, so every
// role stays easy to tell apart on a phone at the pitch.
export const DEFAULT_TEAM_COLOUR = '#ff5a5f'

const DEFAULTS = {
  a: { ...TEAM.a }, b: { ...TEAM.b }, n: { ...TEAM.n }, k: { ...TEAM.k },
}

const hexToRgb = (hex) => {
  let h = String(hex || '').replace('#', '').trim()
  if (h.length === 3) h = h.split('').map((c) => c + c).join('')
  if (!/^[0-9a-f]{6}$/i.test(h)) return null
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255)
}
const rgbToHsl = ([r, g, b]) => {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2
  if (mx === mn) return [0, 0, l]
  const d = mx - mn
  const s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn)
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s, l]
}
const hslToHex = (h, s, l) => {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  const [r, g, b] = h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x]
  return '#' + [r, g, b].map((v) => Math.round((v + m) * 255).toString(16).padStart(2, '0')).join('')
}
const luminance = (hex) => {
  const lin = hexToRgb(hex).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
}
const hueGap = (a, b) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d }

// fill → {fill, dark rim, light accent, text colour for the number on top}
function tokenSet(fill) {
  const [h, s, l] = rgbToHsl(hexToRgb(fill))
  return {
    fill,
    dark: hslToHex(h, s, Math.max(0.08, l * 0.62)),
    light: hslToHex(h, Math.min(1, s), l + (1 - l) * 0.55),
    text: luminance(fill) > 0.42 ? '#1a1f24' : '#ffffff',
  }
}

/** The complementary opposite of a kit colour, tuned to read on grass. */
export function opposingColour(hex) {
  const rgb = hexToRgb(hex)
  if (!rgb) return DEFAULTS.b.fill
  const [h, s, l] = rgbToHsl(rgb)
  // Black, white and greys have no hue — their opposite is the other end
  // of the light scale (black kit ↔ white bibs).
  if (s < 0.15) return l > 0.5 ? '#22272e' : '#f4f6f8'
  const oh = h + 180
  // Keep the opponent vivid and mid-light so it never melts into the pitch
  // (a green-ish opposite gets lifted well clear of the grass).
  const nearGrass = hueGap(oh, 145) < 35
  return hslToHex(oh, Math.max(0.6, Math.min(0.9, s)), nearGrass ? 0.62 : Math.min(0.58, Math.max(0.45, 1 - l)))
}

/** {us, them} fills for a kit colour — handy for previews. */
export function teamPair(hex) {
  const us = hexToRgb(hex) ? hex.toLowerCase() : DEFAULT_TEAM_COLOUR
  return { us, them: us === DEFAULT_TEAM_COLOUR ? DEFAULTS.b.fill : opposingColour(us) }
}

// Accent candidates for the keeper and the coach/neutral token.
const ACCENTS = ['#f5a623', '#8e5cd9', '#e84fa0', '#9bd93a', '#2ec4d6', '#ffd23f']

/** Re-colour every diagram for this team. Mutates TEAM in place. */
export function applyTeamColours(hex) {
  if (!hex || !hexToRgb(hex) || hex.toLowerCase() === DEFAULT_TEAM_COLOUR) {
    Object.assign(TEAM, { a: { ...DEFAULTS.a }, b: { ...DEFAULTS.b }, n: { ...DEFAULTS.n }, k: { ...DEFAULTS.k } })
    return
  }
  const { us, them } = teamPair(hex)
  const hues = [us, them]
    .map((c) => rgbToHsl(hexToRgb(c)))
    .filter(([, s]) => s >= 0.15)
    .map(([h]) => h)
  const distance = (c) => {
    const ch = rgbToHsl(hexToRgb(c))[0]
    return hues.length ? Math.min(...hues.map((h) => hueGap(h, ch))) : 180
  }
  // Coach keeps amber and keeper keeps purple when they're clear of both
  // teams; otherwise each takes the clearest remaining accent.
  const ranked = [...ACCENTS].sort((x, y) => distance(y) - distance(x))
  const coach = distance(DEFAULTS.n.fill) >= 40 ? DEFAULTS.n.fill : ranked[0]
  const keeper = distance(DEFAULTS.k.fill) >= 40 && hueGap(rgbToHsl(hexToRgb(coach))[0], rgbToHsl(hexToRgb(DEFAULTS.k.fill))[0]) >= 40
    ? DEFAULTS.k.fill
    : ranked.find((c) => c !== coach && hueGap(rgbToHsl(hexToRgb(c))[0], rgbToHsl(hexToRgb(coach))[0]) >= 40) || ranked[1]
  Object.assign(TEAM, { a: tokenSet(us), b: tokenSet(them), n: tokenSet(coach), k: tokenSet(keeper) })
}

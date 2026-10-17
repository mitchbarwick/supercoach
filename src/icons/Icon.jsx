// One component for every icon in the app:
//   <Icon name="shield" />             Lucide icon, 20px
//   <Icon name="heart" filled />       solid variant (e.g. favourite on)
//   <Icon name="shark" size={24} />    custom icon, or a placeholder until drawn
// Icons are decorative (aria-hidden) unless given an aria-label.
import { LUCIDE } from './lucide.js'
import { CUSTOM } from './custom/index.jsx'

export function hasIcon(name) {
  return Boolean(LUCIDE[name] || CUSTOM[name])
}

export default function Icon({ name, size = 20, strokeWidth = 2, filled = false, className = '', ...rest }) {
  const Glyph = LUCIDE[name] || CUSTOM[name]
  const a11y = rest['aria-label'] ? { role: 'img' } : { 'aria-hidden': true }
  const cls = `icon ${className}`.trim()
  if (!Glyph) return <Placeholder name={name} size={size} className={cls} {...a11y} {...rest} />
  return <Glyph size={size} strokeWidth={strokeWidth} fill={filled ? 'currentColor' : 'none'} className={cls} {...a11y} {...rest} />
}

// Dashed square standing in for a custom icon that hasn't been drawn yet.
function Placeholder({ name, size, ...rest }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" data-placeholder={name} {...rest}>
      <title>{`${name} (not drawn yet)`}</title>
      <rect x="3" y="3" width="18" height="18" rx="4" strokeDasharray="3 3" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.2" />
      <path d="M12 17h.01" />
    </svg>
  )
}

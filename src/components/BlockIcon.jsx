// What goes in a session block's badge: drills keep their own emoji,
// drink breaks get an icon. Breaks are matched by type, not by the
// '💧' older saved and shared sessions still carry in block.emoji.
import Icon from '../icons/Icon.jsx'

export default function BlockIcon({ block }) {
  if (block.type === 'break') return <Icon name="droplet" size={22} style={{ color: 'var(--blue-600)' }} />
  return block.emoji
}

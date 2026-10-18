// Dev-only gallery (#/icon-lab): every icon in the app at a chosen
// size, for checking custom icons sit well beside Lucide ones.
//   ?size=24     icon size in px (16, 20, 24, 32)
//   ?q=ankle     filter by name
// Drills keep their emoji, so they aren't listed.
import { useSearchParams } from 'react-router-dom'
import { FOCUS_AREAS, EQUIPMENT } from '../data/drills.js'
import { INJURIES, INJURY_CATEGORIES } from '../data/injuries.js'
import { LUCIDE } from '../icons/lucide.js'
import { CUSTOM } from '../icons/custom/index.jsx'
import Icon from '../icons/Icon.jsx'

const SIZES = [16, 20, 24, 32]

export default function IconLab() {
  const [params, setParams] = useSearchParams()
  const size = Number(params.get('size')) || 24
  const q = (params.get('q') || '').toLowerCase()
  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const keep = (row) => !q || row.label.toLowerCase().includes(q) || row.icon.includes(q)
  const rows = (list, labelKey = 'label') => list.map((x) => ({ id: x.id, label: x[labelKey], icon: x.icon })).filter(keep)
  const names = (obj) => Object.keys(obj).sort().map((n) => ({ id: n, label: n, icon: n })).filter(keep)

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Icon lab</h1>
      <p className="muted" style={{ marginBottom: 12 }}>
        {Object.keys(CUSTOM).length} custom icons (src/icons/custom) and {Object.keys(LUCIDE).length} Lucide icons in use. Run <code>npm run check:icons</code> after adding one.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input value={params.get('q') || ''} onChange={(e) => setParam('q', e.target.value)} placeholder="Filter by name" style={{ padding: 8, width: 220 }} />
        <div className="chip-row">
          {SIZES.map((s) => <button key={s} className={`chip ${s === size ? 'on' : ''}`} onClick={() => setParam('size', s === 24 ? '' : String(s))}>{s}px</button>)}
        </div>
      </div>

      <Section title="Custom" rows={names(CUSTOM)} size={size} />
      <Section title="Focus areas" rows={rows(FOCUS_AREAS)} size={size} />
      <Section title="Equipment" rows={rows(EQUIPMENT)} size={size} />
      <Section title="Injury categories" rows={rows(INJURY_CATEGORIES)} size={size} tint="var(--coral-100)" />
      <Section title="Injuries" rows={rows(INJURIES, 'name')} size={size} tint="var(--coral-100)" />
      <Section title="Lucide" rows={names(LUCIDE)} size={size} />
    </div>
  )
}

function Section({ title, rows, size, tint = 'var(--green-100)' }) {
  if (!rows.length) return null
  return (
    <>
      <h2 style={{ fontSize: 17, fontWeight: 900, margin: '24px 0 10px' }}>{title} <span className="muted" style={{ fontWeight: 600 }}>· {rows.length}</span></h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
        {rows.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 10, margin: 0 }}>
            <div style={{ background: tint, width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name={r.icon} size={size} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</div>
              {r.label !== r.icon && <code style={{ fontSize: 12, color: 'var(--ink-500)' }}>{r.icon}</code>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

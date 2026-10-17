// Dev-only gallery (#/icon-lab): every emoji used as an icon beside the
// icon that will replace it, for reviewing src/icons/iconMap.js.
// Drills keep their emoji, so they aren't listed.
//   ?size=24        icon size in px (16, 20, 24, 32)
//   ?match=custom   only show 'lucide', 'close' or 'custom' entries
//   ?q=shark        filter by id or name
import { useSearchParams } from 'react-router-dom'
import { FOCUS_AREAS, EQUIPMENT } from '../data/drills.js'
import { INJURIES, INJURY_CATEGORIES } from '../data/injuries.js'
import {
  CUSTOM_ICONS, FOCUS_ICONS, EQUIPMENT_ICONS,
  INJURY_CATEGORY_ICONS, INJURY_ICONS, UI_ICONS, CONTENT_EMOJIS,
} from '../icons/iconMap.js'
import Icon, { hasIcon } from '../icons/Icon.jsx'

const SIZES = [16, 20, 24, 32]
const MATCH_TAG = {
  lucide: { cls: 'green', label: 'Lucide' },
  close: { cls: 'amber', label: 'Close' },
  custom: { cls: 'coral', label: 'Custom' },
}

export default function IconLab() {
  const [params, setParams] = useSearchParams()
  const size = Number(params.get('size')) || 24
  const match = params.get('match') || ''
  const q = (params.get('q') || '').toLowerCase()
  const setParam = (k, v) => {
    const next = new URLSearchParams(params)
    if (v) next.set(k, v)
    else next.delete(k)
    setParams(next, { replace: true })
  }
  const keep = (row) => (!match || row.match === match) && (!q || row.id.toLowerCase().includes(q) || row.label.toLowerCase().includes(q))

  const rowsFrom = (list, map, labelKey = 'label') => list.map((x) => ({ id: x.id, label: x[labelKey], was: x.emoji, ...map[x.id] }))
  const uiRows = Object.entries(UI_ICONS).map(([id, e]) => ({ id, label: e.where, match: hasIcon(e.icon) ? 'lucide' : 'custom', ...e }))


  const all = [...rowsFrom(FOCUS_AREAS, FOCUS_ICONS), ...rowsFrom(EQUIPMENT, EQUIPMENT_ICONS), ...rowsFrom(INJURY_CATEGORIES, INJURY_CATEGORY_ICONS), ...rowsFrom(INJURIES, INJURY_ICONS, 'name')]
  const tally = all.reduce((t, r) => ({ ...t, [r.match]: (t[r.match] || 0) + 1 }), {})
  const customUse = Object.keys(CUSTOM_ICONS).map((name) => ({ name, desc: CUSTOM_ICONS[name], drawn: hasIcon(name), usedBy: all.filter((r) => r.icon === name).map((r) => r.label) }))

  return (
    <div style={{ padding: 16, maxWidth: 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, marginBottom: 4 }}>Icon lab</h1>
      <p className="muted" style={{ marginBottom: 12 }}>
        {tally.lucide || 0} direct Lucide · {tally.close || 0} close substitutes · {tally.custom || 0} custom
        ({customUse.filter((c) => c.drawn).length}/{customUse.length} custom icons drawn). Mapping lives in <code>src/icons/iconMap.js</code>.
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginBottom: 20 }}>
        <input value={params.get('q') || ''} onChange={(e) => setParam('q', e.target.value)} placeholder="Filter by id or name" style={{ padding: 8, width: 220 }} />
        <div className="chip-row">
          {SIZES.map((s) => <button key={s} className={`chip ${s === size ? 'on' : ''}`} onClick={() => setParam('size', s === 24 ? '' : String(s))}>{s}px</button>)}
        </div>
        <div className="chip-row">
          {['', 'lucide', 'close', 'custom'].map((m) => <button key={m || 'all'} className={`chip ${m === match ? 'on' : ''}`} onClick={() => setParam('match', m)}>{m ? MATCH_TAG[m].label : 'All'}</button>)}
        </div>
      </div>

      <Section title="Focus areas" rows={rowsFrom(FOCUS_AREAS, FOCUS_ICONS).filter(keep)} size={size} />
      <Section title="Equipment" rows={rowsFrom(EQUIPMENT, EQUIPMENT_ICONS).filter(keep)} size={size} />
      <Section title="Injury categories" rows={rowsFrom(INJURY_CATEGORIES, INJURY_CATEGORY_ICONS).filter(keep)} size={size} />
      <Section title="Injuries" rows={rowsFrom(INJURIES, INJURY_ICONS, 'name').filter(keep)} size={size} tint="var(--coral-100)" />
      <Section title="Interface" rows={uiRows.filter(keep)} size={size} showId />

      {(!match || match === 'custom') && !q && (
        <>
          <h2 style={h2}>Custom icons to draw</h2>
          <div style={grid}>
            {customUse.map((c) => (
              <div key={c.name} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, margin: 0 }}>
                <Badge><Icon name={c.name} size={size} /></Badge>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{c.name} {c.drawn && <span className="tag green">drawn</span>}</div>
                  <div className="muted" style={{ fontSize: 13 }}>{c.desc}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Used by: {c.usedBy.join(', ') || 'nothing yet'}</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!match && !q && (
        <>
          <h2 style={h2}>Stays as emoji (content, not icons)</h2>
          <ul className="muted" style={{ paddingLeft: 18 }}>
            {CONTENT_EMOJIS.map((c) => <li key={c.text}>{c.text} <span style={{ fontSize: 12 }}>· {c.where}</span></li>)}
          </ul>
        </>
      )}
    </div>
  )
}

function Section({ title, rows, size, tint, showId }) {
  if (!rows.length) return null
  return (
    <>
      <h2 style={h2}>{title} <span className="muted" style={{ fontWeight: 600 }}>· {rows.length}</span></h2>
      <div style={grid}>
        {rows.map((r) => (
          <div key={r.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 12, margin: 0 }}>
            <Badge tint={tint}><Icon name={r.icon} size={size} /></Badge>
            <span style={{ fontSize: 22, width: 30, textAlign: 'center', opacity: 0.55 }} title="Emoji it replaces">{r.was}</span>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{showId ? r.id : r.label}</div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 2 }}>
                <span className={`tag ${MATCH_TAG[r.match]?.cls || 'grey'}`} style={{ padding: '2px 8px', fontSize: 11 }}>{MATCH_TAG[r.match]?.label || '?'}</span>
                <code style={{ fontSize: 12, color: 'var(--ink-500)' }}>{r.icon}</code>
              </div>
              {(r.note || showId) && <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{showId ? r.label : r.note}</div>}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

function Badge({ tint = 'var(--green-100)', children }) {
  return (
    <div style={{ background: tint, color: 'var(--ink-900)', width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      {children}
    </div>
  )
}

const h2 = { fontSize: 17, fontWeight: 900, margin: '24px 0 10px' }
const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }

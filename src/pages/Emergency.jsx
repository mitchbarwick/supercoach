// Emergency hub: safety preface + searchable list of common injuries.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { INJURIES, INJURY_CATEGORIES } from '../data/injuries.js'

const SEVERITY_META = {
  urgent: { label: 'Treat as serious', cls: 'coral' },
  caution: { label: 'Needs care', cls: 'amber' },
  minor: { label: 'Common knock', cls: 'green' },
}

export default function Emergency() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [cat, setCat] = useState(null)

  const q = query.trim().toLowerCase()
  const list = INJURIES.filter(
    (i) =>
      (!cat || i.category === cat) &&
      (!q || i.name.toLowerCase().includes(q) || i.blurb.toLowerCase().includes(q)),
  )

  return (
    <div>
      {/* ---- Safety preface ---- */}
      <div className="emergency-banner" role="alert">
        <div className="emergency-banner-icon" aria-hidden="true">🚨</div>
        <div>
          <strong>Serious injury? Call emergency services first.</strong>
          <p>
            Call <strong>999</strong> (UK) or <strong>112</strong> right away if a player is unresponsive,
            struggling to breathe, has a suspected neck, back or head injury, heavy bleeding, or a visible
            deformity. When in doubt, always consult a medical professional — this guidance supports you,
            it does not replace trained help.
          </p>
          <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
            <a className="btn btn-coral btn-sm" href="tel:999">📞 Call 999</a>
            <a className="btn btn-ghost btn-sm" href="tel:112">📞 Call 112</a>
          </div>
        </div>
      </div>

      <h1 style={{ fontSize: 26, margin: '18px 0 4px' }}>Injury support</h1>
      <p className="muted" style={{ marginBottom: 14 }}>
        Pick what's happened and we'll walk you through it, step by step. Stay calm — your player is
        watching you for reassurance.
      </p>

      <input
        className="text-input"
        placeholder="🔍 Search — e.g. ankle, head, breathing…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ marginBottom: 12 }}
        aria-label="Search injuries"
      />

      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button className={`chip ${!cat ? 'on' : ''}`} onClick={() => setCat(null)}>All</button>
        {INJURY_CATEGORIES.map((c) => (
          <button
            key={c.id}
            className={`chip ${cat === c.id ? 'on' : ''}`}
            onClick={() => setCat(cat === c.id ? null : c.id)}
          >
            {c.emoji} {c.label}
          </button>
        ))}
      </div>

      {list.length === 0 && (
        <div className="empty-state">
          <div className="big">🔍</div>
          <p>No match — try a simpler word like "leg" or "head", or call a medical professional if you're unsure.</p>
        </div>
      )}

      {list.map((inj, idx) => {
        const sev = SEVERITY_META[inj.severity]
        return (
          <div
            key={inj.id}
            className="card clickable injury-card"
            style={{ animationDelay: `${Math.min(idx * 0.04, 0.4)}s` }}
            onClick={() => navigate(`/emergency/${inj.id}`)}
          >
            <div className={`emoji-badge sev-${inj.severity}`}>{inj.emoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-title">{inj.name}</div>
              <p className="item-sub">{inj.blurb}</p>
            </div>
            <span className={`tag ${sev.cls}`} style={{ flexShrink: 0 }}>{sev.label}</span>
          </div>
        )
      })}
    </div>
  )
}

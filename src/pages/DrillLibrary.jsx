// Browse every drill; favourites float to the top.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DRILLS, FOCUS_AREAS, AGE_GROUPS, drillSuitsAge, ageRangeLabel } from '../data/drills.js'
import { useStore, actions } from '../store/useStore.js'
import { accountsEnabled } from '../config.js'

export default function DrillLibrary() {
  const navigate = useNavigate()
  const favourites = useStore((s) => s.favourites)
  const guest = useStore((s) => accountsEnabled() && !s.auth)
  const [filter, setFilter] = useState(null)
  const [ageFilter, setAgeFilter] = useState(null)

  const list = [...DRILLS]
    .filter((d) => !filter || d.focus.includes(filter))
    .filter((d) => !ageFilter || drillSuitsAge(d, ageFilter))
    .sort((a, b) => favourites.includes(b.id) - favourites.includes(a.id))

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Drill library</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        ⭐ Favourite the drills your team loves — SuperCoach picks favourites first when building sessions.
      </p>

      <div className="row" style={{ gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <select
          className="select-input"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
          value={filter || ''}
          onChange={(e) => setFilter(e.target.value || null)}
          aria-label="Filter drills by focus"
        >
          <option value="">All focus areas</option>
          {FOCUS_AREAS.map((f) => (
            <option key={f.id} value={f.id}>{f.emoji} {f.label}</option>
          ))}
        </select>
        <select
          className="select-input"
          style={{ flex: 1, minWidth: 160, marginBottom: 0 }}
          value={ageFilter || ''}
          onChange={(e) => setAgeFilter(e.target.value || null)}
          aria-label="Filter drills by age group"
        >
          <option value="">All age groups</option>
          {AGE_GROUPS.map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>

      {list.length === 0 && (
        <div className="empty-state">
          <div className="big">🔍</div>
          <p>No drills match that combination — try widening the focus or age filter.</p>
        </div>
      )}

      {list.map((d) => {
        const isFav = favourites.includes(d.id)
        return (
          <div key={d.id} className="card clickable" style={{ display: 'flex', gap: 14, alignItems: 'center', marginBottom: 12 }} onClick={() => navigate(`/drill/${d.id}`)}>
            <div className="emoji-badge" style={{ background: 'var(--green-100)', width: 48, height: 48, fontSize: 24, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              {d.emoji}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="item-title">{d.name}</div>
              <p className="item-sub">{d.blurb}</p>
              <span className="tag blue" style={{ marginTop: 6 }}>🧒 {ageRangeLabel(d)}</span>
            </div>
            <button
              className="icon-btn"
              style={isFav ? { background: 'var(--coral-100)', borderColor: 'var(--coral-600)' } : {}}
              onClick={(e) => { e.stopPropagation(); if (!guest) actions.toggleFavourite(d.id) }}
              aria-label="Toggle favourite"
              title={guest ? 'Sign in to favourite drills' : undefined}
              disabled={guest}
            >
              {isFav ? '❤️' : '🤍'}
            </button>
          </div>
        )
      })}
    </div>
  )
}

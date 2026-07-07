// ============================================================
// SessionCelebration — shown when every block is ticked off.
// A warm little scene in the same style as the drill animations:
// the coach surrounded by happy, bouncing players and confetti.
// Below it, the completed drills with favourite hearts so the
// coach can reflect and save the ones that landed well.
// ============================================================
import { useStore, actions } from '../store/useStore.js'

const CONFETTI = [
  { x: 8, c: '#ff5a5f', d: 0 }, { x: 18, c: '#f5a623', d: 0.9 }, { x: 28, c: '#2f6fed', d: 0.3 },
  { x: 38, c: '#8e5cd9', d: 1.4 }, { x: 48, c: '#ff5a5f', d: 0.6 }, { x: 58, c: '#2e8f57', d: 1.9 },
  { x: 68, c: '#f5a623', d: 0.2 }, { x: 78, c: '#2f6fed', d: 1.1 }, { x: 88, c: '#ff5a5f', d: 1.6 },
  { x: 95, c: '#8e5cd9', d: 0.5 },
]

const PLAYERS = [
  { x: 16, fill: '#ff5a5f', ring: '#c93a3e', d: 0 },
  { x: 28, fill: '#2f6fed', ring: '#1f4fb0', d: 0.25 },
  { x: 40, fill: '#ff5a5f', ring: '#c93a3e', d: 0.5 },
  { x: 60, fill: '#2f6fed', ring: '#1f4fb0', d: 0.12 },
  { x: 72, fill: '#ff5a5f', ring: '#c93a3e', d: 0.38 },
  { x: 84, fill: '#2f6fed', ring: '#1f4fb0', d: 0.62 },
]

function Face({ x, y, r }) {
  return (
    <g>
      <circle cx={x - r * 0.32} cy={y - r * 0.15} r={r * 0.11} fill="#fff" />
      <circle cx={x + r * 0.32} cy={y - r * 0.15} r={r * 0.11} fill="#fff" />
      <path
        d={`M ${x - r * 0.38} ${y + r * 0.25} Q ${x} ${y + r * 0.62} ${x + r * 0.38} ${y + r * 0.25}`}
        fill="none" stroke="#fff" strokeWidth={r * 0.14} strokeLinecap="round"
      />
    </g>
  )
}

export default function SessionCelebration({ session }) {
  const favourites = useStore((s) => s.favourites)

  // one recap row per unique drill, in session order
  const seen = new Set()
  const drills = (session?.blocks || []).filter((b) => {
    if (!b.drillId || seen.has(b.drillId)) return false
    seen.add(b.drillId)
    return true
  })

  return (
    <>
      <div className="card celebrate-card" style={{ background: 'var(--green-50)' }}>
        <div className="celebrate-stage">
          <svg viewBox="0 0 100 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            {/* confetti */}
            {CONFETTI.map((f, i) => (
              <rect
                key={i} className="confetto" x={f.x} y="-4" width="2.1" height="3.2" rx="0.6"
                fill={f.c} style={{ animationDelay: `${f.d}s` }}
              />
            ))}
            {/* ground */}
            <ellipse cx="50" cy="52" rx="46" ry="5" fill="rgba(46,143,87,0.22)" />
            {/* happy players bouncing around the coach */}
            {PLAYERS.map((p, i) => (
              <g key={i} className="hop" style={{ animationDelay: `${p.d}s` }}>
                <ellipse cx={p.x} cy="50.4" rx="4" ry="1.1" fill="rgba(0,0,0,0.12)" />
                <circle cx={p.x} cy="45" r="4.4" fill={p.fill} stroke={p.ring} strokeWidth="0.7" />
                <Face x={p.x} y={45} r={4.4} />
              </g>
            ))}
            {/* the coach — front and centre, having a great night */}
            <g className="coach-sway">
              <ellipse cx="50" cy="51" rx="5.6" ry="1.3" fill="rgba(0,0,0,0.14)" />
              <circle cx="50" cy="43" r="6.2" fill="#f5a623" stroke="#c07f12" strokeWidth="0.8" />
              <Face x={50} y={43} r={6.2} />
            </g>
          </svg>
        </div>
        <h3 className="celebrate-title">🎉 Session complete!</h3>
        <p className="muted" style={{ marginTop: 6 }}>
          Great work, coach — that's a whole session, warm-up to cool-down. The team went home better than they arrived.
        </p>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <div className="section-h">⭐ Which drills landed well?</div>
        <p className="muted" style={{ marginBottom: 6 }}>
          Heart the ones your team loved — favourites get picked first next time.
        </p>
        {drills.map((b) => {
          const isFav = favourites.includes(b.drillId)
          return (
            <div key={b.drillId} className="recap-row">
              <div className="emoji-badge" style={{ background: 'var(--green-100)' }}>{b.emoji}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="item-title">{b.title}</span>
              </div>
              <button
                className="icon-btn"
                style={isFav ? { background: 'var(--coral-100)', borderColor: 'var(--coral-600)' } : {}}
                onClick={() => actions.toggleFavourite(b.drillId)}
                aria-label={isFav ? `Remove ${b.title} from favourites` : `Add ${b.title} to favourites`}
              >
                {isFav ? '❤️' : '🤍'}
              </button>
            </div>
          )
        })}
      </div>
    </>
  )
}

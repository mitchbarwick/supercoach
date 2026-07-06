// The overview plan — designed to live on a phone at the pitch.
import { Link, useNavigate } from 'react-router-dom'
import { useStore, actions } from '../store/useStore.js'
import { BLOCK_STYLE } from '../engine/sessionBuilder.js'
import { FOCUS_AREAS } from '../data/drills.js'

const fmtTime = (m) => `${m}'`

export default function PlanView() {
  const navigate = useNavigate()
  const session = useStore((s) => s.session)
  const ticks = useStore((s) => s.ticks)

  if (!session) {
    return (
      <div className="empty-state">
        <div className="big">📋</div>
        <h2>No session yet</h2>
        <p style={{ margin: '10px 0 22px' }}>Build one in under a minute.</p>
        <Link to="/" className="btn btn-primary">Plan a session</Link>
      </div>
    )
  }

  const { blocks, request } = session
  const done = blocks.filter((b) => ticks[b.id]).length
  const pct = Math.round((done / blocks.length) * 100)
  const minsLeft = blocks.filter((b) => !ticks[b.id]).reduce((sum, b) => sum + b.duration, 0)
  const focusLabels = request.focus.length ? request.focus.map((f) => FOCUS_AREAS.find((x) => x.id === f)?.label).filter(Boolean) : ['Anything']

  return (
    <div>
      <div className="spread" style={{ marginBottom: 6 }}>
        <h1 style={{ fontSize: 26 }}>Tonight's session</h1>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>New plan</button>
      </div>
      <p className="muted" style={{ marginBottom: 12 }}>
        {request.duration} min · {request.players} players · {request.ageGroup}
        {focusLabels.length > 0 && <> · {focusLabels.join(', ')}</>}
      </p>

      <div className="card" style={{ padding: 16, marginBottom: 20 }}>
        <div className="spread" style={{ marginBottom: 8 }}>
          <strong style={{ fontSize: 14.5 }}>{done} of {blocks.length} done</strong>
          <span className="muted">{minsLeft > 0 ? `${minsLeft} min${minsLeft === 1 ? '' : 's'} left` : 'All done'}</span>
        </div>
        <div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
      </div>

      <div className="timeline">
        {blocks.map((b) => {
          const style = BLOCK_STYLE[b.type]
          const clickable = Boolean(b.drillId)
          return (
            <div key={b.id} className={`timeline-item ${ticks[b.id] ? 'done' : ''}`}>
              <div className="rail">
                <span className="time-badge">{fmtTime(b.startMin)}</span>
                <div className="line" />
              </div>
              <div className="item-card">
                <div
                  className={`block-card ${clickable ? 'tappable' : ''}`}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}
                  onClick={() => clickable && navigate(`/drill/${b.drillId}?block=${b.id}`)}
                >
                  <div className="emoji-badge" style={{ background: style.bg }}>{b.emoji}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="row" style={{ gap: 8 }}>
                      <span className="item-title">{b.title}</span>
                      <span className="duration-pill">{b.duration} min</span>
                    </div>
                    <p className="item-sub">{b.blurb}</p>
                    {clickable && <span className="muted" style={{ fontSize: 12.5, color: 'var(--green-700)', fontWeight: 800 }}>Tap for full drill →</span>}
                  </div>
                  <button
                    className={`check-circle ${ticks[b.id] ? 'on' : ''}`}
                    aria-label={ticks[b.id] ? 'Mark not done' : 'Mark done'}
                    onClick={(e) => { e.stopPropagation(); actions.toggleTick(b.id) }}
                  >
                    ✓
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {done === blocks.length && (
        <div className="card" style={{ textAlign: 'center', background: 'var(--green-50)' }}>
          <h3 style={{ fontSize: 20 }}>🎉 Session complete!</h3>
          <p className="muted" style={{ marginTop: 6 }}>Great work, coach. Favourite the drills that landed well — next time they'll be picked first.</p>
        </div>
      )}
    </div>
  )
}

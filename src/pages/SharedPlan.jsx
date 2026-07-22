// Landing page for a shared session link (#/shared?p=...). Shows a
// read-only preview of someone else's plan, then lets the recipient
// copy it into their own SuperCoach — as a NEW plan, so nothing they
// already had is overwritten.
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { actions } from '../store/useStore.js'
import { BLOCK_STYLE } from '../engine/sessionBuilder.js'
import { FOCUS_AREAS } from '../data/drills.js'
import { decodeSession } from '../share/share.js'

const fmtTime = (m) => `${m}'`

export default function SharedPlan() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const payload = searchParams.get('p') || ''
  const session = useMemo(() => decodeSession(payload), [payload])
  const [saving, setSaving] = useState(false)

  if (!session) {
    return (
      <div className="empty-state">
        <div className="big">🔗</div>
        <h2>This shared link looks broken</h2>
        <p style={{ margin: '10px 0 22px' }}>The plan couldn’t be read. Ask whoever sent it to share again.</p>
        <Link to="/" className="btn btn-primary">Go to SuperCoach</Link>
      </div>
    )
  }

  const { blocks, request } = session
  const focusLabels = request.focus?.length
    ? request.focus.map((f) => FOCUS_AREAS.find((x) => x.id === f)?.label).filter(Boolean)
    : ['Anything']

  const useThisPlan = () => {
    setSaving(true)
    // saveSession creates a fresh program and makes it the live session —
    // it never overwrites the recipient's existing saved plans.
    actions.saveSession(session)
    navigate('/plan')
  }

  return (
    <div>
      <div className="shared-banner">🎁 A coach shared this session with you</div>

      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Shared session</h1>
      <p className="muted" style={{ marginBottom: 16 }}>
        {request.duration} min · {request.players} players · {request.ageGroup}
        {focusLabels.length > 0 && <> · {focusLabels.join(', ')}</>}
      </p>

      <div className="timeline">
        {blocks.map((b) => {
          const style = BLOCK_STYLE[b.type] || {}
          const clickable = Boolean(b.drillId)
          return (
            <div key={b.id} className="timeline-item">
              <div className="rail">
                <span className="time-badge">{fmtTime(b.startMin)}</span>
                <div className="line" />
              </div>
              <div className="item-card">
                <div
                  className={`block-card ${clickable ? 'tappable' : ''}`}
                  style={{ cursor: clickable ? 'pointer' : 'default' }}
                  onClick={() => clickable && navigate(`/drill/${b.drillId}`)}
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
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="sticky-cta">
        <div className="inner">
          <button className="btn btn-primary btn-block" onClick={useThisPlan} disabled={saving}>
            {saving ? 'Adding…' : 'Use this plan →'}
          </button>
        </div>
      </div>
    </div>
  )
}

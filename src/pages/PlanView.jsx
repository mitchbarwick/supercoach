// The overview plan — designed to live on a phone at the pitch.
// ?edit=1 (or the ✎ button) opens edit mode: swap any drill for an
// alternative that fits tonight's squad and kit.
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useStore, actions } from '../store/useStore.js'
import { BLOCK_STYLE, fits, buildCtx } from '../engine/sessionBuilder.js'
import { FOCUS_AREAS, DRILLS } from '../data/drills.js'
import { accountsEnabled } from '../config.js'
import SessionCelebration from '../components/SessionCelebration.jsx'
import ShareButton from '../components/ShareButton.jsx'
import { sessionShareUrl } from '../share/share.js'

const fmtTime = (m) => `${m}'`

function SwapPicker({ block, session, favourites, onPick, onClose }) {
  const ctx = buildCtx({ ...session.request, favourites })
  const usedIds = new Set(session.blocks.map((b) => b.drillId).filter(Boolean))
  const alts = DRILLS
    .filter((d) => d.category === block.type && d.id !== block.drillId && !usedIds.has(d.id) && fits(d, ctx))
    .sort((a, b) => Number(favourites.includes(b.id)) - Number(favourites.includes(a.id)))
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="spread" style={{ marginBottom: 4 }}>
          <strong style={{ fontSize: 16 }}>Swap "{block.title}"</strong>
          <button className="icon-btn sm" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p className="muted" style={{ fontSize: 13.5, marginBottom: 12 }}>
          Everything below fits your {session.request.players} players and tonight's kit.
        </p>
        {alts.length === 0 && <p className="muted">No other drills fit tonight's setup — try adding equipment next time.</p>}
        <div className="sheet-list">
          {alts.map((d) => (
            <button key={d.id} className="swap-option" onClick={() => onPick(d)}>
              <span className="emoji-badge" style={{ background: 'var(--green-100)' }}>{d.emoji}</span>
              <span style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <span className="item-title">{d.name} {favourites.includes(d.id) && '❤️'}</span>
                <span className="item-sub" style={{ display: 'block' }}>{d.blurb}</span>
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function PlanView() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const session = useStore((s) => s.session)
  const ticks = useStore((s) => s.ticks)
  const favourites = useStore((s) => s.favourites)
  const currentProgramId = useStore((s) => s.currentProgramId)
  const guest = useStore((s) => accountsEnabled() && !s.auth)
  // Guests can't edit (drill-swap) — force it off even if ?edit=1 is typed directly.
  const editing = searchParams.get('edit') === '1' && !guest
  const [swapBlock, setSwapBlock] = useState(null)
  const [toast, setToast] = useState('')
  // Compress the plan into a share link ahead of the click, so tapping
  // Share fires the native share sheet synchronously (mobile browsers
  // require that within the user gesture).
  const [shareUrl, setShareUrl] = useState('')
  useEffect(() => {
    let live = true
    if (!session) { setShareUrl(''); return }
    sessionShareUrl(session).then((u) => { if (live) setShareUrl(u) })
    return () => { live = false }
  }, [session])

  const setEditing = (on) => {
    setSwapBlock(null)
    setSearchParams(on ? { edit: '1' } : {}, { replace: true })
  }

  const doSwap = (drill) => {
    const blocks = session.blocks.map((b) =>
      b.id === swapBlock.id
        ? { ...b, drillId: drill.id, title: drill.name, emoji: drill.emoji, blurb: drill.blurb }
        : b,
    )
    actions.updateProgramSession(currentProgramId, { ...session, blocks })
    setSwapBlock(null)
    setToast(`Swapped in ${drill.name} ✓`)
    setTimeout(() => setToast(''), 1800)
  }

  if (!session) {
    return (
      <div className="empty-state">
        <div className="big">📋</div>
        <h2>No session yet</h2>
        <p style={{ margin: '10px 0 22px' }}>Build one in under a minute.</p>
        <Link to="/new" className="btn btn-primary">Plan a session</Link>
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
        <div className="row" style={{ gap: 8 }}>
          {!guest && (
            <button
              className={`btn btn-sm ${editing ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => setEditing(!editing)}
            >
              {editing ? '✓ Done' : '✎ Edit'}
            </button>
          )}
          <ShareButton
            url={shareUrl}
            title="Tonight's session · SuperCoach"
            text="Here's the training session I planned — open it in SuperCoach:"
            label="Share"
          />
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/new')}>New plan</button>
        </div>
      </div>
      {editing && (
        <div className="edit-banner">
          ⇄ Tap <strong>Swap</strong> on any drill to switch it for one that fits tonight's squad.
          {currentProgramId ? ' Changes save to this session automatically.' : ''}
        </div>
      )}
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
                    {clickable && !editing && <span className="muted" style={{ fontSize: 12.5, color: 'var(--green-700)', fontWeight: 800 }}>Tap for full drill →</span>}
                  </div>
                  {editing && clickable ? (
                    <button
                      className="btn btn-ghost btn-sm swap-btn"
                      onClick={(e) => { e.stopPropagation(); setSwapBlock(b) }}
                    >
                      ⇄ Swap
                    </button>
                  ) : (
                    <button
                      className={`check-circle ${ticks[b.id] ? 'on' : ''}`}
                      aria-label={ticks[b.id] ? 'Mark not done' : 'Mark done'}
                      onClick={(e) => { e.stopPropagation(); actions.toggleTick(b.id) }}
                    >
                      ✓
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {done === blocks.length && !editing && <SessionCelebration session={session} />}

      {swapBlock && (
        <SwapPicker
          block={swapBlock}
          session={session}
          favourites={favourites}
          onPick={doSwap}
          onClose={() => setSwapBlock(null)}
        />
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  )
}

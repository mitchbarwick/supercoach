// Full drill page — animation, setup, how to play, coaching
// points, age adaptations, notes and favourite toggle.
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getDrill, sayToKids, FOCUS_AREAS, AGE_GROUPS } from '../data/drills.js'
import PitchAnimation from '../components/PitchAnimation.jsx'
import { useStore, actions } from '../store/useStore.js'
import { getCoachingTips, aiConfigured } from '../ai/azure.js'

function Section({ icon, title, children }) {
  return (
    <div className="card">
      <div className="section-h">{icon} {title}</div>
      {children}
    </div>
  )
}

export default function DrillDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const drill = getDrill(id)
  const favourites = useStore((s) => s.favourites)
  const notes = useStore((s) => s.notes)
  const session = useStore((s) => s.session)
  const ticks = useStore((s) => s.ticks)
  const [aiTips, setAiTips] = useState(null)
  const [toast, setToast] = useState('')

  const ageGroup = session?.request?.ageGroup || 'U9-U11'
  // "Say this to the kids" defaults to the session's age group but can be
  // previewed for any band without leaving the page.
  const [sayAge, setSayAge] = useState(ageGroup)
  const isFav = favourites.includes(id)

  // Plan context: only present when this drill was opened from today's plan
  // (PlanView passes ?block=), so Drill Library browsing stays unaffected.
  const blockId = searchParams.get('block')
  const planBlocks = session?.blocks || []
  const drillableBlocks = planBlocks.filter((b) => b.drillId)
  const blockIndex = blockId ? drillableBlocks.findIndex((b) => b.id === blockId) : -1
  const inPlan = blockIndex !== -1
  const prevBlock = inPlan && blockIndex > 0 ? drillableBlocks[blockIndex - 1] : null
  const nextBlock = inPlan && blockIndex < drillableBlocks.length - 1 ? drillableBlocks[blockIndex + 1] : null
  const done = planBlocks.filter((b) => ticks[b.id]).length
  const pct = planBlocks.length ? Math.round((done / planBlocks.length) * 100) : 0
  const minsLeft = planBlocks.filter((b) => !ticks[b.id]).reduce((sum, b) => sum + b.duration, 0)

  useEffect(() => {
    let live = true
    if (drill && aiConfigured()) {
      getCoachingTips(drill, ageGroup).then((t) => live && t && setAiTips(t))
    }
    return () => { live = false }
  }, [id, ageGroup]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!drill) {
    return (
      <div className="empty-state">
        <div className="big">🤔</div>
        <h2>Drill not found</h2>
      </div>
    )
  }

  const flash = (msg) => { setToast(msg); setTimeout(() => setToast(''), 1800) }

  return (
    <div>
      {inPlan && (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <div className="spread" style={{ marginBottom: 8 }}>
            <strong style={{ fontSize: 14.5 }}>{done} of {planBlocks.length} done</strong>
            <span className="muted">{minsLeft > 0 ? `${minsLeft} min${minsLeft === 1 ? '' : 's'} left` : 'All done'}</span>
          </div>
          <div className="progress-wrap"><div className="progress-bar" style={{ width: `${pct}%` }} /></div>
        </div>
      )}

      <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)} style={{ marginBottom: 14 }}>← Back to plan</button>

      <div className="spread" style={{ marginBottom: 4 }}>
        <h1 style={{ fontSize: 26 }}>{drill.emoji} {drill.name}</h1>
        <button
          className="icon-btn"
          style={isFav ? { background: 'var(--coral-100)', borderColor: 'var(--coral-600)' } : {}}
          onClick={() => { actions.toggleFavourite(id); flash(isFav ? 'Removed from favourites' : '⭐ Saved to favourites — I\'ll pick it first next time') }}
          aria-label="Toggle favourite"
        >
          {isFav ? '❤️' : '🤍'}
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: 16 }}>
        {drill.focus.map((f) => {
          const fa = FOCUS_AREAS.find((x) => x.id === f)
          return fa ? <span key={f} className="tag green">{fa.emoji} {fa.label}</span> : null
        })}
        <span className="tag grey">👥 {drill.players.min}–{drill.players.max} players</span>
        <span className="tag grey">⏱ ~{drill.baseDuration} min</span>
      </div>

      <div style={{ marginBottom: 14 }}>
        <PitchAnimation diagram={drill.diagram} />
      </div>

      <Section icon="🗣️" title="Say this to the kids">
        <div className="chip-row" style={{ marginBottom: 10 }}>
          {AGE_GROUPS.map((a) => (
            <button
              key={a.id}
              className={`chip ${sayAge === a.id ? 'on' : ''}`}
              style={{ fontSize: 12.5, padding: '4px 10px' }}
              onClick={() => setSayAge(a.id)}
            >
              {a.id}{a.id === ageGroup ? ' ★' : ''}
            </button>
          ))}
        </div>
        <p style={{ fontSize: 15.5, color: 'var(--ink-700)', fontStyle: 'italic' }}>"{sayToKids(drill, sayAge)}"</p>
      </Section>

      <Section icon="📐" title="Set it up">
        <ul className="nice-list numbered">
          {drill.setup.map((s, i) => <li key={i}><span className="dot">{i + 1}</span><span>{s}</span></li>)}
        </ul>
      </Section>

      <Section icon="▶️" title="How it works">
        <ul className="nice-list">
          {drill.howToPlay.map((s, i) => <li key={i}><span className="dot">•</span><span>{s}</span></li>)}
        </ul>
      </Section>

      <Section icon="🎯" title="What to coach">
        <ul className="nice-list">
          {drill.coachingPoints.map((s, i) => <li key={i}><span className="dot">✓</span><span>{s}</span></li>)}
        </ul>
        {aiTips && (
          <div className="ai-note" style={{ marginTop: 14 }}>
            <strong>✨ For your {ageGroup} group:</strong>
            {aiTips.split('\n').filter(Boolean).map((t, i) => <p key={i} style={{ marginTop: 6 }}>{t.replace(/^[-•]\s*/, '• ')}</p>)}
          </div>
        )}
      </Section>

      <Section icon="🎚️" title="Make it easier / harder">
        <div className="row" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="tag blue" style={{ marginBottom: 8 }}>Easier</span>
            <ul className="nice-list" style={{ marginTop: 8 }}>
              {drill.adaptations.easier.map((s, i) => <li key={i}><span className="dot">↓</span><span>{s}</span></li>)}
            </ul>
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <span className="tag coral" style={{ marginBottom: 8 }}>Harder</span>
            <ul className="nice-list" style={{ marginTop: 8 }}>
              {drill.adaptations.harder.map((s, i) => <li key={i}><span className="dot">↑</span><span>{s}</span></li>)}
            </ul>
          </div>
        </div>
      </Section>

      <Section icon="📝" title="Your notes">
        <textarea
          className="note-input"
          placeholder="How did it go? What would you tweak next time?"
          value={notes[id] || ''}
          onChange={(e) => actions.setNote(id, e.target.value)}
        />
        <p className="muted" style={{ marginTop: 6, fontSize: 13 }}>Saved automatically — your notes show up whenever this drill comes back.</p>
      </Section>

      {toast && <div className="toast">{toast}</div>}

      {inPlan && (
        <div className="sticky-cta">
          <div className="inner">
            {prevBlock && (
              <button
                className="icon-btn"
                aria-label="Previous drill"
                onClick={() => {
                  actions.setTick(blockId, false)
                  navigate(`/drill/${prevBlock.drillId}?block=${prevBlock.id}`)
                }}
              >
                ←
              </button>
            )}
            <button
              className="btn btn-primary btn-block"
              onClick={() => {
                actions.setTick(blockId, true)
                navigate(nextBlock ? `/drill/${nextBlock.drillId}?block=${nextBlock.id}` : '/plan')
              }}
            >
              <span className="next-btn-text">
                <span className="next-btn-main">{nextBlock ? 'Next →' : 'Finish session →'}</span>
                {nextBlock && <span className="next-btn-sub">{nextBlock.title}</span>}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

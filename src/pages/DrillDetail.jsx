// Full drill page — animation, setup, how to play, coaching
// points, age adaptations, notes and favourite toggle.
import { useEffect, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { getDrill, sayToKids, setsFor, drillDurationRange, ageRangeLabel, FOCUS_AREAS, EQUIPMENT } from '../data/drills.js'
import PitchAnimation from '../components/PitchAnimation.jsx'
import DrillFeedback from '../components/DrillFeedback.jsx'
import AccountButton from '../components/AccountButton.jsx'
import ShareButton from '../components/ShareButton.jsx'
import { drillShareUrl } from '../share/share.js'
import { useStore, actions } from '../store/useStore.js'
import { accountsEnabled } from '../config.js'
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
  const guest = useStore((s) => accountsEnabled() && !s.auth)
  const [aiTips, setAiTips] = useState(null)
  const [toast, setToast] = useState('')

  const ageGroup = session?.request?.ageGroup || 'U9-U11'
  const squadSize = session?.request?.players || null
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

  // Non-drillable blocks (drink breaks) sit between drills in the plan but
  // are skipped by prev/next navigation — so stepping over one should tick
  // (or, going backwards, untick) it too, keeping plan progress honest.
  const planIndexOf = (b) => planBlocks.findIndex((p) => p.id === b?.id)
  const setTicksBetween = (fromIdx, toIdx, done) => {
    planBlocks.slice(fromIdx, toIdx).forEach((b) => { if (!b.drillId) actions.setTick(b.id, done) })
  }
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

  const ageBand = (session?.request?.ageGroup) || 'U9-U11'
  const isYoung = ageBand === 'U6-U8' || ageBand === 'U9-U11'
  const coachingPointsForAge = isYoung && drill.coachingPointsYoung?.length ? drill.coachingPointsYoung : drill.coachingPoints

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
        <div className="row" style={{ gap: 8 }}>
          <ShareButton
            url={drillShareUrl(id)}
            title={`${drill.name} · SuperCoach`}
            text={`Check out this drill — ${drill.name}:`}
            label=""
            icon="🔗"
            className="icon-btn"
          />
          <button
            className="icon-btn"
            style={isFav ? { background: 'var(--coral-100)', borderColor: 'var(--coral-600)' } : {}}
            onClick={() => {
              if (guest) { flash('Sign in to favourite drills'); return }
              actions.toggleFavourite(id)
              flash(isFav ? 'Removed from favourites' : '⭐ Saved to favourites — I\'ll pick it first next time')
            }}
            aria-label="Toggle favourite"
          >
            {isFav ? '❤️' : '🤍'}
          </button>
        </div>
      </div>

      {!inPlan && (
        <div className="chip-row" style={{ marginBottom: 16 }}>
          {drill.focus.map((f) => {
            const fa = FOCUS_AREAS.find((x) => x.id === f)
            return fa ? <span key={f} className="tag green">{fa.emoji} {fa.label}</span> : null
          })}
          <span className="tag grey">
            👥 {drill.players.min}–{drill.players.max} players
            {drill.players.multiple === 2 && ' · even numbers'}
            {drill.players.multiple >= 3 && ` · groups of ${drill.players.multiple}`}
          </span>
          {(() => {
            const r = drillDurationRange(drill, ageGroup)
            return <span className="tag grey">⏱ {r.min === r.max ? `~${r.min}` : `${r.min}–${r.max}`} min</span>
          })()}
          <span className="tag blue">🧒 {ageRangeLabel(drill)}</span>
        </div>
      )}

      {!inPlan && drill.good && (
        <div className="chip-row" style={{ marginBottom: 16 }}>
          <span className={`tag ${drill.good.goals ? 'green' : 'grey'}`}>{drill.good.goals ? '✓' : '✗'} Goals</span>
          <span className={`tag ${drill.good.opponent ? 'green' : 'grey'}`}>{drill.good.opponent ? '✓' : '✗'} Opponent</span>
          <span className={`tag ${drill.good.opportunities ? 'green' : 'grey'}`}>{drill.good.opportunities ? '✓' : '✗'} Opportunities</span>
          <span className={`tag ${drill.good.directional ? 'green' : 'grey'}`}>{drill.good.directional ? '✓' : '✗'} Directional</span>
        </div>
      )}

      <div style={{ marginBottom: 14 }}>
        <PitchAnimation diagram={drill.diagram} />
      </div>

      <Section icon="🗣️" title="Say this to the players">
        {guest ? (
          <div className="locked-content">
            <p className="locked-content-body" style={{ fontSize: 15.5, color: 'var(--ink-700)', fontStyle: 'italic' }}>
              "{sayToKids(drill, ageGroup)}"
            </p>
            <div className="locked-content-overlay">
              <span style={{ fontSize: 22 }}>🔒</span>
              <strong>Sign in to unlock coaching scripts for every drill</strong>
              <AccountButton />
            </div>
          </div>
        ) : (
          <p style={{ fontSize: 15.5, color: 'var(--ink-700)', fontStyle: 'italic' }}>"{sayToKids(drill, ageGroup)}"</p>
        )}
      </Section>

      <Section icon="📐" title="Set it up">
        <ul className="nice-list numbered">
          {drill.setup.map((s, i) => <li key={i}><span className="dot">{i + 1}</span><span>{s}</span></li>)}
        </ul>
        {(() => {
          // With today's squad size, tell the coach how many copies of
          // this drill to run at once and the total kit that needs.
          const plan = setsFor(drill, squadSize)
          if (!plan || plan.count < 2) return null
          const kit = Object.entries(plan.equipment)
            .map(([eqId, n]) => `${n} ${(EQUIPMENT.find((e) => e.id === eqId)?.label || eqId).toLowerCase()}`)
            .join(' + ')
          return (
            <div className="setup-callout">
              <strong>👥 With your {squadSize} players:</strong>{' '}
              {plan.size === 1
                ? <>everyone works at once</>
                : <>set up <strong>{plan.count} of these at once</strong> (groups of {plan.size})</>}
              {kit && <> — you&apos;ll need {kit} in total</>}
              {plan.spare > 0 && <>. {plan.spare} spare player{plan.spare > 1 ? 's' : ''} — rotate them in every minute or so</>}.
            </div>
          )
        })()}
      </Section>

      <Section icon="▶️" title="How it works">
        <ul className="nice-list">
          {drill.howToPlay.map((s, i) => <li key={i}><span className="dot">•</span><span>{s}</span></li>)}
        </ul>
      </Section>

      {drill.yourRole && (
        <Section icon="🧑‍🏫" title="Your job during this drill">
          <p style={{ fontSize: 15, color: 'var(--ink-700)' }}>{drill.yourRole}</p>
        </Section>
      )}

      <Section icon="🎯" title="What to coach">
        <ul className="nice-list">
          {coachingPointsForAge.map((s, i) => <li key={i}><span className="dot">✓</span><span>{s}</span></li>)}
        </ul>
        {aiTips && (
          <div className="ai-note" style={{ marginTop: 14 }}>
            <strong>✨ For your {ageGroup} group:</strong>
            {aiTips.split('\n').filter(Boolean).map((t, i) => <p key={i} style={{ marginTop: 6 }}>{t.replace(/^[-•]\s*/, '• ')}</p>)}
          </div>
        )}
      </Section>

      {drill.variants && (
        <Section icon="🧤" title="Keep the whole team busy">
          <p className="muted" style={{ marginBottom: 12, fontSize: 14 }}>
            This one&apos;s keeper-focused — here&apos;s how nobody stands around watching.
          </p>
          <div className="row" style={{ alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <span className="tag blue" style={{ marginBottom: 8 }}>🧤 Goalkeeper</span>
              <ul className="nice-list" style={{ marginTop: 8 }}>
                {drill.variants.keeper.map((s, i) => <li key={i}><span className="dot">•</span><span>{s}</span></li>)}
              </ul>
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <span className="tag green" style={{ marginBottom: 8 }}>⚽ Rest of the team</span>
              <ul className="nice-list" style={{ marginTop: 8 }}>
                {drill.variants.outfield.map((s, i) => <li key={i}><span className="dot">•</span><span>{s}</span></li>)}
              </ul>
            </div>
          </div>
        </Section>
      )}

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

      <DrillFeedback drill={drill} source={inPlan ? 'plan' : 'library'} />

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
                  // stepping back over a drink break un-ticks it again
                  setTicksBetween(planIndexOf(prevBlock) + 1, planIndexOf({ id: blockId }), false)
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
                // advancing past a drink break checks it off too; finishing
                // the session sweeps up any trailing non-drill blocks
                const curIdx = planIndexOf({ id: blockId })
                setTicksBetween(curIdx + 1, nextBlock ? planIndexOf(nextBlock) : planBlocks.length, true)
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

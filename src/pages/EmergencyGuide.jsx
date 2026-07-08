// Step-by-step wizard for a single injury: red flags → assess → do → don't → next steps.
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getInjury } from '../data/injuries.js'

const STEPS = [
  { key: 'flags', title: 'First: any red flags?', icon: '🚩' },
  { key: 'assess', title: 'How serious is it?', icon: '🔎' },
  { key: 'do', title: 'What to do now', icon: '✅' },
  { key: 'dont', title: 'What NOT to do', icon: '⛔' },
  { key: 'after', title: 'Next steps & return to play', icon: '🔁' },
]

export default function EmergencyGuide() {
  const { id } = useParams()
  const navigate = useNavigate()
  const injury = getInjury(id)
  const [step, setStep] = useState(0)
  const [showCall, setShowCall] = useState(false)

  if (!injury) {
    return (
      <div className="empty-state">
        <div className="big">🤔</div>
        <p>We couldn't find that injury guide.</p>
        <Link to="/emergency" className="btn btn-primary" style={{ marginTop: 14 }}>Back to injury support</Link>
      </div>
    )
  }

  const meta = STEPS[step]
  const isFirst = step === 0
  const isLast = step === STEPS.length - 1

  const content = {
    flags: injury.callEmergencyIf,
    assess: injury.assess,
    do: injury.doNow,
    dont: injury.dont,
    after: injury.aftercare,
  }[meta.key]

  return (
    <div>
      <button className="btn btn-ghost btn-sm" onClick={() => navigate('/emergency')}>← All injuries</button>

      <div className="row" style={{ margin: '16px 0 4px', gap: 12 }}>
        <div className={`emoji-badge sev-${injury.severity}`} style={{ width: 52, height: 52, fontSize: 26 }}>
          {injury.emoji}
        </div>
        <div>
          <h1 style={{ fontSize: 23 }}>{injury.name}</h1>
          <p className="muted">{injury.blurb}</p>
        </div>
      </div>

      {/* Persistent safety strip */}
      <div className="calm-strip">
        <span className="calm-dot" aria-hidden="true" /> Stay calm and stay with the player.
        Unsure at any point? <a href="tel:999">Call 999</a> / <a href="tel:112">112</a> — no one will criticise you for calling.
      </div>

      {/* Progress dots */}
      <div className="wizard-dots" aria-label={`Step ${step + 1} of ${STEPS.length}`}>
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            className={`dot ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`}
            onClick={() => setStep(i)}
            aria-label={s.title}
            style={{ border: 'none', padding: 0, cursor: 'pointer' }}
          />
        ))}
      </div>

      {/* Step card — key forces the slide-in animation on every step change */}
      <div key={step} className="card wizard-step">
        <div className="section-h">
          <span aria-hidden="true">{meta.icon}</span> {meta.title}
        </div>

        {meta.key === 'flags' && (
          <p className="muted" style={{ marginBottom: 12 }}>
            Check these first. <strong>If any apply, call emergency services now</strong> — then come back
            to these steps while you wait for help.
          </p>
        )}

        <ul className={`nice-list step-list ${meta.key === 'do' ? 'numbered' : ''}`}>
          {content.map((line, i) => (
            <li key={i} style={{ animationDelay: `${i * 0.07}s` }}>
              <span className={`dot ${meta.key === 'flags' ? 'flag' : ''} ${meta.key === 'dont' ? 'no' : ''}`}>
                {meta.key === 'do' ? i + 1 : meta.key === 'dont' ? '✕' : meta.key === 'flags' ? '🚩' : '•'}
              </span>
              {line}
            </li>
          ))}
        </ul>

        {meta.key === 'flags' && (
          <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button className="btn btn-coral btn-block" onClick={() => setShowCall(true)}>
              ⚠️ One or more apply — get help now
            </button>
            <button className="btn btn-primary btn-block" onClick={() => { setShowCall(false); setStep(1) }}>
              None apply — continue to assessment
            </button>
          </div>
        )}

        {showCall && meta.key === 'flags' && (
          <div className="call-panel fade-in" role="alert">
            <strong>📞 Call 999 (UK) or 112 now.</strong>
            <ul className="nice-list" style={{ marginTop: 10 }}>
              <li><span className="dot">•</span> Put the phone on speaker so your hands stay free</li>
              <li><span className="dot">•</span> Stay with the player — send someone else to meet the ambulance</li>
              <li><span className="dot">•</span> Tell the call handler what happened, the player's age, and follow their instructions — they take over from here</li>
              <li><span className="dot">•</span> Contact the player's parent or carer as soon as you can</li>
            </ul>
            <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
              <a className="btn btn-coral" href="tel:999">📞 Call 999</a>
              <a className="btn btn-ghost" href="tel:112">📞 Call 112</a>
            </div>
          </div>
        )}
      </div>

      {/* Nav buttons for steps after the red-flag gate */}
      {!isFirst && (
        <div className="row" style={{ marginTop: 16 }}>
          <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(step - 1)}>← Back</button>
          {!isLast ? (
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => setStep(step + 1)}>
              {STEPS[step + 1].icon} {STEPS[step + 1].title} →
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 2 }} onClick={() => navigate('/emergency')}>
              Done — back to injuries
            </button>
          )}
        </div>
      )}

      <p className="muted" style={{ marginTop: 22, fontSize: 13, textAlign: 'center' }}>
        This guidance is general first-aid information for coaches, not medical advice.
        Always follow the direction of medical professionals.
      </p>
    </div>
  )
}

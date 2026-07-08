// Session setup wizard — the "Jasmine flow" entry point.
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FOCUS_AREAS, EQUIPMENT, AGE_GROUPS } from '../data/drills.js'
import { buildSession } from '../engine/sessionBuilder.js'
import { aiConfigured } from '../ai/azure.js'
import { designSessionWithAI, SessionDesignError } from '../ai/sessionDesigner.js'
import { useStore, actions } from '../store/useStore.js'

const DURATIONS = [30, 45, 60, 75, 90]

// Sensible starting point per age band — the coach can still adjust either
// value on the next step, this just saves the common case a tap or two.
const AGE_DEFAULTS = {
  'U6-U8': { duration: 30, players: 6 },
  'U9-U11': { duration: 45, players: 8 },
  'U12-U14': { duration: 45, players: 10 },
  'U15+': { duration: 60, players: 12 },
}

export default function SessionSetup() {
  const navigate = useNavigate()
  const favourites = useStore((s) => s.favourites)
  // Remembered decisions from the coach's last session — age group,
  // squad size, duration and kit come prefilled so a returning coach
  // can tap straight through.
  const prefs = useStore((s) => s.prefs)
  const [step, setStep] = useState(0)
  const [duration, setDuration] = useState(prefs?.duration || 45)
  const [players, setPlayers] = useState(prefs?.players || 10)
  const [ageGroup, setAgeGroup] = useState(prefs?.ageGroup || null)
  const [equipment, setEquipment] = useState(prefs?.equipment?.length ? prefs.equipment : ['balls', 'cones', 'vests'])
  const [focus, setFocus] = useState([])
  const [anything, setAnything] = useState(true)
  const [aiState, setAiState] = useState('idle') // 'idle' | 'loading' | 'error'
  const [aiError, setAiError] = useState('')

  const steps = ['Age', 'Session', 'Focus', 'Kit']

  const toggle = (list, id, setter) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const pickAge = (id) => {
    setAgeGroup(id)
    if (prefs?.ageGroup === id) {
      // Her usual group — keep her usual numbers, not the generic defaults.
      if (prefs.duration) setDuration(prefs.duration)
      if (prefs.players) setPlayers(prefs.players)
    } else {
      const d = AGE_DEFAULTS[id]
      if (d) { setDuration(d.duration); setPlayers(d.players) }
    }
    setStep(1)
  }

  const generate = async () => {
    const opts = { duration, players, ageGroup, equipment, focus, favourites }

    if (!aiConfigured()) {
      actions.saveSession(buildSession(opts))
      navigate('/plan')
      return
    }

    setAiState('loading')
    setAiError('')
    try {
      const session = await designSessionWithAI(opts)
      actions.saveSession(session)
      navigate('/plan')
    } catch (err) {
      setAiState('error')
      setAiError(err instanceof SessionDesignError ? err.message : 'Something went wrong building your session.')
    }
  }

  const goBack = () => {
    setAiState('idle')
    setStep(step - 1)
  }

  const next = () => (step < steps.length - 1 ? setStep(step + 1) : generate())
  const canNext = step !== 2 || focus.length > 0 || anything

  const pickAnything = () => {
    setAnything(true)
    setFocus([])
  }
  const pickFocus = (id) => {
    setAnything(false)
    toggle(focus, id, setFocus)
  }

  return (
    <div>
      <div className="hero">
        <h1>Plan tonight's session</h1>
        <p>Tell me what you're working with — I'll build the whole session, warm-up to cool-down.</p>
      </div>

      <div className="wizard-dots">
        {steps.map((s, i) => <div key={s} className={`dot ${i <= step ? 'on' : ''}`} />)}
      </div>

      {step === 0 && (
        <div className="card fade-in">
          <label className="field-label">Age group</label>
          {prefs?.ageGroup && (
            <p className="field-hint">✨ Remembered from last time — tap {prefs.ageGroup} to keep everything as usual.</p>
          )}
          <div className="age-list">
            {AGE_GROUPS.map((a) => (
              <button key={a.id} className={`age-option ${ageGroup === a.id ? 'on' : ''}`} onClick={() => pickAge(a.id)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="card fade-in">
          <label className="field-label">How long is your session?</label>
          <div className="chip-row" style={{ marginBottom: 22 }}>
            {DURATIONS.map((d) => (
              <button key={d} className={`chip ${duration === d ? 'on' : ''}`} onClick={() => setDuration(d)}>
                {d} min
              </button>
            ))}
          </div>
          <label className="field-label">How many players turned up?</label>
          <div>
            <div className="row" style={{ marginBottom: 6 }}>
              <span className="val">{players}</span>
              <span className="muted">including any keepers</span>
            </div>
            <input
              type="range"
              className="slider"
              min="2"
              max="30"
              value={players}
              onChange={(e) => setPlayers(Number(e.target.value))}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="card fade-in">
          <label className="field-label">What does the team need to work on?</label>
          <p className="field-hint">Pick up to three — the plan will prioritise these. Or pick anything.</p>
          <div className="chip-row">
            <button className={`chip ${anything ? 'on coral' : ''}`} onClick={pickAnything}>
              🌈 Anything
            </button>
            {FOCUS_AREAS.map((f) => (
              <button
                key={f.id}
                className={`chip ${focus.includes(f.id) ? 'on coral' : ''}`}
                onClick={() => (focus.includes(f.id) || focus.length < 3) && pickFocus(f.id)}
              >
                {f.emoji} {f.label}
              </button>
            ))}
          </div>
          {favourites.length > 0 && (
            <p className="muted" style={{ marginTop: 16 }}>⭐ You have {favourites.length} favourite drill{favourites.length > 1 ? 's' : ''} — they'll be picked first when they fit.</p>
          )}
        </div>
      )}

      {step === 3 && (
        <div className="card fade-in">
          <label className="field-label">What equipment do you have?</label>
          <p className="field-hint">Only drills you can actually run will make the plan.</p>
          <div className="chip-row">
            {EQUIPMENT.map((e) => (
              <button key={e.id} className={`chip ${equipment.includes(e.id) ? 'on' : ''}`} onClick={() => toggle(equipment, e.id, setEquipment)}>
                {e.emoji} {e.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === steps.length - 1 && aiState === 'error' && (
        <div className="card fade-in" style={{ borderColor: 'var(--coral-600)' }}>
          <p style={{ color: 'var(--coral-700)', fontWeight: 800 }}>⚠️ Couldn't build your session</p>
          <p className="muted" style={{ marginTop: 6 }}>{aiError}</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generate}>Try again</button>
        </div>
      )}

      {step > 0 && (
        <div className="sticky-cta">
          <div className="inner">
            <button className="btn btn-ghost" onClick={goBack} disabled={aiState === 'loading'}>Back</button>
            <button className="btn btn-primary btn-block" onClick={next} disabled={!canNext || aiState === 'loading'}>
              {aiState === 'loading' ? '✨ Designing your session…' : step === steps.length - 1 ? '✨ Build my session' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Session setup wizard — the "Jasmine flow" entry point.
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FOCUS_AREAS, EQUIPMENT, AGE_GROUPS } from '../data/drills.js'
import { buildSession } from '../engine/sessionBuilder.js'
import { aiConfigured } from '../ai/azure.js'
import { designSessionWithAI, SessionDesignError } from '../ai/sessionDesigner.js'
import { useStore, actions, drillRecencyMap } from '../store/useStore.js'

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
  // Settings → Team / Kit: fixed details that skip their wizard step.
  const team = useStore((s) => s.team) || {}
  const kit = useStore((s) => s.kit)
  const fixedAge = AGE_GROUPS.some((a) => a.id === team.ageGroup) ? team.ageGroup : null
  const fixedKit = Array.isArray(kit) ? kit : null

  // Starting numbers for an age group: the coach's usual numbers when it's
  // their usual group, otherwise the age-band defaults. The Team squad size,
  // when set, is always the starting head-count.
  const startingFor = (id) => {
    const usual = prefs?.ageGroup === id
    const d = AGE_DEFAULTS[id] || {}
    return {
      duration: (usual && prefs.duration) || d.duration || 45,
      players: team.players || (usual && prefs.players) || d.players || 10,
    }
  }
  const initial = fixedAge ? startingFor(fixedAge) : { duration: prefs?.duration || 45, players: team.players || prefs?.players || 10 }

  const [stepIdx, setStepIdx] = useState(0)
  const [duration, setDuration] = useState(initial.duration)
  const [players, setPlayers] = useState(initial.players)
  const [ageGroup, setAgeGroup] = useState(fixedAge || prefs?.ageGroup || null)
  const [chosenKit, setEquipment] = useState(prefs?.equipment?.length ? prefs.equipment : ['balls', 'cones', 'vests'])
  const equipment = fixedKit || chosenKit
  const [focus, setFocus] = useState([])
  const [anything, setAnything] = useState(true)
  const [aiState, setAiState] = useState('idle') // 'idle' | 'loading' | 'error'
  const [aiError, setAiError] = useState('')

  const steps = [
    !fixedAge && 'Age',
    'Session',
    'Focus',
    !fixedKit && 'Kit',
  ].filter(Boolean)
  const stepName = steps[stepIdx]
  const isLast = stepIdx === steps.length - 1
  const setStep = setStepIdx

  const toggle = (list, id, setter) =>
    setter(list.includes(id) ? list.filter((x) => x !== id) : [...list, id])

  const pickAge = (id) => {
    setAgeGroup(id)
    const start = startingFor(id)
    setDuration(start.duration)
    setPlayers(start.players)
    setStep(1)
  }

  const generate = async () => {
    // Read the rotation memory fresh at click time so the just-built plan
    // (recorded on the previous generate) steers this one towards variety.
    const opts = { duration, players, ageGroup, equipment, focus, favourites, recency: drillRecencyMap() }

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
    setStep(stepIdx - 1)
  }

  const next = () => (!isLast ? setStep(stepIdx + 1) : generate())
  const canNext = stepName !== 'Focus' || focus.length > 0 || anything
  const ageLabel = AGE_GROUPS.find((a) => a.id === ageGroup)?.label

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
        {steps.map((s, i) => <div key={s} className={`dot ${i <= stepIdx ? 'on' : ''}`} />)}
      </div>

      {stepName === 'Age' && (
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

      {stepName === 'Session' && (
        <div className="card fade-in">
          {fixedAge && (
            <div className="setup-fixed">
              <span>👕 <strong>{ageLabel}</strong>{fixedKit ? <span style={{ whiteSpace: 'nowrap' }}>{` · 🎒 ${fixedKit.length} kit item${fixedKit.length === 1 ? '' : 's'}`}</span> : ''}</span>
              <Link to="/settings" className="muted" style={{ fontSize: 13.5, fontWeight: 700, whiteSpace: 'nowrap' }}>Change</Link>
            </div>
          )}
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
              <span className="muted">{team.players && players !== team.players ? `usually ${team.players} · including any keepers` : 'including any keepers'}</span>
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

      {stepName === 'Focus' && (
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
          {fixedKit && (
            <p className="muted" style={{ marginTop: 16 }}>🎒 Using your kit list from Settings ({fixedKit.length} item{fixedKit.length === 1 ? '' : 's'}).</p>
          )}
          {favourites.length > 0 && (
            <p className="muted" style={{ marginTop: 16 }}>⭐ You have {favourites.length} favourite drill{favourites.length > 1 ? 's' : ''} — they'll be picked first when they fit.</p>
          )}
        </div>
      )}

      {stepName === 'Kit' && (
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

      {isLast && aiState === 'error' && (
        <div className="card fade-in" style={{ borderColor: 'var(--coral-600)' }}>
          <p style={{ color: 'var(--coral-700)', fontWeight: 800 }}>⚠️ Couldn't build your session</p>
          <p className="muted" style={{ marginTop: 6 }}>{aiError}</p>
          <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={generate}>Try again</button>
        </div>
      )}

      {(stepIdx > 0 || stepName !== 'Age') && (
        <div className="sticky-cta">
          <div className="inner">
            {stepIdx > 0 && <button className="btn btn-ghost" onClick={goBack} disabled={aiState === 'loading'}>Back</button>}
            <button className="btn btn-primary btn-block" onClick={next} disabled={!canNext || aiState === 'loading'}>
              {aiState === 'loading' ? '✨ Designing your session…' : isLast ? '✨ Build my session' : 'Continue'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

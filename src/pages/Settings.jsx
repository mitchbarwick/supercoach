// Account, Team, Kit and Azure AI Foundry connection settings.
import { useRef, useState } from 'react'
import { useStore, actions } from '../store/useStore.js'
import { AGE_GROUPS, EQUIPMENT } from '../data/drills.js'
import { DEFAULT_TEAM_COLOUR, teamPair } from '../anim/theme.js'
import { aiConfigured } from '../ai/azure.js'
import { accountsEnabled } from '../config.js'
import AccountButton from '../components/AccountButton.jsx'
import Icon from '../icons/Icon.jsx'

// Common kit colours — plus a custom picker for anything else.
const KIT_COLOURS = [
  { hex: DEFAULT_TEAM_COLOUR, name: 'Coral' },
  { hex: '#d62828', name: 'Red' },
  { hex: '#7a1f3d', name: 'Maroon' },
  { hex: '#ff8c00', name: 'Orange' },
  { hex: '#f5d90a', name: 'Yellow' },
  { hex: '#0b7a4b', name: 'Green' },
  { hex: '#0f9b9b', name: 'Teal' },
  { hex: '#5bb8f5', name: 'Sky blue' },
  { hex: '#2f6fed', name: 'Royal blue' },
  { hex: '#1f2f6b', name: 'Navy' },
  { hex: '#6a3fb5', name: 'Purple' },
  { hex: '#1d1f22', name: 'Black' },
  { hex: '#ffffff', name: 'White' },
]

const readable = (hex) => {
  const n = parseInt(hex.slice(1), 16)
  const [r, g, b] = [(n >> 16) & 255, (n >> 8) & 255, n & 255]
  return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#1a1f24' : '#fff'
}

function Token({ fill, label }) {
  return (
    <span className="team-token" style={{ background: fill, color: readable(fill) }}>{label}</span>
  )
}

function TeamCard({ onSaved }) {
  const team = useStore((s) => s.team) || {}
  const colour = team.colour || DEFAULT_TEAM_COLOUR
  const { us, them } = teamPair(colour)
  const custom = !KIT_COLOURS.some((k) => k.hex === colour.toLowerCase())
  const picker = useRef(null)

  const set = (patch) => { actions.setTeam(patch); onSaved() }
  const players = team.players

  return (
    <div className="card">
      <div className="section-h"><Icon name="shirt" /> Team</div>
      <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 16 }}>Fixed details about your squad, so you're not asked every time.</p>

      <label className="field-label">Age group</label>
      <p className="field-hint">{team.ageGroup ? 'Session setup will skip the age question.' : 'Not set — you\'ll pick it when you plan a session.'}</p>
      <div className="chip-row" style={{ marginBottom: 22 }}>
        <button className={`chip ${!team.ageGroup ? 'on' : ''}`} onClick={() => set({ ageGroup: null })}>Ask each time</button>
        {AGE_GROUPS.map((a) => (
          <button key={a.id} className={`chip ${team.ageGroup === a.id ? 'on' : ''}`} onClick={() => set({ ageGroup: a.id })}>{a.label}</button>
        ))}
      </div>

      <label className="field-label">Number of players</label>
      <p className="field-hint">Your usual squad size. It's the starting number each session — you'll still confirm who turned up.</p>
      <div className="row" style={{ gap: 12, marginBottom: 22, flexWrap: 'wrap' }}>
        <div className="stepper" role="group" aria-label="Number of players">
          <button aria-label="Fewer players" disabled={!players || players <= 2} onClick={() => set({ players: Math.max(2, (players || 10) - 1) })}>−</button>
          <span className="val" aria-live="polite">{players || '—'}</span>
          <button aria-label="More players" disabled={players >= 30} onClick={() => set({ players: Math.min(30, (players || 9) + 1) })}>+</button>
        </div>
        {players ? (
          <button className="btn btn-ghost btn-sm" onClick={() => set({ players: null })}>Clear</button>
        ) : (
          <span className="muted" style={{ fontSize: 14 }}>Not set</span>
        )}
      </div>

      <label className="field-label">Team colour</label>
      <p className="field-hint">Colours your players in every drill diagram. When a drill needs two teams, the other side wears the opposite colour.</p>
      <div className="swatch-row">
        {KIT_COLOURS.map((k) => (
          <button
            key={k.hex}
            className={`swatch ${colour.toLowerCase() === k.hex ? 'on' : ''}`}
            style={{ background: k.hex }}
            aria-label={k.name}
            aria-pressed={colour.toLowerCase() === k.hex}
            title={k.name}
            onClick={() => set({ colour: k.hex === DEFAULT_TEAM_COLOUR ? null : k.hex })}
          />
        ))}
        <button
          className={`swatch swatch-custom ${custom ? 'on' : ''}`}
          style={custom ? { background: colour } : undefined}
          aria-label="Custom colour"
          title="Custom colour"
          onClick={() => picker.current?.click()}
        >{!custom && '+'}</button>
        <input
          ref={picker}
          type="color"
          className="visually-hidden"
          value={colour}
          onChange={(e) => set({ colour: e.target.value })}
          tabIndex={-1}
          aria-hidden="true"
        />
      </div>
      <div className="team-preview">
        <span className="team-preview-side"><Token fill={us} label="7" /><Token fill={us} label="9" /> Your team</span>
        <span className="team-preview-side"><Token fill={them} label="4" /><Token fill={them} label="5" /> Opposition</span>
      </div>
    </div>
  )
}

function KitCard({ onSaved }) {
  const kit = useStore((s) => s.kit)
  const prefs = useStore((s) => s.prefs)
  const fixed = Array.isArray(kit)

  const setFixed = (on) => {
    actions.setKit(on ? (prefs?.equipment?.length ? prefs.equipment : ['balls', 'cones', 'vests']) : null)
    onSaved()
  }
  const toggle = (id) => {
    actions.setKit(kit.includes(id) ? kit.filter((x) => x !== id) : [...kit, id])
    onSaved()
  }

  return (
    <div className="card">
      <div className="section-h"><Icon name="backpack" /> Kit {fixed && <span className="tag green">{kit.length} item{kit.length === 1 ? '' : 's'}</span>}</div>
      <p className="muted" style={{ fontSize: 14, marginTop: -4, marginBottom: 14 }}>
        Set the kit you've always got and session setup stops asking. Only drills you can run with it make the plan.
      </p>
      <div className="seg" style={{ marginBottom: fixed ? 16 : 0 }}>
        <button className={!fixed ? 'on' : ''} onClick={() => setFixed(false)}>Ask each session</button>
        <button className={fixed ? 'on' : ''} onClick={() => setFixed(true)}>Use my kit list</button>
      </div>
      {fixed && (
        <div className="chip-row fade-in">
          {EQUIPMENT.map((e) => (
            <button key={e.id} className={`chip ${kit.includes(e.id) ? 'on' : ''}`} onClick={() => toggle(e.id)}>
              <Icon name={e.icon} size={18} /> {e.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Settings() {
  const azure = useStore((s) => s.azure)
  const auth = useStore((s) => s.auth)
  const syncedAt = useStore((s) => s.syncedAt)
  const [form, setForm] = useState(azure)
  const [saved, setSaved] = useState(false)
  const timer = useRef(null)

  const flashSaved = () => {
    setSaved(true)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setSaved(false), 1800)
  }
  const save = () => {
    actions.setAzure(form)
    flashSaved()
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Settings</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Your account, your team and kit, plus the optional AI connection for age-specific coaching tips.</p>

      {accountsEnabled() && (
        <div className="card">
          <div className="section-h"><Icon name="user-round" /> Account {auth && <span className="tag green">Signed in</span>}</div>
          {auth ? (
            <>
              <AccountButton />
              <p className="muted" style={{ fontSize: 13, marginTop: 10 }}>
                Sessions, saved programs and favourites sync to your account
                {syncedAt ? ` — last synced ${new Date(syncedAt).toLocaleTimeString()}` : ''}.
                Signing out keeps everything on this device.
              </p>
            </>
          ) : (
            <>
              <p className="muted" style={{ fontSize: 14, marginBottom: 14 }}>Sign in to keep your sessions, saved programs and favourite drills on every device.</p>
              <AccountButton />
            </>
          )}
        </div>
      )}

      <TeamCard onSaved={flashSaved} />
      <KitCard onSaved={flashSaved} />

      <div className="card">
        <div className="section-h"><Icon name="sparkles" /> Azure AI Foundry {aiConfigured() && <span className="tag green">Connected</span>}</div>
        <label className="field-label" style={{ marginTop: 10 }}>Endpoint</label>
        <input className="text-input" placeholder="https://your-resource.openai.azure.com" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>Deployment name</label>
        <input className="text-input" placeholder="gpt-4o-mini" value={form.deployment} onChange={(e) => setForm({ ...form, deployment: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>API key</label>
        <input className="text-input" type="password" placeholder="Your Azure OpenAI key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Either key type works: the Foundry project API key (long) or the classic resource key (32 characters). Stored only in this browser — the app works fully without it.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save}>Save connection</button>
      </div>

      {saved && <div className="toast"><Icon name="check" size={16} /> Saved</div>}
    </div>
  )
}

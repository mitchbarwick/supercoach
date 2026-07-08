// "Something not quite right?" — free-text feedback at the bottom of
// every drill page. Sends the coach's words plus telemetry (which
// drill, what age group, how many kids...) so the app creator can
// tune the drill. Works for guests too; hidden until the API exists.
import { useState } from 'react'
import { apiEnabled, APP_VERSION } from '../config.js'
import { api } from '../api/client.js'
import { useStore } from '../store/useStore.js'

export default function DrillFeedback({ drill, source }) {
  const session = useStore((s) => s.session)
  const auth = useStore((s) => s.auth)
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [status, setStatus] = useState('idle') // idle | sending | sent | error

  if (!apiEnabled()) return null

  const send = async () => {
    if (!text.trim()) return
    setStatus('sending')
    try {
      await api.sendFeedback(auth?.token, {
        drillId: drill.id,
        drillName: drill.name,
        text: text.trim(),
        telemetry: {
          ageGroup: session?.request?.ageGroup || null,
          players: session?.request?.players || null,
          duration: session?.request?.duration || null,
          focus: session?.request?.focus || null,
          equipment: session?.request?.equipment || null,
          source,
          aiGenerated: Boolean(session?.ai),
          appVersion: APP_VERSION,
        },
      })
      setStatus('sent')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'sent') {
    return (
      <div className="card feedback-card">
        <p style={{ fontWeight: 800 }}>💚 Thanks — that goes straight to SuperCoach HQ.</p>
        <p className="muted" style={{ fontSize: 13.5, marginTop: 4 }}>Your note helps make this drill better for every coach.</p>
      </div>
    )
  }

  return (
    <div className="card feedback-card">
      {!open ? (
        <button className="feedback-open" onClick={() => setOpen(true)}>
          <span>💬</span>
          <span style={{ flex: 1, textAlign: 'left' }}>
            <strong>Something not quite right with this drill?</strong>
            <span className="muted" style={{ display: 'block', fontSize: 13.5 }}>Tell the app creator — it goes with your age group and squad size attached.</span>
          </span>
          <span aria-hidden="true">→</span>
        </button>
      ) : (
        <div>
          <div className="section-h">💬 Feedback on "{drill.name}"</div>
          <textarea
            className="note-input"
            autoFocus
            placeholder="What didn't make sense, or what didn't work for your kids?"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <div className="row" style={{ gap: 10, marginTop: 12 }}>
            <button className="btn btn-primary" disabled={!text.trim() || status === 'sending'} onClick={send}>
              {status === 'sending' ? 'Sending…' : 'Send feedback'}
            </button>
            <button className="btn btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
          </div>
          {status === 'error' && <p style={{ color: 'var(--coral-700)', fontSize: 13, marginTop: 8 }}>Couldn't send just now — your note is still here, try again in a moment.</p>}
        </div>
      )}
    </div>
  )
}

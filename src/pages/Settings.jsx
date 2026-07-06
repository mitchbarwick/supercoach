// Azure AI Foundry connection settings.
import { useState } from 'react'
import { useStore, actions } from '../store/useStore.js'
import { aiConfigured } from '../ai/azure.js'

export default function Settings() {
  const azure = useStore((s) => s.azure)
  const [form, setForm] = useState(azure)
  const [saved, setSaved] = useState(false)

  const save = () => {
    actions.setAzure(form)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div>
      <h1 style={{ fontSize: 26, marginBottom: 4 }}>Settings</h1>
      <p className="muted" style={{ marginBottom: 18 }}>Connect Azure AI Foundry to get coaching tips tailored to your exact age group on every drill page.</p>

      <div className="card">
        <div className="section-h">✨ Azure AI Foundry {aiConfigured() && <span className="tag green">Connected</span>}</div>
        <label className="field-label" style={{ marginTop: 10 }}>Endpoint</label>
        <input className="text-input" placeholder="https://your-resource.openai.azure.com" value={form.endpoint} onChange={(e) => setForm({ ...form, endpoint: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>Deployment name</label>
        <input className="text-input" placeholder="gpt-4o-mini" value={form.deployment} onChange={(e) => setForm({ ...form, deployment: e.target.value })} />
        <label className="field-label" style={{ marginTop: 14 }}>API key</label>
        <input className="text-input" type="password" placeholder="Your Azure OpenAI key" value={form.apiKey} onChange={(e) => setForm({ ...form, apiKey: e.target.value })} />
        <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Either key type works: the Foundry project API key (long) or the classic resource key (32 characters). Stored only in this browser — the app works fully without it.</p>
        <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={save}>Save connection</button>
      </div>

      {saved && <div className="toast">Saved ✓</div>}
    </div>
  )
}

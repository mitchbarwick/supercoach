// Dev-only gallery (#/anim-lab): every drill animation on one page,
// with the compiler's warnings, for authoring and review.
//   ?id=rondo        filter by id / name
//   ?cat=game        filter by category
//   ?t=2.4           freeze every animation at 2.4s
//   ?frac=0.5        freeze each at 50% of its own timeline (contact sheet)
//   ?cols=3          fixed column count
//   ?set=ball        ball test scenes (spin, blur), cropped in close
import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { DRILLS } from '../data/drills.js'
import { BALL_LAB } from '../data/scenes/lab.js'
import { compileScene } from '../anim/compile.js'
import PitchAnimation from '../components/PitchAnimation.jsx'

export default function AnimLab() {
  const [params, setParams] = useSearchParams()
  const filter = params.get('id') || ''
  const cat = params.get('cat')
  const t = params.get('t') != null ? parseFloat(params.get('t')) : undefined
  const frac = params.get('frac') != null ? parseFloat(params.get('frac')) : undefined
  const cols = params.get('cols')
  const setFilter = (v) => {
    const next = new URLSearchParams(params)
    if (v) next.set('id', v)
    else next.delete('id')
    setParams(next, { replace: true })
  }
  const set = params.get('set')
  const list = useMemo(
    () => (set === 'ball' ? Object.entries(BALL_LAB).map(([id, l]) => ({ id, emoji: '⚽', category: 'lab', ...l })) : DRILLS).filter((d) => (!cat || d.category === cat) && (!filter || d.id.includes(filter) || d.name.toLowerCase().includes(filter.toLowerCase()))),
    [filter, cat, set],
  )
  return (
    <div style={{ padding: 16, maxWidth: cols ? 'none' : 1200, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22 }}>Animation lab · {list.length} {set === 'ball' ? 'ball tests' : 'drills'}</h1>
      <input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter by id or name" style={{ padding: 8, width: 280, marginBottom: 16 }} />
      <div style={{ display: 'grid', gridTemplateColumns: cols ? `repeat(${cols}, 1fr)` : 'repeat(auto-fill, minmax(340px, 1fr))', gap: 18 }}>
        {list.map((d) => {
          let warnings = []
          let duration = 0
          try {
            const c = compileScene(d.diagram)
            warnings = c.warnings
            duration = c.duration
          } catch (e) {
            warnings = ['crash: ' + e.message]
          }
          const freeze = frac != null ? frac * duration : t
          return (
            <div key={d.id} data-drill={d.id}>
              <div style={{ fontWeight: 800, marginBottom: 6, fontSize: cols ? 12 : 16 }}>
                {d.emoji} {d.name} <span style={{ color: '#888', fontWeight: 600, fontSize: 11 }}>{d.id}</span>
              </div>
              <PitchAnimation key={freeze} diagram={d.diagram} freezeAt={freeze} viewBox={d.view} />
              {warnings.length > 0 && (
                <ul style={{ color: '#b8363b', fontSize: 12, margin: '6px 0 0', paddingLeft: 18 }}>
                  {warnings.map((w, i) => <li key={i}>{w}</li>)}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

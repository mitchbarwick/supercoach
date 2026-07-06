// ============================================================
// PositionMap — mini pitch used in session setup to pick which
// position groups showed up today. Static (no animation), square
// (100 x 100) so it fits the mobile form factor better than the
// wide 100 x 64 pitch used elsewhere. Each row is a tap target
// that toggles a whole position group on/off.
// ============================================================
const ROWS = [
  { id: 'forwards', label: 'FWD', y: 15, tokens: [38, 50, 62] },
  { id: 'midfield', label: 'MID', y: 38, tokens: [30, 50, 70] },
  { id: 'defence', label: 'DEF', y: 61, tokens: [26, 42, 58, 74] },
  { id: 'goalkeeper', label: 'GK', y: 84, tokens: [50] },
]
const ROW_HEIGHT = 20

export default function PositionMap({ positions, onToggle }) {
  return (
    <div className="pitch-wrap position-map" style={{ aspectRatio: '1 / 1' }}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <rect x="0" y="0" width="100" height="100" fill="#2e8f57" />
        <rect x="3" y="3" width="94" height="94" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="0.7" rx="1.5" />

        {ROWS.map((row) => {
          const on = positions[row.id]
          return (
            <g
              key={row.id}
              className="position-row"
              onClick={() => onToggle(row.id)}
              style={{ cursor: 'pointer' }}
            >
              <rect x="3" y={row.y - ROW_HEIGHT / 2} width="94" height={ROW_HEIGHT} fill={on ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.12)'} />
              {row.tokens.map((x, i) => (
                <g key={i} opacity={on ? 1 : 0.35}>
                  <ellipse cx={x} cy={row.y + 2.6} rx="2.6" ry="0.9" fill="rgba(0,0,0,0.22)" />
                  <circle cx={x} cy={row.y} r="3" fill={on ? '#ff5a5f' : '#9aa0a6'} stroke={on ? '#c93a3e' : '#71767b'} strokeWidth="0.6" />
                </g>
              ))}
              <text
                x="8"
                y={row.y + 1.1}
                fontSize="4"
                fontWeight="800"
                fill={on ? '#fff' : 'rgba(255,255,255,0.55)'}
                fontFamily="Nunito, sans-serif"
              >
                {row.label}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

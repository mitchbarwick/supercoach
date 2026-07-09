// Full-screen takeover shown while a Google credential is being
// exchanged for a session (AccountButton sets `busy` for this).
// Covers whatever page triggered sign-in (Landing, guest info, the
// Home sign-in card, etc.) via a portal so it always fills the
// viewport regardless of where AccountButton is nested.
import { createPortal } from 'react-dom'

export default function SigningInScreen({ text = 'Signing you in…' }) {
  return createPortal(
    <div className="signing-in-screen" role="status" aria-live="polite">
      <svg className="signing-in-anim" viewBox="0 0 100 50" width="220" height="110">
        <g className="signing-in-coach">
          <ellipse cx="24" cy="39" rx="6.5" ry="2" fill="rgba(0,0,0,0.14)" />
          <circle cx="24" cy="26" r="7.2" fill="#f5a623" stroke="#c07f12" strokeWidth="0.9" />
          <text x="24" y="29" textAnchor="middle" fontSize="7" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">C</text>
        </g>
        <g className="signing-in-player">
          <ellipse cx="76" cy="39" rx="5.6" ry="1.8" fill="rgba(0,0,0,0.14)" />
          <circle cx="76" cy="28" r="5.8" fill="#ff5a5f" stroke="#c93a3e" strokeWidth="0.8" />
          <text x="76" y="30.6" textAnchor="middle" fontSize="6" fontWeight="800" fill="#fff" fontFamily="Nunito, sans-serif">1</text>
        </g>
        <circle className="signing-in-ball" r="2.6" fill="#fff" stroke="#222" strokeWidth="0.4" />
      </svg>
      <p className="signing-in-text">{text}</p>
    </div>,
    document.body,
  )
}

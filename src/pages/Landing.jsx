// Landing / welcome screen for signed-out visitors.
// Encourages signing in (so plans sync across devices) with a clear
// secondary "continue as guest" path. Shown on every visit until the
// visitor signs in (see Home.jsx) — the guest choice is session-only.
import { useNavigate } from 'react-router-dom'
import AccountButton from '../components/AccountButton.jsx'
import LandingHero from '../components/LandingHero.jsx'
import drillScreenPhoto from '../assets/hero-1.png'
import wizardScreenPhoto from '../assets/hero-2.png'

const FEATURES = [
  {
    emoji: '⚡',
    title: 'A full session in minutes',
    text: 'Tell us the age group and what you want to work on — we build the whole plan, warm-up to cool-down.',
    image: wizardScreenPhoto,
    imageAlt: 'A coach holding a phone showing the SuperCoach session wizard set to Under 9–11, with players training on the pitch behind them',
  },
  {
    emoji: '📚',
    title: '50+ drills with animations',
    text: 'Every drill shows a moving diagram, setup and age-appropriate coaching cues.',
    image: drillScreenPhoto,
    imageAlt: 'A coach holding a phone showing a SuperCoach drill animation, with players training on the pitch behind them',
  },
  { emoji: '☁️', title: 'Synced across your devices', text: 'Sign in and your plans, saved sessions and favourite drills follow you everywhere.' },
]

export default function Landing() {
  const navigate = useNavigate()

  return (
    <div className="landing fade-in">
      <div className="landing-hero">
        <LandingHero />
        <h1>Plan training your team will love</h1>
        <p>SuperCoach builds grassroots football sessions for you — pick an age group, choose a focus, and coach with confidence.</p>
      </div>

      <div className="landing-cta card">
        <div className="landing-signin">
          <AccountButton />
        </div>
        <p className="muted landing-guest-note">
          Sign in to keep your sessions on every device — or try it as a guest first.
        </p>
        <button className="btn btn-ghost btn-block" onClick={() => navigate('/guest')}>
          Continue as guest →
        </button>
      </div>

      <ul className="landing-features">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <span className="landing-feature-emoji" aria-hidden="true">{f.emoji}</span>
            <span>
              <strong>{f.title}</strong>
              <span className="muted landing-feature-text">{f.text}</span>
              {f.image && <img className="landing-feature-photo" src={f.image} alt={f.imageAlt} />}
            </span>
          </li>
        ))}
      </ul>

      <p className="muted landing-foot">No account needed to get started — sign in any time for the full experience.</p>
    </div>
  )
}

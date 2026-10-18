// Landing / welcome screen for signed-out visitors.
// Encourages signing in (so plans sync across devices) with a clear
// secondary "continue as guest" path. Shown on every visit until the
// visitor signs in (see Home.jsx) — the guest choice is session-only.
import { Link } from 'react-router-dom'
import AccountButton from '../components/AccountButton.jsx'
import LandingHero from '../components/LandingHero.jsx'
import Icon from '../icons/Icon.jsx'
// Feature photos: 4:3 crops from the top of hero-1.png / hero-2.png (the
// full-size sources, not shipped), at 480 and 940 px wide, as AVIF with
// a WebP fallback — ~10–35 KB each instead of 1.3 MB.
import drillAvif480 from '../assets/landing/drill-screen-480.avif'
import drillAvif940 from '../assets/landing/drill-screen-940.avif'
import drillWebp480 from '../assets/landing/drill-screen-480.webp'
import drillWebp940 from '../assets/landing/drill-screen-940.webp'
import wizardAvif480 from '../assets/landing/wizard-screen-480.avif'
import wizardAvif940 from '../assets/landing/wizard-screen-940.avif'
import wizardWebp480 from '../assets/landing/wizard-screen-480.webp'
import wizardWebp940 from '../assets/landing/wizard-screen-940.webp'

const photo = (avif480, avif940, webp480, webp940) => ({
  avif: `${avif480} 480w, ${avif940} 940w`,
  webp: `${webp480} 480w, ${webp940} 940w`,
  src: webp940,
})
const wizardScreenPhoto = photo(wizardAvif480, wizardAvif940, wizardWebp480, wizardWebp940)
const drillScreenPhoto = photo(drillAvif480, drillAvif940, drillWebp480, drillWebp940)
// One column on phones (page width less the gutters), three across from 720px.
const PHOTO_SIZES = '(min-width: 720px) 240px, calc(100vw - 32px)'

// "Synced across your devices" has no photo: the same devices, linked.
function SyncedDevices() {
  return (
    <div className="landing-feature-media landing-synced" aria-hidden="true">
      <span className="landing-synced-cloud"><Icon name="cloud" size={30} /></span>
      <span className="landing-synced-devices">
        <Icon name="smartphone" size={34} strokeWidth={1.75} />
        <Icon name="tablet" size={42} strokeWidth={1.75} />
        <Icon name="laptop" size={50} strokeWidth={1.75} />
      </span>
    </div>
  )
}

const FEATURES = [
  {
    icon: 'zap',
    title: 'A full session in minutes',
    text: 'Tell us the age group and what you want to work on — we build the whole plan, warm-up to cool-down.',
    image: wizardScreenPhoto,
    imageAlt: 'A coach holding a phone showing the SuperCoach session wizard set to Under 9–11, with players training on the pitch behind them',
  },
  {
    icon: 'library',
    title: '50+ drills with animations',
    text: 'Every drill shows a moving diagram, setup and age-appropriate coaching cues.',
    image: drillScreenPhoto,
    imageAlt: 'A coach holding a phone showing a SuperCoach drill animation, with players training on the pitch behind them',
  },
  { icon: 'cloud', title: 'Synced across your devices', text: 'Sign in and your plans, saved sessions and favourite drills follow you everywhere.' },
]

export default function Landing() {
  return (
    <div className="landing fade-in">
      <LandingHero>
        <h1>Plan training your team will love</h1>
        <div className="landing-signin">
          <AccountButton />
        </div>
        <Link to="/guest" className="landing-guest">
          Continue as guest <Icon name="arrow-right" size={16} />
        </Link>
      </LandingHero>

      <p className="landing-lede">
        SuperCoach builds grassroots football sessions for you — pick an age group, choose a focus, and coach with confidence.
      </p>

      <ul className="landing-features">
        {FEATURES.map((f) => (
          <li key={f.title} className="landing-feature">
            {f.image
              ? (
                <picture>
                  <source type="image/avif" srcSet={f.image.avif} sizes={PHOTO_SIZES} />
                  <source type="image/webp" srcSet={f.image.webp} sizes={PHOTO_SIZES} />
                  <img className="landing-feature-media" src={f.image.src} alt={f.imageAlt} width="940" height="705" loading="lazy" decoding="async" />
                </picture>
              )
              : <SyncedDevices />}
            <div className="landing-feature-body">
              <span className="landing-feature-icon"><Icon name={f.icon} size={20} /></span>
              <strong>{f.title}</strong>
              <span className="landing-feature-text">{f.text}</span>
            </div>
          </li>
        ))}
      </ul>

      <p className="muted landing-foot">No account needed to get started — sign in any time for the full experience.</p>
    </div>
  )
}

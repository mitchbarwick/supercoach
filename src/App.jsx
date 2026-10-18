import { lazy, Suspense, useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useLocation, useNavigationType } from 'react-router-dom'
import Home from './pages/Home.jsx'
import GuestInfo from './pages/GuestInfo.jsx'
import SessionSetup from './pages/SessionSetup.jsx'
import PlanView from './pages/PlanView.jsx'
import DrillDetail from './pages/DrillDetail.jsx'
import DrillLibrary from './pages/DrillLibrary.jsx'
import SharedPlan from './pages/SharedPlan.jsx'
import Settings from './pages/Settings.jsx'
import Emergency from './pages/Emergency.jsx'
import EmergencyGuide from './pages/EmergencyGuide.jsx'
import Admin from './pages/Admin.jsx'
import SpinningBall from './components/SpinningBall.jsx'
import Icon from './icons/Icon.jsx'
import { useStore } from './store/useStore.js'
import { accountsEnabled } from './config.js'

// Dev-only gallery of every drill animation (#/anim-lab); never shipped.
const AnimLab = import.meta.env.DEV ? lazy(() => import('./pages/AnimLab.jsx')) : null
// Dev-only gallery of every icon (#/icon-lab); never shipped.
const IconLab = import.meta.env.DEV ? lazy(() => import('./pages/IconLab.jsx')) : null

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: 'house', end: true },
  { to: '/plan', label: 'Plan', icon: 'clipboard-list' },
  { to: '/library', label: 'Library', icon: 'library' },
  { to: '/settings', label: 'Settings', icon: 'settings' },
]

export default function App() {
  const { pathname } = useLocation()
  const navType = useNavigationType()
  const isAdmin = useStore((s) => Boolean(s.auth?.user?.isAdmin))
  const auth = useStore((s) => s.auth)
  const guestEntered = useStore((s) => s.guestEntered)
  const [menuOpen, setMenuOpen] = useState(false)

  // Mirrors Home.jsx's gate for showing <Landing/>, plus the guest-info
  // interstitial — neither should also expose site navigation before the
  // visitor has actually chosen sign-in or guest.
  const showingLanding = (pathname === '/' && !auth && !guestEntered && accountsEnabled()) || pathname === '/guest'
  // The drill page brings its own top bar (back · share · favourite).
  const onDrillPage = pathname.startsWith('/drill/')

  useEffect(() => {
    // Only scroll fresh navigations to the top — back/forward (POP) keeps
    // the browser's native scroll restoration so returning to a list
    // lands back where you left it.
    if (navType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navType])

  // Close the mobile menu on any route change.
  useEffect(() => { setMenuOpen(false) }, [pathname])

  // Let Escape close the menu.
  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menuOpen])

  const closeMenu = () => setMenuOpen(false)

  return (
    <div className="app-shell">
      {!onDrillPage && <header className="topbar">
        <Link to="/" className="brand" onClick={closeMenu}>
          <SpinningBall /> SuperCoach
        </Link>
        {!showingLanding && (
          <>
            <button
              type="button"
              className="nav-toggle"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={menuOpen}
              aria-controls="main-nav"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon name={menuOpen ? 'x' : 'menu'} size={20} />
            </button>
            <nav
              id="main-nav"
              className={`topnav ${menuOpen ? 'open' : ''}`}
              aria-label="Main navigation"
            >
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  onClick={closeMenu}
                  className={({ isActive }) => `topnav-link ${isActive ? 'on' : ''}`}
                >
                  <Icon name={item.icon} size={18} className="topnav-icon" />
                  <span className="topnav-label">{item.label}</span>
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  className={({ isActive }) => `topnav-link ${isActive ? 'on' : ''}`}
                >
                  <Icon name="chart-column" size={18} className="topnav-icon" />
                  <span className="topnav-label">Admin</span>
                </NavLink>
              )}
              {auth && (
                <NavLink
                  to="/emergency"
                  onClick={closeMenu}
                  className={({ isActive }) => `topnav-emergency ${isActive ? 'on' : ''}`}
                  title="Emergency injury support"
                >
                  <Icon name="siren" size={18} className="topnav-icon" />
                  <span className="topnav-label">Emergency</span>
                </NavLink>
              )}
            </nav>
          </>
        )}
      </header>}
      {menuOpen && <button className="nav-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeMenu} />}
      <main key={pathname} className="page-fade">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guest" element={<GuestInfo />} />
          <Route path="/new" element={<SessionSetup />} />
          <Route path="/plan" element={<PlanView />} />
          <Route path="/shared" element={<SharedPlan />} />
          <Route path="/admin" element={<Admin />} />
          {AnimLab && <Route path="/anim-lab" element={<Suspense fallback={null}><AnimLab /></Suspense>} />}
          {IconLab && <Route path="/icon-lab" element={<Suspense fallback={null}><IconLab /></Suspense>} />}
          <Route path="/drill/:id" element={<DrillDetail />} />
          <Route path="/library" element={<DrillLibrary />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/emergency" element={<Emergency />} />
          <Route path="/emergency/:id" element={<EmergencyGuide />} />
        </Routes>
      </main>
    </div>
  )
}

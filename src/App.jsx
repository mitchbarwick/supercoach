import { useEffect, useState } from 'react'
import { Routes, Route, Link, NavLink, useLocation, useNavigationType } from 'react-router-dom'
import Home from './pages/Home.jsx'
import GuestInfo from './pages/GuestInfo.jsx'
import SessionSetup from './pages/SessionSetup.jsx'
import PlanView from './pages/PlanView.jsx'
import DrillDetail from './pages/DrillDetail.jsx'
import DrillLibrary from './pages/DrillLibrary.jsx'
import Settings from './pages/Settings.jsx'
import Emergency from './pages/Emergency.jsx'
import EmergencyGuide from './pages/EmergencyGuide.jsx'
import Admin from './pages/Admin.jsx'
import { useStore } from './store/useStore.js'
import { accountsEnabled } from './config.js'

const NAV_ITEMS = [
  { to: '/', label: 'Home', emoji: '⚽', end: true },
  { to: '/plan', label: 'Plan', emoji: '📋' },
  { to: '/library', label: 'Library', emoji: '📚' },
  { to: '/settings', label: 'Settings', emoji: '⚙️' },
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
      <header className="topbar">
        <Link to="/" className="brand" onClick={closeMenu}>
          <span className="ball">⚽</span> SuperCoach
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
              <span aria-hidden="true">{menuOpen ? '✕' : '☰'}</span>
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
                  <span className="topnav-emoji" aria-hidden="true">{item.emoji}</span>
                  <span className="topnav-label">{item.label}</span>
                </NavLink>
              ))}
              {isAdmin && (
                <NavLink
                  to="/admin"
                  onClick={closeMenu}
                  className={({ isActive }) => `topnav-link ${isActive ? 'on' : ''}`}
                >
                  <span className="topnav-emoji" aria-hidden="true">📊</span>
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
                  <span className="topnav-emoji" aria-hidden="true">🚨</span>
                  <span className="topnav-label">Emergency</span>
                </NavLink>
              )}
            </nav>
          </>
        )}
      </header>
      {menuOpen && <button className="nav-backdrop" aria-hidden="true" tabIndex={-1} onClick={closeMenu} />}
      <main key={pathname} className="page-fade">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/guest" element={<GuestInfo />} />
          <Route path="/new" element={<SessionSetup />} />
          <Route path="/plan" element={<PlanView />} />
          <Route path="/admin" element={<Admin />} />
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

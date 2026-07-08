import { useEffect } from 'react'
import { Routes, Route, Link, NavLink, useLocation, useNavigationType } from 'react-router-dom'
import Home from './pages/Home.jsx'
import SessionSetup from './pages/SessionSetup.jsx'
import PlanView from './pages/PlanView.jsx'
import DrillDetail from './pages/DrillDetail.jsx'
import DrillLibrary from './pages/DrillLibrary.jsx'
import Settings from './pages/Settings.jsx'
import Emergency from './pages/Emergency.jsx'
import EmergencyGuide from './pages/EmergencyGuide.jsx'
import Admin from './pages/Admin.jsx'
import { useStore } from './store/useStore.js'

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

  useEffect(() => {
    // Only scroll fresh navigations to the top — back/forward (POP) keeps
    // the browser's native scroll restoration so returning to a list
    // lands back where you left it.
    if (navType !== 'POP') window.scrollTo(0, 0)
  }, [pathname, navType])

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link to="/" className="brand">
          <span className="ball">⚽</span> SuperCoach
        </Link>
        <nav className="topnav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `topnav-link ${isActive ? 'on' : ''}`}
            >
              <span className="topnav-emoji" aria-hidden="true">{item.emoji}</span>
              <span className="topnav-label">{item.label}</span>
            </NavLink>
          ))}
          {isAdmin && (
            <NavLink to="/admin" className={({ isActive }) => `topnav-link ${isActive ? 'on' : ''}`}>
              <span className="topnav-emoji" aria-hidden="true">📊</span>
              <span className="topnav-label">Admin</span>
            </NavLink>
          )}
          <NavLink
            to="/emergency"
            className={({ isActive }) => `topnav-emergency ${isActive ? 'on' : ''}`}
            title="Emergency injury support"
          >
            <span className="topnav-emoji" aria-hidden="true">🚨</span>
            <span>Emergency</span>
          </NavLink>
        </nav>
      </header>
      <main key={pathname} className="page-fade">
        <Routes>
          <Route path="/" element={<Home />} />
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

import { useEffect } from 'react'
import { Routes, Route, Link, useLocation, useNavigationType } from 'react-router-dom'
import SessionSetup from './pages/SessionSetup.jsx'
import PlanView from './pages/PlanView.jsx'
import DrillDetail from './pages/DrillDetail.jsx'
import DrillLibrary from './pages/DrillLibrary.jsx'
import Settings from './pages/Settings.jsx'

export default function App() {
  const { pathname } = useLocation()
  const navType = useNavigationType()

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
        <nav className="topbar-actions">
          <Link to="/library" className="icon-btn" title="Drill library & favourites" aria-label="Drill library">📚</Link>
          <Link to="/plan" className="icon-btn" title="Current session plan" aria-label="Current plan">📋</Link>
          <Link to="/settings" className="icon-btn" title="Settings" aria-label="Settings">⚙️</Link>
        </nav>
      </header>
      <main key={pathname} className="page-fade">
        <Routes>
          <Route path="/" element={<SessionSetup />} />
          <Route path="/plan" element={<PlanView />} />
          <Route path="/drill/:id" element={<DrillDetail />} />
          <Route path="/library" element={<DrillLibrary />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
    </div>
  )
}

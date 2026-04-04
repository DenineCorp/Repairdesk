import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/LoadingSpinner'
import Login from './pages/Login'
import TechDashboard from './pages/TechDashboard'
import FounderDashboard from './pages/FounderDashboard'
import IntakeForm from './pages/IntakeForm'
import TicketDetail from './pages/TicketDetail'

/** Redirects unauthenticated users to /login */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner message="Authenticating…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/** After login, redirect root to the correct dashboard by role */
function RoleRedirect() {
  const { role, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Loading…" />
  if (role === 'founder') return <Navigate to="/founder-dashboard" replace />
  return <Navigate to="/tech-dashboard" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Protected */}
        <Route path="/" element={<RequireAuth><RoleRedirect /></RequireAuth>} />
        <Route path="/tech-dashboard" element={<RequireAuth><TechDashboard /></RequireAuth>} />
        <Route path="/founder-dashboard" element={<RequireAuth><FounderDashboard /></RequireAuth>} />
        <Route path="/intake" element={<RequireAuth><IntakeForm /></RequireAuth>} />
        <Route path="/ticket/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

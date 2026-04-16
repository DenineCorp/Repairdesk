import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import LoadingSpinner from './components/LoadingSpinner'
import AnimatedBackground from './components/AnimatedBackground'
import Login from './pages/Login'
import Setup2FA from './pages/Setup2FA'
import Verify2FA from './pages/Verify2FA'
import TechDashboard from './pages/TechDashboard'
import FounderDashboard from './pages/FounderDashboard'
import IntakeForm from './pages/IntakeForm'
import TicketDetail from './pages/TicketDetail'
import AuditLog from './pages/AuditLog'
import UserManagement from './pages/UserManagement'
import TicketStatus from './pages/TicketStatus'
import TaxReport from './pages/TaxReport'

/** Redirects unauthenticated users */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner message="Authenticating…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/** Requires a valid session but NOT AAL2 — used for the 2FA setup/verify flow */
function RequireSession({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingSpinner message="Authenticating…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  return children
}

/** After login + 2FA, redirect root to the correct dashboard by role */
function RoleRedirect() {
  const { role, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Loading…" />
  if (role === 'founder') return <Navigate to="/founder-dashboard" replace />
  if (role === 'viewer') return <Navigate to="/viewer" replace />
  return <Navigate to="/tech-dashboard" replace />
}

/** Block viewer-role accounts from write-access routes */
function RequireNotViewer({ children }) {
  const { role, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Loading…" />
  if (role === 'viewer') return <Navigate to="/viewer" replace />
  return children
}

/** Restrict route to founder only */
function RequireFounder({ children }) {
  const { role, loading } = useAuth()
  if (loading) return <LoadingSpinner message="Loading…" />
  if (role !== 'founder') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />
        <Route path="/status/:issueId" element={<TicketStatus />} />
        <Route path="/setup-2fa" element={<RequireSession><Setup2FA /></RequireSession>} />
        <Route path="/verify-2fa" element={<RequireSession><Verify2FA /></RequireSession>} />

        {/* Protected */}
        <Route path="/" element={<RequireAuth><RoleRedirect /></RequireAuth>} />
        <Route path="/tech-dashboard" element={<RequireAuth><TechDashboard /></RequireAuth>} />
        <Route path="/viewer" element={<RequireAuth><TechDashboard /></RequireAuth>} />
        <Route path="/founder-dashboard" element={<RequireAuth><FounderDashboard /></RequireAuth>} />
        <Route path="/intake" element={<RequireAuth><RequireNotViewer><IntakeForm /></RequireNotViewer></RequireAuth>} />
        <Route path="/ticket/:id" element={<RequireAuth><TicketDetail /></RequireAuth>} />
        <Route path="/audit-log" element={<RequireAuth><AuditLog /></RequireAuth>} />
        <Route path="/users" element={<RequireAuth><RequireFounder><UserManagement /></RequireFounder></RequireAuth>} />
        <Route path="/tax-report" element={<RequireAuth><RequireFounder><TaxReport /></RequireFounder></RequireAuth>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

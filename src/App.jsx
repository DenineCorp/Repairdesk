import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { supabase } from './services/supabaseClient'
import LoadingSpinner from './components/LoadingSpinner'
import Login from './pages/Login'
import Setup2FA from './pages/Setup2FA'
import Verify2FA from './pages/Verify2FA'
import TechDashboard from './pages/TechDashboard'
import FounderDashboard from './pages/FounderDashboard'
import IntakeForm from './pages/IntakeForm'
import TicketDetail from './pages/TicketDetail'

/** Redirects unauthenticated users; enforces AAL2 if TOTP is enrolled */
function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [aalChecked, setAalChecked] = useState(false)
  const [needsMfa, setNeedsMfa] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!user) { setAalChecked(true); return }
    supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => {
      if (data?.nextLevel === 'aal2' && data?.currentLevel !== 'aal2') {
        setNeedsMfa(true)
      }
      setAalChecked(true)
    })
  }, [user, loading])

  if (loading || !aalChecked) return <LoadingSpinner message="Authenticating…" />
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />
  if (needsMfa) return <Navigate to="/verify-2fa" replace />
  return children
}

/** After login + 2FA, redirect root to the correct dashboard by role */
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
        <Route path="/setup-2fa" element={<Setup2FA />} />
        <Route path="/verify-2fa" element={<Verify2FA />} />

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

import { LogOut, ClipboardList, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, role, signOut } = useAuth()
  const navigate = useNavigate()

  const rolePill = role === 'founder'
    ? { bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)', border: 'rgba(245,158,11,0.2)', label: 'Founder' }
    : role === 'viewer'
      ? { bg: 'rgba(142,142,147,0.12)', color: 'var(--text-secondary)', border: 'rgba(142,142,147,0.2)', label: 'Viewer' }
      : { bg: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: 'rgba(0,113,227,0.2)', label: 'Technician' }

  return (
    <header
      className="no-print"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 52,
        zIndex: 100,
        background: 'rgba(11,25,41,0.75)',
        backdropFilter: 'blur(24px) saturate(180%)',
        WebkitBackdropFilter: 'blur(24px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        {/* Logo + company name */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'default' }}>
          <img
            src="/logo.jpg"
            alt="Elect Technologies"
            style={{ height: 32, width: 32, objectFit: 'contain', borderRadius: 6 }}
          />
          <span style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            fontSize: 17,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            <span style={{ fontWeight: 700, color: '#4f9cf9' }}>Elect</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}> Technologies</span>
          </span>
        </div>

        {/* Right */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Email */}
            <span className="nav-email" style={{ fontSize: 12, color: 'rgba(242,242,247,0.4)' }}>
              {user.email}
            </span>

            {/* Technician + Founder nav links */}
            {(role === 'founder' || role === 'technician') && (
              <>
                <button
                  onClick={() => navigate('/founder-dashboard')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(242,242,247,0.65)', fontSize: 12, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    transition: 'color 150ms, background 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)'; e.currentTarget.style.background = 'none' }}
                >
                  <ClipboardList size={13} strokeWidth={2} />
                  <span className="nav-signout-text">Reports</span>
                </button>
                <button
                  onClick={() => navigate('/audit-log')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(242,242,247,0.65)', fontSize: 12, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    transition: 'color 150ms, background 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)'; e.currentTarget.style.background = 'none' }}
                >
                  <ClipboardList size={13} strokeWidth={2} />
                  <span className="nav-signout-text">Activity Log</span>
                </button>
              </>
            )}

            {/* Founder-only: User Management */}
            {role === 'founder' && (
              <button
                onClick={() => navigate('/users')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
                  padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                  transition: 'color 150ms, background 150ms',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
              >
                <Users size={13} strokeWidth={2} />
                <span className="nav-signout-text">Users</span>
              </button>
            )}

            {/* Role pill */}
            {role && (
              <span style={{
                fontSize: 12,
                fontWeight: 500,
                color: rolePill.color,
                background: rolePill.bg,
                border: `1px solid ${rolePill.border}`,
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
                lineHeight: 1.4,
              }}>
                {rolePill.label}
              </span>
            )}

            {/* Sign out */}
            <button
              onClick={signOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-secondary)',
                fontSize: 12,
                fontWeight: 500,
                padding: '3px 8px',
                borderRadius: 'var(--radius-sm)',
                transition: 'color 150ms, background 150ms',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none'; }}
            >
              <LogOut size={13} strokeWidth={2} />
              <span className="nav-signout-text">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}

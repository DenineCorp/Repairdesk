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
        background: 'rgba(255,255,255,0.82)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.08)',
        boxShadow: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src="/logo.jpg" alt="Elect Technologies" style={{ height: 28, width: 28, objectFit: 'contain', borderRadius: 4 }} />
        </div>

        {/* Right */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Email */}
            <span className="nav-email" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
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
                    color: 'var(--text-secondary)', fontSize: 12, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    transition: 'color 150ms, background 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.background = 'var(--bg-elevated)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'none' }}
                >
                  <ClipboardList size={13} strokeWidth={2} />
                  <span className="nav-signout-text">Reports</span>
                </button>
                <button
                  onClick={() => navigate('/audit-log')}
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

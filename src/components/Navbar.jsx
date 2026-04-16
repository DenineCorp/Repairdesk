import { LogOut, LayoutDashboard, ScrollText, Users, Receipt } from 'lucide-react'
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
        background: 'rgba(11,25,41,0.82)',
        backdropFilter: 'blur(32px) saturate(200%)',
        WebkitBackdropFilter: 'blur(32px) saturate(200%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 1px 0 rgba(79,156,249,0.08), 0 4px 24px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        {/* Logo + company name */}
        <div
          onClick={() => navigate('/')}
          style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        >
          <div style={{
            width: 32, height: 32,
            background: 'transparent',
            borderRadius: '50%',
            border: '2.5px solid #e3181a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 12px rgba(227,24,26,0.2)',
          }}>
            <svg viewBox="0 0 18 16" fill="none" style={{ width: '56%', height: '56%', flexShrink: 0 }}>
              <line x1="0.9" y1="0.9" x2="17.1" y2="0.9" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="0.9" x2="0.9" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="8"   x2="8.5"  y2="8"   stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="15.1" x2="8.5" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="13.5" y1="0.9" x2="13.5" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{
            fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif',
            fontSize: 18,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            userSelect: 'none',
          }}>
            <span style={{ fontWeight: 700, background: 'linear-gradient(90deg, #4f9cf9 0%, #e3181a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Elect</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}> Technologies</span>
          </span>
        </div>

        {/* Right */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Email */}
            <span className="nav-email" style={{ fontSize: 13, color: 'rgba(242,242,247,0.4)' }}>
              {user.email}
            </span>

            {/* Dashboard nav link — routes per role */}
            {(role === 'founder' || role === 'technician') && (
              <>
                <button
                  onClick={() => navigate(role === 'founder' ? '/founder-dashboard' : '/tech-dashboard')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(242,242,247,0.65)', fontSize: 13, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    transition: 'color 150ms, background 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)'; e.currentTarget.style.background = 'none' }}
                >
                  <LayoutDashboard size={13} strokeWidth={2} />
                  <span className="nav-signout-text">Dashboard</span>
                </button>
                <button
                  onClick={() => navigate('/audit-log')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'rgba(242,242,247,0.65)', fontSize: 13, fontWeight: 500,
                    padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                    transition: 'color 150ms, background 150ms',
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)'; e.currentTarget.style.background = 'none' }}
                >
                  <ScrollText size={13} strokeWidth={2} />
                  <span className="nav-signout-text">Activity Log</span>
                </button>
              </>
            )}

            {/* Founder-only: Tax Report + User Management */}
            {role === 'founder' && (
              <button
                onClick={() => navigate('/tax-report')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'rgba(242,242,247,0.65)', fontSize: 13, fontWeight: 500,
                  padding: '3px 8px', borderRadius: 'var(--radius-sm)',
                  transition: 'color 150ms, background 150ms',
                  fontFamily: 'inherit',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.background = 'rgba(255,255,255,0.09)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'rgba(242,242,247,0.65)'; e.currentTarget.style.background = 'none' }}
              >
                <Receipt size={13} strokeWidth={2} />
                <span className="nav-signout-text">Tax Report</span>
              </button>
            )}
            {role === 'founder' && (
              <button
                onClick={() => navigate('/users')}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: 'none', border: 'none', cursor: 'pointer',
                  color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
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
                fontSize: 13,
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
                fontSize: 13,
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

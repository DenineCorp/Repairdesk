import { Wrench, LogOut } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'

export default function Navbar() {
  const { user, role, signOut } = useAuth()

  const rolePill = role === 'founder'
    ? { bg: 'var(--accent-amber-dim)', color: 'var(--accent-amber)', border: 'rgba(245,158,11,0.2)', label: 'Founder' }
    : { bg: 'var(--accent-blue-dim)', color: 'var(--accent-blue)', border: 'rgba(59,130,246,0.2)', label: 'Technician' }

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
        background: 'rgba(12,12,13,0.85)',
        backdropFilter: 'blur(12px) saturate(180%)',
        WebkitBackdropFilter: 'blur(12px) saturate(180%)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        padding: '0 20px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Wrench size={16} color="var(--accent-cyan)" strokeWidth={2} />
          <span style={{ fontWeight: 600, fontSize: 15, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
            RepairDesk
          </span>
        </div>

        {/* Right */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Email */}
            <span className="nav-email" style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              {user.email}
            </span>

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

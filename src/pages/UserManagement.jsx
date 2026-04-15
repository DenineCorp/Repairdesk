import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Users, RefreshCw } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'

const ROLES = ['viewer', 'technician', 'founder']

const ROLE_CFG = {
  founder:    { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(245,158,11,0.2)',   label: 'Founder' },
  technician: { color: 'var(--accent-blue)',  bg: 'var(--accent-blue-dim)',  border: 'rgba(0,113,227,0.2)',    label: 'Technician' },
  viewer:     { color: 'var(--text-secondary)', bg: 'rgba(142,142,147,0.1)', border: 'rgba(142,142,147,0.2)', label: 'Viewer' },
}

function RolePill({ role }) {
  const cfg = ROLE_CFG[role] ?? ROLE_CFG.viewer
  return (
    <span style={{
      fontSize: 12, fontWeight: 500,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-sm)',
      padding: '3px 8px',
      whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  )
}

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function UserManagement() {
  const [users, setUsers]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [saving, setSaving]     = useState(null)
  const [pendingRoles, setPendingRoles] = useState({})
  const [flash, setFlash]       = useState({})
  const [currentUserId, setCurrentUserId] = useState(null)

  const fetchUsers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      setCurrentUserId(user?.id)

      // Read from profiles table — RLS ensures only founders can see all rows
      const { data, error: fetchErr } = await supabase
        .from('profiles')
        .select('id, email, role, created_at')
        .order('created_at', { ascending: true })

      if (fetchErr) throw new Error(fetchErr.message)

      data.sort((a, b) => {
        const order = { founder: 0, technician: 1, viewer: 2 }
        const diff = (order[a.role] ?? 2) - (order[b.role] ?? 2)
        return diff !== 0 ? diff : a.email.localeCompare(b.email)
      })
      setUsers(data)
    } catch (err) {
      setError('Failed to load users — make sure the profiles table and RLS policies are set up in Supabase.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchUsers() }, [fetchUsers])

  const handleRoleChange = (userId, newRole) => {
    setPendingRoles(prev => ({ ...prev, [userId]: newRole }))
  }

  const saveRole = async (userId) => {
    const newRole = pendingRoles[userId]
    if (!newRole) return
    setSaving(userId)
    try {
      // Calls a SECURITY DEFINER RPC — no service role key needed
      const { error: rpcErr } = await supabase.rpc('update_user_role', {
        target_user_id: userId,
        new_role: newRole,
      })
      if (rpcErr) throw new Error(rpcErr.message)

      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setPendingRoles(prev => { const n = { ...prev }; delete n[userId]; return n })
      setFlash(prev => ({ ...prev, [userId]: 'saved' }))
      setTimeout(() => setFlash(prev => { const n = { ...prev }; delete n[userId]; return n }), 2000)
    } catch (err) {
      setFlash(prev => ({ ...prev, [userId]: 'error' }))
      setTimeout(() => setFlash(prev => { const n = { ...prev }; delete n[userId]; return n }), 3000)
    } finally {
      setSaving(null)
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ paddingTop: 52 + 24, paddingBottom: 40, paddingLeft: 'var(--page-pad-x)', paddingRight: 'var(--page-pad-x)', maxWidth: 900, margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={18} color="var(--accent-blue)" strokeWidth={2} />
            <div>
              <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                User Management
              </h1>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
                Manage roles for all staff accounts
              </p>
            </div>
          </div>
          <button
            onClick={fetchUsers}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500,
              padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
              transition: 'color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
          >
            <RefreshCw size={12} strokeWidth={2} />
            Refresh
          </button>
        </div>

        {/* Role legend */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20,
          padding: '12px 16px',
          background: 'rgba(0,113,227,0.04)',
          border: '1px solid rgba(0,113,227,0.1)',
          borderRadius: 'var(--radius-md)',
          fontSize: 13, color: 'var(--text-secondary)',
        }}>
          <strong style={{ color: 'var(--text-primary)', marginRight: 4 }}>Roles:</strong>
          <span><strong style={{ color: 'var(--accent-amber)' }}>Founder</strong> — full access + user management</span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span><strong style={{ color: 'var(--accent-blue)' }}>Technician</strong> — full access, cannot manage users</span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span><strong style={{ color: 'var(--text-secondary)' }}>Viewer</strong> — read-only, default for new accounts</span>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading users…" />
        ) : error ? (
          <div style={{
            background: 'var(--accent-red-dim)', border: '1px solid rgba(239,68,68,0.2)',
            color: 'var(--accent-red)', borderRadius: 'var(--radius-md)',
            padding: '12px 16px', fontSize: 14,
          }}>
            {error}
          </div>
        ) : (
          <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', padding: 0 }}>
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px',
              gap: 12, padding: '10px 16px',
              borderBottom: '1px solid var(--border-subtle)',
              fontSize: 12, fontWeight: 600,
              color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              <span>Email</span>
              <span>Current Role</span>
              <span>Change To</span>
              <span></span>
            </div>

            {users.length === 0 ? (
              <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '20px 16px' }}>No users found.</p>
            ) : users.map(u => {
              const isSelf = u.id === currentUserId
              const pending = pendingRoles[u.id]
              const isDirty = pending && pending !== u.role
              const flashState = flash[u.id]

              return (
                <div
                  key={u.id}
                  style={{
                    display: 'grid', gridTemplateColumns: '1fr 140px 140px 100px',
                    gap: 12, padding: '12px 16px',
                    alignItems: 'center',
                    borderBottom: '1px solid var(--border-subtle)',
                    background: flashState === 'saved' ? 'rgba(16,185,129,0.04)' : 'transparent',
                    transition: 'background 300ms',
                  }}
                >
                  <div>
                    <span style={{ fontSize: 14, color: 'var(--text-primary)', fontWeight: isSelf ? 600 : 400 }}>
                      {u.email}
                    </span>
                    {isSelf && (
                      <span style={{ fontSize: 12, color: 'var(--text-tertiary)', marginLeft: 6 }}>(you)</span>
                    )}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 1 }}>
                      Joined {formatDate(u.created_at)}
                    </div>
                  </div>

                  <div><RolePill role={u.role} /></div>

                  <div>
                    {isSelf ? (
                      <span style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>—</span>
                    ) : (
                      <select
                        value={pending ?? u.role}
                        onChange={e => handleRoleChange(u.id, e.target.value)}
                        style={{
                          background: 'var(--bg-elevated)',
                          border: `1px solid ${isDirty ? 'var(--accent-blue)' : 'var(--border-default)'}`,
                          borderRadius: 'var(--radius-sm)',
                          color: 'var(--text-primary)',
                          fontSize: 13, padding: '5px 8px',
                          cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                          width: '100%',
                        }}
                      >
                        {ROLES.map(r => (
                          <option key={r} value={r} style={{ background: '#ffffff' }}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    {!isSelf && (
                      <button
                        onClick={() => saveRole(u.id)}
                        disabled={!isDirty || saving === u.id}
                        style={{
                          fontSize: 13, fontWeight: 500,
                          padding: '5px 12px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          cursor: isDirty && saving !== u.id ? 'pointer' : 'not-allowed',
                          fontFamily: 'inherit',
                          transition: 'background 150ms, opacity 150ms',
                          opacity: isDirty ? 1 : 0.4,
                          background: flashState === 'error'
                            ? 'var(--accent-red-dim)'
                            : flashState === 'saved'
                              ? 'rgba(16,185,129,0.12)'
                              : isDirty ? 'var(--accent-blue)' : 'var(--bg-elevated)',
                          color: flashState === 'error'
                            ? 'var(--accent-red)'
                            : flashState === 'saved'
                              ? 'var(--accent-green)'
                              : isDirty ? '#fff' : 'var(--text-tertiary)',
                        }}
                      >
                        {saving === u.id ? '…'
                          : flashState === 'saved' ? 'Saved ✓'
                          : flashState === 'error' ? 'Failed'
                          : 'Save'}
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </motion.main>
    </div>
  )
}

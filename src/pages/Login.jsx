import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wrench } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  letterSpacing: '0.01em',
  marginBottom: 6,
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      setError(signInError.message)
      setLoading(false)
      return
    }

    // Check if user has TOTP enrolled
    const { data: mfaData } = await supabase.auth.mfa.listFactors()
    const totpFactors = mfaData?.totp ?? []

    if (totpFactors.length === 0) {
      // First time — send to enroll
      navigate('/setup-2fa')
    } else {
      // Already enrolled — send to verify
      navigate('/verify-2fa')
    }
  }

  const focusInput = (e) => {
    e.target.style.borderColor = 'rgba(59,130,246,0.5)'
    e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.08)'
  }
  const blurInput = (e) => {
    e.target.style.borderColor = 'var(--border-subtle)'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden',
    }}>
      {/* Subtle gradient */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59,130,246,0.08), transparent)',
        pointerEvents: 'none',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          width: '100%',
          maxWidth: 380,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 32,
        }}>
          {/* Logo */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Wrench size={20} color="var(--accent-cyan)" strokeWidth={2} />
              <span style={{ fontWeight: 700, fontSize: 20, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                RepairDesk
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
              Sign in to your Elect Technologies workspace
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '24px 0' }} />

          {/* Error */}
          {error && (
            <div style={{
              background: 'var(--accent-red-dim)',
              border: '1px solid rgba(239,68,68,0.2)',
              color: 'var(--accent-red)',
              borderRadius: 'var(--radius-md)',
              padding: '8px 12px',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle}>Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@company.com"
                autoComplete="email"
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                style={inputStyle}
                placeholder="••••••••"
                autoComplete="current-password"
                onFocus={focusInput}
                onBlur={blurInput}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                background: loading ? 'rgba(59,130,246,0.6)' : 'var(--accent-blue)',
                color: '#fff',
                border: 'none',
                borderRadius: 'var(--radius-md)',
                padding: '9px 16px',
                fontSize: 14,
                fontWeight: 500,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                transition: 'background 150ms ease',
                marginTop: 4,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563eb' }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = 'var(--accent-blue)' }}
            >
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-tertiary)', marginTop: 16 }}>
          Elect Technologies — authorised staff only
        </p>
      </motion.div>
    </div>
  )
}

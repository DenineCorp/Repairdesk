import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabaseClient'

const LOCKOUT_DURATION_MS = 30_000
const MAX_ATTEMPTS = 5

function sanitizeAuthError(err) {
  const msg = err?.message ?? String(err)
  if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) return 'Invalid email or password.'
  if (msg.includes('Email not confirmed')) return 'Please verify your email address first.'
  if (msg.includes('Too many requests')) return 'Too many attempts. Please wait before trying again.'
  return 'Sign in failed. Please try again.'
}

export default function Login() {
  const [mode, setMode]           = useState('login') // 'login' | 'signup'
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [error, setError]         = useState(null)
  const [loading, setLoading]     = useState(false)
  const [signupDone, setSignupDone] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
  const [attempts, setAttempts]   = useState(0)
  const [lockedUntil, setLockedUntil] = useState(null)
  const [countdown, setCountdown] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    if (!lockedUntil) return
    const interval = setInterval(() => {
      const remaining = Math.ceil((lockedUntil - Date.now()) / 1000)
      if (remaining <= 0) { setLockedUntil(null); setCountdown(0) }
      else setCountdown(remaining)
    }, 500)
    return () => clearInterval(interval)
  }, [lockedUntil])

  const handleSignup = async (e) => {
    e.preventDefault()
    setError(null)
    if (!email.toLowerCase().endsWith('@electtech.ca')) {
      setError('Sign-up is restricted to @electtech.ca email addresses.')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirmPw) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role: 'viewer' } },
    })
    setLoading(false)
    if (signUpError) {
      if (signUpError.message?.includes('already registered')) {
        setError('An account with this email already exists.')
      } else {
        setError('Sign-up failed — please try again.')
      }
      return
    }
    setSignupDone(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    if (lockedUntil && Date.now() < lockedUntil) {
      setError(`Too many failed attempts. Try again in ${countdown}s.`)
      return
    }
    setLoading(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password })
    if (signInError) {
      const next = attempts + 1
      if (next >= MAX_ATTEMPTS) {
        setLockedUntil(Date.now() + LOCKOUT_DURATION_MS)
        setCountdown(LOCKOUT_DURATION_MS / 1000)
        setAttempts(0)
        setError(`Too many failed attempts. Try again in ${LOCKOUT_DURATION_MS / 1000}s.`)
      } else {
        setAttempts(next)
        setError(sanitizeAuthError(signInError))
      }
      setLoading(false)
      return
    }
    setAttempts(0)
    const { data: mfaData } = await supabase.auth.mfa.listFactors()
    const totpFactors = mfaData?.totp ?? []
    navigate(totpFactors.length === 0 ? '/setup-2fa' : '/verify-2fa')
  }

  const inputStyle = (field) => ({
    width: '100%',
    background: '#ffffff',
    border: `1px solid ${focusedField === field ? '#0071e3' : 'rgba(0,0,0,0.12)'}`,
    borderRadius: 'var(--radius-md)',
    padding: '11px 14px',
    color: '#1d1d1f',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms ease, box-shadow 150ms ease',
    boxShadow: focusedField === field ? '0 0 0 4px rgba(0,113,227,0.15)' : 'none',
    caretColor: '#0071e3',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo mark */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.08, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            style={{ marginBottom: 16 }}
          >
            <img src="/logo.jpg" alt="Elect Technologies" style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 16 }} />
          </motion.div>
          <p style={{ fontSize: 14, color: '#6e6e73' }}>
            Elect Technologies — staff portal
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 'var(--radius-2xl)',
          padding: '36px 32px',
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {/* Mode tabs */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 28, background: 'rgba(0,0,0,0.04)', borderRadius: 'var(--radius-md)', padding: 3 }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setSignupDone(false) }}
                style={{
                  flex: 1, border: 'none', fontFamily: 'inherit', fontSize: 13, fontWeight: 500,
                  cursor: 'pointer', padding: '7px 0', borderRadius: 'calc(var(--radius-md) - 1px)',
                  transition: 'background 150ms, color 150ms',
                  background: mode === m ? '#ffffff' : 'transparent',
                  color: mode === m ? '#1d1d1f' : '#6e6e73',
                  boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                }}
              >
                {m === 'login' ? 'Sign in' : 'Create account'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(255,59,48,0.06)',
                border: '1px solid rgba(255,59,48,0.18)',
                color: '#ff3b30',
                borderRadius: 'var(--radius-md)',
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Signup success */}
          {signupDone ? (
            <div style={{
              textAlign: 'center',
              padding: '16px 0',
            }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22,
              }}>✓</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#1d1d1f', marginBottom: 8 }}>Check your email</p>
              <p style={{ fontSize: 13, color: '#6e6e73', lineHeight: 1.5 }}>
                We sent a confirmation link to <strong>{email}</strong>. Verify your email, then sign in to set up 2FA.
              </p>
              <button
                type="button"
                onClick={() => { setMode('login'); setSignupDone(false); setError(null) }}
                style={{
                  marginTop: 20, background: '#0071e3', color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-md)', padding: '10px 24px',
                  fontSize: 14, fontWeight: 400, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Go to sign in
              </button>
            </div>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6e6e73', marginBottom: 7 }}>
                  Work email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle('email')}
                  placeholder="you@electtech.ca"
                  autoComplete="email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
                <p style={{ fontSize: 11, color: '#aeaeb2', marginTop: 5 }}>Must be an @electtech.ca email address</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6e6e73', marginBottom: 7 }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle('password')}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6e6e73', marginBottom: 7 }}>
                  Confirm password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPw}
                  onChange={e => setConfirmPw(e.target.value)}
                  style={inputStyle('confirmPw')}
                  placeholder="••••••••••••"
                  autoComplete="new-password"
                  onFocus={() => setFocusedField('confirmPw')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: loading ? 'rgba(0,113,227,0.45)' : '#0071e3',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', fontSize: 15, fontWeight: 400,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4,
                  transition: 'background 200ms ease, transform 80ms ease',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0077ed' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0071e3' }}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6e6e73', marginBottom: 7 }}>
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  style={inputStyle('email')}
                  placeholder="you@electtech.ca"
                  autoComplete="email"
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#6e6e73', marginBottom: 7 }}>
                  Password
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle('password')}
                  placeholder="••••••••••••"
                  autoComplete="current-password"
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', background: loading ? 'rgba(0,113,227,0.45)' : '#0071e3',
                  color: '#fff', border: 'none', borderRadius: 'var(--radius-md)',
                  padding: '12px 16px', fontSize: 15, fontWeight: 400,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4,
                  transition: 'background 200ms ease, transform 80ms ease',
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#0077ed' }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.background = '#0071e3' }}
                onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
                onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
              >
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          )}
        </div>

        <p style={{
          textAlign: 'center',
          fontSize: 12,
          color: '#aeaeb2',
          marginTop: 20,
        }}>
          {mode === 'signup' ? 'Read-only access by default — a founder can escalate your role.' : 'Authorised access only'}
        </p>
      </motion.div>
    </div>
  )
}

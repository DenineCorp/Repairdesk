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
  const [mode, setMode]           = useState('login')
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
      if (signUpError.message?.includes('already registered') || signUpError.message?.includes('already exists')) {
        setError('An account with this email already exists. Try signing in instead.')
      } else if (signUpError.message?.includes('Email not confirmed')) {
        setError('Account created — check your email inbox to confirm before signing in.')
      } else {
        setError(signUpError.message ?? 'Sign-up failed — please try again.')
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
    navigate('/')
  }

  const inputStyle = (field) => ({
    width: '100%',
    background: focusedField === field ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${focusedField === field ? 'rgba(79,156,249,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '10px',
    padding: '11px 14px',
    color: '#f2f2f7',
    fontSize: 15,
    outline: 'none',
    fontFamily: 'inherit',
    transition: 'border-color 150ms ease, background 150ms ease, box-shadow 150ms ease',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(79,156,249,0.15)' : 'none',
    caretColor: '#4f9cf9',
  })

  return (
    <div style={{
      minHeight: '100vh',
      background: 'transparent',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Logo + company name */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ textAlign: 'center', marginBottom: 36 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 10 }}>
            <div style={{
              width: 48, height: 48,
              background: 'transparent',
              borderRadius: '50%',
              border: '3px solid #e3181a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
              boxShadow: '0 0 20px rgba(227,24,26,0.25)',
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
              fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1,
            }}>
              <span style={{ fontWeight: 700, background: 'linear-gradient(90deg, #4f9cf9 0%, #e3181a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Elect</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}> Technologies</span>
            </span>
          </div>
          <p style={{ fontSize: 14, color: 'rgba(242,242,247,0.4)', letterSpacing: '0.01em' }}>
            Staff portal — internal use only
          </p>
        </motion.div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: '36px 32px',
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Mode tabs */}
          <div style={{
            display: 'flex', gap: 0, marginBottom: 28,
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '10px',
            padding: 3,
            border: '1px solid rgba(255,255,255,0.07)',
          }}>
            {['login', 'signup'].map(m => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setError(null); setSignupDone(false) }}
                style={{
                  flex: 1, border: 'none', fontFamily: 'inherit', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', padding: '8px 0', borderRadius: '8px',
                  transition: 'background 150ms, color 150ms, box-shadow 150ms',
                  background: mode === m ? 'rgba(255,255,255,0.1)' : 'transparent',
                  color: mode === m ? '#f2f2f7' : 'rgba(242,242,247,0.4)',
                  boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.3)' : 'none',
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
                background: 'rgba(255,59,48,0.1)',
                border: '1px solid rgba(255,59,48,0.22)',
                color: '#ff6b6b',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: 14,
                marginBottom: 20,
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Signup success */}
          {signupDone ? (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{
                width: 48, height: 48, borderRadius: '50%',
                background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
                fontSize: 22,
              }}>✓</div>
              <p style={{ fontSize: 15, fontWeight: 500, color: '#f2f2f7', marginBottom: 8 }}>Check your email</p>
              <p style={{ fontSize: 14, color: 'rgba(242,242,247,0.55)', lineHeight: 1.6 }}>
                We sent a confirmation link to <strong style={{ color: '#f2f2f7' }}>{email}</strong>. Verify your email, then sign in.
              </p>
              <button
                type="button"
                onClick={() => { setMode('login'); setSignupDone(false); setError(null) }}
                style={{
                  marginTop: 20, background: '#0071e3', color: '#fff', border: 'none',
                  borderRadius: '10px', padding: '10px 24px',
                  fontSize: 14, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
                onMouseLeave={e => e.currentTarget.style.background = '#0071e3'}
              >
                Go to sign in
              </button>
            </div>
          ) : mode === 'signup' ? (
            <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)', marginBottom: 7 }}>
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
                <p style={{ fontSize: 12, color: 'rgba(242,242,247,0.3)', marginTop: 5 }}>Must be an @electtech.ca email address</p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)', marginBottom: 7 }}>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)', marginBottom: 7 }}>
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
                  width: '100%',
                  background: loading ? 'rgba(0,113,227,0.5)' : '#0071e3',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 16px', fontSize: 15, fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4,
                  transition: 'background 200ms ease, transform 80ms ease',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(0,113,227,0.3)',
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)', marginBottom: 7 }}>
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
                <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)', marginBottom: 7 }}>
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
                  width: '100%',
                  background: loading ? 'rgba(0,113,227,0.5)' : '#0071e3',
                  color: '#fff', border: 'none', borderRadius: '10px',
                  padding: '12px 16px', fontSize: 15, fontWeight: 500,
                  cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginTop: 4,
                  transition: 'background 200ms ease, transform 80ms ease',
                  boxShadow: loading ? 'none' : '0 4px 16px rgba(0,113,227,0.3)',
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
          fontSize: 13,
          color: 'rgba(242,242,247,0.3)',
          marginTop: 20,
        }}>
          {mode === 'signup' ? 'Read-only access by default — a founder can escalate your role.' : 'Authorised access only'}
        </p>
      </motion.div>
    </div>
  )
}

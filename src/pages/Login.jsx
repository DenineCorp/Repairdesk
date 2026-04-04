import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Wrench } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [focusedField, setFocusedField] = useState(null)
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

    const { data: mfaData } = await supabase.auth.mfa.listFactors()
    const totpFactors = mfaData?.totp ?? []
    navigate(totpFactors.length === 0 ? '/setup-2fa' : '/verify-2fa')
  }

  const inputStyle = (field) => ({
    width: '100%',
    background: focusedField === field
      ? 'rgba(255,255,255,0.05)'
      : 'rgba(255,255,255,0.03)',
    border: `1px solid ${focusedField === field ? 'rgba(227,24,55,0.4)' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 10,
    padding: '13px 16px',
    color: '#f0f0f0',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'inherit',
    letterSpacing: '0.01em',
    transition: 'all 200ms ease',
    boxShadow: focusedField === field
      ? '0 0 0 3px rgba(227,24,55,0.08), inset 0 1px 2px rgba(0,0,0,0.2)'
      : 'inset 0 1px 2px rgba(0,0,0,0.15)',
    caretColor: '#E31837',
  })

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1,
      overflow: 'hidden',
    }}>

      {/* Focused ambient glow — blooms outward from card centre */}
      <div style={{
        position: 'absolute',
        width: 700,
        height: 700,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(227,24,55,0.08) 0%, rgba(227,24,55,0.04) 35%, transparent 70%)',
        pointerEvents: 'none',
        transform: 'translateY(-40px)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        {/* Logo mark — above card */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 52,
              height: 52,
              borderRadius: 16,
              background: 'rgba(227,24,55,0.1)',
              border: '1px solid rgba(227,24,55,0.2)',
              marginBottom: 16,
              boxShadow: '0 0 32px rgba(227,24,55,0.12)',
            }}
          >
            <Wrench size={22} color="#E31837" strokeWidth={1.75} />
          </motion.div>
          <h1 style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#f0f0f0',
            letterSpacing: '-0.03em',
            marginBottom: 6,
            lineHeight: 1.2,
          }}>
            RepairDesk
          </h1>
          <p style={{
            fontSize: 13,
            color: 'rgba(139,139,154,0.9)',
            letterSpacing: '0.01em',
            lineHeight: 1.5,
          }}>
            Elect Technologies — staff portal
          </p>
        </div>

        {/* Aurora gradient border wrapper */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(227,24,55,0.45) 0%, rgba(147,51,234,0.25) 45%, rgba(59,130,246,0.2) 80%, rgba(227,24,55,0.3) 100%)',
          borderRadius: 22,
          padding: 1,
          boxShadow: '0 0 100px rgba(227,24,55,0.18), 0 0 200px rgba(147,51,234,0.08)',
        }}>
        {/* Glass card */}
        <div style={{
          background: 'linear-gradient(160deg, rgba(255,255,255,0.075) 0%, rgba(255,255,255,0.02) 100%)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          borderRadius: 21,
          padding: '36px 32px',
          boxShadow: `
            0 2px 0 rgba(255,255,255,0.08) inset,
            0 -1px 0 rgba(0,0,0,0.2) inset,
            0 32px 80px rgba(0,0,0,0.65),
            0 8px 32px rgba(0,0,0,0.4)
          `,
          position: 'relative',
          overflow: 'hidden',
        }}>

          {/* Inner top-edge sheen */}
          <div style={{
            position: 'absolute',
            top: 0, left: '10%', right: '10%',
            height: 1,
            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.18), transparent)',
            pointerEvents: 'none',
          }} />

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.2)',
                color: '#f87171',
                borderRadius: 10,
                padding: '10px 14px',
                fontSize: 13,
                marginBottom: 20,
                letterSpacing: '0.01em',
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(139,139,154,0.8)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle('email')}
                placeholder="you@electtechnologies.com"
                autoComplete="email"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
                color: 'rgba(139,139,154,0.8)',
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}>
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
                background: loading
                  ? 'rgba(227,24,55,0.35)'
                  : '#E31837',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '13px 16px',
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: '0.01em',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                marginTop: 4,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(227,24,55,0.3), 0 1px 0 rgba(255,255,255,0.15) inset',
                transition: 'all 200ms ease',
              }}
              onMouseEnter={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-1px)'
                  e.currentTarget.style.boxShadow = '0 8px 28px rgba(227,24,55,0.45), 0 1px 0 rgba(255,255,255,0.15) inset'
                  e.currentTarget.style.background = '#c0162f'
                }
              }}
              onMouseLeave={e => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 4px 20px rgba(227,24,55,0.3), 0 1px 0 rgba(255,255,255,0.15) inset'
                  e.currentTarget.style.background = '#E31837'
                }
              }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'translateY(0) scale(0.99)' }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)' }}
            >
              {loading ? (
                <span style={{ opacity: 0.7 }}>Signing in…</span>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
        </div>{/* end gradient border wrapper */}

        {/* Footer */}
        <p style={{
          textAlign: 'center',
          fontSize: 11,
          color: 'rgba(74,74,90,0.8)',
          marginTop: 20,
          letterSpacing: '0.03em',
        }}>
          AUTHORISED ACCESS ONLY
        </p>
      </motion.div>
    </div>
  )
}

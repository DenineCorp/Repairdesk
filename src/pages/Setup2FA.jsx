import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 0',
  color: 'var(--text-primary)',
  fontSize: 24,
  outline: 'none',
  fontFamily: 'ui-monospace, "Cascadia Code", monospace',
  letterSpacing: '0.3em',
  textAlign: 'center',
  width: 180,
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

export default function Setup2FA() {
  const navigate = useNavigate()
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [factorId, setFactorId] = useState(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [enrolling, setEnrolling] = useState(true)

  useEffect(() => {
    async function enroll() {
      // Check for existing factors
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const existingTotp = factorsData?.totp ?? []

      // If a verified factor already exists, skip setup
      if (existingTotp.some(f => f.status === 'verified')) {
        navigate('/verify-2fa', { replace: true })
        return
      }

      // Unenroll any stale unverified factors before re-enrolling
      for (const factor of existingTotp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'RepairDesk' })
      if (error) {
        setError('Failed to start 2FA setup — please refresh and try again.')
        setEnrolling(false)
        return
      }
      setFactorId(data.id)
      setQrCode(data.totp.qr_code)
      setSecret(data.totp.secret)
      setEnrolling(false)
    }
    enroll()
  }, [navigate])

  const handleVerify = async (e) => {
    e.preventDefault()
    setError(null)
    setVerifying(true)
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
      if (error) throw error
      navigate('/', { replace: true })
    } catch (err) {
      setError('Invalid code — try again')
      setVerifying(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f5f7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1,
    }}>
      <div style={{ display: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: 400, position: 'relative', zIndex: 1 }}
      >
        <div style={{
          background: '#ffffff',
          border: '1px solid rgba(0,0,0,0.08)',
          borderRadius: 'var(--radius-2xl)',
          padding: 32,
          boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={20} color="var(--accent-cyan)" strokeWidth={2} />
              <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                Set Up Two-Factor Auth
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>
              Scan this QR code with Google Authenticator or Authy
            </p>
          </div>

          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 0 24px' }} />

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

          {enrolling ? (
            <p style={{ textAlign: 'center', color: 'var(--text-tertiary)', fontSize: 13 }}>Loading…</p>
          ) : qrCode ? (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {/* QR code */}
              <div style={{
                background: 'white',
                borderRadius: 'var(--radius-md)',
                padding: 10,
                flexShrink: 0,
                lineHeight: 0,
              }}>
                <img src={qrCode} alt="2FA QR code" width={180} height={180} style={{ display: 'block' }} />
              </div>

              {/* Secret key */}
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>
                  Manual entry key
                </p>
                <p style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 12px',
                  wordBreak: 'break-all',
                  letterSpacing: '0.05em',
                }}>
                  {secret}
                </p>
              </div>

              {/* Code input */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>
                  Enter the 6-digit code to confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(227,24,55,0.5)'; e.target.style.boxShadow = '0 0 0 3px rgba(227,24,55,0.08)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                style={{
                  width: '100%',
                  background: verifying || code.length !== 6 ? 'rgba(227,24,55,0.5)' : 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '9px 16px',
                  fontSize: 14, fontWeight: 500,
                  cursor: verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 150ms ease',
                }}
                onMouseEnter={e => { if (!verifying && code.length === 6) e.currentTarget.style.background = '#c0162f' }}
                onMouseLeave={e => { if (!verifying && code.length === 6) e.currentTarget.style.background = 'var(--accent-blue)' }}
              >
                {verifying ? 'Verifying…' : 'Activate 2FA'}
              </button>
            </form>
          ) : null}
        </div>
      </motion.div>
    </div>
  )
}

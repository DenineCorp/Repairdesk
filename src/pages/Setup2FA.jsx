import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'
import { supabase } from '../services/supabaseClient'

const codeInputStyle = {
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: '10px',
  padding: '12px 0',
  color: '#f2f2f7',
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
      const { data: factorsData } = await supabase.auth.mfa.listFactors()
      const existingTotp = factorsData?.totp ?? []

      if (existingTotp.some(f => f.status === 'verified')) {
        navigate('/verify-2fa', { replace: true })
        return
      }

      for (const factor of existingTotp) {
        await supabase.auth.mfa.unenroll({ factorId: factor.id })
      }

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'ET ServiceDesk' })
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
      background: 'transparent',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      position: 'relative',
      zIndex: 1,
    }}>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 420 }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: 28 }}>
          <div style={{
            width: 40, height: 40,
            background: 'transparent',
            borderRadius: '50%',
            border: '2.5px solid #e3181a',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
            boxShadow: '0 0 16px rgba(227,24,26,0.22)',
          }}>
            <svg viewBox="0 0 18 16" fill="none" style={{ width: '56%', height: '56%', flexShrink: 0 }}>
              <line x1="0.9" y1="0.9" x2="17.1" y2="0.9" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="0.9" x2="0.9" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="8"   x2="8.5"  y2="8"   stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="0.9" y1="15.1" x2="8.5" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
              <line x1="13.5" y1="0.9" x2="13.5" y2="15.1" stroke="#e3181a" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
          </div>
          <span style={{ fontFamily: '-apple-system, "Helvetica Neue", sans-serif', fontSize: 20, letterSpacing: '-0.02em' }}>
            <span style={{ fontWeight: 700, background: 'linear-gradient(90deg, #4f9cf9 0%, #e3181a 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Elect</span>
            <span style={{ fontWeight: 700, color: '#ffffff' }}> Technologies</span>
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '20px',
          padding: 32,
          backdropFilter: 'blur(40px) saturate(180%)',
          WebkitBackdropFilter: 'blur(40px) saturate(180%)',
          boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 32px 80px rgba(0,0,0,0.6), 0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <ShieldCheck size={20} color="#4f9cf9" strokeWidth={2} />
              <span style={{ fontWeight: 700, fontSize: 18, color: '#f2f2f7', letterSpacing: '-0.02em' }}>
                Set Up Two-Factor Auth
              </span>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(242,242,247,0.5)', marginTop: 4 }}>
              Scan this QR code with Google Authenticator or Authy
            </p>
          </div>

          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)', margin: '0 0 24px' }} />

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(255,59,48,0.1)',
              border: '1px solid rgba(255,59,48,0.22)',
              color: '#ff6b6b',
              borderRadius: '10px',
              padding: '8px 12px',
              fontSize: 13,
              marginBottom: 16,
            }}>
              {error}
            </div>
          )}

          {enrolling ? (
            <p style={{ textAlign: 'center', color: 'rgba(242,242,247,0.4)', fontSize: 13 }}>Loading…</p>
          ) : qrCode ? (
            <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              {/* QR code */}
              <div style={{
                background: 'white',
                borderRadius: '12px',
                padding: 10,
                flexShrink: 0,
                lineHeight: 0,
                boxShadow: '0 0 0 1px rgba(255,255,255,0.15)',
              }}>
                <img src={qrCode} alt="2FA QR code" width={180} height={180} style={{ display: 'block' }} />
              </div>

              {/* Secret key */}
              <div style={{ width: '100%' }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(242,242,247,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
                  Manual entry key
                </p>
                <p style={{
                  fontFamily: 'ui-monospace, monospace',
                  fontSize: 12,
                  color: 'rgba(242,242,247,0.6)',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  wordBreak: 'break-all',
                  letterSpacing: '0.05em',
                }}>
                  {secret}
                </p>
              </div>

              {/* Code input */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, width: '100%' }}>
                <label style={{ fontSize: 13, fontWeight: 500, color: 'rgba(242,242,247,0.6)' }}>
                  Enter the 6-digit code to confirm
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  style={codeInputStyle}
                  onFocus={e => { e.target.style.borderColor = 'rgba(79,156,249,0.6)'; e.target.style.boxShadow = '0 0 0 3px rgba(79,156,249,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.12)'; e.target.style.boxShadow = 'none' }}
                  autoComplete="one-time-code"
                />
              </div>

              <button
                type="submit"
                disabled={verifying || code.length !== 6}
                style={{
                  width: '100%',
                  background: verifying || code.length !== 6 ? 'rgba(0,113,227,0.4)' : '#0071e3',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '11px 16px',
                  fontSize: 14, fontWeight: 500,
                  cursor: verifying || code.length !== 6 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 150ms ease',
                  boxShadow: verifying || code.length !== 6 ? 'none' : '0 4px 16px rgba(0,113,227,0.3)',
                }}
                onMouseEnter={e => { if (!verifying && code.length === 6) e.currentTarget.style.background = '#0077ed' }}
                onMouseLeave={e => { if (!verifying && code.length === 6) e.currentTarget.style.background = '#0071e3' }}
              >
                {verifying ? 'Verifying…' : 'Activate 2FA'}
              </button>
            </form>
          ) : null}
        </div>

        <p style={{ textAlign: 'center', fontSize: 13, color: 'rgba(242,242,247,0.3)', marginTop: 20 }}>
          Authorised staff only
        </p>
      </motion.div>
    </div>
  )
}

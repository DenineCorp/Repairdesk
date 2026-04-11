import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../services/supabaseClient'

const STATUS_CFG = {
  pending:     { label: 'Pending',     color: '#ff9f0a', bg: 'rgba(255,159,10,0.12)',  desc: 'Your device has been logged and is in the queue.' },
  'in progress': { label: 'In Progress', color: '#4f9cf9', bg: 'rgba(79,156,249,0.12)', desc: 'A technician is actively working on your device.' },
  ready:       { label: 'Ready',       color: '#34c759', bg: 'rgba(52,199,89,0.12)',   desc: 'Your device is repaired and ready for pickup!' },
  collected:   { label: 'Collected',   color: '#6e6e73', bg: 'rgba(110,110,115,0.12)', desc: 'This device has been collected. Thank you!' },
}

function formatDate(d) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TicketStatus() {
  const { issueId } = useParams()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('tickets')
        .select('issue_id, device, issue, status, date_in, date_expected, warranty_days')
        .eq('issue_id', issueId)
        .maybeSingle()

      if (error || !data) { setNotFound(true) }
      else { setTicket(data) }
      setLoading(false)
    }
    load()
  }, [issueId])

  const cfg = STATUS_CFG[ticket?.status] ?? STATUS_CFG.pending

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
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: '100%', maxWidth: 380 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 8 }}>
            <img src="/logo.jpg" alt="ET" style={{ width: 40, height: 40, objectFit: 'contain', borderRadius: 10 }} />
            <span style={{ fontFamily: '-apple-system, "Helvetica Neue", sans-serif', fontSize: 19, letterSpacing: '-0.02em' }}>
              <span style={{ fontWeight: 700, color: '#4f9cf9' }}>Elect</span>
              <span style={{ fontWeight: 700, color: '#ffffff' }}> Technologies</span>
            </span>
          </div>
          <p style={{ fontSize: 12, color: 'rgba(242,242,247,0.45)' }}>Repair Status</p>
        </div>

        {/* Card */}
        <div style={{
          background: '#ffffff',
          borderRadius: 20,
          padding: '28px 24px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
        }}>
          {loading ? (
            <p style={{ textAlign: 'center', color: '#6e6e73', fontSize: 14 }}>Loading…</p>
          ) : notFound ? (
            <div style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 600, color: '#1d1d1f', marginBottom: 8 }}>Ticket not found</p>
              <p style={{ fontSize: 13, color: '#6e6e73' }}>The reference ID on this label could not be found.</p>
            </div>
          ) : (
            <>
              {/* Issue ID */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <p style={{ fontSize: 11, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                  Reference
                </p>
                <p style={{ fontSize: 28, fontWeight: 900, color: '#1d1d1f', letterSpacing: 1 }}>
                  {ticket.issue_id}
                </p>
              </div>

              {/* Status badge */}
              <div style={{
                background: cfg.bg,
                borderRadius: 12,
                padding: '14px 16px',
                marginBottom: 20,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 18, fontWeight: 700, color: cfg.color, marginBottom: 4 }}>
                  {cfg.label}
                </p>
                <p style={{ fontSize: 13, color: '#6e6e73' }}>{cfg.desc}</p>
              </div>

              {/* Details — device, issue description, dates. No customer personal data. */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 20px' }}>
                {[
                  ['Device',     ticket.device],
                  ['Brought in', formatDate(ticket.date_in)],
                  ['Expected',   formatDate(ticket.date_expected)],
                  ...(ticket.warranty_days != null
                    ? [['Warranty', `${ticket.warranty_days} day${ticket.warranty_days !== 1 ? 's' : ''}`]]
                    : []),
                ].map(([label, value]) => (
                  <div key={label}>
                    <p style={{ fontSize: 11, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      {label}
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f' }}>{value}</p>
                  </div>
                ))}

                {/* Issue description — full width */}
                {ticket.issue && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 11, color: '#aeaeb2', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>
                      Issue
                    </p>
                    <p style={{ fontSize: 14, fontWeight: 500, color: '#1d1d1f', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{ticket.issue}</p>
                  </div>
                )}
              </div>

              <p style={{ fontSize: 11, color: '#aeaeb2', textAlign: 'center', marginTop: 20 }}>
                Questions? Visit us or call during business hours.
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}

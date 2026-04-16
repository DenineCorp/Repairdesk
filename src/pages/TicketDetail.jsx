import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Printer, Bell } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../services/supabaseClient'
import { sendSMS } from '../services/twilioService'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'
import LoadingSpinner from '../components/LoadingSpinner'

function isOverdue(dateExpected, status) {
  if (status === 'collected') return false
  return new Date(dateExpected) < new Date(new Date().toDateString())
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

const fieldLabelStyle = {
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-tertiary)',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginBottom: 4,
}

const fieldValueStyle = {
  fontSize: 14,
  color: 'var(--text-primary)',
  lineHeight: 1.5,
}

function FieldBlock({ label, value, mono }) {
  return (
    <div>
      <p style={fieldLabelStyle}>{label}</p>
      <p style={{
        ...fieldValueStyle,
        fontFamily: mono ? 'ui-monospace, "Cascadia Code", monospace' : 'inherit',
      }}>
        {value}
      </p>
    </div>
  )
}

export default function TicketDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notifying, setNotifying] = useState(false)
  const [notifStatus, setNotifStatus] = useState(null) // 'sent' | 'error'

  useEffect(() => {
    async function fetchTicket() {
      const { data, error } = await supabase
        .from('tickets')
        .select('id, issue_id, customer_name, customer_phone, device, issue, date_in, date_expected, status, warranty_days, created_by, payments(payment_status, amount_paid)')
        .eq('id', id)
        .single()
      if (error) setError('Failed to load ticket.')
      else setTicket(data)
      setLoading(false)
    }
    fetchTicket()
  }, [id])

  const handleSendNotification = async () => {
    setNotifying(true)
    setNotifStatus(null)
    try {
      const message = `Hi ${ticket.customer_name}, your repair (${ticket.issue_id}) is now ${ticket.status}. Thank you — Elect Technologies.`
      await sendSMS({ to: ticket.customer_phone, message })
      setNotifStatus('sent')
    } catch (err) {
      setNotifStatus(err?.message ?? 'SMS failed')
    } finally {
      setNotifying(false)
    }
  }

  if (loading) return <><Navbar /><LoadingSpinner message="Loading ticket…" /></>

  if (error || !ticket) return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error ?? 'Ticket not found.'}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
          Go back
        </button>
      </div>
    </div>
  )

  const overdue = isOverdue(ticket.date_expected, ticket.status)

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />

      {/* Screen view */}
      <motion.main
        className="no-print"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ paddingTop: 52 + 24, paddingBottom: 40, paddingLeft: 24, paddingRight: 24, maxWidth: 700, margin: '0 auto' }}
      >
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            background: 'none', border: 'none', cursor: 'pointer',
            color: 'var(--text-secondary)', fontSize: 14,
            fontFamily: 'inherit', padding: '0 0 16px 0',
            transition: 'color 150ms',
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
        >
          <ChevronLeft size={16} strokeWidth={2} />
          Back
        </button>

        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 style={{
              fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
              fontSize: 24,
              fontWeight: 700,
              color: overdue ? 'var(--accent-red)' : 'var(--accent-cyan)',
              letterSpacing: '0.02em',
            }}>
              {ticket.issue_id}
            </h1>
            <StatusBadge status={ticket.status} />
            {overdue && (
              <span style={{
                fontSize: 13, fontWeight: 500,
                color: 'var(--accent-red)',
                background: 'var(--accent-red-dim)',
                border: '1px solid rgba(239,68,68,0.2)',
                borderRadius: 'var(--radius-sm)',
                padding: '3px 8px',
              }}>
                Overdue
              </span>
            )}
          </div>

          {/* Print button */}
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none',
              border: '1px solid var(--border-default)',
              borderRadius: 'var(--radius-md)',
              color: 'var(--text-secondary)',
              fontSize: 14, fontWeight: 500,
              padding: '7px 12px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'color 150ms, border-color 150ms',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
          >
            <Printer size={14} strokeWidth={2} />
            Print Label
          </button>
        </div>

        {/* Info grid */}
        <div className="glass-card" style={{
          borderRadius: 'var(--radius-lg)',
          padding: 24,
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px 32px',
          marginBottom: 16,
        }}>
          <FieldBlock label="Customer name" value={ticket.customer_name} />
          <FieldBlock label="Device" value={ticket.device} />
          <FieldBlock label="Phone" value={ticket.customer_phone} mono />
          <FieldBlock label="Date in" value={formatDate(ticket.date_in)} />
          <FieldBlock label="Expected" value={formatDate(ticket.date_expected)} />
          {ticket.warranty_days != null && (
            <FieldBlock label="Warranty" value={`${ticket.warranty_days} day${ticket.warranty_days !== 1 ? 's' : ''}`} />
          )}
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={fieldLabelStyle}>Issue description</p>
            <p style={{ ...fieldValueStyle, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {ticket.issue}
            </p>
          </div>
        </div>

        {/* Notification section */}
        <div className="glass-card" style={{
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              Customer Notification
            </p>
            <p style={{ fontSize: 13, color: 'var(--text-tertiary)' }}>
              {notifStatus === 'sent'
                ? `SMS sent to ${ticket.customer_phone}`
                : notifStatus && notifStatus !== 'sent'
                  ? notifStatus
                  : 'Send a status update SMS to the customer'}
            </p>
          </div>
          <button
            onClick={handleSendNotification}
            disabled={notifying || notifStatus === 'sent'}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: notifStatus === 'sent' ? 'rgba(16,185,129,0.08)' : 'var(--accent-green-dim)',
              color: notifStatus === 'error' ? 'var(--accent-red)' : 'var(--accent-green)',
              border: notifStatus === 'error' ? '1px solid rgba(239,68,68,0.2)' : '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontSize: 14, fontWeight: 500,
              cursor: notifying || notifStatus === 'sent' ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background 150ms',
              flexShrink: 0,
              opacity: notifStatus === 'sent' ? 0.6 : 1,
            }}
            onMouseEnter={e => { if (!notifying && notifStatus !== 'sent') e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
            onMouseLeave={e => { if (!notifying && notifStatus !== 'sent') e.currentTarget.style.background = 'var(--accent-green-dim)' }}
          >
            <Bell size={13} strokeWidth={2} />
            {notifying ? 'Sending…' : notifStatus === 'sent' ? 'Sent' : 'Send Notification'}
          </button>
        </div>
      </motion.main>

      {/* Print-only label */}
      <div className="print-only">
        <div style={{
          fontFamily: 'monospace',
          border: '2px solid black',
          padding: 24,
          maxWidth: 400,
          margin: '0 auto',
          color: 'black',
          background: 'white',
        }}>
          {/* Label header — logo + company name + issue ID */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <img src="/logo.jpg" alt="ET" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 6 }} />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'black', letterSpacing: 0.3, lineHeight: 1.2 }}>
                  Elect Technologies
                </div>
                <div style={{ fontSize: 9, color: '#555', letterSpacing: 0.2 }}>Service Receipt</div>
              </div>
            </div>
            <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 2, color: 'black', whiteSpace: 'nowrap' }}>{ticket.issue_id}</div>
          </div>
          <hr style={{ borderColor: 'black', margin: '12px 0' }} />
          <table style={{ width: '100%', fontSize: 14, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Customer', ticket.customer_name],
                ['Phone',    ticket.customer_phone],
                ['Device',   ticket.device],
                ['Issue',    ticket.issue.length > 60 ? ticket.issue.slice(0, 60) + '…' : ticket.issue],
                ['Date In',  formatDate(ticket.date_in)],
                ['Expected', formatDate(ticket.date_expected)],
                ['Status',   ticket.status.toUpperCase()],
                ['Payment',  (ticket.payments?.[0]?.payment_status ?? 'unpaid').toUpperCase()],
                ...(ticket.warranty_days != null ? [['Warranty', `${ticket.warranty_days} day${ticket.warranty_days !== 1 ? 's' : ''}`]] : []),
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 'bold', paddingRight: 12, paddingBottom: 6, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}:</td>
                  <td style={{ paddingBottom: 6 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* QR code — customer copy */}
          <hr style={{ borderColor: 'black', margin: '14px 0 12px' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 12 }}>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'black', margin: '0 0 3px' }}>
                Customer Copy
              </p>
              <p style={{ fontSize: 9, color: '#555', margin: 0, lineHeight: 1.4 }}>
                Scan QR to view ticket details
              </p>
            </div>
            <div style={{ padding: 4, background: 'white', border: '1px solid #ccc', borderRadius: 4, lineHeight: 0 }}>
              <QRCodeSVG
                value={`${window.location.origin}/status/${ticket.issue_id}`}
                size={130}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
                includeMargin={true}
              />
            </div>
          </div>
          <hr style={{ borderStyle: 'dashed', borderColor: 'black', margin: '14px 0 4px' }} />
          <p style={{ fontSize: 9, textAlign: 'center', color: 'black', margin: 0 }}>✂ cut here</p>
        </div>
      </div>
    </div>
  )
}

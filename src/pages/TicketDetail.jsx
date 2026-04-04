import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft, Printer, Bell } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
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
  fontSize: 11,
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

  useEffect(() => {
    async function fetchTicket() {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single()
      if (error) setError(error.message)
      else setTicket(data)
      setLoading(false)
    }
    fetchTicket()
  }, [id])

  if (loading) return <><Navbar /><LoadingSpinner message="Loading ticket…" /></>

  if (error || !ticket) return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ maxWidth: 700, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
        <p style={{ color: 'var(--accent-red)', fontSize: 14 }}>{error ?? 'Ticket not found.'}</p>
        <button onClick={() => navigate(-1)} style={{ marginTop: 16, background: 'none', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', padding: '8px 16px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13 }}>
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
            color: 'var(--text-secondary)', fontSize: 13,
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
                fontSize: 12, fontWeight: 500,
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
              fontSize: 13, fontWeight: 500,
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
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
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
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <FieldBlock label="Date in" value={formatDate(ticket.date_in)} />
            <FieldBlock
              label="Expected"
              value={formatDate(ticket.date_expected)}
            />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <p style={fieldLabelStyle}>Issue description</p>
            <p style={{ ...fieldValueStyle, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
              {ticket.issue}
            </p>
          </div>
        </div>

        {/* Notification section */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 2 }}>
              Customer Notification
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
              Send an update to the customer about this ticket
            </p>
          </div>
          <button
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'var(--accent-green-dim)',
              color: 'var(--accent-green)',
              border: '1px solid rgba(16,185,129,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '7px 14px',
              fontSize: 13, fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 150ms',
              flexShrink: 0,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(16,185,129,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-green-dim)'}
          >
            <Bell size={13} strokeWidth={2} />
            Send Notification
          </button>
        </div>
      </motion.main>

      {/* Print-only label — clean black-and-white, logic unchanged */}
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
          <div style={{ textAlign: 'center', marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 4, textTransform: 'uppercase' }}>RepairDesk</div>
            <div style={{ fontSize: 30, fontWeight: 900, letterSpacing: 2, marginTop: 4 }}>{ticket.issue_id}</div>
          </div>
          <hr style={{ borderColor: 'black', margin: '12px 0' }} />
          <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Customer', ticket.customer_name],
                ['Phone',    ticket.customer_phone],
                ['Device',   ticket.device],
                ['Issue',    ticket.issue.length > 80 ? ticket.issue.slice(0, 80) + '…' : ticket.issue],
                ['Date In',  formatDate(ticket.date_in)],
                ['Expected', formatDate(ticket.date_expected)],
                ['Status',   ticket.status.toUpperCase()],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ fontWeight: 'bold', paddingRight: 12, paddingBottom: 6, whiteSpace: 'nowrap', verticalAlign: 'top' }}>{label}:</td>
                  <td style={{ paddingBottom: 6 }}>{value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

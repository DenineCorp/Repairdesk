import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, RefreshCw, CreditCard, Bell, Clock, ChevronLeft } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import Navbar from '../components/Navbar'
import LoadingSpinner from '../components/LoadingSpinner'

const ACTION_CONFIG = {
  'ticket.created':        { Icon: Plus,       color: 'var(--accent-green)', label: 'Ticket created' },
  'ticket.status_changed': { Icon: RefreshCw,  color: 'var(--accent-cyan)',  label: 'Status changed' },
  'payment.updated':       { Icon: CreditCard, color: 'var(--accent-amber)', label: 'Payment updated' },
  'notification.sent':     { Icon: Bell,       color: 'var(--accent-blue)',  label: 'Notification sent' },
}

function formatTs(ts) {
  return new Date(ts).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function buildDescription(log) {
  const d = log.details ?? {}
  switch (log.action) {
    case 'ticket.created':
      return `${d.customer_name ?? ''}${d.device ? ` — ${d.device}` : ''}`
    case 'ticket.status_changed':
      return `${d.old_status ?? '?'} → ${d.new_status ?? '?'}`
    case 'payment.updated':
      return `${(d.payment_status ?? 'unpaid').charAt(0).toUpperCase() + (d.payment_status ?? '').slice(1)} · CAD ${d.amount_paid ?? '0.00'}`
    case 'notification.sent':
      return `SMS ${d.status ?? ''} to ${d.customer_phone ?? ''}`
    default:
      return Object.entries(d).filter(([k]) => k !== 'performed_by_email').map(([k, v]) => `${k}: ${v}`).join(', ')
  }
}

function EventRow({ log, isLast }) {
  const cfg = ACTION_CONFIG[log.action] ?? { Icon: Clock, color: 'var(--text-tertiary)', label: log.action }
  const { Icon } = cfg

  return (
    <div style={{
      display: 'flex', gap: 14,
      padding: '14px 24px',
      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
    }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: `color-mix(in srgb, ${cfg.color} 12%, transparent)`,
        border: `1px solid color-mix(in srgb, ${cfg.color} 25%, transparent)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginTop: 2,
      }}>
        <Icon size={14} color={cfg.color} strokeWidth={2} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)' }}>
            {cfg.label}
          </span>
          {log.details?.issue_id && (
            <span style={{
              fontFamily: 'ui-monospace, "Cascadia Code", monospace',
              fontSize: 12, fontWeight: 600,
              color: 'var(--accent-cyan)',
              background: 'var(--accent-cyan-dim)',
              border: '1px solid rgba(255,77,109,0.15)',
              borderRadius: 'var(--radius-sm)',
              padding: '1px 7px',
            }}>
              {log.details.issue_id}
            </span>
          )}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 4, lineHeight: 1.5 }}>
          {buildDescription(log)}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>
          {log.details?.performed_by_email ?? 'System'} · {formatTs(log.created_at)}
        </p>
      </div>
    </div>
  )
}

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  color: 'var(--text-primary)',
  fontSize: 13,
  padding: '7px 12px',
  cursor: 'pointer',
  fontFamily: 'inherit',
  outline: 'none',
}

export default function AuditLog() {
  const navigate = useNavigate()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(500)
      .then(({ data, error }) => {
        if (!error && data) setLogs(data)
        setLoading(false)
      })
  }, [])

  const filtered = filter === 'all' ? logs : logs.filter(l => l.action === filter)

  if (loading) return <><Navbar /><LoadingSpinner message="Loading activity log…" /></>

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          paddingTop: 52 + 24,
          paddingBottom: 40,
          paddingLeft: 'var(--page-pad-x)',
          paddingRight: 'var(--page-pad-x)',
          maxWidth: 800,
          margin: '0 auto',
        }}
      >
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Activity Log
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
              {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            </p>
          </div>

          <select
            value={filter}
            onChange={e => setFilter(e.target.value)}
            style={inputStyle}
          >
            <option value="all">All events</option>
            <option value="ticket.created">Tickets created</option>
            <option value="ticket.status_changed">Status changes</option>
            <option value="payment.updated">Payments</option>
            <option value="notification.sent">Notifications</option>
          </select>
        </div>

        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', padding: 0, overflow: 'hidden' }}>
          {filtered.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '40px 0', fontSize: 14, color: 'var(--text-tertiary)' }}>
              No events found.
            </p>
          ) : (
            filtered.map((log, i) => (
              <EventRow key={log.id} log={log} isLast={i === filtered.length - 1} />
            ))
          )}
        </div>
      </motion.main>
    </div>
  )
}

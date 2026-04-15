import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle, XCircle, Bell } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { sendSMS } from '../services/twilioService'
import { logAudit } from '../utils/auditLogger'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'

const STATUSES = ['pending', 'in progress', 'ready', 'collected']
const PAYMENT_STATUSES = ['unpaid', 'partial', 'paid']

function isOverdue(dateExpected, status) {
  if (status === 'collected') return false
  return new Date(dateExpected) < new Date(new Date().toDateString())
}

function isDueToday(dateExpected, status) {
  if (status === 'collected') return false
  return dateExpected === new Date().toISOString().split('T')[0]
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

// ── Toast ─────────────────────────────────────────────────────────────────────
function Toast({ toasts }) {
  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none',
    }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.18 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              background: 'var(--bg-elevated)',
              border: `1px solid ${t.type === 'success' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.25)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: 14,
              color: t.type === 'success' ? 'var(--accent-green)' : 'var(--accent-red)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
              pointerEvents: 'auto',
              minWidth: 240,
            }}
          >
            {t.type === 'success'
              ? <CheckCircle size={14} strokeWidth={2} />
              : <XCircle size={14} strokeWidth={2} />
            }
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}

// ── Payment status badge (read-only) ─────────────────────────────────────────
function PaymentBadge({ status }) {
  const cfg = {
    paid:    { color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', border: 'rgba(16,185,129,0.2)', label: 'Paid' },
    partial: { color: 'var(--accent-cyan)',  bg: 'var(--accent-cyan-dim)',  border: 'rgba(255,77,109,0.2)',  label: 'Partial' },
    unpaid:  { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(245,158,11,0.2)', label: 'Unpaid' },
  }[status?.toLowerCase()] ?? { color: 'var(--text-tertiary)', bg: 'transparent', border: 'var(--border-subtle)', label: status ?? 'Unpaid' }

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 12, fontWeight: 500,
      color: cfg.color, background: cfg.bg,
      border: `1px solid ${cfg.border}`,
      borderRadius: 'var(--radius-sm)',
      padding: '3px 7px',
      whiteSpace: 'nowrap',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

// ── Inline payment controls ───────────────────────────────────────────────────
function PaymentControls({ payment, ticket, onSaved, onError }) {
  const [amount, setAmount] = useState(payment?.amount_paid ? String(payment.amount_paid) : '')
  const [payStatus, setPayStatus] = useState(payment?.payment_status ?? 'unpaid')
  const [saving, setSaving] = useState(false)
  const [flashSaved, setFlashSaved] = useState(false)

  const handleSave = async (e) => {
    e.stopPropagation()
    setSaving(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const subtotalVal  = parseFloat(amount) || 0
      const gstAmt       = +(subtotalVal * 0.05).toFixed(2)
      const pstAmt       = +(subtotalVal * 0.07).toFixed(2)
      const taxTotalVal  = +(gstAmt + pstAmt).toFixed(2)
      const totalCharged = +(subtotalVal + taxTotalVal).toFixed(2)
      const isPaid = payStatus === 'paid'

      const { error } = await supabase
        .from('payments')
        .update({
          payment_status: payStatus,
          amount_paid:    subtotalVal,   // pre-tax service charge
          subtotal:       subtotalVal,
          gst_amount:     gstAmt,
          pst_amount:     pstAmt,
          tax_total:      taxTotalVal,
          total_charged:  totalCharged,
          paid_at:        isPaid ? new Date().toISOString() : null,
          updated_by:     user.id,
        })
        .eq('id', payment.id)

      if (error) throw error
      setFlashSaved(true)
      setTimeout(() => setFlashSaved(false), 1200)
      logAudit({
        action: 'payment.updated',
        entity: 'payment',
        entityId: payment.id,
        details: {
          issue_id: ticket?.issue_id,
          customer_name: ticket?.customer_name,
          payment_status: payStatus,
          amount_paid: amountVal.toFixed(2),
        },
      })
      onSaved()
    } catch (err) {
      onError(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      onClick={e => e.stopPropagation()}
      style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}
    >
      {/* Current payment badge */}
      <PaymentBadge status={payment?.payment_status ?? 'unpaid'} />

      {/* Amount input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }} onClick={e => e.stopPropagation()}>
        <span style={{
          fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRight: 'none',
          borderRadius: 'var(--radius-sm) 0 0 var(--radius-sm)',
          padding: '4px 6px',
          lineHeight: 1,
          userSelect: 'none',
          whiteSpace: 'nowrap',
        }}>CAD</span>
        <input
        type="number"
        min="0"
        step="0.01"
        placeholder="0.00"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          width: 64,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
          padding: '4px 7px',
          color: 'var(--text-primary)',
          fontSize: 13,
          outline: 'none',
          fontFamily: 'inherit',
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(227,24,55,0.5)'}
        onBlur={e => e.target.style.borderColor = 'var(--border-default)'}
      />
      </div>

      {/* Payment status selector */}
      <select
        value={payStatus}
        onChange={e => setPayStatus(e.target.value)}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-primary)',
          fontSize: 13,
          padding: '4px 8px',
          cursor: 'pointer',
          fontFamily: 'inherit',
          outline: 'none',
        }}
      >
        {PAYMENT_STATUSES.map(s => (
          <option key={s} value={s} style={{ background: '#ffffff' }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </option>
        ))}
      </select>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          background: flashSaved ? 'rgba(16,185,129,0.2)' : 'var(--accent-green-dim)',
          color: 'var(--accent-green)',
          border: '1px solid rgba(16,185,129,0.2)',
          borderRadius: 'var(--radius-sm)',
          padding: '4px 10px',
          fontSize: 13, fontWeight: 500,
          cursor: saving ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: saving ? 0.6 : 1,
          transition: 'background 200ms',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={e => { if (!saving && !flashSaved) e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
        onMouseLeave={e => { if (!flashSaved) e.currentTarget.style.background = 'var(--accent-green-dim)' }}
      >
        {saving ? '…' : flashSaved ? 'Saved ✓' : 'Save'}
      </button>

      {/* Live tax breakdown — shown only when an amount is entered */}
      {parseFloat(amount) > 0 && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            fontSize: 12, color: 'var(--text-tertiary)',
            flexBasis: '100%',
            paddingLeft: 2,
            flexWrap: 'wrap',
          }}
        >
          <span>GST 5%: <strong style={{ color: 'var(--accent-blue)' }}>${(parseFloat(amount) * 0.05).toFixed(2)}</strong></span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span>PST 7%: <strong style={{ color: 'var(--accent-cyan)' }}>${(parseFloat(amount) * 0.07).toFixed(2)}</strong></span>
          <span style={{ color: 'var(--border-default)' }}>·</span>
          <span>Customer pays: <strong style={{ color: 'var(--text-primary)' }}>CAD {(parseFloat(amount) * 1.12).toFixed(2)}</strong></span>
        </div>
      )}
    </div>
  )
}

// ── Notify Button ─────────────────────────────────────────────────────────────
function NotifyButton({ ticket, addToast }) {
  const [state, setState] = useState('idle') // idle | loading | sent
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase
      .from('notifications')
      .select('id')
      .eq('ticket_id', ticket.id)
      .eq('status', 'sent')
      .maybeSingle()
      .then(({ data }) => {
        if (data) setState('sent')
        setChecked(true)
      })
  }, [ticket.id])

  if (!checked) return null

  if (state === 'sent') {
    return (
      <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-tertiary)', flexShrink: 0 }}>
        Notified ✓
      </span>
    )
  }

  const handleNotify = async (e) => {
    e.stopPropagation()
    setState('loading')
    const { data: { user } } = await supabase.auth.getUser()
    const message = `Hi ${ticket.customer_name}, your device ${ticket.device} (Ref: ${ticket.issue_id}) is ready for collection. Please visit Elect Technologies during business hours.`
    let smsFailed = false
    try {
      await sendSMS({ to: ticket.customer_phone, message })
    } catch (err) {
      console.error('[NotifyButton] SMS error:', err)
      smsFailed = true
    }
    const { error: dbError } = await supabase.from('notifications').insert({
      ticket_id: ticket.id,
      channel: 'sms',
      sent_by: user.id,
      message,
      status: smsFailed ? 'failed' : 'sent',
      sent_at: new Date().toISOString(),
    })
    if (dbError) console.error('[NotifyButton] DB insert error:', dbError)
    logAudit({
      action: 'notification.sent',
      entity: 'notification',
      entityId: ticket.id,
      details: {
        issue_id: ticket.issue_id,
        customer_name: ticket.customer_name,
        customer_phone: ticket.customer_phone,
        channel: 'sms',
        status: smsFailed ? 'failed' : 'sent',
      },
    })
    if (smsFailed) {
      addToast('SMS failed — check phone number', 'error')
      setState('idle')
    } else {
      setState('sent')
    }
  }

  return (
    <button
      onClick={handleNotify}
      disabled={state === 'loading'}
      style={{
        background: 'var(--accent-green-dim)',
        color: 'var(--accent-green)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 10px',
        fontSize: 13, fontWeight: 500,
        cursor: state === 'loading' ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        display: 'flex', alignItems: 'center', gap: 5,
        flexShrink: 0,
        opacity: state === 'loading' ? 0.6 : 1,
        transition: 'background 150ms',
      }}
      onMouseEnter={e => { if (state === 'idle') e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-green-dim)' }}
    >
      <Bell size={11} strokeWidth={2} />
      {state === 'loading' ? '…' : 'Notify Customer'}
    </button>
  )
}

// ── Offline Banner ────────────────────────────────────────────────────────────
function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine)
  useEffect(() => {
    const on  = () => setOffline(false)
    const off = () => setOffline(true)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  if (!offline) return null
  return (
    <div style={{
      position: 'fixed', top: 52, left: 0, right: 0, zIndex: 98,
      background: 'var(--accent-amber-dim)',
      borderBottom: '1px solid rgba(245,158,11,0.2)',
      padding: '7px 24px',
      fontSize: 13, fontWeight: 500,
      color: 'var(--accent-amber)',
      textAlign: 'center',
    }}>
      Connection lost — retrying…
    </div>
  )
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonRows({ count = 3 }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '4px 0' }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px' }}>
          <div className="skeleton" style={{ width: 90, height: 13 }} />
          <div className="skeleton" style={{ flex: 1, height: 13, minWidth: 80 }} />
          <div className="skeleton" style={{ width: 130, height: 13 }} />
          <div className="skeleton" style={{ width: 55, height: 13 }} />
          <div className="skeleton" style={{ width: 68, height: 20, borderRadius: 6 }} />
        </div>
      ))}
    </div>
  )
}

// ── Section Heading ───────────────────────────────────────────────────────────
const SectionHeading = ({ children, showDot, dotColor }) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 8,
    fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)',
    letterSpacing: '0.05em', textTransform: 'uppercase',
    marginBottom: 12, paddingBottom: 8,
    borderBottom: '1px solid var(--border-subtle)',
  }}>
    {showDot && dotColor && (
      <span className="pulse-dot" style={{
        display: 'inline-block', width: 8, height: 8,
        borderRadius: '50%', background: dotColor, flexShrink: 0,
      }} />
    )}
    {children}
  </div>
)

// ── Ticket Row ────────────────────────────────────────────────────────────────
const TicketRow = ({ ticket, onStatusChange, updating, onClick, accentLeft, flashSuccess, onPaymentSaved, onPaymentError, addToast, readOnly }) => {
  const overdue = isOverdue(ticket.date_expected, ticket.status)
  const [hovered, setHovered] = useState(false)
  const payment = ticket.payments?.[0]

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        background: flashSuccess
          ? 'rgba(16,185,129,0.06)'
          : hovered ? 'var(--bg-hover)' : 'transparent',
        transition: 'background 200ms ease',
        cursor: 'pointer',
        borderLeft: accentLeft ? `2px solid ${accentLeft}` : '2px solid transparent',
        paddingLeft: accentLeft ? 10 : 12,
        flexWrap: 'wrap',
        rowGap: 6,
      }}
    >
      {/* Issue ID */}
      <span style={{
        fontFamily: 'ui-monospace, "Cascadia Code", "Fira Code", monospace',
        fontSize: 14, fontWeight: 600,
        color: overdue ? 'var(--accent-red)' : 'var(--accent-cyan)',
        minWidth: 95, flexShrink: 0,
      }}>
        {ticket.issue_id}
      </span>

      {/* Customer */}
      <span style={{ fontWeight: 500, color: 'var(--text-primary)', flex: '1 1 120px', fontSize: 14, minWidth: 0 }}>
        {ticket.customer_name}
      </span>

      {/* Device */}
      <span style={{
        color: 'var(--text-secondary)', fontSize: 14, flex: '1 1 120px',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0,
      }}>
        {ticket.device}
      </span>

      {/* Expected date */}
      <span style={{ color: overdue ? 'var(--accent-red)' : 'var(--text-tertiary)', fontSize: 13, flexShrink: 0 }}>
        {formatDate(ticket.date_expected)}
      </span>

      {/* Ticket status badge */}
      <div style={{ flexShrink: 0 }}>
        <StatusBadge status={ticket.status} />
      </div>

      {/* Notify button — only for ready tickets, not for viewers */}
      {!readOnly && ticket.status === 'ready' && (
        <div onClick={e => e.stopPropagation()}>
          <NotifyButton ticket={ticket} addToast={addToast} />
        </div>
      )}

      {/* Ticket status select — hidden for viewers */}
      {!readOnly && (
        <select
          value={ticket.status}
          onChange={e => { e.stopPropagation(); onStatusChange(ticket.id, e.target.value) }}
          disabled={updating === ticket.id}
          onClick={e => e.stopPropagation()}
          style={{
            background: 'var(--bg-elevated)',
            border: '1px solid var(--border-default)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            fontSize: 13, padding: '4px 8px',
            cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
            opacity: updating === ticket.id ? 0.5 : 1,
            flexShrink: 0,
          }}
        >
          {STATUSES.map(s => (
            <option key={s} value={s} style={{ background: '#ffffff' }}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      )}

      {/* Payment controls — hidden for viewers */}
      {!readOnly && payment && (
        <PaymentControls
          payment={payment}
          ticket={ticket}
          onSaved={onPaymentSaved}
          onError={onPaymentError}
        />
      )}
    </div>
  )
}

const EmptyState = ({ text }) => (
  <p style={{ fontSize: 14, color: 'var(--text-tertiary)', padding: '16px 12px' }}>{text}</p>
)

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

// ── Dashboard ─────────────────────────────────────────────────────────────────
export default function TechDashboard() {
  const navigate = useNavigate()
  const { role } = useAuth()
  const readOnly = role === 'viewer'
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [flashRows, setFlashRows] = useState({})
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000)
  }, [])

  const fetchTickets = useCallback(async () => {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, payments(id, payment_status, amount_paid, paid_at)')
      .order('created_at', { ascending: false })
    if (!error) setTickets(data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchTickets() }, [fetchTickets])

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('tickets-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tickets' }, () => fetchTickets())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchTickets])

  const updateStatus = async (ticketId, newStatus) => {
    const ticket = tickets.find(t => t.id === ticketId)
    setUpdating(ticketId)
    const { error } = await supabase
      .from('tickets')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', ticketId)

    if (error) {
      addToast('Failed to update status — please try again.', 'error')
    } else {
      setFlashRows(prev => ({ ...prev, [ticketId]: true }))
      setTimeout(() => setFlashRows(prev => { const n = { ...prev }; delete n[ticketId]; return n }), 800)
      addToast('Status updated', 'success')
      logAudit({
        action: 'ticket.status_changed',
        entity: 'ticket',
        entityId: ticketId,
        details: {
          issue_id: ticket?.issue_id,
          customer_name: ticket?.customer_name,
          old_status: ticket?.status,
          new_status: newStatus,
        },
      })
      await fetchTickets()
    }
    setUpdating(null)
  }

  const handlePaymentSaved = useCallback(() => {
    addToast('Payment saved', 'success')
    fetchTickets()
  }, [addToast, fetchTickets])

  const handlePaymentError = useCallback((msg) => {
    addToast(msg || 'Failed to save payment', 'error')
  }, [addToast])

  const active   = tickets.filter(t => t.status !== 'collected')
  const overdue  = tickets.filter(t => isOverdue(t.date_expected, t.status))
  const dueToday = tickets.filter(t => isDueToday(t.date_expected, t.status))

  const StatCard = ({ label, value, color }) => (
    <motion.div
      variants={itemVariants}
      className="glass-stat"
      style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}
    >
      <div style={{ fontSize: 28, fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1, letterSpacing: '-0.03em' }}>{value}</div>
      <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 6, letterSpacing: '0.01em' }}>{label}</div>
    </motion.div>
  )

  const renderRows = (list, accentLeft) => (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      {list.map(t => (
        <motion.div key={t.id} variants={itemVariants}>
          <TicketRow
            ticket={t}
            onStatusChange={updateStatus}
            updating={updating}
            onClick={() => navigate(`/ticket/${t.id}`)}
            accentLeft={accentLeft}
            flashSuccess={!!flashRows[t.id]}
            onPaymentSaved={handlePaymentSaved}
            onPaymentError={handlePaymentError}
            addToast={addToast}
            readOnly={readOnly}
          />
        </motion.div>
      ))}
    </motion.div>
  )

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />
      <Toast toasts={toasts} />
      <OfflineBanner />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ paddingTop: 52 + 24, paddingBottom: 40, paddingLeft: 'var(--page-pad-x)', paddingRight: 'var(--page-pad-x)', maxWidth: 1200, margin: '0 auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Tech Dashboard
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
              {active.length} active job{active.length !== 1 ? 's' : ''}
            </p>
          </div>
          {!readOnly && (
            <button
              onClick={() => navigate('/intake')}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--accent-blue)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius-md)',
                padding: '8px 14px', fontSize: 14, fontWeight: 500,
                cursor: 'pointer', fontFamily: 'inherit', transition: 'background 150ms',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#0077ed'}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--accent-blue)'}
            >
              <Plus size={14} strokeWidth={2.5} />
              New Ticket
            </button>
          )}
        </div>

        {loading ? (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
              {[0,1,2].map(i => (
                <div key={i} className="glass-stat" style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
                  <div className="skeleton" style={{ width: 48, height: 28, marginBottom: 8 }} />
                  <div className="skeleton" style={{ width: 80, height: 12 }} />
                </div>
              ))}
            </div>
            <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <div className="skeleton" style={{ width: 120, height: 11, marginBottom: 16 }} />
              <SkeletonRows count={3} />
            </div>
          </>
        ) : (
          <>
            {/* Stats */}
            <motion.div
              variants={containerVariants} initial="hidden" animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}
            >
              <StatCard label="Active jobs" value={active.length} color="var(--accent-blue)" />
              <StatCard label="Overdue" value={overdue.length} color={overdue.length > 0 ? 'var(--accent-red)' : 'var(--text-primary)'} />
              <StatCard label="Due today" value={dueToday.length} color={dueToday.length > 0 ? 'var(--accent-amber)' : 'var(--text-primary)'} />
            </motion.div>

            {/* Overdue + Due Today */}
            <div className="split-grid">
              <div className="glass-card" style={{ border: '1px solid rgba(239,68,68,0.2)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <SectionHeading showDot={overdue.length > 0} dotColor="var(--accent-red)">Overdue</SectionHeading>
                {overdue.length === 0 ? <EmptyState text="No overdue jobs" /> : renderRows(overdue, 'var(--accent-red)')}
              </div>
              <div className="glass-card" style={{ border: '1px solid rgba(245,158,11,0.18)', borderRadius: 'var(--radius-lg)', padding: 16 }}>
                <SectionHeading showDot={false}>Due Today</SectionHeading>
                {dueToday.length === 0 ? <EmptyState text="Nothing due today" /> : renderRows(dueToday, 'var(--accent-amber)')}
              </div>
            </div>

            {/* All active */}
            <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', padding: 16 }}>
              <SectionHeading showDot={false}>All Active Jobs</SectionHeading>
              {active.length === 0 ? <EmptyState text="No active jobs" /> : renderRows(active, null)}
            </div>
          </>
        )}
      </motion.main>
    </div>
  )
}

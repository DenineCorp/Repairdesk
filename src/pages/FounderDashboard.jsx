import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Search, Bell, CheckCircle, XCircle, Download } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../services/supabaseClient'
import { sendSMS } from '../services/twilioService'
import { downloadCsv } from '../utils/exportCsv'
import { logAudit } from '../utils/auditLogger'
import Navbar from '../components/Navbar'
import StatusBadge from '../components/StatusBadge'

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
              : <XCircle size={14} strokeWidth={2} />}
            {t.message}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
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

// ── Skeleton for founder table ────────────────────────────────────────────────
function SkeletonFounder() {
  return (
    <>
      <div className="kpi-grid" style={{ marginBottom: 24 }}>
        {[0,1,2,3].map(i => (
          <div key={i} className="glass-stat" style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}>
            <div className="skeleton" style={{ width: 80, height: 24, marginBottom: 8 }} />
            <div className="skeleton" style={{ width: 100, height: 12 }} />
          </div>
        ))}
      </div>
      <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[0,1,2].map(i => (
              <tr key={i}>
                {[80,110,140,65,75,55,55,55].map((w, j) => (
                  <td key={j} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                    <div className="skeleton" style={{ width: w, height: 13 }} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}

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

function formatCurrency(val) {
  return `CAD ${Number(val).toFixed(2)}`
}

// Build last-7-days revenue chart data from tickets+payments
function buildChartData(data) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const label = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric' })
    days.push({ key, label, revenue: 0 })
  }
  data.forEach(ticket => {
    const p = ticket.payments?.[0]
    if (p?.payment_status === 'paid' && p.paid_at) {
      const paidDay = p.paid_at.split('T')[0]
      const found = days.find(d => d.key === paidDay)
      if (found) found.revenue += parseFloat(p.amount_paid) || 0
    }
  })
  return days
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const itemVariants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2 } },
}

const inputStyle = {
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '8px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

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
        display: 'inline-flex', alignItems: 'center', gap: 4,
        background: 'var(--accent-green-dim)',
        color: 'var(--accent-green)',
        border: '1px solid rgba(16,185,129,0.2)',
        borderRadius: 'var(--radius-sm)',
        padding: '4px 10px',
        fontSize: 13, fontWeight: 500,
        cursor: state === 'loading' ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: state === 'loading' ? 0.6 : 1,
        transition: 'background 150ms',
        whiteSpace: 'nowrap',
      }}
      onMouseEnter={e => { if (state === 'idle') e.currentTarget.style.background = 'rgba(16,185,129,0.2)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'var(--accent-green-dim)' }}
    >
      <Bell size={11} strokeWidth={2} />
      {state === 'loading' ? '…' : 'Notify'}
    </button>
  )
}

export default function FounderDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterPayment, setFilterPayment] = useState('all')
  const [toasts, setToasts] = useState([])
  const toastId = useRef(0)

  const addToast = useCallback((message, type = 'success') => {
    const id = ++toastId.current
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const handleExport = () => {
    const ts = new Date().toISOString().split('T')[0]
    const rows = filtered.map(t => {
      const p = t.payments?.[0]
      const subtotal = parseFloat(p?.subtotal) > 0 ? parseFloat(p.subtotal) : (parseFloat(p?.amount_paid) || 0)
      const gst      = parseFloat(p?.gst_amount) > 0 ? parseFloat(p.gst_amount) : +(subtotal * 0.05).toFixed(2)
      const pst      = parseFloat(p?.pst_amount) > 0 ? parseFloat(p.pst_amount) : +(subtotal * 0.07).toFixed(2)
      return {
        'Issue ID':              t.issue_id,
        'Customer':              t.customer_name,
        'Phone':                 t.customer_phone,
        'Device':                t.device,
        'Issue':                 t.issue,
        'Status':                t.status,
        'Date In':               formatDate(t.date_in),
        'Expected':              formatDate(t.date_expected),
        'Payment Status':        p?.payment_status ?? 'unpaid',
        'Service Charge (CAD)':  subtotal.toFixed(2),
        'GST 5% (CAD)':          gst.toFixed(2),
        'PST 7% BC (CAD)':       pst.toFixed(2),
        'Total Charged (CAD)':   (subtotal + gst + pst).toFixed(2),
      }
    })
    downloadCsv(`et-servicedesk-export-${ts}.csv`, rows)
  }

  const fetchData = async () => {
    const { data: tickets, error } = await supabase
      .from('tickets')
      .select(`*, payments(id,payment_status,amount_paid,paid_at)`)
      .order('created_at', { ascending: false })
    if (!error) setData(tickets)
    setLoading(false)
  }

  useEffect(() => { fetchData() }, [])

  // Derived stats
  const today = new Date().toISOString().split('T')[0]
  const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const paidTickets = data.filter(t => t.payments?.[0]?.payment_status === 'paid')
  const totalRevenue = paidTickets.reduce((s, t) => s + (parseFloat(t.payments?.[0]?.amount_paid) || 0), 0)
  const weekRevenue  = paidTickets
    .filter(t => t.payments?.[0]?.paid_at?.split('T')[0] >= weekAgo)
    .reduce((s, t) => s + (parseFloat(t.payments?.[0]?.amount_paid) || 0), 0)
  const todayJobs   = data.filter(t => t.created_at?.split('T')[0] === today).length
  const weekJobs    = data.filter(t => t.created_at?.split('T')[0] >= weekAgo).length
  const unpaidCount = data.filter(t => t.payments?.[0]?.payment_status !== 'paid').length

  const chartData = buildChartData(data)

  // Filtered table rows
  const filtered = data.filter(t => {
    const matchSearch = !search ||
      t.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      t.issue_id.toLowerCase().includes(search.toLowerCase()) ||
      t.device.toLowerCase().includes(search.toLowerCase())
    const ps = t.payments?.[0]?.payment_status ?? 'unpaid'
    const matchPayment = filterPayment === 'all' || ps === filterPayment
    return matchSearch && matchPayment
  })

  const KpiCard = ({ label, value, color }) => (
    <motion.div
      variants={itemVariants}
      className="glass-stat"
      style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6, whiteSpace: 'nowrap' }}>{label}</div>
    </motion.div>
  )

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload?.length) {
      return (
        <div style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-md)',
          padding: '8px 12px',
          fontSize: 13,
          color: 'var(--text-primary)',
        }}>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 2 }}>{label}</p>
          <p style={{ fontWeight: 600 }}>CAD {payload[0].value.toFixed(2)}</p>
        </div>
      )
    }
    return null
  }

  const thStyle = {
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(0,0,0,0.025)',
    whiteSpace: 'nowrap',
    whiteSpace: 'nowrap',
  }

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
              Dashboard
            </h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 2 }}>
              {unpaidCount} awaiting payment
            </p>
          </div>
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
        </div>

        {loading ? <SkeletonFounder /> : (
          <>
            {/* KPI row */}
            <motion.div
              variants={containerVariants} initial="hidden" animate="show"
              className="kpi-grid"
            >
              <KpiCard label="Total revenue" value={formatCurrency(totalRevenue)} color="var(--accent-green)" />
              <KpiCard label="Revenue this week" value={formatCurrency(weekRevenue)} color="var(--accent-green)" />
              <KpiCard label="Jobs today" value={todayJobs} />
              <KpiCard label="Jobs this week" value={weekJobs} />
            </motion.div>

            {/* Revenue chart */}
            <div className="glass-card" style={{
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              marginBottom: 24,
            }}>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 16 }}>
                Revenue — last 7 days
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={chartData} barSize={28}>
                  <CartesianGrid vertical={false} stroke="var(--border-subtle)" />
                  <XAxis
                    dataKey="label"
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `CAD ${v}`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="revenue" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Search + filter + export */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <Search size={14} color="var(--text-tertiary)" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Search tickets…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ ...inputStyle, width: '100%', paddingLeft: 32 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(227,24,55,0.4)'; e.target.style.boxShadow = '0 0 0 3px rgba(227,24,55,0.07)' }}
                  onBlur={e => { e.target.style.borderColor = 'var(--border-subtle)'; e.target.style.boxShadow = 'none' }}
                />
              </div>
              <select
                value={filterPayment}
                onChange={e => setFilterPayment(e.target.value)}
                style={{ ...inputStyle, width: 'auto', cursor: 'pointer' }}
              >
                <option value="all">All payments</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
              </select>

              <button
                onClick={handleExport}
                disabled={filtered.length === 0}
                title="Export visible rows as CSV"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  fontSize: 14, fontWeight: 500,
                  padding: '7px 12px',
                  cursor: filtered.length === 0 ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  opacity: filtered.length === 0 ? 0.4 : 1,
                  transition: 'color 150ms, border-color 150ms',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
                onMouseEnter={e => { if (filtered.length > 0) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' } }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
              >
                <Download size={13} strokeWidth={2} />
                Export CSV
              </button>
            </div>

            {/* Job history table */}
            <div className="glass-card" style={{
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
            }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr>
                      <th style={thStyle}>Issue ID</th>
                      <th style={thStyle}>Customer</th>
                      <th style={thStyle}>Device</th>
                      <th style={thStyle}>Status</th>
                      <th style={thStyle}>Expected</th>
                      <th style={thStyle}>Payment</th>
                      <th style={thStyle}>Amount</th>
                      <th style={thStyle}>Notify</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((ticket, i) => {
                      const payment = ticket.payments?.[0]
                      const overdue = isOverdue(ticket.date_expected, ticket.status)
                      const isPaid  = payment?.payment_status === 'paid'
                      const isLast  = i === filtered.length - 1

                      return (
                        <TableRow addToast={addToast}
                          key={ticket.id}
                          ticket={ticket}
                          payment={payment}
                          overdue={overdue}
                          isPaid={isPaid}
                          isLast={isLast}
                          onNavigate={() => navigate(`/ticket/${ticket.id}`)}
                        />
                      )
                    })}
                  </tbody>
                </table>
                {filtered.length === 0 && (
                  <p style={{ textAlign: 'center', padding: '32px 0', fontSize: 14, color: 'var(--text-tertiary)' }}>
                    No tickets found.
                  </p>
                )}
              </div>
            </div>
          </>
        )}
      </motion.main>
    </div>
  )
}

function TableRow({ ticket, payment, overdue, isPaid, isLast, onNavigate, addToast }) {
  const [hovered, setHovered] = useState(false)

  const tdStyle = {
    padding: '12px 16px',
    borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
    background: hovered ? 'var(--bg-hover)' : 'transparent',
    transition: 'background 100ms',
    verticalAlign: 'middle',
    cursor: 'pointer',
  }

  return (
    <tr
      onClick={onNavigate}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <td style={tdStyle}>
        <span
          style={{
            fontFamily: 'ui-monospace, "Cascadia Code", monospace',
            fontSize: 14,
            fontWeight: 600,
            color: overdue ? 'var(--accent-red)' : 'var(--accent-cyan)',
            whiteSpace: 'nowrap',
          }}
        >
          {ticket.issue_id}
        </span>
      </td>
      <td style={{ ...tdStyle, color: 'var(--text-primary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{ticket.customer_name}</td>
      <td style={{ ...tdStyle, color: 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap' }}>{ticket.device}</td>
      <td style={tdStyle}><StatusBadge status={ticket.status} /></td>
      <td style={{ ...tdStyle, color: overdue ? 'var(--accent-red)' : 'var(--text-secondary)', fontSize: 14, whiteSpace: 'nowrap' }}>
        {formatDate(ticket.date_expected)}
      </td>
      <td style={tdStyle}>
        {(() => {
          const ps = payment?.payment_status ?? 'unpaid'
          const cfg = ps === 'paid'
            ? { color: 'var(--accent-green)', bg: 'var(--accent-green-dim)', border: 'rgba(16,185,129,0.2)', label: 'Paid' }
            : ps === 'partial'
            ? { color: 'var(--accent-cyan)', bg: 'var(--accent-cyan-dim)', border: 'rgba(255,77,109,0.2)', label: 'Partial' }
            : { color: 'var(--accent-amber)', bg: 'var(--accent-amber-dim)', border: 'rgba(245,158,11,0.2)', label: 'Unpaid' }
          return (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 13, fontWeight: 500,
              color: cfg.color, background: cfg.bg,
              border: `1px solid ${cfg.border}`,
              borderRadius: 'var(--radius-sm)',
              padding: '3px 8px',
            }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.color, flexShrink: 0 }} />
              {cfg.label}
            </span>
          )
        })()}
      </td>
      <td style={{ ...tdStyle, fontFamily: 'ui-monospace, monospace', fontSize: 14, color: isPaid ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
        {payment?.amount_paid ? `CAD ${parseFloat(payment.amount_paid).toFixed(2)}` : '—'}
      </td>
      <td style={tdStyle}>
        {ticket.status === 'ready' && <NotifyButton ticket={ticket} addToast={addToast} />}
      </td>
    </tr>
  )
}


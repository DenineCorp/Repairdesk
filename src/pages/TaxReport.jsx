import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { downloadCsv } from '../utils/exportCsv'
import Navbar from '../components/Navbar'

// ── Ontario HST rates ─────────────────────────────────────────────────────────
const GST_RATE = 0.05   // 5% federal
const PST_RATE = 0.08   // 8% Ontario provincial (HST component)

const PERIODS = [
  { label: 'This Month',    value: 'month' },
  { label: 'Last 3 Months', value: 'quarter' },
  { label: 'This Year',     value: 'year' },
  { label: 'All Time',      value: 'all' },
]

function periodStart(value) {
  const now = new Date()
  if (value === 'month')   return new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  if (value === 'quarter') return new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString()
  if (value === 'year')    return new Date(now.getFullYear(), 0, 1).toISOString()
  return null
}

function formatDate(str) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('en-CA', { day: '2-digit', month: 'short', year: 'numeric' })
}

function cad(n) {
  return `CAD ${Number(n).toFixed(2)}`
}

// Resolves tax breakdown — uses stored values when available, back-calculates otherwise
function getTaxBreakdown(payment) {
  const subtotal = parseFloat(payment.subtotal) > 0
    ? parseFloat(payment.subtotal)
    : parseFloat(payment.amount_paid) || 0

  const gst = parseFloat(payment.gst_amount) > 0
    ? parseFloat(payment.gst_amount)
    : +(subtotal * GST_RATE).toFixed(2)

  const pst = parseFloat(payment.pst_amount) > 0
    ? parseFloat(payment.pst_amount)
    : +(subtotal * PST_RATE).toFixed(2)

  const taxTotal     = +(gst + pst).toFixed(2)
  const totalCharged = +(subtotal + taxTotal).toFixed(2)

  return { subtotal, gst, pst, taxTotal, totalCharged }
}

export default function TaxReport() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading]   = useState(true)
  const [period, setPeriod]     = useState('month')

  useEffect(() => {
    async function fetchPayments() {
      setLoading(true)
      let query = supabase
        .from('payments')
        .select('*, tickets(issue_id, customer_name, device)')
        .eq('payment_status', 'paid')
        .order('paid_at', { ascending: false })

      const start = periodStart(period)
      if (start) query = query.gte('paid_at', start)

      const { data, error } = await query
      if (!error) setPayments(data || [])
      setLoading(false)
    }
    fetchPayments()
  }, [period])

  // ── Aggregate totals ────────────────────────────────────────────────────────
  const totals = payments.reduce((acc, p) => {
    const { subtotal, gst, pst, taxTotal, totalCharged } = getTaxBreakdown(p)
    return {
      subtotal:     acc.subtotal     + subtotal,
      gst:          acc.gst          + gst,
      pst:          acc.pst          + pst,
      taxTotal:     acc.taxTotal     + taxTotal,
      totalCharged: acc.totalCharged + totalCharged,
    }
  }, { subtotal: 0, gst: 0, pst: 0, taxTotal: 0, totalCharged: 0 })

  // ── CSV export ──────────────────────────────────────────────────────────────
  const handleExport = () => {
    const rows = payments.map(p => {
      const { subtotal, gst, pst, taxTotal, totalCharged } = getTaxBreakdown(p)
      const t = p.tickets
      return {
        'Date Paid':              formatDate(p.paid_at),
        'Ticket ID':              t?.issue_id        ?? '—',
        'Customer':               t?.customer_name   ?? '—',
        'Device':                 t?.device          ?? '—',
        'Service Charge (CAD)':   subtotal.toFixed(2),
        'GST 5% (CAD)':           gst.toFixed(2),
        'PST 8% (CAD)':           pst.toFixed(2),
        'Total Tax (CAD)':        taxTotal.toFixed(2),
        'Total Charged (CAD)':    totalCharged.toFixed(2),
      }
    })
    // Append summary row
    rows.push({
      'Date Paid':              'TOTAL',
      'Ticket ID':              '',
      'Customer':               `${payments.length} payment${payments.length !== 1 ? 's' : ''}`,
      'Device':                 '',
      'Service Charge (CAD)':   totals.subtotal.toFixed(2),
      'GST 5% (CAD)':           totals.gst.toFixed(2),
      'PST 8% (CAD)':           totals.pst.toFixed(2),
      'Total Tax (CAD)':        totals.taxTotal.toFixed(2),
      'Total Charged (CAD)':    totals.totalCharged.toFixed(2),
    })
    const ts   = new Date().toISOString().split('T')[0]
    const pLabel = PERIODS.find(p => p.value === period)?.label.replace(/\s+/g, '-').toLowerCase() ?? period
    downloadCsv(`et-tax-report-${pLabel}-${ts}.csv`, rows)
  }

  // ── Styles ──────────────────────────────────────────────────────────────────
  const thStyle = {
    padding: '10px 14px',
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--text-secondary)',
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    textAlign: 'left',
    borderBottom: '1px solid var(--border-subtle)',
    background: 'rgba(255,255,255,0.04)',
    whiteSpace: 'nowrap',
  }

  const KpiCard = ({ label, value, color, sub }) => (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-stat"
      style={{ borderRadius: 'var(--radius-lg)', padding: '16px 20px' }}
    >
      <div style={{
        fontSize: 20, fontWeight: 700,
        color: color ?? 'var(--text-primary)',
        lineHeight: 1,
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {value}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 2 }}>{sub}</div>}
    </motion.div>
  )

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{
          paddingTop: 52 + 24, paddingBottom: 40,
          paddingLeft: 'var(--page-pad-x)', paddingRight: 'var(--page-pad-x)',
          maxWidth: 1200, margin: '0 auto',
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
              Tax Report
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 2 }}>
              Ontario HST breakdown — GST 5% + PST 8% on all paid repairs
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Period selector */}
            <div style={{
              display: 'flex',
              background: 'var(--bg-elevated)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
              overflow: 'hidden',
            }}>
              {PERIODS.map((p, i) => (
                <button
                  key={p.value}
                  onClick={() => setPeriod(p.value)}
                  style={{
                    background: period === p.value ? 'rgba(79,156,249,0.15)' : 'none',
                    color: period === p.value ? '#4f9cf9' : 'var(--text-secondary)',
                    border: 'none',
                    borderRight: i < PERIODS.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                    padding: '6px 12px',
                    fontSize: 12,
                    fontWeight: period === p.value ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background 150ms, color 150ms',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExport}
              disabled={payments.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'none',
                border: '1px solid var(--border-default)',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-secondary)',
                fontSize: 13, fontWeight: 500,
                padding: '7px 12px',
                cursor: payments.length === 0 ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: payments.length === 0 ? 0.4 : 1,
                transition: 'color 150ms, border-color 150ms',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => { if (payments.length > 0) { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' } }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
            >
              <Download size={13} strokeWidth={2} />
              Export CSV
            </button>
          </div>
        </div>

        {/* ── KPI cards ───────────────────────────────────────────────────────── */}
        <div className="kpi-grid" style={{ marginBottom: 24 }}>
          <KpiCard
            label="Service Revenue"
            value={cad(totals.subtotal)}
            color="var(--accent-green)"
            sub="Pre-tax earnings"
          />
          <KpiCard
            label="GST Collected"
            value={cad(totals.gst)}
            color="var(--accent-blue)"
            sub="5% federal — to CRA"
          />
          <KpiCard
            label="PST Collected"
            value={cad(totals.pst)}
            color="var(--accent-cyan)"
            sub="8% Ontario — to CRA"
          />
          <KpiCard
            label="Total Tax to Remit"
            value={cad(totals.taxTotal)}
            color="var(--accent-amber)"
            sub={`13% HST on ${payments.length} payment${payments.length !== 1 ? 's' : ''}`}
          />
        </div>

        {/* ── Breakdown table ─────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '40px', fontSize: 13, color: 'var(--text-tertiary)', textAlign: 'center' }}>
              Loading…
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr>
                    <th style={thStyle}>Date Paid</th>
                    <th style={thStyle}>Ticket</th>
                    <th style={thStyle}>Customer</th>
                    <th style={thStyle}>Device</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Service Charge</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>GST (5%)</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>PST (8%)</th>
                    <th style={{ ...thStyle, textAlign: 'right' }}>Total Charged</th>
                  </tr>
                </thead>

                <tbody>
                  {payments.map((p, i) => {
                    const { subtotal, gst, pst, totalCharged } = getTaxBreakdown(p)
                    const ticket = p.tickets
                    const isLast = i === payments.length - 1
                    const td = {
                      padding: '11px 14px',
                      borderBottom: isLast ? 'none' : '1px solid var(--border-subtle)',
                      fontSize: 13,
                    }
                    return (
                      <tr key={p.id}>
                        <td style={{ ...td, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                          {formatDate(p.paid_at)}
                        </td>
                        <td style={{ ...td, fontFamily: 'ui-monospace, monospace', fontWeight: 600, color: 'var(--accent-cyan)' }}>
                          {ticket?.issue_id ?? '—'}
                        </td>
                        <td style={{ ...td, fontWeight: 500, color: 'var(--text-primary)' }}>
                          {ticket?.customer_name ?? '—'}
                        </td>
                        <td style={{ ...td, color: 'var(--text-secondary)' }}>
                          {ticket?.device ?? '—'}
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                          CAD {subtotal.toFixed(2)}
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--accent-blue)' }}>
                          +${gst.toFixed(2)}
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--accent-cyan)' }}>
                          +${pst.toFixed(2)}
                        </td>
                        <td style={{ ...td, textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: 'var(--text-primary)' }}>
                          CAD {totalCharged.toFixed(2)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>

                {/* Totals footer */}
                {payments.length > 0 && (
                  <tfoot>
                    <tr style={{ background: 'rgba(255,255,255,0.03)' }}>
                      <td
                        colSpan={4}
                        style={{
                          padding: '10px 14px',
                          fontSize: 11, fontWeight: 600,
                          color: 'var(--text-secondary)',
                          textTransform: 'uppercase', letterSpacing: '0.05em',
                          borderTop: '1px solid var(--border-default)',
                        }}
                      >
                        Totals — {payments.length} payment{payments.length !== 1 ? 's' : ''}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-green)', fontVariantNumeric: 'tabular-nums', borderTop: '1px solid var(--border-default)' }}>
                        CAD {totals.subtotal.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-blue)', fontVariantNumeric: 'tabular-nums', borderTop: '1px solid var(--border-default)' }}>
                        +${totals.gst.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--accent-cyan)', fontVariantNumeric: 'tabular-nums', borderTop: '1px solid var(--border-default)' }}>
                        +${totals.pst.toFixed(2)}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', borderTop: '1px solid var(--border-default)' }}>
                        CAD {totals.totalCharged.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>

              {payments.length === 0 && (
                <p style={{ textAlign: 'center', padding: '40px', fontSize: 13, color: 'var(--text-tertiary)' }}>
                  No paid transactions in this period.
                </p>
              )}
            </div>
          )}
        </div>

        {/* ── Remittance note ─────────────────────────────────────────────────── */}
        {payments.length > 0 && (
          <p style={{
            marginTop: 16, fontSize: 12,
            color: 'var(--text-tertiary)',
            textAlign: 'right',
            letterSpacing: '0.01em',
          }}>
            GST/HST Business Number required for CRA remittance. Consult your accountant for filing deadlines.
          </p>
        )}
      </motion.main>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, CheckCircle } from 'lucide-react'
import { supabase } from '../services/supabaseClient'
import { generateIssueId } from '../utils/issueId'
import Navbar from '../components/Navbar'

const today = () => new Date().toISOString().split('T')[0]

const inputStyle = {
  width: '100%',
  background: 'var(--bg-elevated)',
  border: '1px solid var(--border-subtle)',
  borderRadius: 'var(--radius-md)',
  padding: '9px 12px',
  color: 'var(--text-primary)',
  fontSize: 14,
  outline: 'none',
  fontFamily: 'inherit',
  transition: 'border-color 150ms ease, box-shadow 150ms ease',
}

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 500,
  color: 'var(--text-secondary)',
  letterSpacing: '0.01em',
  marginBottom: 6,
}

function Field({ label, children }) {
  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  )
}

function FocusableInput({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      {...props}
      style={{
        ...inputStyle,
        ...style,
        borderColor: focused ? 'rgba(59,130,246,0.5)' : 'var(--border-subtle)',
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

function FocusableTextarea({ style, ...props }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      {...props}
      style={{
        ...inputStyle,
        ...style,
        borderColor: focused ? 'rgba(59,130,246,0.5)' : 'var(--border-subtle)',
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.08)' : 'none',
        resize: 'vertical',
        minHeight: 100,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}

export default function IntakeForm() {
  const navigate = useNavigate()
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [successId, setSuccessId] = useState(null)

  const [form, setForm] = useState({
    customer_name: '',
    customer_phone: '',
    device: '',
    issue: '',
    date_in: today(),
    date_expected: '',
  })

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!form.customer_phone.trim()) {
      setError('Phone number is required.')
      return
    }
    if (form.date_expected < today()) {
      setError('Expected completion date cannot be in the past.')
      return
    }

    setSubmitting(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      const issue_id = await generateIssueId()

      const { data: ticket, error: ticketError } = await supabase
        .from('tickets')
        .insert({
          issue_id,
          customer_name: form.customer_name.trim(),
          customer_phone: form.customer_phone.trim(),
          device: form.device.trim(),
          issue: form.issue.trim(),
          date_in: form.date_in,
          date_expected: form.date_expected,
          status: 'pending',
          created_by: user.id,
        })
        .select()
        .single()

      if (ticketError) throw ticketError

      const { error: paymentError } = await supabase
        .from('payments')
        .insert({ ticket_id: ticket.id, payment_status: 'unpaid', amount_paid: 0, updated_by: user.id })

      if (paymentError) throw paymentError

      setSuccessId(issue_id)
      setTimeout(() => navigate(`/ticket/${ticket.id}`), 1200)
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg-app)', minHeight: '100vh' }}>
      <Navbar />

      <motion.main
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        style={{ paddingTop: 52 + 24, paddingBottom: 40, paddingLeft: 'var(--page-pad-x)', paddingRight: 'var(--page-pad-x)', maxWidth: 600, margin: '0 auto' }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em', marginBottom: 4 }}>
          New Repair Ticket
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>
          Register a new device. A unique issue ID will be assigned automatically.
        </p>

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

        {/* Success toast */}
        <AnimatePresence>
          {successId && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                background: 'var(--accent-green-dim)',
                border: '1px solid rgba(16,185,129,0.2)',
                color: 'var(--accent-green)',
                borderRadius: 'var(--radius-md)',
                padding: '8px 12px',
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              <CheckCircle size={14} />
              Ticket {successId} created — redirecting…
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form card */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-xl)',
          padding: 24,
        }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Name + Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Customer name">
                <FocusableInput type="text" required value={form.customer_name} onChange={set('customer_name')} placeholder="Jane Smith" />
              </Field>
              <Field label="Phone number">
                <FocusableInput type="tel" required value={form.customer_phone} onChange={set('customer_phone')} placeholder="+1 555 000 0000" />
              </Field>
            </div>

            {/* Device */}
            <Field label="Device type & model">
              <FocusableInput type="text" required value={form.device} onChange={set('device')} placeholder="e.g. MacBook Pro 14-inch 2021" />
            </Field>

            {/* Issue */}
            <Field label="Issue description">
              <FocusableTextarea required value={form.issue} onChange={set('issue')} placeholder="Describe the problem the customer reported…" rows={4} />
            </Field>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Date brought in">
                <FocusableInput type="date" required value={form.date_in} onChange={set('date_in')} />
              </Field>
              <Field label="Expected completion">
                <FocusableInput type="date" required value={form.date_expected} onChange={set('date_expected')} min={form.date_in} />
              </Field>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Actions */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                type="button"
                onClick={() => navigate(-1)}
                style={{
                  background: 'none',
                  border: '1px solid var(--border-default)',
                  borderRadius: 'var(--radius-md)',
                  color: 'var(--text-secondary)',
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'color 150ms, border-color 150ms',
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-primary)'; e.currentTarget.style.borderColor = 'var(--border-strong)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.borderColor = 'var(--border-default)' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: submitting ? 'rgba(59,130,246,0.6)' : 'var(--accent-blue)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: '8px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontFamily: 'inherit',
                  transition: 'background 150ms',
                }}
                onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#2563eb' }}
                onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = 'var(--accent-blue)' }}
              >
                <Plus size={14} strokeWidth={2.5} />
                {submitting ? 'Creating…' : 'Create Ticket'}
              </button>
            </div>
          </form>
        </div>
      </motion.main>
    </div>
  )
}

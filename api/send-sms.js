import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/send-sms
 * Sends an SMS via Twilio. Credentials stay server-side — never exposed to the client.
 * Requires a valid Supabase Bearer token in the Authorization header.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.slice(7)

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )
  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // ── Input validation ──────────────────────────────────────────────────────
  const { to, message } = req.body ?? {}

  if (!to || !message || typeof to !== 'string' || typeof message !== 'string') {
    return res.status(400).json({ error: 'Missing required fields: to, message' })
  }

  // Normalize to E.164 — strip formatting, assume +1 for 10-digit North American numbers
  let normalized = to.replace(/\D/g, '')
  if (normalized.length === 10) normalized = '+1' + normalized           // e.g. 6475551234 → +16475551234
  else if (normalized.length === 11 && normalized.startsWith('1')) normalized = '+' + normalized  // e.g. 16475551234 → +16475551234
  else if (!to.startsWith('+')) normalized = '+' + normalized            // already had country code digits

  if (!/^\+[1-9]\d{7,14}$/.test(normalized)) {
    return res.status(400).json({ error: `Invalid phone number "${to}" — save numbers as 10 digits (6475551234) or E.164 (+16475551234)` })
  }

  if (message.length > 1600) {
    return res.status(400).json({ error: 'Message exceeds 1600 character limit' })
  }

  // ── Twilio call ───────────────────────────────────────────────────────────
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken  = process.env.TWILIO_AUTH_TOKEN
  const from       = process.env.TWILIO_FROM_NUMBER

  if (!accountSid || !authToken || !from) {
    console.error('[send-sms] Twilio env vars not configured')
    return res.status(503).json({ error: 'SMS service unavailable' })
  }

  const body = new URLSearchParams({ To: normalized, From: from, Body: message })

  const twilioRes = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    }
  )

  if (!twilioRes.ok) {
    console.error('[send-sms] Twilio error:', await twilioRes.text())
    return res.status(502).json({ error: 'SMS delivery failed' })
  }

  const result = await twilioRes.json()
  return res.status(200).json({ sid: result.sid })
}

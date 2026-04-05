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
    process.env.SUPABASE_SERVICE_ROLE_KEY
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

  // Enforce E.164 format (+[country code][number], 8–15 digits total)
  if (!/^\+[1-9]\d{7,14}$/.test(to)) {
    return res.status(400).json({ error: 'Invalid phone number. Use E.164 format (e.g. +14155552671)' })
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

  const body = new URLSearchParams({ To: to, From: from, Body: message })

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

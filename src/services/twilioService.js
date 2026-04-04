import { supabase } from './supabaseClient'

/**
 * Sends an SMS via the /api/send-sms serverless function.
 * Twilio credentials live server-side only and are never exposed to the client.
 */
export async function sendSMS({ to, message }) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('Not authenticated')

  const response = await fetch('/api/send-sms', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ to, message }),
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(data.error || 'SMS failed')
  return data
}

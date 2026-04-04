export async function sendSMS({ to, message }) {
  const accountSid = import.meta.env.VITE_TWILIO_ACCOUNT_SID
  const authToken = import.meta.env.VITE_TWILIO_AUTH_TOKEN
  const from = import.meta.env.VITE_TWILIO_FROM_NUMBER

  const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`

  const body = new URLSearchParams()
  body.append('To', to)
  body.append('From', from)
  body.append('Body', message)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  })

  const data = await response.json()
  if (!response.ok) throw new Error(data.message || 'SMS failed')
  return data
}

import { createClient } from '@supabase/supabase-js'

/**
 * POST /api/reset-mfa
 * Deletes all MFA factors for the authenticated user using the service role key.
 * Requires: Authorization: Bearer <user_jwt>
 * Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.slice(7)
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const url    = process.env.SUPABASE_URL
  const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !svcKey) return res.status(503).json({ error: 'Server misconfiguration' })

  const anonClient  = createClient(url, process.env.SUPABASE_ANON_KEY ?? svcKey, { auth: { persistSession: false } })
  const adminClient = createClient(url, svcKey, { auth: { persistSession: false, autoRefreshToken: false } })

  const { data: { user }, error: authErr } = await anonClient.auth.getUser(token)
  if (authErr || !user) return res.status(401).json({ error: 'Unauthorized' })

  // Fetch all factors for this user via admin REST API
  const factorsRes = await fetch(`${url}/auth/v1/admin/users/${user.id}/factors`, {
    headers: { Authorization: `Bearer ${svcKey}`, apikey: svcKey },
  })
  const factors = await factorsRes.json()

  const list = Array.isArray(factors) ? factors : []
  for (const f of list) {
    await fetch(`${url}/auth/v1/admin/users/${user.id}/factors/${f.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${svcKey}`, apikey: svcKey },
    })
  }

  return res.status(200).json({ deleted: list.length })
}

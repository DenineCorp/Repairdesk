import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/get-role
 * Returns the authenticated user's role from app_metadata (server-write-only).
 * Uses the service role key so app_metadata is accessible.
 * Falls back to user_metadata.role for accounts not yet migrated.
 *
 * Required Vercel env vars:
 *   SUPABASE_URL            — same value as VITE_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY — from Supabase dashboard → Settings → API → service_role
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  const token = authHeader.slice(7)

  const supabaseUrl = process.env.SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceKey) {
    console.error('[get-role] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
    return res.status(503).json({ error: 'Server misconfiguration' })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false },
  })

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // app_metadata is only writable by admins — tamper-proof
  // Falls back to user_metadata for accounts not yet using app_metadata
  const role = user.app_metadata?.role ?? user.user_metadata?.role ?? null

  return res.status(200).json({ role })
}

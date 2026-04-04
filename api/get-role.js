import { createClient } from '@supabase/supabase-js'

/**
 * GET /api/get-role
 * Returns the authenticated user's role from app_metadata (server-write-only).
 * app_metadata cannot be modified by the user, preventing role escalation.
 * Falls back to user_metadata.role during migration.
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

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  // app_metadata is set via Supabase admin only — users cannot write to it
  // Falls back to user_metadata for backward compatibility
  const role = user.app_metadata?.role ?? user.user_metadata?.role ?? null

  return res.status(200).json({ role })
}

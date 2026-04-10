import { createClient } from '@supabase/supabase-js'

/**
 * GET  /api/manage-roles  — list all users (founder only)
 * PATCH /api/manage-roles  — update a user's role (founder only)
 *
 * The service role key is used ONLY for auth admin operations
 * (listUsers, updateUserById) — NOT for any data queries, so RLS on
 * your tables is completely unaffected.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'PATCH') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUrl     = process.env.SUPABASE_URL
  const anonKey         = process.env.SUPABASE_ANON_KEY
  const serviceRoleKey  = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    console.error('[manage-roles] Missing env vars')
    return res.status(503).json({ error: 'Server misconfiguration' })
  }

  // Verify the caller via anon key (respects RLS + JWT validation)
  const supabaseAnon = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } })
  const { data: { user: caller }, error: authErr } = await supabaseAnon.auth.getUser(token)
  if (authErr || !caller) return res.status(401).json({ error: 'Unauthorized' })

  const callerRole = caller.user_metadata?.role ?? caller.app_metadata?.role
  if (callerRole !== 'founder') return res.status(403).json({ error: 'Forbidden — founders only' })

  // Admin client — used only for auth.admin operations
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

  // ── GET: list all users ───────────────────────────────────────────────────
  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (error) {
      console.error('[manage-roles] listUsers error:', error)
      return res.status(500).json({ error: 'Failed to list users' })
    }
    const users = data.users.map(u => ({
      id:         u.id,
      email:      u.email,
      role:       u.user_metadata?.role ?? 'viewer',
      created_at: u.created_at,
    }))
    return res.status(200).json({ users })
  }

  // ── PATCH: update a user's role ────────────────────────────────────────────
  const { userId, role } = req.body ?? {}
  const VALID_ROLES = ['founder', 'technician', 'viewer']

  if (!userId || !VALID_ROLES.includes(role)) {
    return res.status(400).json({ error: 'userId and a valid role are required' })
  }
  if (userId === caller.id) {
    return res.status(400).json({ error: 'You cannot change your own role' })
  }

  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    user_metadata: { role },
  })
  if (updateErr) {
    console.error('[manage-roles] updateUserById error:', updateErr)
    return res.status(500).json({ error: 'Failed to update role' })
  }

  return res.status(200).json({ success: true })
}

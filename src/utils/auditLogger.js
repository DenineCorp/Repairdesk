import { supabase } from '../services/supabaseClient'

/**
 * Writes an audit event to the audit_logs table.
 * Fires-and-forgets — errors are logged to console, never thrown.
 *
 * Required Supabase table (run once in SQL editor):
 *
 *   CREATE TABLE audit_logs (
 *     id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *     action        text NOT NULL,
 *     entity        text NOT NULL,
 *     entity_id     text,
 *     details       jsonb,
 *     performed_by  uuid REFERENCES auth.users(id),
 *     created_at    timestamptz DEFAULT now()
 *   );
 *   ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
 *   -- All authenticated staff can insert
 *   CREATE POLICY "Staff can insert audit logs"
 *     ON audit_logs FOR INSERT TO authenticated WITH CHECK (true);
 *   -- All authenticated staff can read (restrict to founders via app logic)
 *   CREATE POLICY "Staff can read audit logs"
 *     ON audit_logs FOR SELECT TO authenticated USING (true);
 */
export async function logAudit({ action, entity, entityId = null, details = {} }) {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('audit_logs').insert({
      action,
      entity,
      entity_id: entityId,
      details: { ...details, performed_by_email: user?.email ?? 'unknown' },
      performed_by: user?.id ?? null,
    })
    if (error) console.error('[auditLogger]', error.message)
  } catch (err) {
    console.error('[auditLogger]', err)
  }
}

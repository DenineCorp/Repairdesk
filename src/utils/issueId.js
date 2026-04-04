import { supabase } from '../services/supabaseClient'

/**
 * Generates a unique Issue ID in the format RPR-XXXXX.
 * Retries until a unique ID is confirmed in the database.
 */
export async function generateIssueId() {
  const MAX_ATTEMPTS = 10

  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const digits = String(Math.floor(10000 + Math.random() * 90000)) // 10000–99999
    const candidate = `RPR-${digits}`

    const { data, error } = await supabase
      .from('tickets')
      .select('id')
      .eq('issue_id', candidate)
      .maybeSingle()

    if (error) throw new Error(`Issue ID check failed: ${error.message}`)

    if (!data) {
      // No existing row — this ID is unique
      return candidate
    }
  }

  throw new Error('Failed to generate a unique Issue ID after multiple attempts.')
}

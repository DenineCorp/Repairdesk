import { supabase } from '../services/supabaseClient'

/**
 * Generates a serial Issue ID in the format YY-NNNN.
 * YY = last 2 digits of current year (e.g. "26")
 * NNNN = next sequential number for that year, zero-padded to 4 digits
 * Examples: 26-0001, 26-0002, 26-0003
 */
export async function generateIssueId() {
  const yy = new Date().getFullYear().toString().slice(-2)
  const prefix = `${yy}-`

  // Count how many tickets already exist for this year
  const { count, error } = await supabase
    .from('tickets')
    .select('id', { count: 'exact', head: true })
    .like('issue_id', `${prefix}%`)

  if (error) throw new Error(`Issue ID generation failed: ${error.message}`)

  const next = (count ?? 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

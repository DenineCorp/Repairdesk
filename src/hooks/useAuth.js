import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

/**
 * Read role directly from the JWT session — instant, no network call.
 * Works as long as the user's role is stored in user_metadata (set via Supabase dashboard).
 */
function getRoleFromSession(session) {
  return session?.user?.user_metadata?.role ?? null
}

/**
 * Optional background upgrade: reads app_metadata via the secure server endpoint.
 * app_metadata can only be written by a Supabase admin — tamper-proof.
 * If the API fails for any reason, the JWT role is already set and UI works fine.
 */
async function fetchSecureRole(session) {
  if (!session) return null
  try {
    const res = await fetch('/api/get-role', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return null
    const { role } = await res.json()
    return role ?? null
  } catch {
    return null
  }
}

export function useAuth() {
  const [user, setUser]     = useState(null)
  const [role, setRole]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initial session — set role from JWT immediately so routing works instantly
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      setRole(getRoleFromSession(session))
      setLoading(false)

      // Background: upgrade role from app_metadata if API is available
      if (session) {
        fetchSecureRole(session).then(r => {
          if (r) setRole(r)
        })
      }
    })

    // Auth state changes (sign in / sign out / token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      const jwtRole = getRoleFromSession(session)
      setRole(jwtRole)

      // Background upgrade
      if (session) {
        fetchSecureRole(session).then(r => {
          if (r) setRole(r)
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
  }

  return { user, loading, role, signOut }
}

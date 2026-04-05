import { useState, useEffect } from 'react'
import { supabase } from '../services/supabaseClient'

async function fetchSecureRole(session) {
  if (!session) return null
  try {
    const res = await fetch('/api/get-role', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) {
      // API unreachable (env vars not configured) — fall back to user_metadata
      return session.user?.user_metadata?.role ?? null
    }
    const { role } = await res.json()
    // If API returned null, fall back to user_metadata
    return role ?? session.user?.user_metadata?.role ?? null
  } catch {
    return session.user?.user_metadata?.role ?? null
  }
}

export function useAuth() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setUser(session?.user ?? null)
      const r = await fetchSecureRole(session)
      setRole(r)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      const r = await fetchSecureRole(session)
      setRole(r)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    await supabase.auth.signOut()
    setRole(null)
  }

  return { user, loading, role, signOut }
}

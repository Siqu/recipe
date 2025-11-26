import type { Database } from '@/supabase.types.ts'
import { createClient } from '@supabase/supabase-js'
import { useAuthStore } from '@/stores/auth.ts'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

const supabase = createClient<Database>(supabaseUrl, supabasePublishableKey)

supabase.auth.onAuthStateChange((event, session) => {
  const authStore = useAuthStore()

  const { user } = storeToRefs(authStore)

  user.value = session?.user || null
})

export default function useSupabase () {
  return { supabase }
}

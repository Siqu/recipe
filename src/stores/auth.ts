import type { User } from '@supabase/supabase-js'
import useSupabase from '@/composable/useSupabase.ts'

export const useAuthStore = defineStore('auth', () => {
  const { supabase } = useSupabase()
  const router = useRouter()

  const user = ref<null | User>(null)

  const login = ({ email, password }: { email: string, password: string }) => {
    return supabase.auth.signInWithPassword({ email, password })
  }

  const logout = async () => {
    const { error } = await supabase.auth.signOut()

    if (error) {
      throw error
    }

    router.push({
      name: 'login',
    })
  }
  const isLoggedIn = async () => {
    await supabase.auth.getSession()

    return !!user.value
  }

  return {
    user,
    login,
    isLoggedIn,
    logout,
  }
})

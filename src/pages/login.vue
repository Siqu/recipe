<script
    setup
    lang="ts"
>

  import { AuthError } from '@supabase/supabase-js'
  import { definePage } from 'unplugin-vue-router/runtime'
  import { useAuthStore } from '@/stores/auth.ts'

  definePage({
    name: 'login',
    meta: {
      layout: 'auth',
    },
  })

  const router = useRouter()
  const authStore = useAuthStore()

  const { login } = authStore

  const model = ref({
    email: '',
    password: '',
  })
  const visible = ref(false)
  const error = ref<null | Error>(null)

  async function handleLogin () {
    try {
      await login(model.value)

      router.push({ name: 'index' })
    } catch (error_) {
      if (error_ instanceof AuthError) {
        error.value = error_
      }
    }
  }
</script>

<template>
  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" md="4" sm="8">
        <v-form @submit.prevent="handleLogin">
          <v-card elevation="8" title="Login">
            <v-card-text>
              <v-alert v-if="null !== error" class="mb-4" color="error" icon="mdi-alert">
                {{ error }}
              </v-alert>
              <v-text-field v-model="model.email" placeholder="Email" prepend-inner-icon="mdi-email-outline" />
              <v-text-field
                v-model="model.password"
                :append-inner-icon="visible ? 'mdi-eye-off' : 'mdi-eye' "
                placeholder="Password"
                prepend-inner-icon="mdi-lock-outline"
                :type="visible ? 'text' : 'password'"
                @click:append-inner="visible = !visible"
              />
            </v-card-text>
            <v-card-actions class="justify-center">
              <v-btn color="primary" type="submit">
                Login
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-form>
      </v-col>
    </v-row>
  </v-container>
</template>

<style
    scoped
    lang="sass"
>

</style>

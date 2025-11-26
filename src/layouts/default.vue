<template>
  <v-app-bar title="Recipe">
    <v-spacer />
    <AddRecipe />
    <v-btn class="ms-4" icon="mdi-logout" @click="logout" />
  </v-app-bar>
  <v-main>
    <router-view />
  </v-main>
</template>

<script lang="ts" setup>
  import { useAuthStore } from '@/stores/auth.ts'

  const authStore = useAuthStore()

  const { logout } = authStore
</script>

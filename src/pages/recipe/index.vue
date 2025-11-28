<script
    setup
    lang="ts"
>
  import type { Tables } from '@/supabase.types.ts'
  import { definePage } from 'unplugin-vue-router/runtime'
  import useSupabase from '@/composable/useSupabase.ts'

  definePage({
    name: 'recipes',
    meta: {
      requiresAuth: true,
    },
  })

  const { supabase } = useSupabase()

  const recipes = ref<Tables<'Recipe'>[]>([])
  const loading = ref(true)

  onMounted(() => {
    loading.value = true

    supabase.from('Recipe').select('*').then(resp => resp.data).then(data => {
      if (null !== data) {
        recipes.value = data
      }

      loading.value = false
    })
  })
</script>

<template>
  <v-container>
    <v-row v-if="loading">
      <v-col
        v-for="i in 6"
        :key="i"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xl="2"
      >
        <v-skeleton-loader style="aspect-ratio: 1" type="image" />
      </v-col>
    </v-row>
    <v-row v-else>
      <v-col
        v-for="recipe in recipes"
        :key="recipe.id"
        cols="12"
        lg="3"
        md="4"
        sm="6"
        xl="2"
      >
        <v-card :to="{name: 'recipe', params: { id: recipe.id }}">
          <RecipeImage add-title :recipe="recipe" />
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style
    scoped
    lang="scss"
>
:deep .v-skeleton-loader__image {
  height: 100%;
}
</style>

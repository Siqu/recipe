<script
    setup
    lang="ts"
>
  import type { Tables } from '@/supabase.types.ts'
  import moment from 'moment'
  import { definePage } from 'unplugin-vue-router/runtime'
  import { useRoute } from 'vue-router'
  import useSupabase from '@/composable/useSupabase.ts'

  definePage({
    name: 'recipe',
    meta: {
      requiresAuth: true,
    },
  })

  const router = useRouter()
  const route = useRoute('recipe')
  const { supabase } = useSupabase()

  const recipe = ref<Tables<'Recipe'> | null>(null)
  const defaultServings = ref(1)
  const loading = ref(true)
  const saving = ref(false)
  const servings = ref(1)
  const recipeFormValid = ref<boolean | null>(null)
  const editDialog = ref(false)

  const readableDuration = computed(() => {
    const totalDuration = moment.duration()
    if (cookDuration.value) {
      totalDuration.add(cookDuration.value)
    }
    if (prepDuration.value) {
      totalDuration.add(prepDuration.value)
    }

    return totalDuration.humanize()
  })

  const cookDuration = computed(() => {
    if (!recipe.value?.cookTime) {
      return null
    }

    return moment.duration(recipe.value?.cookTime)
  })

  const prepDuration = computed(() => {
    if (!recipe.value?.prepTime) {
      return null
    }

    return moment.duration(recipe.value?.prepTime)
  })

  const ingredients = computed(() => {
    if (!recipe.value || !recipe.value.ingredients) {
      return []
    }

    return recipe.value.ingredients.map(ingredient => {
      const titleParts = [ingredient.name]
      if (ingredient.unit) {
        titleParts.unshift(ingredient.unit)
      }
      if (ingredient.amount) {
        titleParts.unshift((ingredient.amount * (servings.value / defaultServings.value)).toFixed(2).replace('.00', ''))
      }

      return {
        ...ingredient,
        title: titleParts.join(' '),
      }
    })
  })

  const editActionsDisabled = computed((): boolean | ('cancel' | 'save')[] | undefined => {
    if (!recipeFormValid.value) {
      return ['save']
    }

    return false
  })

  function deleteRecipe () {
    supabase.from('Recipe').delete().eq('id', route.params.id).then(() => {
      router.replace({ name: 'recipes' })
    }, console.error)
  }

  function updateRecipe (model: Ref<Tables<'Recipe'>>, confirmEditSave: () => void) {
    saving.value = true
    supabase
      .from('Recipe')
      .update(model.value)
      .eq('id', route.params.id)
      .then(() => {
        confirmEditSave()
        editDialog.value = false
        saving.value = false
      })
  }

  onMounted(() => {
    loading.value = true
    supabase.from('Recipe').select().eq('id', route.params.id).single().then(resp => resp.data).then(data => {
      recipe.value = data
      if (recipe.value?.recipeYield) {
        defaultServings.value = recipe.value.recipeYield
        servings.value = recipe.value.recipeYield
      }
      loading.value = false
    })
  })
</script>

<template>
  <v-container>
    <v-row>
      <v-col cols="12" lg="8" offset-lg="2">
        <v-card v-if="loading">
          <v-row>
            <v-col cols="12" lg="3" md="4" xl="2">
              <v-skeleton-loader type="image" />
            </v-col>
            <v-col
              cols="12"
              lg="9"
              md="8"
              xl="10"
            >
              <v-skeleton-loader type="heading,subtitle" />
              <v-skeleton-loader type="button, button" />
            </v-col>
          </v-row>
          <v-row>
            <v-col cols="12" lg="4" md="6">
              <v-skeleton-loader type="heading" />
              <v-skeleton-loader type="list-item,list-item" />
            </v-col>
            <v-col cols="12" lg="8" md="6">
              <v-skeleton-loader type="heading" />
              <v-skeleton-loader type="list-item,list-item" />
            </v-col>
          </v-row>
        </v-card>
        <v-card v-else-if="recipe">
          <v-row>
            <v-col cols="12" lg="3" md="4" xl="2">
              <RecipeImage :recipe="recipe" />
            </v-col>
            <v-col
              cols="12"
              lg="9"
              md="8"
              xl="10"
            >
              <v-card-title class="d-flex flex-column h-100">
                <div class="text-wrap">{{ recipe.name }}</div>
                <v-chip-group v-if="recipe?.keywords" class="mb-2">
                  <v-chip v-for="(keyword, idx) in recipe.keywords" :key="idx" size="small" :text="keyword" />
                </v-chip-group>
                <v-spacer />
                <v-row class="flex-grow-0 align-center">
                  <v-col cols="6" lg="3">
                    <v-number-input
                      v-model.number="servings"
                      control-variant="split"
                      hide-details="auto"
                      :min="1"
                    />
                  </v-col>
                  <v-col cols="6" lg="9">
                    <v-tooltip>
                      <template #activator="{props: activatorProps}">
                        <v-btn
                          prepend-icon="mdi-clock"
                          size="x-large"
                          :text="readableDuration"
                          variant="outlined"
                          v-bind="activatorProps"
                        />
                      </template>
                      Preparation duration: {{ prepDuration ? prepDuration.humanize() : 'n/a' }}<br>
                      Cook duration: {{ cookDuration ? cookDuration.humanize() : 'n/a' }}
                    </v-tooltip>
                  </v-col>
                </v-row>
                <div class="position-absolute top-0 right-0 me-3 mt-3">
                  <v-dialog v-model="editDialog" fullscreen>
                    <template #activator="{props: activatorProps}">
                      <v-btn
                        class="me-3"
                        color="primary"
                        icon="mdi-pencil"
                        size="small"
                        variant="outlined"
                        v-bind="activatorProps"
                      />
                    </template>
                    <template #default="{isActive}">
                      <v-card :disabled="saving" title="Edit Recipe">
                        <v-confirm-edit v-model="recipe" :disabled="editActionsDisabled" hide-actions>
                          <template #default="{model: proxyModel, isPristine, cancel, save}">
                            <RecipeForm v-model="proxyModel.value" v-model:recipe-form-valid="recipeFormValid">
                              <template #actions>
                                <v-btn @click="() => {cancel();isActive.value = false}">Cancel</v-btn>
                                <v-spacer />
                                <v-btn color="primary" :disabled="true !== recipeFormValid || isPristine" variant="elevated" @click="updateRecipe(proxyModel, save)">
                                  Update recipe
                                </v-btn>
                              </template>
                            </RecipeForm>
                          </template>
                        </v-confirm-edit>
                      </v-card>
                    </template>
                  </v-dialog>
                  <v-dialog max-width="400">
                    <template #activator="{props: activatorProps}">
                      <v-btn
                        color="error"
                        icon="mdi-delete"
                        size="small"
                        v-bind="activatorProps"
                      />
                    </template>
                    <template #default="{isActive}">
                      <v-card title="Delete Recipe?">
                        <v-card-actions>
                          <v-btn text="Cancel" @click="isActive.value = false" />
                          <v-spacer />
                          <v-btn color="error" text="Delete" @click="deleteRecipe" />
                        </v-card-actions>
                      </v-card>
                    </template>
                  </v-dialog>
                </div>
              </v-card-title>
            </v-col>
          </v-row>
          <v-divider />
          <v-card-text>
            <v-row>
              <v-col cols="12" lg="4" md="6">
                <h2>Ingredients</h2>
                <v-list density="compact">
                  <v-list-item v-for="(ingredient, idx) in ingredients" :key="idx" :title="ingredient.title" />
                </v-list>
              </v-col>
              <v-col cols="12" lg="8" md="6">
                <h2 class="mb-3">Instructions</h2>
                <div v-for="(instruction, idx) in recipe.instructions" :key="idx" class="d-flex mb-3 text-body-1">
                  <div class="flex-grow-0 me-3 text-h5 text-purple-darken-1 font-weight-bold">
                    {{ idx + 1 }}
                  </div>
                  <p>
                    {{ instruction }}
                  </p>
                </div>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style
    scoped
    lang="sass"
>

</style>

<script
    setup
    lang="ts"
>
  import type { Recipe } from 'schema-dts'
  import type { TablesInsert, Unit } from '@/supabase.types.ts'
  import isURL from 'validator/lib/isURL'
  import { watch } from 'vue'
  import useSupabase from '@/composable/useSupabase.ts'
  import { units } from '@/plugins/units.ts'

  const { supabase } = useSupabase()
  const router = useRouter()

  const dialog = ref(false)
  const step = ref(1)
  const url = ref('')
  const urlFormValid = ref(null)
  const recipeFormValid = ref<boolean | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const recipe = ref<TablesInsert<'Recipe'>>(recipeFactory())

  function recipeFactory () {
    return {
      name: '',
      description: null,
      image: null,
      cookTime: null,
      prepTime: null,
      keywords: [],
      ingredients: [],
      instructions: [],
      recipeYield: null,
      url: null,
    }
  }

  function reset () {
    step.value = 1
    recipe.value = recipeFactory()
    url.value = ''
    urlFormValid.value = null
    recipeFormValid.value = null
    loading.value = false
    error.value = null
  }

  const urlRules = [
    (value: string) => {
      if (isURL(value)) {
        return true
      }
      return 'URL invalid'
    },
  ]

  const disabled = computed(() => {
    if (2 === step.value && true !== recipeFormValid.value) return 'next'

    return false
  })

  function createRecipe () {
    if (true === recipeFormValid.value) {
      loading.value = true
      supabase
        .from('Recipe')
        .insert([
          recipe.value,
        ])
        .select('id')
        .single()
        .then(resp => resp.data)
        .then(data => {
          loading.value = false
          if (null !== data) {
            dialog.value = false
            router.push({
              name: 'recipe',
              params: {
                id: data.id,
              },
            })
          }
        }, error => {
          console.error(error)
          loading.value = false
        })
    }
  }

  function fetchMetadata (next: () => void) {
    if (!url.value) {
      next()

      return
    }

    loading.value = true
    error.value = null
    recipe.value = recipeFactory()

    supabase.functions.invoke('recipe-schema-parser', {
      body: {
        url: url.value,
      },
    })
      .then(response => response.data?.recipe)
      .then((schemaRecipe: Recipe | null) => {
        loading.value = false
        if (null === schemaRecipe) {
          error.value = 'No recipe found'
          return
        }

        recipe.value.url = url.value
        if (typeof schemaRecipe.name === 'string') {
          recipe.value.name = schemaRecipe.name
        }
        if (typeof schemaRecipe.description === 'string') {
          recipe.value.description = schemaRecipe.description
        }
        if (typeof schemaRecipe.image === 'string') {
          recipe.value.image = schemaRecipe.image
        } else if (Array.isArray(schemaRecipe.image)) {
          recipe.value.image = schemaRecipe.image[0]
        }
        if (typeof schemaRecipe.prepTime === 'string') {
          recipe.value.prepTime = schemaRecipe.prepTime
        }
        if (typeof schemaRecipe.cookTime === 'string') {
          recipe.value.cookTime = schemaRecipe.cookTime
        }
        if (
          typeof schemaRecipe.recipeYield !== 'object'
          && schemaRecipe.recipeYield !== undefined
        ) {
          recipe.value.recipeYield = typeof schemaRecipe.recipeYield === 'string' ? Number.parseInt(schemaRecipe.recipeYield) : schemaRecipe.recipeYield
        }
        if (typeof schemaRecipe.keywords === 'string') {
          recipe.value.keywords = schemaRecipe.keywords.split(',').map(keyword => keyword.trim())
        }
        recipe.value.instructions = []
        if (Array.isArray(schemaRecipe.recipeInstructions)) {
          for (const recipeInstruction of schemaRecipe.recipeInstructions) {
            if (
              typeof recipeInstruction === 'object'
              && recipeInstruction['@type'] === 'HowToSection'
              && recipeInstruction.hasOwnProperty('itemListElement')
            ) {
              for (const item of recipeInstruction.itemListElement) {
                if (typeof item === 'object' && item['@type'] === 'HowToStep') {
                  recipe.value.instructions.push(`${item.text}`.trim())
                } else if (typeof item === 'string') {
                  recipe.value.instructions.push(item)
                }
              }
            } else if (typeof recipeInstruction === 'string') {
              recipe.value.instructions.push(recipeInstruction)
            }
          }
        }
        recipe.value.ingredients = []
        const ingredientRegex = /^(\d[.]*\d*)*(\s+\w*\s+)*(.*)$/u
        if (Array.isArray(schemaRecipe.recipeIngredient)) {
          for (const recipeIngredient of schemaRecipe.recipeIngredient) {
            let m
            if ((m = ingredientRegex.exec(recipeIngredient)) !== null) {
              let amount = null
              let unit = null
              let name = null

              if (m[3] !== undefined) {
                name = m[3].trim()
              }

              if (m[2] !== undefined) {
                if (units.includes(m[2].trim())) {
                  unit = m[2].trim() as Unit
                } else {
                  name = `${m[2]} ${name}`.trim()
                }
              }

              if (m[1] !== undefined) {
                amount = Number.parseFloat(m[1].trim())
              }

              if (null !== name) {
                recipe.value.ingredients.push({
                  name,
                  amount,
                  unit,
                })
              }
            }
          }
        }

        next()
      }, error => {
        loading.value = false
        error.value = `An error occurred while trying to fetch recipe "${error}"`
        console.error(error)
      })
  }

  watch(dialog, newValue => {
    if (false === newValue) {
      reset()
    }
  })
</script>

<template>
  <v-dialog v-model="dialog" fullscreen :persistent="step !== 1">
    <template #activator="{props: activatorProps}">
      <v-btn
        v-bind="activatorProps"
        color="primary"
        icon="mdi-plus"
        size="small"
        variant="elevated"
      />
    </template>
    <v-card :disabled="loading" :loading="loading">
      <template #loader="{ isActive }">
        <v-progress-linear
          :active="isActive"
          color="deep-purple"
          height="4"
          indeterminate
        />
      </template>
      <v-stepper v-model="step" class="overflow-y-auto">
        <template #default="{ prev, next }">
          <v-stepper-header class="position-sticky top-0 left-0 bg-white">
            <v-stepper-item title="Enter URL" :value="1" />
            <v-divider />
            <v-stepper-item title="Overview" :value="2" />
          </v-stepper-header>
          <v-stepper-window>
            <v-stepper-window-item :value="1">
              <v-form v-model="urlFormValid">
                <v-text-field v-model="url" label="Website URL" prepend-inner-icon="mdi-web" :rules="urlRules" />
              </v-form>
              <v-alert v-if="error" color="error" icon="mdi-alert" :text="error" />
              <v-stepper-actions
                :disabled="disabled"
                @click:next="fetchMetadata(next)"
                @click:prev="dialog = false"
              />
            </v-stepper-window-item>
            <v-stepper-window-item :value="2">
              <RecipeForm v-model="recipe" v-model:recipe-form-valid="recipeFormValid" @cancel="prev" @submit="createRecipe" />
            </v-stepper-window-item>
          </v-stepper-window>
        </template>
      </v-stepper>
    </v-card>
  </v-dialog>
</template>

<style
    scoped
    lang="sass"
>

</style>

<script
    setup
    lang="ts"
>
  import type { Recipe } from 'schema-dts'
  import type { Ingredient, TablesInsert, Unit } from '@/supabase.types.ts'
  import isURL from 'validator/lib/isURL'
  import { watch } from 'vue'
  import IngredientInput from '@/components/Form/IngredientInput.vue'
  import useSupabase from '@/composable/useSupabase.ts'
  import { units } from '@/plugins/units.ts'

  const { supabase } = useSupabase()
  const router = useRouter()

  const dialog = ref(false)
  const step = ref(1)
  const url = ref('')
  const urlFormValid = ref(null)
  const recipeFormValid = ref(null)
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
    if (1 === step.value) return 'prev'
    if (2 === step.value && true !== recipeFormValid.value) return 'next'

    return undefined
  })

  function addIngredient () {
    if (!recipe.value.ingredients) {
      recipe.value.ingredients = []
    }

    recipe.value.ingredients.push({
      name: '',
      amount: null,
      unit: null,
    })
  }

  function removeIngredient (idx: number) {
    if (!recipe.value.ingredients) {
      return
    }

    recipe.value.ingredients.splice(idx, 1)
  }

  function addInstruction () {
    if (!recipe.value.instructions) {
      recipe.value.instructions = []
    }

    recipe.value.instructions.push('')
  }

  function removeInstruction (idx: number) {
    if (!recipe.value.instructions) {
      return
    }
    recipe.value.instructions.splice(idx, 1)
  }

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
  <v-dialog v-model="dialog" max-width="800" :persistent="step !== 1">
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
                @click:prev="prev"
              />
            </v-stepper-window-item>
            <v-stepper-window-item :value="2">
              <v-form v-model="recipeFormValid" validate-on="eager">
                <v-container>
                  <v-row>
                    <v-col v-if="recipe.image" cols="12">
                      <v-img height="200" :src="null === recipe.image ? undefined : recipe.image" />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field
                        v-if="recipe.url"
                        v-model="recipe.url"
                        hide-details="auto"
                        label="URL"
                        readonly
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-text-field v-model="recipe.name" hide-details="auto" label="Name" />
                    </v-col>
                    <v-col cols="12">
                      <v-textarea
                        v-model="recipe.description"
                        auto-grow
                        hide-details="auto"
                        label="Description"
                        rows="1"
                      />
                    </v-col>
                    <v-col cols="12">
                      <v-combobox
                        v-model="recipe.keywords"
                        chips
                        clearable
                        closable-chips
                        hide-details="auto"
                        label="Keywords"
                        multiple
                      />
                    </v-col>
                    <v-col cols="12" md="6">
                      <v-text-field v-model.number="recipe.recipeYield" hide-details="auto" label="Yield" />
                    </v-col>
                  </v-row>
                  <v-row>
                    <v-col cols="12" md="6">
                      <DurationInput v-model="recipe.prepTime" label="Preparation time" />
                    </v-col>
                    <v-col cols="12" md="6">
                      <DurationInput v-model="recipe.cookTime" label="Cook time" />
                    </v-col>
                  </v-row>
                  <v-row v-if="!!recipe.ingredients">
                    <v-col cols="12">
                      <div class="text-subtitle-2 mb-3">Ingredients</div>
                      <v-divider class="mb-5" />
                      <IngredientInput v-for="(ingredient, idx) in recipe.ingredients" :key="idx" v-model="recipe.ingredients[idx] as Ingredient" @remove="removeIngredient(idx)" />
                      <v-btn
                        class="mt-5"
                        color="primary"
                        icon="mdi-plus"
                        size="small"
                        @click="addIngredient"
                      />
                      <v-divider class="my-5" />
                    </v-col>
                  </v-row>
                  <v-row v-if="!!recipe.instructions">
                    <v-col cols="12">
                      <div class="text-subtitle-2 mb-3">Instructions</div>
                      <v-divider class="mb-5" />
                      <v-row
                        v-for="(instruction, idx) in recipe.instructions"
                        :key="idx"
                        align="start"
                      >
                        <v-col>
                          <v-textarea
                            v-model="recipe.instructions[idx]"
                            auto-grow
                            rows="1"
                          />
                        </v-col>

                        <v-col class="flex-grow-0">
                          <v-btn
                            class="mt-1"
                            color="error"
                            icon="mdi-delete"
                            size="small"
                            @click="removeInstruction(idx)"
                          />
                        </v-col>
                      </v-row>
                      <v-btn
                        class="mt-5"
                        color="primary"
                        icon="mdi-plus"
                        size="small"
                        @click="addInstruction"
                      />
                      <v-divider class="my-5" />
                    </v-col>
                  </v-row>
                </v-container>
                <v-card-actions>
                  <v-btn @click="prev">Previous</v-btn>
                  <v-spacer />
                  <v-btn color="primary" :disabled="true !== recipeFormValid" variant="elevated" @click="createRecipe">
                    Create recipe
                  </v-btn>
                </v-card-actions>
              </v-form>
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

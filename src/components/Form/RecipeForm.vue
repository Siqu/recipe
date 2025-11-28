<script
    setup
    lang="ts"
>
  import type { Ingredient, TablesInsert } from '@/supabase.types.ts'
  import IngredientInput from '@/components/Form/IngredientInput.vue'

  const model = defineModel<TablesInsert<'Recipe'>>({
    required: true,
  })
  const recipeFormValid = defineModel<boolean | null>('recipeFormValid', {
    required: true,
  })

  defineEmits(['cancel', 'submit'])

  function addIngredient () {
    if (!model.value.ingredients) {
      model.value.ingredients = []
    }

    model.value.ingredients.push({
      name: '',
      amount: null,
      unit: null,
    })
  }

  function removeIngredient (idx: number) {
    if (!model.value.ingredients) {
      return
    }

    model.value.ingredients.splice(idx, 1)
  }

  function addInstruction () {
    if (!model.value.instructions) {
      model.value.instructions = []
    }

    model.value.instructions.push('')
  }

  function removeInstruction (idx: number) {
    if (!model.value.instructions) {
      return
    }
    model.value.instructions.splice(idx, 1)
  }
</script>

<template>
  <v-form v-model="recipeFormValid" validate-on="eager">
    <v-container>
      <v-row>
        <v-col v-if="model.image" cols="12">
          <v-img height="200" :src="null === model.image ? undefined : model.image" />
        </v-col>
        <v-col cols="12">
          <v-text-field
            v-if="model.url"
            v-model="model.url"
            hide-details="auto"
            label="URL"
            readonly
          />
        </v-col>
        <v-col cols="12">
          <v-text-field v-model="model.name" hide-details="auto" label="Name" />
        </v-col>
        <v-col cols="12">
          <v-textarea
            v-model="model.description"
            auto-grow
            hide-details="auto"
            label="Description"
            rows="1"
          />
        </v-col>
        <v-col cols="12">
          <v-combobox
            v-model="model.keywords"
            chips
            clearable
            closable-chips
            hide-details="auto"
            label="Keywords"
            multiple
          />
        </v-col>
        <v-col cols="12" md="6">
          <v-text-field v-model.number="model.recipeYield" hide-details="auto" label="Yield" />
        </v-col>
      </v-row>
      <v-row>
        <v-col cols="12" md="6">
          <DurationInput v-model="model.prepTime" label="Preparation time" />
        </v-col>
        <v-col cols="12" md="6">
          <DurationInput v-model="model.cookTime" label="Cook time" />
        </v-col>
      </v-row>
      <v-row v-if="!!model.ingredients">
        <v-col cols="12">
          <div class="text-subtitle-2 mb-3">Ingredients</div>
          <v-divider class="mb-5" />
          <IngredientInput v-for="(ingredient, idx) in model.ingredients" :key="idx" v-model="model.ingredients[idx] as Ingredient" @remove="removeIngredient(idx)" />
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
      <v-row v-if="!!model.instructions">
        <v-col cols="12">
          <div class="text-subtitle-2 mb-3">Instructions</div>
          <v-divider class="mb-5" />
          <v-row
            v-for="(instruction, idx) in model.instructions"
            :key="idx"
            align="start"
          >
            <v-col>
              <v-textarea
                v-model="model.instructions[idx]"
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
      <slot name="actions">
        <v-btn @click="$emit('cancel')">Previous</v-btn>
        <v-spacer />
        <v-btn color="primary" :disabled="true !== recipeFormValid" variant="elevated" @click="$emit('submit')">
          Create recipe
        </v-btn>
      </slot>
    </v-card-actions>
  </v-form>
</template>

<style
    scoped
    lang="sass"
>

</style>

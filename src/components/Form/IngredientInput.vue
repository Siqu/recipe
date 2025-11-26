<script
    setup
    lang="ts"
>
  import type { Ingredient } from '@/supabase.types.ts'
  import isEmpty from 'validator/lib/isEmpty'

  const model = defineModel<Ingredient>({ required: true })

  defineEmits(['remove'])

  const nameRules = [
    (value: string) => {
      if (null !== value && !isEmpty(value)) {
        return true
      }
      return 'Name is required'
    },
  ]
</script>

<template>
  <v-row align="start">
    <v-col cols="3" md="2">
      <v-text-field v-model.number="model.amount" density="comfortable" hide-details="auto" label="Amount" />
    </v-col>
    <v-col cols="3" md="2">
      <v-combobox v-model="model.unit" density="comfortable" hide-details="auto" label="Unit" />
    </v-col>
    <v-col>
      <v-combobox
        v-model="model.name"
        clearable
        density="comfortable"
        hide-details="auto"
        label="Name"
        :rules="nameRules"
      />
    </v-col>
    <v-col class="flex-grow-0">
      <v-btn
        class="mt-1"
        color="error"
        icon="mdi-delete"
        size="small"
        @click="$emit('remove')"
      />
    </v-col>
  </v-row>
</template>

<style
    scoped
    lang="sass"
>

</style>

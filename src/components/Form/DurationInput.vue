<script
    setup
    lang="ts"
>
  import moment from 'moment'
  import { watch } from 'vue'

  defineProps({
    label: {
      type: String,
      required: true,
    },
  })

  const model = defineModel<string | null>()

  const hours = ref(0)
  const minutes = ref(0)

  function updateModel () {
    model.value = `P0DT${hours.value}H${minutes.value}M`
  }

  watch(hours, updateModel)
  watch(minutes, updateModel)

  onMounted(() => {
    const duration = moment.duration(model.value)

    hours.value = duration.hours()
    minutes.value = duration.minutes()
  })
</script>

<template>
  <div class="text-subtitle-2">{{ label }}</div>
  <div class="d-flex">
    <v-text-field v-model.number="hours" hide-details="auto" label="Hours" />
    <v-text-field v-model.number="minutes" hide-details="auto" label="Minutes" />
  </div>
</template>

<style
    scoped
    lang="sass"
>

</style>

<script
    setup
    lang="ts"
>
  import type { Tables } from '@/supabase.types.ts'
  import { useDisplay } from 'vuetify'
  import colors from 'vuetify/util/colors'

  const props = withDefaults(defineProps<{
    recipe: Tables<'Recipe'>
    addTitle?: boolean
  }>(), {
    addTitle: false,
  })

  const { mdAndUp } = useDisplay()

  const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($, ofs) => (ofs ? '-' : '') + $.toLowerCase())

  const classes = computed(() => {
    const colorKeys = Object.keys(colors)
    const randomColor = colorKeys[Math.trunc(colorKeys.length * Math.random())]

    let bgClass = 'bg-purple'
    if (
      randomColor !== undefined
      && randomColor !== 'shades'
    ) {
      bgClass = `bg-${kebabize(randomColor)}`
    }

    return {
      'd-flex': true,
      'align-end': true,
      'text-white': !!props.recipe.image,
      [bgClass]: true,
    }
  })

  const aspectRatio = computed(() => {
    if (mdAndUp.value) {
      return 1
    }

    return 16 / 9
  })
</script>

<template>
  <v-img
    :aspect-ratio="aspectRatio"
    :class="classes"
    cover
    :src="recipe.image ?recipe.image: undefined"
  >
    <v-card-title v-if="addTitle" v-tooltip:bottom-start="recipe.name">{{ recipe.name }}</v-card-title>
  </v-img>
</template>

<style
    scoped
    lang="sass"
>

</style>

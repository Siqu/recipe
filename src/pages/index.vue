<template>
  <v-container>
    <v-row>
      <v-col cols="12" lg="4">
        <v-card title="Recipes" :to="{name: 'recipes'}" />
      </v-col>
    </v-row>
  </v-container>
</template>

<script lang="ts" setup>
  import { definePage } from 'unplugin-vue-router/runtime'

  definePage({
    name: 'index',
    meta: {
      requiresAuth: true,
    },
  })

</script>

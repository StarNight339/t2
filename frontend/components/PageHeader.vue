<template>
  <section class="page-header mb-8">
    <div class="container-x py-8">
      <v-breadcrumbs :items="[{ title: 'หน้าแรก', to: '/' }, ...crumbs]" class="pa-0 mb-2 text-body-2" divider="›" />
      <h1 class="ph-title">{{ title }}</h1>
      <p v-if="subtitle" class="opacity-80 mt-1">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string, subtitle?: string, crumbs?: any[] }>(), { crumbs: () => [] })
</script>

<style scoped>
.page-header { background: linear-gradient(120deg, #072648, #0B3A6E); color: #fff; }
.page-header :deep(.v-breadcrumbs-item--disabled) { opacity: .8; }
.ph-title { font-size: clamp(1.5rem, 3vw, 2rem); font-weight: 500; }
</style>

<template>
  <section class="page-header mb-6">
    <div class="container-x py-5">
      <v-breadcrumbs :items="[{ title: 'หน้าแรก', to: '/' }, ...crumbs]" class="pa-0 mb-1 text-body-2" divider="›" />
      <h1 class="ph-title">{{ title }}</h1>
      <p v-if="subtitle" class="text-medium-emphasis mt-1">{{ subtitle }}</p>
    </div>
  </section>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ title: string, subtitle?: string, crumbs?: any[] }>(), { crumbs: () => [] })
</script>

<style scoped>
.page-header { background: #fff; border-bottom: 1px solid #E3E8EE; }
.page-header :deep(.v-breadcrumbs-item--link) { color: rgb(var(--v-theme-primary)); }
.ph-title { font-size: clamp(1.35rem, 2.6vw, 1.75rem); font-weight: 500; color: var(--kb-navy); }
</style>

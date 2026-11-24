<!-- การ์ดหัวข้อแบบเดียวกับหน้าแก้ไขข่าว: ชื่อ + ปุ่มด้านขวา แล้วตามด้วยเนื้อหา -->
<template>
  <v-card elevation="1" class="mb-4" :class="flush ? '' : 'pa-4'">
    <div class="d-flex align-center ga-2" :class="flush ? 'px-4 pt-4 pb-2' : 'mb-3'">
      <v-icon v-if="icon" :icon="icon" color="primary" size="20" />
      <h2 class="sc-title">{{ title }}</h2>
      <v-spacer />
      <v-btn v-if="to" :to="to" size="small" color="primary" variant="tonal" append-icon="mdi-chevron-right">{{ action || 'ดูทั้งหมด' }}</v-btn>
      <slot name="actions" />
    </div>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
defineProps<{ title: string, icon?: string, to?: string, action?: string, flush?: boolean }>()
</script>

<style scoped>
.sc-title { font-family: 'Prompt', sans-serif; font-size: 1.05rem; font-weight: 500; color: #1A2B3C; }
</style>

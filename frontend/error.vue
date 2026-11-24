<template>
  <NuxtLayout>
    <div class="container-x text-center py-16">
      <div class="code">{{ error?.statusCode || 500 }}</div>
      <h1 class="text-h5 mb-2">{{ error?.statusCode === 404 ? (error?.message || 'ไม่พบหน้าที่ต้องการ') : 'เกิดข้อผิดพลาด' }}</h1>
      <p class="text-medium-emphasis mb-6">หน้านี้อาจถูกลบหรือย้ายไปแล้ว</p>
      <v-btn color="primary" @click="clearError({ redirect: '/' })">กลับหน้าแรก</v-btn>
    </div>
  </NuxtLayout>
</template>

<script setup lang="ts">
defineProps<{ error: any }>()
</script>

<style scoped>
.code { font-family: 'Prompt'; font-size: 5rem; font-weight: 600; color: var(--kb-gold); line-height: 1; }
</style>

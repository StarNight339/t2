<!-- รูปปกข่าว: ถ้าไม่มีรูป แสดงพื้นสีอ่อนตามสีหมวด + ไอคอน แทนกล่องสีเข้ม -->
<template>
  <v-img v-if="src" :src="src" :alt="alt" eager cover :aspect-ratio="ratio" class="cover-img" />
  <div v-else class="cover-ph" :style="{ aspectRatio: String(ratio), background: tint, color }">
    <v-icon icon="mdi-newspaper-variant-outline" :size="small ? 22 : 40" />
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{ src?: string | null, alt?: string, color?: string | null, ratio?: number, small?: boolean }>(), {
  alt: '', color: '#0B3A6E', ratio: 16 / 9,
})
const color = computed(() => props.color || '#0B3A6E')
const tint = computed(() => `${color.value}14`) // สีหมวดแบบจางมาก (alpha ~8%)
</script>

<style scoped>
.cover-ph { width: 100%; display: flex; align-items: center; justify-content: center; }
.cover-ph :deep(.v-icon) { opacity: .55; }
</style>

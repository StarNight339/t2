<!-- ข่าวแบบแถว: รูปเล็กซ้าย + หัวข้อ/หมวด/วันที่ (ใช้ในหน้าแรก) -->
<template>
  <NuxtLink :to="`/news/${post.slug}`" class="news-row d-flex ga-3 py-3">
    <div class="thumb flex-shrink-0 rounded overflow-hidden">
      <CoverImage :src="post.cover_image" :alt="post.title" :color="post.category_color" :ratio="1.45" small />
    </div>
    <div class="flex-grow-1" style="min-width: 0">
      <div class="title line-clamp-2">
        <v-icon v-if="post.is_pinned" icon="mdi-pin" size="14" color="secondary" class="mr-1" />{{ post.title }}
      </div>
      <div class="d-flex flex-wrap align-center ga-2 mt-1 text-caption text-medium-emphasis">
        <span v-if="!hideCategory && post.category_name" class="cat" :style="{ color: post.category_color || '#0B3A6E' }">● {{ post.category_name }}</span>
        <span>{{ thaiDate(post.published_at) }}</span>
        <span><v-icon size="12" icon="mdi-eye-outline" /> {{ post.view_count?.toLocaleString() }}</span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ post: any, hideCategory?: boolean }>()
</script>

<style scoped>
.news-row + .news-row { border-top: 1px solid #EEF1F5; }
.thumb { width: 108px; }
.title { font-weight: 500; line-height: 1.5; color: #1A2B3C; }
.news-row:hover .title { color: var(--kb-navy); text-decoration: underline; }
.cat { font-weight: 500; }
</style>

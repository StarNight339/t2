<template>
  <NuxtLink :to="`/news/${post.slug}`" class="d-block h-100">
    <v-card class="h-100 hover-lift d-flex flex-column" :elevation="1">
      <div class="cover">
        <v-img v-if="post.cover_image" :src="post.cover_image" :alt="post.title" cover :aspect-ratio="16 / 9" />
        <div v-else class="cover-ph d-flex align-center justify-center">
          <img src="/logo.svg" alt="" width="64" height="64">
        </div>
        <v-chip v-if="post.category_name" class="cat-chip" size="small" variant="flat" :color="post.category_color || 'primary'">
          {{ post.category_name }}
        </v-chip>
        <v-icon v-if="post.is_pinned" class="pin" icon="mdi-pin" color="secondary" />
      </div>
      <v-card-text class="flex-grow-1 d-flex flex-column">
        <h3 class="title line-clamp-2 mb-2">{{ post.title }}</h3>
        <p v-if="!compact && post.excerpt" class="text-body-2 text-medium-emphasis line-clamp-2 mb-2">{{ post.excerpt }}</p>
        <v-spacer />
        <div class="text-caption text-medium-emphasis d-flex ga-3">
          <span><v-icon size="14" icon="mdi-calendar-blank-outline" /> {{ thaiDate(post.published_at) }}</span>
          <span><v-icon size="14" icon="mdi-eye-outline" /> {{ post.view_count?.toLocaleString() }}</span>
        </div>
      </v-card-text>
    </v-card>
  </NuxtLink>
</template>

<script setup lang="ts">
defineProps<{ post: any, compact?: boolean }>()
</script>

<style scoped>
.cover { position: relative; }
.cover-ph { aspect-ratio: 16/9; background: linear-gradient(135deg, #0B3A6E, #174E8C); }
.cover-ph img { opacity: .5; }
.cat-chip { position: absolute; top: 10px; left: 10px; }
.pin { position: absolute; top: 10px; right: 10px; background: #fff; border-radius: 50%; padding: 14px; }
.title { font-family: 'Prompt', sans-serif; font-size: 1.02rem; font-weight: 500; line-height: 1.45; color: #1A2B3C; }
</style>

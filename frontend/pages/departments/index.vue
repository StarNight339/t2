<template>
  <div>
    <PageHeader title="แผนกวิชา" subtitle="สาขาวิชาที่เปิดสอนในระดับ ปวช. และ ปวส." :crumbs="[{ title: 'แผนกวิชา' }]" />
    <div class="container-x">
      <v-row>
        <v-col v-for="d in items" :key="d.id" cols="12" sm="6" md="4">
          <NuxtLink :to="`/departments/${d.slug}`" class="d-block h-100">
            <v-card class="h-100 hover-lift" elevation="1">
              <v-img v-if="d.image_url" :src="d.image_url" :alt="d.name" height="170" cover />
              <div v-else class="ph d-flex align-center justify-center"><v-icon icon="mdi-tools" size="56" color="white" /></div>
              <v-card-title class="text-wrap">{{ d.name }}</v-card-title>
              <v-card-text class="text-medium-emphasis line-clamp-2">{{ d.description || ' ' }}</v-card-text>
            </v-card>
          </NuxtLink>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data } = await useFetch<any>('/api/departments', { query: { all: 1, type: 'department' } })
const items = computed(() => data.value?.items || [])
useSeoMeta({ title: 'แผนกวิชา' })
</script>

<style scoped>
.ph { height: 170px; background: linear-gradient(135deg, #0B3A6E, #174E8C); }
</style>

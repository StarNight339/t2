<template>
  <div>
    <PageHeader :title="title" :crumbs="[{ title: 'ข่าวสาร' }]" />
    <div class="container-x">
      <!-- ตัวกรอง -->
      <div class="d-flex flex-wrap align-center ga-3 mb-6">
        <v-chip-group :model-value="category" selected-class="bg-primary" @update:model-value="setCategory">
          <v-chip value="" variant="outlined" filter>ทั้งหมด</v-chip>
          <v-chip v-for="c in site?.categories || []" :key="c.id" :value="c.slug" variant="outlined" filter>{{ c.name }}</v-chip>
        </v-chip-group>
        <v-spacer />
        <form class="search" @submit.prevent="applySearch">
          <v-text-field v-model="search" placeholder="ค้นหาข่าว" prepend-inner-icon="mdi-magnify" hide-details density="compact" clearable @click:clear="search = ''; applySearch()" />
        </form>
      </div>

      <p v-if="route.query.q" class="mb-4 text-medium-emphasis">
        ผลการค้นหา “{{ route.query.q }}” พบ {{ total }} รายการ
      </p>

      <v-row v-if="items.length">
        <v-col v-for="p in items" :key="p.id" cols="12" sm="6" md="4"><NewsCard :post="p" /></v-col>
      </v-row>
      <div v-else-if="!pending" class="text-center py-16 text-medium-emphasis">
        <v-icon icon="mdi-newspaper-variant-outline" size="56" class="mb-2" />
        <div>ไม่พบข่าว</div>
      </div>

      <div v-if="pages > 1" class="d-flex justify-center mt-8">
        <v-pagination :model-value="page" :length="pages" :total-visible="7" rounded="circle" color="primary" @update:model-value="setPage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: site } = await useSite()

const category = computed(() => String(route.query.category || ''))
const page = computed(() => Number(route.query.page || 1))
const search = ref(String(route.query.q || ''))
const perPage = 12

const { data, pending } = await useFetch<any>('/api/posts', {
  query: computed(() => ({ page: page.value, perPage, category: category.value || undefined, q: route.query.q || undefined, tag: route.query.tag || undefined })),
})
const items = computed(() => data.value?.items || [])
const total = computed(() => data.value?.total || 0)
const pages = computed(() => Math.ceil(total.value / perPage))

const title = computed(() => site.value?.categories.find((c: any) => c.slug === category.value)?.name || 'ข่าวประชาสัมพันธ์')

function go(q: Record<string, any>) {
  navigateTo({ query: Object.fromEntries(Object.entries({ ...route.query, ...q }).filter(([, v]) => v)) })
  if (import.meta.client) window.scrollTo({ top: 0, behavior: 'smooth' })
}
const setCategory = (v: any) => go({ category: v || undefined, page: undefined })
const setPage = (p: number) => go({ page: p > 1 ? p : undefined })
const applySearch = () => go({ q: search.value || undefined, page: undefined })

useSeoMeta({ title })
</script>

<style scoped>
.search { width: 280px; max-width: 100%; }
</style>

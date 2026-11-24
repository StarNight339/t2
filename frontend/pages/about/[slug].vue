<template>
  <div v-if="page">
    <PageHeader :title="page.title" :crumbs="[{ title: 'เกี่ยวกับวิทยาลัย' }, { title: page.title }]" />
    <div class="container-x">
      <v-row>
        <v-col cols="12" md="3" order="2" order-md="1">
          <v-card elevation="1">
            <v-list nav density="comfortable">
              <v-list-subheader>เกี่ยวกับวิทยาลัย</v-list-subheader>
              <v-list-item v-for="p in site?.pages || []" :key="p.id" :to="`/about/${p.slug}`" :title="p.title" color="primary" />
              <v-list-item to="/personnel" title="ทำเนียบบุคลากร" color="primary" />
            </v-list>
          </v-card>
        </v-col>
        <v-col cols="12" md="9" order="1" order-md="2">
          <v-card elevation="1" class="pa-5 pa-md-8">
            <div class="prose" v-html="page.content" />
            <p class="text-caption text-medium-emphasis mt-6">ปรับปรุงล่าสุด {{ thaiDate(page.updated_at) }}</p>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const { data: site } = await useSite()
const { data, error } = await useFetch<any>(() => `/api/pages/${encodeURIComponent(String(route.params.slug))}`)
if (error.value) throw createError({ statusCode: 404, message: 'ไม่พบหน้านี้', fatal: true })
const page = computed(() => data.value?.data)
useSeoMeta({ title: () => page.value?.title })
</script>

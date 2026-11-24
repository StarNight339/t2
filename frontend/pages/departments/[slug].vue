<template>
  <div v-if="dept">
    <PageHeader :title="dept.name" :crumbs="[{ title: 'แผนกวิชา', to: '/departments' }, { title: dept.name }]" />
    <div class="container-x">
      <v-card elevation="1" class="pa-5 pa-md-6 mb-8">
        <v-row align="center">
          <v-col v-if="dept.image_url" cols="12" md="5"><v-img :src="dept.image_url" :alt="dept.name" class="rounded-lg" /></v-col>
          <v-col cols="12" :md="dept.image_url ? 7 : 12">
            <p class="text-body-1" style="white-space: pre-line">{{ dept.description || 'ยังไม่มีรายละเอียด' }}</p>
          </v-col>
        </v-row>
      </v-card>

      <section v-if="people.length" class="mb-10">
        <h2 class="section-title">บุคลากรในแผนก</h2>
        <v-row>
          <v-col v-for="p in people" :key="p.id" cols="6" sm="4" md="3" lg="2"><PersonCard :p="p" /></v-col>
        </v-row>
      </section>

      <section>
        <div class="d-flex align-center">
          <h2 class="section-title">ข่าวของแผนก</h2>
          <v-spacer />
        </div>
        <v-row v-if="news.length">
          <v-col v-for="p in news" :key="p.id" cols="12" sm="6" md="4"><NewsCard :post="p" /></v-col>
        </v-row>
        <p v-else class="text-medium-emphasis">ยังไม่มีข่าว</p>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const slug = String(route.params.slug)
const { data, error } = await useFetch<any>(`/api/departments/${encodeURIComponent(slug)}`)
if (error.value) throw createError({ statusCode: 404, message: 'ไม่พบแผนกนี้', fatal: true })
const [{ data: ppl }, { data: posts }] = await Promise.all([
  useFetch<any>('/api/personnel', { query: { all: 1, department: slug } }),
  useFetch<any>('/api/posts', { query: { department: slug, perPage: 6 } }),
])
const dept = computed(() => data.value?.data)
const people = computed(() => ppl.value?.items || [])
const news = computed(() => posts.value?.items || [])
useSeoMeta({ title: () => dept.value?.name })
</script>

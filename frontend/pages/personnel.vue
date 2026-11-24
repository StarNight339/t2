<template>
  <div>
    <PageHeader title="ทำเนียบบุคลากร" :crumbs="[{ title: 'เกี่ยวกับวิทยาลัย' }, { title: 'ทำเนียบบุคลากร' }]" />
    <div class="container-x">
      <div class="d-flex justify-end mb-6">
        <v-select
          v-model="dept" :items="[{ title: 'ทุกแผนก/งาน', value: '' }, ...deptItems]"
          label="แผนก / งาน" hide-details density="compact" style="max-width: 320px"
        />
      </div>

      <template v-if="!dept">
        <section v-for="g in groups" v-show="g.items.length" :key="g.level" class="mb-10">
          <h2 class="section-title">{{ g.label }}</h2>
          <v-row :justify="g.level === 'director' ? 'center' : 'start'">
            <v-col v-for="p in g.items" :key="p.id" cols="6" sm="4" md="3" :lg="g.level === 'director' ? 3 : 2">
              <PersonCard :p="p" :big="g.level === 'director'" show-dept />
            </v-col>
          </v-row>
        </section>
      </template>
      <v-row v-else>
        <v-col v-for="p in items" :key="p.id" cols="6" sm="4" md="3" lg="2"><PersonCard :p="p" /></v-col>
      </v-row>

      <div v-if="!items.length" class="text-center text-medium-emphasis py-16">ยังไม่มีข้อมูลบุคลากร</div>
    </div>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const dept = ref(String(route.query.department || ''))
const { data } = await useFetch<any>('/api/personnel', { query: computed(() => ({ all: 1, department: dept.value || undefined })) })
const { data: depts } = await useFetch<any>('/api/departments', { query: { all: 1 } })
const items = computed<any[]>(() => data.value?.items || [])
const deptItems = computed(() => (depts.value?.items || []).map((d: any) => ({ title: d.name, value: d.slug })))

const LEVELS = [
  { level: 'director', label: 'ผู้อำนวยการ' },
  { level: 'deputy', label: 'รองผู้อำนวยการ' },
  { level: 'head', label: 'หัวหน้าแผนก / หัวหน้างาน' },
  { level: 'staff', label: 'ครูและบุคลากร' },
]
const groups = computed(() => LEVELS.map((l) => ({ ...l, items: items.value.filter((p) => p.admin_level === l.level) })))

useSeoMeta({ title: 'ทำเนียบบุคลากร' })
</script>

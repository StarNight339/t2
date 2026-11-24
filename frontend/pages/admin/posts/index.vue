<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-text-field v-model="search" placeholder="ค้นหาหัวข้อข่าว" prepend-inner-icon="mdi-magnify" hide-details density="compact" clearable style="max-width: 280px" />
      <v-select v-model="status" :items="statusItems" label="สถานะ" hide-details density="compact" style="max-width: 180px" />
      <v-select v-model="category" :items="catItems" label="หมวด" hide-details density="compact" style="max-width: 220px" />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" to="/admin/posts/new">เขียนข่าวใหม่</v-btn>
    </div>

    <v-card elevation="1">
      <v-data-table-server
        v-model:page="page" v-model:items-per-page="perPage"
        :headers="headers" :items="items" :items-length="total" :loading="loading"
        items-per-page-text="แสดงต่อหน้า" no-data-text="ไม่พบข่าว" loading-text="กำลังโหลด..."
        @update:options="load"
      >
        <template #item.title="{ item }">
          <div class="d-flex align-center ga-3 py-2">
            <v-img :src="item.cover_image || '/logo.svg'" width="64" height="42" max-width="64" cover class="rounded bg-primary flex-shrink-0" />
            <div>
              <NuxtLink :to="`/admin/posts/${item.id}`" class="font-weight-medium title-link">{{ item.title }}</NuxtLink>
              <div class="text-caption text-medium-emphasis">
                <v-icon v-if="item.is_pinned" size="12" icon="mdi-pin" color="secondary" />
                <v-icon v-if="item.is_urgent" size="12" icon="mdi-bullhorn" color="accent" />
                {{ item.author_name }}<span v-if="item.department_name"> · {{ item.department_name }}</span>
              </div>
            </div>
          </div>
        </template>
        <template #item.category_name="{ item }">
          <v-chip size="small" variant="tonal" :color="item.category_color || 'primary'">{{ item.category_name }}</v-chip>
        </template>
        <template #item.status="{ item }">
          <v-chip size="small" :color="STATUS_LABEL[item.status].color">{{ STATUS_LABEL[item.status].text }}</v-chip>
        </template>
        <template #item.published_at="{ item }">
          <span class="text-body-2">{{ thaiDate(item.published_at) || '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn v-if="item.status === 'published'" icon="mdi-open-in-new" size="small" variant="text" :href="`/news/${item.slug}`" target="_blank" aria-label="ดูหน้าเว็บ" />
            <v-btn v-if="auth.isEditor && item.status === 'pending'" icon="mdi-check-circle-outline" size="small" variant="text" color="success" title="อนุมัติเผยแพร่" aria-label="อนุมัติ" @click="approve(item)" />
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" :to="`/admin/posts/${item.id}`" aria-label="แก้ไข" />
            <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" aria-label="ลบ" @click="toDelete = item" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <ConfirmDialog :model-value="!!toDelete" :text="`ลบข่าว “${toDelete?.title}” ?`" @update:model-value="toDelete = null" @confirm="remove" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', title: 'ข่าว / ประกาศ' })
const auth = useAuthStore()
const route = useRoute()
const { api } = useApi()
const { ok, fail } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const loading = ref(false)
const search = ref('')
const status = ref(String(route.query.status || ''))
const category = ref<number | ''>('')
const toDelete = ref<any>(null)

const headers = [
  { title: 'หัวข้อข่าว', key: 'title', sortable: false },
  { title: 'หมวด', key: 'category_name', sortable: false },
  { title: 'สถานะ', key: 'status', sortable: false },
  { title: 'วันที่เผยแพร่', key: 'published_at', sortable: false },
  { title: 'อ่าน', key: 'view_count', sortable: false, align: 'end' as const },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
const statusItems = [{ title: 'ทุกสถานะ', value: '' }, ...Object.entries(STATUS_LABEL).map(([value, s]) => ({ title: s.text, value }))]
const cats = ref<any[]>([])
const catItems = computed(() => [{ title: 'ทุกหมวด', value: '' }, ...cats.value.map((c) => ({ title: c.name, value: c.id }))])

async function load() {
  loading.value = true
  try {
    const res = await api<any>('/api/admin/posts', {
      query: { page: page.value, perPage: perPage.value, search: search.value || undefined, status: status.value || undefined, category_id: category.value || undefined },
    })
    items.value = res.items
    total.value = res.total
  } catch (e: any) { fail(e.message) } finally { loading.value = false }
}

let timer: any
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; load() }, 350) })
watch([status, category], () => { page.value = 1; load() })
onMounted(async () => { cats.value = (await api<any>('/api/admin/categories', { query: { all: 1 } })).items })

async function approve(item: any) {
  try {
    await api(`/api/admin/posts/${item.id}`, { method: 'PUT', body: { status: 'published' } })
    ok('อนุมัติเผยแพร่แล้ว')
    load()
  } catch (e: any) { fail(e.message) }
}
async function remove() {
  try {
    await api(`/api/admin/posts/${toDelete.value.id}`, { method: 'DELETE' })
    ok('ลบข่าวแล้ว')
    toDelete.value = null
    load()
  } catch (e: any) { fail(e.message) }
}
</script>

<style scoped>
.title-link:hover { color: rgb(var(--v-theme-primary)); text-decoration: underline; }
</style>

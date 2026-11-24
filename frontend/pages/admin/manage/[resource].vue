<template>
  <div v-if="def">
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-text-field v-model="search" placeholder="ค้นหา" prepend-inner-icon="mdi-magnify" hide-details density="compact" clearable style="max-width: 280px" />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-plus" @click="openForm()">เพิ่ม{{ def.title }}</v-btn>
    </div>

    <v-card elevation="1">
      <v-data-table-server
        v-model:page="page" v-model:items-per-page="perPage"
        :headers="headers" :items="items" :items-length="total" :loading="loading"
        items-per-page-text="แสดงต่อหน้า" no-data-text="ยังไม่มีข้อมูล" loading-text="กำลังโหลด..."
        @update:options="load"
      >
        <template v-for="c in def.columns" :key="c.key" #[`item.${c.key}`]="{ item }">
          <v-img v-if="c.type === 'image'" :src="item[c.key] || '/logo.svg'" width="72" height="46" cover class="rounded my-1 bg-grey-lighten-3" />
          <v-icon v-else-if="c.type === 'bool'" :icon="item[c.key] ? 'mdi-check-circle' : 'mdi-minus-circle-outline'" :color="item[c.key] ? 'success' : 'grey'" />
          <span v-else-if="c.type === 'datetime'" class="text-body-2">{{ thaiDate(item[c.key], true) || '-' }}</span>
          <span v-else-if="c.type === 'color'" class="swatch" :style="{ background: item[c.key] || '#ccc' }" />
          <v-img v-else-if="c.type === 'youtube'" :src="`https://i.ytimg.com/vi/${item[c.key]}/mqdefault.jpg`" width="96" height="54" cover class="rounded my-1" />
          <span v-else>{{ item[c.key] ?? '-' }}</span>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" aria-label="แก้ไข" @click="openForm(item)" />
            <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" aria-label="ลบ" @click="toDelete = item" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- ฟอร์มเพิ่ม/แก้ไข -->
    <v-dialog v-model="dialog" :max-width="def.wide ? 960 : 640" scrollable persistent>
      <v-card>
        <v-card-title class="d-flex align-center">
          {{ editingId ? 'แก้ไข' : 'เพิ่ม' }}{{ def.title }}
          <v-spacer />
          <v-btn icon="mdi-close" variant="text" size="small" aria-label="ปิด" @click="dialog = false" />
        </v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-row dense>
              <v-col v-for="fd in def.fields" :key="fd.key" cols="12" :sm="fd.cols || 12">
                <AdminUploadField v-if="fd.type === 'image'" v-model="form[fd.key]" :label="fd.label + (fd.required ? ' *' : '')" class="mb-4" />
                <div v-else-if="fd.type === 'html'" class="mb-4">
                  <div class="text-body-2 mb-1">{{ fd.label }}</div>
                  <AdminRichEditor v-model="form[fd.key]" />
                </div>
                <v-switch v-else-if="fd.type === 'switch'" v-model="form[fd.key]" :label="fd.label" color="primary" hide-details density="compact" />
                <v-select
                  v-else-if="fd.type === 'select'" v-model="form[fd.key]" :label="fd.label + (fd.required ? ' *' : '')"
                  :items="fd.source ? (sources[fd.source] || []) : fd.options" :item-title="fd.source ? 'name' : 'title'" :item-value="fd.source ? 'id' : 'value'"
                  :clearable="!fd.required" :rules="fd.required ? [req] : []"
                />
                <v-textarea v-else-if="fd.type === 'textarea'" v-model="form[fd.key]" :label="fd.label" rows="3" auto-grow :hint="fd.hint" :persistent-hint="!!fd.hint" />
                <v-text-field
                  v-else v-model="form[fd.key]" :label="fd.label + (fd.required ? ' *' : '')"
                  :type="fd.type === 'datetime' ? 'datetime-local' : fd.type === 'number' ? 'number' : fd.type === 'color' ? 'color' : 'text'"
                  :rules="fd.required ? [req] : []" :hint="fd.hint" :persistent-hint="!!fd.hint"
                />
              </v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-divider />
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog :model-value="!!toDelete" text="ต้องการลบรายการนี้ใช่หรือไม่?" @update:model-value="toDelete = null" @confirm="remove" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', roles: ['admin', 'editor'], key: (r) => r.fullPath })

const route = useRoute()
const { api } = useApi()
const { ok, fail } = useToast()

const name = computed(() => String(route.params.resource))
const def = computed(() => RESOURCES[name.value])
if (!def.value) navigateTo('/admin')

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const form = reactive<Record<string, any>>({})
const formRef = ref()
const toDelete = ref<any>(null)
const sources = reactive<Record<string, any[]>>({})

const headers = computed(() => [
  ...def.value.columns.map((c) => ({ title: c.title, key: c.key, sortable: false })),
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
])
const req = (v: any) => (v !== null && v !== undefined && String(v).trim() !== '') || 'จำเป็นต้องกรอก'

async function load() {
  loading.value = true
  try {
    const res = await api<any>(`/api/admin/${name.value}`, { query: { page: page.value, perPage: perPage.value, search: search.value || undefined } })
    items.value = res.items
    total.value = res.total
  } catch (e: any) { fail(e.message) } finally { loading.value = false }
}
let timer: any
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; load() }, 350) })

onMounted(async () => {
  const need = [...new Set(def.value.fields.map((f) => f.source).filter(Boolean))] as string[]
  for (const s of need) sources[s] = (await api<any>(`/api/admin/${s}`, { query: { all: 1 } })).items
})

function openForm(item?: any) {
  editingId.value = item?.id ?? null
  for (const k of Object.keys(form)) delete form[k]
  for (const fd of def.value.fields) {
    let v = item ? item[fd.key] : fd.default ?? (fd.type === 'switch' ? false : '')
    if (fd.type === 'switch') v = !!v
    if (fd.type === 'datetime') v = toInputDateTime(v)
    form[fd.key] = v ?? ''
  }
  dialog.value = true
}

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  const missingImg = def.value.fields.find((f) => f.type === 'image' && f.required && !form[f.key])
  if (missingImg) return fail(`กรุณาใส่${missingImg.label}`)
  const body = { ...form }
  if (name.value === 'videos') body.youtube_id = youtubeId(body.youtube_id)
  saving.value = true
  try {
    if (editingId.value) await api(`/api/admin/${name.value}/${editingId.value}`, { method: 'PUT', body })
    else await api(`/api/admin/${name.value}`, { method: 'POST', body })
    ok('บันทึกเรียบร้อย')
    dialog.value = false
    load()
  } catch (e: any) { fail(e.message) } finally { saving.value = false }
}

async function remove() {
  try {
    await api(`/api/admin/${name.value}/${toDelete.value.id}`, { method: 'DELETE' })
    ok('ลบเรียบร้อย')
    toDelete.value = null
    load()
  } catch (e: any) { fail(e.message); toDelete.value = null }
}
</script>

<style scoped>
.swatch { display: inline-block; width: 22px; height: 22px; border-radius: 50%; border: 1px solid #ddd; vertical-align: middle; }
</style>

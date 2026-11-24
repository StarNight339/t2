<template>
  <div>
    <div class="d-flex flex-wrap align-center ga-3 mb-4">
      <v-text-field v-model="search" placeholder="ค้นหาชื่อ / อีเมล" prepend-inner-icon="mdi-magnify" hide-details density="compact" clearable style="max-width: 280px" />
      <v-spacer />
      <v-btn color="primary" prepend-icon="mdi-account-plus" @click="openForm()">เพิ่มผู้ใช้</v-btn>
    </div>

    <v-alert type="info" variant="tonal" density="compact" class="mb-4 text-body-2">
      <b>ผู้ดูแลระบบ</b> จัดการได้ทุกอย่าง · <b>บรรณาธิการ</b> จัดการเนื้อหาและอนุมัติข่าว · <b>ผู้เขียนข่าว</b> เขียนข่าวของตัวเองแล้วส่งอนุมัติ
    </v-alert>

    <v-card elevation="1">
      <v-data-table-server
        v-model:page="page" v-model:items-per-page="perPage" :headers="headers" :items="items" :items-length="total" :loading="loading"
        items-per-page-text="แสดงต่อหน้า" no-data-text="ไม่พบผู้ใช้" @update:options="load"
      >
        <template #item.full_name="{ item }">
          <div class="font-weight-medium">{{ item.full_name }}</div>
          <div class="text-caption text-medium-emphasis">{{ item.username }} · {{ item.email }}</div>
        </template>
        <template #item.role="{ item }"><v-chip size="small" :color="item.role === 'admin' ? 'primary' : item.role === 'editor' ? 'secondary' : 'grey'">{{ ROLE_LABEL[item.role] }}</v-chip></template>
        <template #item.is_active="{ item }"><v-icon :icon="item.is_active ? 'mdi-check-circle' : 'mdi-cancel'" :color="item.is_active ? 'success' : 'error'" /></template>
        <template #item.last_login_at="{ item }"><span class="text-body-2">{{ thaiDate(item.last_login_at, true) || 'ยังไม่เคย' }}</span></template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil-outline" size="small" variant="text" aria-label="แก้ไข" @click="openForm(item)" />
            <v-btn icon="mdi-delete-outline" size="small" variant="text" color="error" aria-label="ลบ" :disabled="item.id === auth.user?.id" @click="toDelete = item" />
          </div>
        </template>
      </v-data-table-server>
    </v-card>

    <v-dialog v-model="dialog" max-width="560" persistent>
      <v-card>
        <v-card-title>{{ editingId ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้' }}</v-card-title>
        <v-divider />
        <v-card-text>
          <v-form ref="formRef">
            <v-row dense>
              <v-col cols="12"><v-text-field v-model="f.full_name" label="ชื่อ-สกุล *" :rules="[req]" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="f.username" label="ชื่อผู้ใช้ *" :rules="[req]" autocomplete="off" /></v-col>
              <v-col cols="12" sm="6"><v-text-field v-model="f.email" label="อีเมล *" type="email" :rules="[req]" /></v-col>
              <v-col cols="12" sm="6"><v-select v-model="f.role_id" :items="roleItems" label="สิทธิ์ *" :rules="[req]" /></v-col>
              <v-col cols="12" sm="6"><v-select v-model="f.department_id" :items="depts" item-title="name" item-value="id" label="แผนก / งาน" clearable /></v-col>
              <v-col cols="12">
                <v-text-field
                  v-model="f.password" :label="editingId ? 'รหัสผ่านใหม่ (เว้นว่างถ้าไม่เปลี่ยน)' : 'รหัสผ่าน *'" type="password" autocomplete="new-password"
                  :rules="editingId ? [pwOpt] : [req, pwOpt]"
                />
              </v-col>
              <v-col cols="12"><v-switch v-model="f.is_active" label="เปิดใช้งานบัญชี" color="primary" hide-details /></v-col>
            </v-row>
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="dialog = false">ยกเลิก</v-btn>
          <v-btn color="primary" variant="flat" :loading="saving" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog :model-value="!!toDelete" :text="`ลบผู้ใช้ ${toDelete?.full_name}?`" @update:model-value="toDelete = null" @confirm="remove" />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', title: 'ผู้ใช้งาน', roles: ['admin'] })
const auth = useAuthStore()
const { api } = useApi()
const { ok, fail } = useToast()

const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(20)
const loading = ref(false)
const search = ref('')
const dialog = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref()
const toDelete = ref<any>(null)
const roles = ref<any[]>([])
const depts = ref<any[]>([])
const f = reactive<any>({})

const headers = [
  { title: 'ผู้ใช้', key: 'full_name', sortable: false },
  { title: 'สิทธิ์', key: 'role', sortable: false },
  { title: 'แผนก/งาน', key: 'department_name', sortable: false },
  { title: 'เข้าใช้ล่าสุด', key: 'last_login_at', sortable: false },
  { title: 'สถานะ', key: 'is_active', sortable: false },
  { title: '', key: 'actions', sortable: false, align: 'end' as const },
]
const roleItems = computed(() => roles.value.map((r) => ({ title: ROLE_LABEL[r.name] || r.name, value: r.id })))
const req = (v: any) => (v !== null && v !== undefined && String(v).trim() !== '') || 'จำเป็นต้องกรอก'
const pwOpt = (v: string) => !v || v.length >= 8 || 'อย่างน้อย 8 ตัวอักษร'

async function load() {
  loading.value = true
  try {
    const res = await api<any>('/api/admin/users', { query: { page: page.value, perPage: perPage.value, search: search.value || undefined } })
    items.value = res.items
    total.value = res.total
  } catch (e: any) { fail(e.message) } finally { loading.value = false }
}
let timer: any
watch(search, () => { clearTimeout(timer); timer = setTimeout(() => { page.value = 1; load() }, 350) })
onMounted(async () => {
  roles.value = (await api<any>('/api/admin/roles')).items
  depts.value = (await api<any>('/api/admin/departments', { query: { all: 1 } })).items
})

function openForm(u?: any) {
  editingId.value = u?.id ?? null
  Object.assign(f, {
    full_name: u?.full_name || '', username: u?.username || '', email: u?.email || '',
    role_id: u?.role_id ?? 3, department_id: u?.department_id ?? null, is_active: u ? !!u.is_active : true, password: '',
  })
  dialog.value = true
}
async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    const body = { ...f }
    if (!body.password) delete body.password
    if (editingId.value) await api(`/api/admin/users/${editingId.value}`, { method: 'PUT', body })
    else await api('/api/admin/users', { method: 'POST', body })
    ok('บันทึกเรียบร้อย')
    dialog.value = false
    load()
  } catch (e: any) { fail(e.message) } finally { saving.value = false }
}
async function remove() {
  try {
    await api(`/api/admin/users/${toDelete.value.id}`, { method: 'DELETE' })
    ok('ลบผู้ใช้แล้ว')
    load()
  } catch (e: any) { fail(e.message) } finally { toDelete.value = null }
}
</script>

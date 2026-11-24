<template>
  <v-card elevation="1">
    <v-data-table-server
      v-model:page="page" v-model:items-per-page="perPage" :headers="headers" :items="items" :items-length="total" :loading="loading"
      items-per-page-text="แสดงต่อหน้า" no-data-text="ยังไม่มีประวัติ" @update:options="load"
    >
      <template #item.created_at="{ item }">{{ thaiDate(item.created_at, true) }}</template>
      <template #item.action="{ item }"><v-chip size="small" :color="COLORS[item.action] || 'grey'">{{ LABELS[item.action] || item.action }}</v-chip></template>
      <template #item.table_name="{ item }">{{ item.table_name ? `${item.table_name}${item.record_id ? ' #' + item.record_id : ''}` : '-' }}</template>
    </v-data-table-server>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'ประวัติการใช้งาน', roles: ['admin'] })
const { api } = useApi()
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const perPage = ref(30)
const loading = ref(false)
const headers = [
  { title: 'เวลา', key: 'created_at', sortable: false },
  { title: 'ผู้ใช้', key: 'full_name', sortable: false },
  { title: 'การกระทำ', key: 'action', sortable: false },
  { title: 'ข้อมูล', key: 'table_name', sortable: false },
  { title: 'IP', key: 'ip_address', sortable: false },
]
const LABELS: Record<string, string> = { login: 'เข้าสู่ระบบ', create: 'เพิ่ม', update: 'แก้ไข', delete: 'ลบ' }
const COLORS: Record<string, string> = { login: 'info', create: 'success', update: 'warning', delete: 'error' }

async function load() {
  loading.value = true
  try {
    const res = await api<any>('/api/admin/logs', { query: { page: page.value, perPage: perPage.value } })
    items.value = res.items
    total.value = res.total
  } finally { loading.value = false }
}
</script>

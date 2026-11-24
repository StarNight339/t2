<template>
  <div>
    <div class="d-flex align-center ga-3 mb-4">
      <v-btn-toggle v-model="status" mandatory density="compact" color="primary" variant="outlined">
        <v-btn value="">ทั้งหมด</v-btn>
        <v-btn value="new">ใหม่</v-btn>
        <v-btn value="read">อ่านแล้ว</v-btn>
        <v-btn value="replied">ตอบแล้ว</v-btn>
      </v-btn-toggle>
    </div>

    <v-row>
      <v-col cols="12" md="5">
        <v-card elevation="1">
          <v-list lines="three" class="py-0">
            <template v-for="(m, i) in items" :key="m.id">
              <v-divider v-if="i" />
              <v-list-item :active="sel?.id === m.id" color="primary" @click="open(m)">
                <v-list-item-title :class="{ 'font-weight-bold': m.status === 'new' }">{{ m.subject }}</v-list-item-title>
                <v-list-item-subtitle>{{ m.name }} · {{ thaiDate(m.created_at, true) }}</v-list-item-subtitle>
                <template #append><v-chip size="x-small" :color="ST[m.status].color">{{ ST[m.status].text }}</v-chip></template>
              </v-list-item>
            </template>
            <v-list-item v-if="!items.length && !loading" title="ไม่มีข้อความ" class="text-center py-6" />
          </v-list>
          <v-divider />
          <div v-if="pages > 1" class="pa-2"><v-pagination v-model="page" :length="pages" density="compact" @update:model-value="load" /></div>
        </v-card>
      </v-col>
      <v-col cols="12" md="7">
        <v-card v-if="sel" elevation="1" class="pa-5">
          <div class="d-flex align-start">
            <div>
              <h2 class="text-h6">{{ sel.subject }}</h2>
              <div class="text-body-2 text-medium-emphasis">{{ thaiDateLong(sel.created_at) }} {{ timeOf(sel.created_at) }}</div>
            </div>
            <v-spacer />
            <v-btn icon="mdi-delete-outline" variant="text" color="error" aria-label="ลบ" @click="confirmDel = true" />
          </div>
          <v-divider class="my-4" />
          <div class="d-flex flex-wrap ga-4 text-body-2 mb-4">
            <span><v-icon size="16" icon="mdi-account" /> {{ sel.name }}</span>
            <a v-if="sel.email" :href="`mailto:${sel.email}?subject=${encodeURIComponent('Re: ' + sel.subject)}`" class="text-primary"><v-icon size="16" icon="mdi-email" /> {{ sel.email }}</a>
            <a v-if="sel.phone" :href="`tel:${sel.phone}`" class="text-primary"><v-icon size="16" icon="mdi-phone" /> {{ sel.phone }}</a>
          </div>
          <p style="white-space: pre-line">{{ sel.message }}</p>
          <v-divider class="my-4" />
          <div class="d-flex ga-2">
            <v-btn v-if="sel.email" color="primary" prepend-icon="mdi-reply" :href="`mailto:${sel.email}?subject=${encodeURIComponent('Re: ' + sel.subject)}`" @click="setStatus('replied')">ตอบกลับทางอีเมล</v-btn>
            <v-btn variant="tonal" @click="setStatus('replied')">ทำเครื่องหมายว่าตอบแล้ว</v-btn>
          </div>
        </v-card>
        <v-card v-else elevation="0" class="border text-center text-medium-emphasis py-16">เลือกข้อความเพื่ออ่าน</v-card>
      </v-col>
    </v-row>

    <ConfirmDialog v-model="confirmDel" text="ลบข้อความนี้?" @confirm="remove" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'ข้อความติดต่อ', roles: ['admin', 'editor'] })
const { api } = useApi()
const { ok, fail } = useToast()

const ST: Record<string, { text: string, color: string }> = {
  new: { text: 'ใหม่', color: 'accent' }, read: { text: 'อ่านแล้ว', color: 'grey' }, replied: { text: 'ตอบแล้ว', color: 'success' },
}
const items = ref<any[]>([])
const total = ref(0)
const page = ref(1)
const status = ref('')
const loading = ref(false)
const sel = ref<any>(null)
const confirmDel = ref(false)
const pages = computed(() => Math.ceil(total.value / 20))

async function load() {
  loading.value = true
  try {
    const res = await api<any>('/api/admin/messages', { query: { page: page.value, status: status.value || undefined } })
    items.value = res.items
    total.value = res.total
  } catch (e: any) { fail(e.message) } finally { loading.value = false }
}
watch(status, () => { page.value = 1; sel.value = null; load() })
onMounted(load)

async function open(m: any) {
  sel.value = m
  if (m.status === 'new') {
    await api(`/api/admin/messages/${m.id}`, { method: 'PUT', body: { status: 'read' } }).catch(() => {})
    m.status = 'read'
  }
}
async function setStatus(s: string) {
  await api(`/api/admin/messages/${sel.value.id}`, { method: 'PUT', body: { status: s } })
  sel.value.status = s
  ok('อัปเดตสถานะแล้ว')
}
async function remove() {
  try {
    await api(`/api/admin/messages/${sel.value.id}`, { method: 'DELETE' })
    confirmDel.value = false
    sel.value = null
    ok('ลบแล้ว')
    load()
  } catch (e: any) { fail(e.message) }
}
</script>

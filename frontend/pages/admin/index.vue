<template>
  <div>
    <h1 class="text-h5 mb-1">สวัสดี {{ auth.user?.name }}</h1>
    <p class="text-medium-emphasis mb-6">{{ ROLE_LABEL[auth.user?.role || ''] }}<span v-if="auth.user?.department_name"> · {{ auth.user.department_name }}</span></p>

    <v-row v-if="s">
      <v-col v-for="c in cards" :key="c.label" cols="6" md="3">
        <v-card :to="c.to" elevation="1" class="pa-4">
          <div class="d-flex align-center">
            <div>
              <div class="text-caption text-medium-emphasis">{{ c.label }}</div>
              <div class="text-h5 font-weight-medium">{{ c.value.toLocaleString() }}</div>
            </div>
            <v-spacer />
            <v-avatar :color="c.color" variant="tonal" size="46"><v-icon :icon="c.icon" /></v-avatar>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <v-row v-if="s" class="mt-2">
      <v-col cols="12" md="7">
        <v-card elevation="1">
          <v-card-title class="d-flex align-center">
            ข่าวล่าสุด
            <v-spacer />
            <v-btn color="primary" prepend-icon="mdi-plus" to="/admin/posts/new" size="small">เขียนข่าว</v-btn>
          </v-card-title>
          <v-list lines="two">
            <v-list-item v-for="p in recent" :key="p.id" :to="`/admin/posts/${p.id}`">
              <v-list-item-title>{{ p.title }}</v-list-item-title>
              <v-list-item-subtitle>{{ p.category_name }} · แก้ไข {{ thaiDate(p.updated_at, true) }}</v-list-item-subtitle>
              <template #append><v-chip size="small" :color="STATUS_LABEL[p.status].color">{{ STATUS_LABEL[p.status].text }}</v-chip></template>
            </v-list-item>
            <v-list-item v-if="!recent.length" title="ยังไม่มีข่าว" />
          </v-list>
        </v-card>
      </v-col>
      <v-col cols="12" md="5">
        <v-card elevation="1" class="mb-4">
          <v-card-title>ข่าวยอดนิยม</v-card-title>
          <v-list density="compact">
            <v-list-item v-for="(p, i) in s.popular" :key="p.id" :href="`/news/${p.slug}`" target="_blank">
              <template #prepend><span class="rank mr-3">{{ i + 1 }}</span></template>
              <v-list-item-title>{{ p.title }}</v-list-item-title>
              <template #append><span class="text-caption">{{ p.view_count.toLocaleString() }} วิว</span></template>
            </v-list-item>
          </v-list>
        </v-card>
        <v-card elevation="1">
          <v-card-title>จำนวนข่าวตามหมวด</v-card-title>
          <v-card-text>
            <div v-for="c in s.byCategory" :key="c.name" class="mb-3">
              <div class="d-flex text-body-2 mb-1"><span>{{ c.name }}</span><v-spacer /><span>{{ c.total }}</span></div>
              <v-progress-linear :model-value="maxCat ? (c.total / maxCat) * 100 : 0" :color="c.color || 'primary'" height="8" rounded />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', title: 'แดชบอร์ด' })
const auth = useAuthStore()
const { api } = useApi()
const s = ref<any>(null)
const recent = ref<any[]>([])

onMounted(async () => {
  const [st, posts] = await Promise.all([api<any>('/api/admin/stats'), api<any>('/api/admin/posts', { query: { perPage: 6 } })])
  s.value = st.data
  recent.value = posts.items
})

const cards = computed(() => s.value ? [
  { label: 'ข่าวทั้งหมด', value: s.value.posts, icon: 'mdi-newspaper-variant-outline', color: 'primary', to: '/admin/posts' },
  { label: 'รออนุมัติ', value: s.value.pending, icon: 'mdi-clock-outline', color: 'warning', to: '/admin/posts?status=pending' },
  { label: 'ยอดอ่านรวม', value: s.value.views, icon: 'mdi-eye-outline', color: 'success' },
  auth.isEditor
    ? { label: 'ข้อความใหม่', value: s.value.messagesNew, icon: 'mdi-email-outline', color: 'accent', to: '/admin/messages' }
    : { label: 'กิจกรรมที่จะถึง', value: s.value.events, icon: 'mdi-calendar-outline', color: 'accent' },
] : [])
const maxCat = computed(() => Math.max(0, ...(s.value?.byCategory || []).map((c: any) => Number(c.total))))
</script>

<style scoped>
.rank { width: 24px; height: 24px; border-radius: 50%; background: #E8EEF5; display: inline-flex; align-items: center; justify-content: center; font-size: .8rem; font-weight: 600; }
</style>

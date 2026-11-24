<template>
  <v-app>
    <v-navigation-drawer v-model="drawer" :permanent="lgAndUp" :temporary="!lgAndUp" color="primary" width="260">
      <div class="d-flex align-center ga-3 pa-4">
        <img src="/logo.svg" width="40" height="40" alt="">
        <div>
          <div class="font-head font-weight-medium">ระบบจัดการเว็บไซต์</div>
          <div class="text-caption opacity-80">วิทยาลัยเทคนิคกระบี่</div>
        </div>
      </div>
      <v-divider class="opacity-25" />
      <v-list nav density="comfortable" class="pt-2">
        <template v-for="sec in menu" :key="sec.label">
          <v-list-subheader v-if="sec.label" class="text-white opacity-60">{{ sec.label }}</v-list-subheader>
          <v-list-item
            v-for="it in sec.items" :key="it.to" :to="it.to" :prepend-icon="it.icon" :title="it.label"
            :exact="it.to === '/admin'" rounded="lg" active-class="active-item"
          >
            <template v-if="it.badge" #append>
              <v-badge :content="it.badge" color="secondary" inline />
            </template>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar flat border="b" color="surface">
      <v-app-bar-nav-icon v-if="!lgAndUp" aria-label="เมนู" @click="drawer = !drawer" />
      <v-toolbar-title class="text-body-1 font-weight-medium">{{ title }}</v-toolbar-title>
      <v-btn to="/" target="_blank" variant="text" prepend-icon="mdi-open-in-new" class="d-none d-sm-flex">ดูหน้าเว็บ</v-btn>
      <v-menu>
        <template #activator="{ props }">
          <v-btn v-bind="props" variant="text" class="text-none">
            <v-avatar color="primary" size="32" class="mr-2"><span class="text-caption">{{ initials }}</span></v-avatar>
            <span class="d-none d-sm-inline">{{ auth.user?.name }}</span>
          </v-btn>
        </template>
        <v-list density="compact" min-width="220">
          <v-list-item :title="auth.user?.name" :subtitle="ROLE_LABEL[auth.user?.role || '']" />
          <v-divider />
          <v-list-item to="/admin/profile" prepend-icon="mdi-account-key-outline" title="เปลี่ยนรหัสผ่าน" />
          <v-list-item prepend-icon="mdi-logout" title="ออกจากระบบ" @click="logout" />
        </v-list>
      </v-menu>
    </v-app-bar>

    <v-main class="bg-background">
      <div class="pa-4 pa-md-6">
        <slot />
      </div>
    </v-main>

    <v-snackbar v-model="toast.show" :color="toast.color" location="top right" timeout="3000">{{ toast.text }}</v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

// ตรวจขนาดจอจากเบราว์เซอร์โดยตรง: จอกว้าง = เมนูติดด้านข้าง, จอเล็ก = เมนูเลื่อนออกมา
const lgAndUp = ref(true)
onMounted(() => {
  const mq = window.matchMedia('(min-width: 1280px)')
  const apply = () => { lgAndUp.value = mq.matches; drawer.value = mq.matches }
  apply()
  mq.addEventListener('change', apply)
})
const auth = useAuthStore()
const route = useRoute()
const { api } = useApi()
const { state: toast } = useToast()
const drawer = ref(true)

const newMessages = ref(0)
onMounted(async () => {
  if (!auth.isEditor) return
  try { newMessages.value = (await api<any>('/api/admin/messages', { query: { status: 'new', perPage: 1 } })).total } catch {}
})

const menu = computed(() => {
  const r = auth.user?.role
  const editor = r === 'admin' || r === 'editor'
  const sections: any[] = [
    { items: [{ label: 'แดชบอร์ด', to: '/admin', icon: 'mdi-view-dashboard-outline' }] },
    { label: 'ข่าวสาร', items: [
      { label: 'ข่าว / ประกาศ', to: '/admin/posts', icon: 'mdi-newspaper-variant-outline' },
      ...(editor ? [
        { label: 'หมวดข่าว', to: '/admin/manage/categories', icon: 'mdi-shape-outline' },
        { label: 'ปฏิทินกิจกรรม', to: '/admin/manage/events', icon: 'mdi-calendar-month-outline' },
      ] : []),
    ] },
  ]
  if (editor) {
    sections.push({ label: 'เนื้อหาเว็บไซต์', items: [
      { label: 'แบนเนอร์หน้าแรก', to: '/admin/manage/banners', icon: 'mdi-image-multiple-outline' },
      { label: 'หน้าเกี่ยวกับเรา', to: '/admin/manage/pages', icon: 'mdi-file-document-outline' },
      { label: 'แผนก / งาน', to: '/admin/manage/departments', icon: 'mdi-domain' },
      { label: 'บุคลากร', to: '/admin/manage/personnel', icon: 'mdi-account-tie-outline' },
      { label: 'วิดีโอ', to: '/admin/manage/videos', icon: 'mdi-youtube' },
      { label: 'ลิงก์หน่วยงาน', to: '/admin/manage/links', icon: 'mdi-link-variant' },
      { label: 'ข้อความติดต่อ', to: '/admin/messages', icon: 'mdi-email-outline', badge: newMessages.value || undefined },
    ] })
  }
  if (r === 'admin') {
    sections.push({ label: 'ระบบ', items: [
      { label: 'ผู้ใช้งาน', to: '/admin/users', icon: 'mdi-account-multiple-outline' },
      { label: 'ตั้งค่าเว็บไซต์', to: '/admin/settings', icon: 'mdi-cog-outline' },
      { label: 'ประวัติการใช้งาน', to: '/admin/logs', icon: 'mdi-history' },
    ] })
  }
  return sections
})

const title = computed(() => RESOURCES[String(route.params.resource)]?.title || (route.meta.title as string) || 'ระบบจัดการเว็บไซต์')
const initials = computed(() => (auth.user?.name || '?').trim().charAt(0))

function logout() {
  auth.logout()
  navigateTo('/admin/login')
}
</script>

<style scoped>
.active-item { background: rgba(255, 255, 255, .16) !important; color: #fff !important; box-shadow: inset 3px 0 0 var(--kb-gold); }
</style>

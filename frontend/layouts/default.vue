<template>
  <v-app>
    <!-- แถบบนสุด: ติดต่อ -->
    <div class="topbar d-none d-md-block">
      <div class="container-x d-flex align-center justify-space-between py-1 text-caption">
        <div class="d-flex ga-4">
          <span v-if="s.phone"><v-icon size="14" icon="mdi-phone" /> {{ s.phone }}</span>
          <span v-if="s.email"><v-icon size="14" icon="mdi-email-outline" /> {{ s.email }}</span>
        </div>
        <div class="d-flex ga-3 align-center">
          <a v-if="s.facebook_url" :href="s.facebook_url" target="_blank" rel="noopener" aria-label="Facebook"><v-icon size="16" icon="mdi-facebook" /></a>
          <NuxtLink to="/admin/login"><v-icon size="14" icon="mdi-lock-outline" /> สำหรับเจ้าหน้าที่</NuxtLink>
        </div>
      </div>
    </div>

    <!-- ส่วนหัว -->
    <header class="header">
      <div class="container-x d-flex align-center py-3">
        <NuxtLink to="/" class="d-flex align-center ga-3 brand">
          <img :src="s.logo_url || '/logo.svg'" alt="ตราวิทยาลัย" width="56" height="56">
          <div>
            <div class="brand-th">{{ s.site_name || 'วิทยาลัยเทคนิคกระบี่' }}</div>
            <div class="brand-en">{{ s.site_name_en || 'Krabi Technical College' }}</div>
          </div>
        </NuxtLink>
        <v-spacer />
        <v-btn class="d-md-none" icon="mdi-menu" variant="text" color="white" aria-label="เปิดเมนู" @click="drawer = true" />
      </div>

      <!-- เมนูหลัก (จอใหญ่) -->
      <nav class="mainnav d-none d-md-block">
        <div class="container-x d-flex align-center">
          <template v-for="m in menu" :key="m.label">
            <v-menu v-if="m.children" open-on-hover location="bottom start">
              <template #activator="{ props }">
                <v-btn v-bind="props" variant="text" color="white" rounded="0" class="nav-btn" :class="{ active: isActive(m) }" append-icon="mdi-chevron-down">
                  {{ m.label }}
                </v-btn>
              </template>
              <v-list density="compact" min-width="220">
                <v-list-item v-for="c in m.children" :key="c.to" :to="c.to" :title="c.label" />
              </v-list>
            </v-menu>
            <v-btn v-else :to="m.to" variant="text" color="white" rounded="0" class="nav-btn" :class="{ active: isActive(m) }">{{ m.label }}</v-btn>
          </template>
          <v-spacer />
          <form class="nav-search" role="search" @submit.prevent="doSearch">
            <input v-model="q" type="search" placeholder="ค้นหาข่าว..." aria-label="ค้นหาข่าว">
            <button type="submit" aria-label="ค้นหา"><v-icon icon="mdi-magnify" size="20" /></button>
          </form>
        </div>
      </nav>
    </header>

    <!-- เมนูมือถือ -->
    <v-navigation-drawer v-model="drawer" temporary location="right" width="290">
      <form class="pa-3" role="search" @submit.prevent="doSearch">
        <v-text-field v-model="q" placeholder="ค้นหาข่าว..." prepend-inner-icon="mdi-magnify" hide-details density="compact" />
      </form>
      <v-list nav density="comfortable">
        <template v-for="m in menu" :key="m.label">
          <v-list-group v-if="m.children" :value="m.label">
            <template #activator="{ props }"><v-list-item v-bind="props" :title="m.label" /></template>
            <v-list-item v-for="c in m.children" :key="c.to" :to="c.to" :title="c.label" @click="drawer = false" />
          </v-list-group>
          <v-list-item v-else :to="m.to" :title="m.label" @click="drawer = false" />
        </template>
        <v-divider class="my-2" />
        <v-list-item to="/admin/login" prepend-icon="mdi-lock-outline" title="สำหรับเจ้าหน้าที่" />
      </v-list>
    </v-navigation-drawer>

    <v-main>
      <slot />
    </v-main>

    <!-- ส่วนท้าย -->
    <footer class="footer">
      <div class="container-x py-10">
        <v-row>
          <v-col cols="12" md="5">
            <div class="d-flex align-center ga-3 mb-3">
              <img :src="s.logo_url || '/logo.svg'" alt="" width="48" height="48">
              <div class="font-head text-h6">{{ s.site_name }}</div>
            </div>
            <p class="text-body-2 opacity-80 mb-2">{{ s.about_short }}</p>
            <p v-if="s.address" class="text-body-2 opacity-80"><v-icon size="16" icon="mdi-map-marker-outline" /> {{ s.address }}</p>
          </v-col>
          <v-col cols="6" md="3">
            <div class="footer-h">เมนู</div>
            <NuxtLink v-for="m in quick" :key="m.to" :to="m.to" class="footer-link">{{ m.label }}</NuxtLink>
          </v-col>
          <v-col cols="6" md="4">
            <div class="footer-h">หน่วยงานที่เกี่ยวข้อง</div>
            <a v-for="l in agencyLinks" :key="l.id" :href="l.url" target="_blank" rel="noopener" class="footer-link">{{ l.title }}</a>
          </v-col>
        </v-row>
      </div>
      <div class="footer-bottom text-center text-caption py-3">
        © {{ year }} {{ s.site_name }} · งานประชาสัมพันธ์
      </div>
    </footer>
  </v-app>
</template>

<script setup lang="ts">
const { data: site } = await useSite()
const s = computed(() => site.value?.settings || {} as Record<string, string>)
const route = useRoute()
const drawer = ref(false)
const q = ref('')
const year = new Date().getFullYear() + 543

const menu = computed(() => [
  { label: 'หน้าแรก', to: '/' },
  {
    label: 'ข่าวสาร', to: '/news',
    children: [{ label: 'ข่าวทั้งหมด', to: '/news' }, ...(site.value?.categories || []).map((c: any) => ({ label: c.name, to: `/news?category=${c.slug}` }))],
  },
  {
    label: 'เกี่ยวกับวิทยาลัย', to: '/about',
    children: [...(site.value?.pages || []).map((p: any) => ({ label: p.title, to: `/about/${p.slug}` })), { label: 'ทำเนียบบุคลากร', to: '/personnel' }],
  },
  { label: 'แผนกวิชา', to: '/departments' },
  { label: 'ปฏิทินกิจกรรม', to: '/events' },
  { label: 'ติดต่อเรา', to: '/contact' },
])
const quick = [
  { label: 'ข่าวประชาสัมพันธ์', to: '/news' }, { label: 'ปฏิทินกิจกรรม', to: '/events' },
  { label: 'แผนกวิชา', to: '/departments' }, { label: 'ทำเนียบบุคลากร', to: '/personnel' }, { label: 'ติดต่อเรา', to: '/contact' },
]
const agencyLinks = computed(() => (site.value?.links || []).filter((l: any) => l.group_name !== 'system'))

function isActive(m: any) {
  return m.to === '/' ? route.path === '/' : route.path.startsWith(m.to)
}
function doSearch() {
  drawer.value = false
  navigateTo({ path: '/news', query: q.value ? { q: q.value } : {} })
}
</script>

<style scoped>
.topbar { background: var(--kb-navy-dark); color: #CFD8E3; }
.topbar a:hover { color: #fff; }
.header { background: var(--kb-navy); color: #fff; }
.brand img { border-radius: 50%; background: #fff; }
.brand-th { font-family: 'Prompt', sans-serif; font-size: 1.35rem; font-weight: 500; line-height: 1.2; }
.brand-en { font-size: .85rem; opacity: .8; letter-spacing: .5px; }
.mainnav { background: rgba(0, 0, 0, .18); border-top: 1px solid rgba(255, 255, 255, .08); }
.nav-btn { height: 48px !important; font-weight: 400; }
.nav-btn.active { box-shadow: inset 0 -3px 0 var(--kb-gold); }
.nav-search { display: flex; align-items: center; background: rgba(255, 255, 255, .12); border-radius: 8px; padding: 0 4px 0 12px; }
.nav-search input { background: transparent; border: 0; outline: 0; color: #fff; width: 170px; height: 34px; font-family: inherit; }
.nav-search input::placeholder { color: rgba(255, 255, 255, .7); }
.nav-search button { color: #fff; display: flex; padding: 4px; }
.footer { background: var(--kb-navy-dark); color: #E3E9F0; margin-top: 48px; }
.footer-h { font-family: 'Prompt', sans-serif; font-weight: 500; margin-bottom: 10px; color: var(--kb-gold); }
.footer-link { display: block; padding: 3px 0; opacity: .85; font-size: .95rem; }
.footer-link:hover { opacity: 1; text-decoration: underline; }
.footer-bottom { background: rgba(0, 0, 0, .25); opacity: .85; }
</style>

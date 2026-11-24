<template>
  <div v-if="home" class="container-x pt-6">
    <v-row>
      <!-- ================= คอลัมน์หลัก ================= -->
      <v-col cols="12" lg="8">
        <!-- แบนเนอร์ -->
        <v-card v-if="home.banners.length" elevation="1" class="mb-4 overflow-hidden">
          <v-carousel
            :height="mdAndUp ? 340 : 190" cycle interval="6000"
            hide-delimiter-background show-arrows="hover" color="secondary"
          >
            <v-carousel-item v-for="b in home.banners" :key="b.id" :src="b.image_url" cover :alt="b.title || ''">
              <component :is="b.link_url ? 'a' : 'div'" :href="b.link_url || undefined" class="d-block fill-height" />
            </v-carousel-item>
          </v-carousel>
        </v-card>
        <v-card v-else elevation="1" class="mb-4 pa-6 welcome">
          <div class="text-overline text-secondary">ยินดีต้อนรับสู่</div>
          <h1 class="welcome-title">{{ home.settings.site_name }}</h1>
          <p class="text-medium-emphasis mt-1">{{ home.settings.slogan }}</p>
        </v-card>

        <!-- ข่าวด่วน -->
        <v-card v-if="home.urgent.length" elevation="1" class="mb-4 urgent">
          <div class="d-flex align-center ga-2 px-4 pt-3 pb-1">
            <v-icon icon="mdi-bullhorn-outline" color="accent" size="20" />
            <span class="sc-title text-accent">ประกาศด่วน</span>
          </div>
          <v-list density="compact" class="py-1 bg-transparent">
            <v-list-item v-for="u in home.urgent" :key="u.id" :to="`/news/${u.slug}`" class="px-4">
              <v-list-item-title class="text-wrap">{{ u.title }}</v-list-item-title>
              <template #append><span class="text-caption text-medium-emphasis ml-2">{{ thaiDate(u.published_at) }}</span></template>
            </v-list-item>
          </v-list>
        </v-card>

        <!-- ข่าวล่าสุด -->
        <SectionCard title="ข่าวประชาสัมพันธ์ล่าสุด" icon="mdi-newspaper-variant-outline" to="/news">
          <NuxtLink v-if="featured" :to="`/news/${featured.slug}`" class="featured d-block mb-4">
            <v-row dense align="center">
              <v-col cols="12" md="6">
                <CoverImage :src="featured.cover_image" :alt="featured.title" :color="featured.category_color" class="rounded-lg overflow-hidden" />
              </v-col>
              <v-col cols="12" md="6" class="px-md-4">
                <div class="d-flex flex-wrap ga-2 mb-2">
                  <v-chip size="small" variant="tonal" :color="featured.category_color || 'primary'">{{ featured.category_name }}</v-chip>
                  <v-chip v-if="featured.is_pinned" size="small" variant="tonal" color="secondary" prepend-icon="mdi-pin">ปักหมุด</v-chip>
                </div>
                <h3 class="featured-title">{{ featured.title }}</h3>
                <p class="text-body-2 text-medium-emphasis line-clamp-3 mt-2">{{ featured.excerpt }}</p>
                <div class="text-caption text-medium-emphasis mt-3">
                  <v-icon size="14" icon="mdi-calendar-blank-outline" /> {{ thaiDate(featured.published_at) }}
                  <v-icon size="14" icon="mdi-eye-outline" class="ml-3" /> {{ featured.view_count.toLocaleString() }}
                </div>
              </v-col>
            </v-row>
          </NuxtLink>

          <v-divider v-if="others.length" class="mb-1" />
          <NewsRow v-for="p in others" :key="p.id" :post="p" />
        </SectionCard>

        <!-- ข่าวตามหมวด -->
        <SectionCard v-if="home.categories.length" title="ข่าวตามหมวดหมู่" icon="mdi-shape-outline" flush>
          <v-tabs v-model="tab" color="primary" show-arrows density="compact" class="px-2 border-b">
            <v-tab v-for="c in home.categories" :key="c.id" :value="c.id" class="text-body-2">{{ c.name }}</v-tab>
          </v-tabs>
          <v-window v-model="tab">
            <v-window-item v-for="c in home.categories" :key="c.id" :value="c.id">
              <div class="px-4 pb-2">
                <NewsRow v-for="p in c.posts" :key="p.id" :post="p" hide-category />
              </div>
              <div class="px-4 pb-4">
                <v-btn :to="`/news?category=${c.slug}`" variant="tonal" color="primary" size="small" block>ดู{{ c.name }}ทั้งหมด</v-btn>
              </div>
            </v-window-item>
          </v-window>
        </SectionCard>

        <!-- วิดีโอ -->
        <SectionCard v-if="home.videos.length" title="วิดีโอประชาสัมพันธ์" icon="mdi-youtube">
          <v-row dense>
            <v-col v-for="v in home.videos" :key="v.id" cols="12" md="4">
              <div class="video rounded-lg overflow-hidden">
                <iframe :src="`https://www.youtube-nocookie.com/embed/${v.youtube_id}`" :title="v.title" loading="lazy" allowfullscreen />
              </div>
              <div class="text-body-2 font-weight-medium mt-2 line-clamp-2">{{ v.title }}</div>
            </v-col>
          </v-row>
        </SectionCard>
      </v-col>

      <!-- ================= แถบข้าง ================= -->
      <v-col cols="12" lg="4">
        <!-- บริการด่วน -->
        <SectionCard title="บริการ" icon="mdi-apps">
          <div class="quick-grid">
            <NuxtLink v-for="q in quick" :key="q.to" :to="q.to" class="quick">
              <v-avatar color="primary" variant="tonal" size="40"><v-icon :icon="q.icon" size="22" /></v-avatar>
              <span>{{ q.label }}</span>
            </NuxtLink>
          </div>
        </SectionCard>

        <!-- กิจกรรม -->
        <SectionCard title="กิจกรรมที่จะมาถึง" icon="mdi-calendar-month-outline" to="/events" action="ปฏิทิน" flush>
          <v-list v-if="home.events.length" lines="two" class="py-0">
            <v-list-item v-for="e in home.events" :key="e.id" :to="e.post_slug ? `/news/${e.post_slug}` : '/events'" class="py-2 px-4">
              <template #prepend>
                <div class="date-box mr-3">
                  <div class="d">{{ dayMonth(e.start_at).day }}</div>
                  <div class="m">{{ dayMonth(e.start_at).month }}</div>
                </div>
              </template>
              <v-list-item-title class="text-wrap text-body-2 font-weight-medium">{{ e.title }}</v-list-item-title>
              <v-list-item-subtitle class="text-caption">
                <span v-if="!e.is_all_day">{{ timeOf(e.start_at) }} · </span>{{ e.location || 'ภายในวิทยาลัย' }}
              </v-list-item-subtitle>
            </v-list-item>
          </v-list>
          <p v-else class="text-body-2 text-medium-emphasis px-4 pb-4">ยังไม่มีกิจกรรมเร็วๆ นี้</p>
        </SectionCard>

        <!-- ติดต่อ -->
        <SectionCard title="ติดต่อวิทยาลัย" icon="mdi-phone-outline" to="/contact" action="ติดต่อเรา">
          <div class="d-flex flex-column ga-2 text-body-2">
            <div v-if="home.settings.address" class="d-flex ga-2"><v-icon size="18" icon="mdi-map-marker-outline" color="primary" /><span>{{ home.settings.address }}</span></div>
            <div v-if="home.settings.phone" class="d-flex ga-2"><v-icon size="18" icon="mdi-phone-outline" color="primary" /><a :href="`tel:${home.settings.phone}`">{{ home.settings.phone }}</a></div>
            <div v-if="home.settings.email" class="d-flex ga-2"><v-icon size="18" icon="mdi-email-outline" color="primary" /><a :href="`mailto:${home.settings.email}`">{{ home.settings.email }}</a></div>
          </div>
        </SectionCard>

        <!-- ลิงก์หน่วยงาน -->
        <SectionCard v-if="home.links.length" title="หน่วยงานที่เกี่ยวข้อง" icon="mdi-link-variant" flush>
          <v-list density="compact" class="pt-0">
            <v-list-item v-for="l in home.links" :key="l.id" :href="l.url" target="_blank" rel="noopener" append-icon="mdi-open-in-new" class="px-4">
              <v-list-item-title class="text-body-2">{{ l.title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </SectionCard>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
import { useDisplay } from 'vuetify'

const { mdAndUp } = useDisplay()
const { data } = await useFetch<any>('/api/home')
const home = computed(() => data.value?.data)
const featured = computed(() => home.value?.latest?.[0])
const others = computed(() => home.value?.latest?.slice(1, 7) || [])
const tab = ref<number | null>(null)
watchEffect(() => { if (tab.value == null && home.value?.categories?.length) tab.value = home.value.categories[0].id })

const quick = [
  { label: 'รับสมัครเรียน', to: '/news?category=admission', icon: 'mdi-school-outline' },
  { label: 'ประกาศ', to: '/news?category=announcements', icon: 'mdi-bullhorn-outline' },
  { label: 'จัดซื้อจัดจ้าง', to: '/news?category=procurement', icon: 'mdi-file-document-outline' },
  { label: 'รับสมัครงาน', to: '/news?category=jobs', icon: 'mdi-briefcase-outline' },
  { label: 'แผนกวิชา', to: '/departments', icon: 'mdi-tools' },
  { label: 'บุคลากร', to: '/personnel', icon: 'mdi-account-group-outline' },
]

useSeoMeta({ title: 'หน้าแรก', ogTitle: 'วิทยาลัยเทคนิคกระบี่' })
</script>

<style scoped>
.welcome { border-left: 4px solid var(--kb-gold); border-radius: 0 12px 12px 0 !important; }
.welcome-title { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 500; color: var(--kb-navy); }
.sc-title { font-family: 'Prompt', sans-serif; font-size: 1.05rem; font-weight: 500; }
.urgent { border-left: 4px solid var(--kb-red); border-radius: 0 12px 12px 0 !important; background: #FFF8F8; }
.featured-title { font-family: 'Prompt', sans-serif; font-size: 1.2rem; font-weight: 500; line-height: 1.5; color: var(--kb-navy); }
.featured:hover .featured-title { text-decoration: underline; }
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.quick { border-radius: 10px; padding: 12px 4px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; font-size: .85rem; border: 1px solid #E3E8EE; transition: border-color .15s, background .15s; }
.quick:hover { border-color: var(--kb-gold); background: #FFFBF0; }
.date-box { width: 46px; text-align: center; border-radius: 8px; overflow: hidden; border: 1px solid #DDE3EA; }
.date-box .d { background: var(--kb-navy); color: #fff; font-family: 'Prompt'; font-size: 1.1rem; line-height: 1.6; }
.date-box .m { font-size: .7rem; padding: 1px 0; }
.video { aspect-ratio: 16/9; }
.video iframe { width: 100%; height: 100%; border: 0; }
</style>

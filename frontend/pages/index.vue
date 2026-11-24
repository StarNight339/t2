<template>
  <div v-if="home">
    <!-- สไลด์แบนเนอร์ -->
    <v-carousel
      v-if="home.banners.length"
      :height="mdAndUp ? 460 : 220"
      cycle interval="6000" hide-delimiter-background show-arrows="hover" color="secondary"
    >
      <v-carousel-item v-for="b in home.banners" :key="b.id" :src="b.image_url" cover :alt="b.title || ''">
        <component :is="b.link_url ? 'a' : 'div'" :href="b.link_url || undefined" class="d-block fill-height" />
      </v-carousel-item>
    </v-carousel>
    <section v-else class="hero">
      <div class="container-x py-12 py-md-16">
        <h1 class="hero-title">{{ home.settings.site_name }}</h1>
        <p class="hero-sub">{{ home.settings.slogan }}</p>
        <div class="d-flex ga-3 mt-6 flex-wrap">
          <v-btn color="secondary" size="large" to="/news?category=admission" prepend-icon="mdi-school-outline">รับสมัครนักเรียน</v-btn>
          <v-btn variant="outlined" color="white" size="large" to="/news">ข่าวทั้งหมด</v-btn>
        </div>
      </div>
    </section>

    <!-- ข่าวด่วน -->
    <div v-if="home.urgent.length" class="urgent">
      <div class="container-x d-flex align-center ga-3 py-2">
        <v-chip color="accent" variant="flat" size="small" prepend-icon="mdi-bullhorn-outline" class="flex-shrink-0">ข่าวด่วน</v-chip>
        <div class="ticker">
          <div class="ticker-track">
            <NuxtLink v-for="u in home.urgent" :key="u.id" :to="`/news/${u.slug}`" class="mr-12">● {{ u.title }}</NuxtLink>
          </div>
        </div>
      </div>
    </div>

    <div class="container-x mt-8">
      <v-row>
        <!-- ข่าวล่าสุด -->
        <v-col cols="12" lg="8">
          <div class="d-flex align-center">
            <h2 class="section-title">ข่าวประชาสัมพันธ์ล่าสุด</h2>
            <v-spacer />
            <v-btn to="/news" variant="text" color="primary" append-icon="mdi-arrow-right" class="mb-4">ดูทั้งหมด</v-btn>
          </div>

          <NuxtLink v-if="featured" :to="`/news/${featured.slug}`" class="d-block mb-6">
            <v-card class="featured hover-lift" elevation="2">
              <v-row no-gutters>
                <v-col cols="12" md="7">
                  <v-img v-if="featured.cover_image" :src="featured.cover_image" cover height="100%" min-height="220" :alt="featured.title" />
                  <div v-else class="featured-ph"><img src="/logo.svg" alt="" width="90"></div>
                </v-col>
                <v-col cols="12" md="5" class="pa-5 d-flex flex-column">
                  <div class="d-flex ga-2 mb-2">
                    <v-chip size="small" variant="flat" :color="featured.category_color || 'primary'">{{ featured.category_name }}</v-chip>
                    <v-chip v-if="featured.is_pinned" size="small" color="secondary" prepend-icon="mdi-pin">ปักหมุด</v-chip>
                  </div>
                  <h3 class="featured-title">{{ featured.title }}</h3>
                  <p class="text-body-2 text-medium-emphasis line-clamp-3 mt-2">{{ featured.excerpt }}</p>
                  <v-spacer />
                  <div class="text-caption text-medium-emphasis mt-3">
                    <v-icon size="14" icon="mdi-calendar-blank-outline" /> {{ thaiDate(featured.published_at) }}
                  </div>
                </v-col>
              </v-row>
            </v-card>
          </NuxtLink>

          <v-row>
            <v-col v-for="p in others" :key="p.id" cols="12" sm="6" md="4">
              <NewsCard :post="p" compact />
            </v-col>
          </v-row>
        </v-col>

        <!-- ปฏิทินกิจกรรม -->
        <v-col cols="12" lg="4">
          <h2 class="section-title">กิจกรรมที่กำลังจะมาถึง</h2>
          <v-card elevation="1">
            <v-list v-if="home.events.length" lines="two" class="py-0">
              <template v-for="(e, i) in home.events" :key="e.id">
                <v-divider v-if="i" />
                <v-list-item :to="e.post_slug ? `/news/${e.post_slug}` : '/events'" class="py-3">
                  <template #prepend>
                    <div class="date-box mr-3">
                      <div class="d">{{ dayMonth(e.start_at).day }}</div>
                      <div class="m">{{ dayMonth(e.start_at).month }}</div>
                    </div>
                  </template>
                  <v-list-item-title class="font-weight-medium text-wrap">{{ e.title }}</v-list-item-title>
                  <v-list-item-subtitle>
                    <span v-if="!e.is_all_day">{{ timeOf(e.start_at) }} · </span>{{ e.location || 'วิทยาลัยเทคนิคกระบี่' }}
                  </v-list-item-subtitle>
                </v-list-item>
              </template>
            </v-list>
            <v-card-text v-else class="text-medium-emphasis text-center py-8">ยังไม่มีกิจกรรมเร็วๆ นี้</v-card-text>
            <v-divider />
            <v-card-actions><v-btn block to="/events" color="primary">ดูปฏิทินทั้งหมด</v-btn></v-card-actions>
          </v-card>

          <!-- ลิงก์ด่วน -->
          <h2 class="section-title mt-8">บริการ</h2>
          <div class="quick-grid">
            <NuxtLink v-for="q in quick" :key="q.to" :to="q.to" class="quick">
              <v-icon :icon="q.icon" size="28" color="primary" />
              <span>{{ q.label }}</span>
            </NuxtLink>
          </div>
        </v-col>
      </v-row>

      <!-- ข่าวแยกตามหมวด -->
      <section v-if="home.categories.length" class="mt-10">
        <h2 class="section-title">ข่าวตามหมวดหมู่</h2>
        <v-tabs v-model="tab" color="primary" show-arrows class="mb-4">
          <v-tab v-for="c in home.categories" :key="c.id" :value="c.id">{{ c.name }}</v-tab>
        </v-tabs>
        <v-window v-model="tab">
          <v-window-item v-for="c in home.categories" :key="c.id" :value="c.id">
            <v-row>
              <v-col v-for="p in c.posts" :key="p.id" cols="12" sm="6" md="3"><NewsCard :post="p" compact /></v-col>
            </v-row>
            <div class="text-center mt-4">
              <v-btn :to="`/news?category=${c.slug}`" variant="tonal" color="primary">ดู{{ c.name }}ทั้งหมด</v-btn>
            </div>
          </v-window-item>
        </v-window>
      </section>

      <!-- วิดีโอ -->
      <section v-if="home.videos.length" class="mt-10">
        <h2 class="section-title">วิดีโอประชาสัมพันธ์</h2>
        <v-row>
          <v-col v-for="v in home.videos" :key="v.id" cols="12" md="4">
            <v-card elevation="1">
              <div class="video">
                <iframe :src="`https://www.youtube-nocookie.com/embed/${v.youtube_id}`" :title="v.title" loading="lazy" allowfullscreen />
              </div>
              <v-card-text class="font-weight-medium">{{ v.title }}</v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </section>
    </div>
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
  { label: 'ติดต่อเรา', to: '/contact', icon: 'mdi-phone-outline' },
]

useSeoMeta({ title: 'หน้าแรก', ogTitle: 'วิทยาลัยเทคนิคกระบี่' })
</script>

<style scoped>
.hero { background: linear-gradient(120deg, #072648 0%, #0B3A6E 55%, #174E8C 100%); color: #fff; }
.hero-title { font-size: clamp(1.8rem, 4vw, 2.8rem); font-weight: 600; }
.hero-sub { font-size: 1.15rem; opacity: .85; margin-top: 6px; }
.urgent { background: #FFF4F4; border-bottom: 1px solid #F5C8CE; color: #8B0D20; }
.featured-title { font-family: 'Prompt', sans-serif; font-size: 1.3rem; font-weight: 500; line-height: 1.45; color: #0B3A6E; }
.featured-ph { height: 100%; min-height: 220px; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #0B3A6E, #174E8C); }
.featured-ph img { opacity: .5; }
.date-box { width: 54px; text-align: center; border-radius: 8px; overflow: hidden; border: 1px solid #DDE3EA; }
.date-box .d { background: var(--kb-navy); color: #fff; font-family: 'Prompt'; font-size: 1.3rem; line-height: 1.6; }
.date-box .m { font-size: .75rem; padding: 2px 0; }
.quick-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
.quick { background: #fff; border-radius: 10px; padding: 14px 6px; display: flex; flex-direction: column; align-items: center; gap: 6px; text-align: center; font-size: .9rem; border: 1px solid #E3E8EE; transition: border-color .15s; }
.quick:hover { border-color: var(--kb-gold); }
.video { aspect-ratio: 16/9; }
.video iframe { width: 100%; height: 100%; border: 0; }
</style>

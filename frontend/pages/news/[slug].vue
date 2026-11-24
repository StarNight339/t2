<template>
  <div v-if="post">
    <PageHeader :title="post.category_name" :crumbs="[{ title: 'ข่าวสาร', to: '/news' }, { title: post.category_name, to: `/news?category=${post.category_slug}` }]" />
    <div class="container-x">
      <v-row>
        <v-col cols="12" lg="8">
          <v-card elevation="1" class="pa-5 pa-md-8">
            <h1 class="post-title">{{ post.title }}</h1>
            <div class="d-flex flex-wrap ga-4 text-body-2 text-medium-emphasis mt-3 mb-6">
              <span><v-icon size="16" icon="mdi-calendar-blank-outline" /> {{ thaiDateLong(post.published_at) }}</span>
              <span v-if="post.department_name"><v-icon size="16" icon="mdi-domain" /> {{ post.department_name }}</span>
              <span><v-icon size="16" icon="mdi-eye-outline" /> อ่าน {{ post.view_count.toLocaleString() }} ครั้ง</span>
            </div>

            <v-img v-if="post.cover_image" :src="post.cover_image" :alt="post.title" class="rounded-lg mb-6" max-height="520" />

            <!-- เนื้อหาผ่านการกรอง HTML ที่ backend แล้ว -->
            <div class="prose" v-html="post.content" />

            <!-- อัลบั้มภาพ -->
            <template v-if="post.images.length">
              <h2 class="section-title mt-8">ภาพกิจกรรม ({{ post.images.length }})</h2>
              <div class="gallery">
                <button v-for="(img, i) in post.images" :key="img.id" class="g-item" :aria-label="img.caption || `ภาพที่ ${i + 1}`" @click="openViewer(i)">
                  <v-img :src="img.image_url" :alt="img.caption || ''" cover aspect-ratio="1" />
                </button>
              </div>
            </template>

            <!-- เอกสารแนบ -->
            <template v-if="post.attachments.length">
              <h2 class="section-title mt-8">เอกสารแนบ</h2>
              <v-list class="border rounded-lg py-0">
                <template v-for="(f, i) in post.attachments" :key="f.id">
                  <v-divider v-if="i" />
                  <v-list-item :href="`/api/attachments/${f.id}/download`" target="_blank">
                    <template #prepend><v-icon :icon="fileIcon(f.file_name)" color="accent" size="32" /></template>
                    <v-list-item-title>{{ f.file_name }}</v-list-item-title>
                    <v-list-item-subtitle>{{ fileSize(f.file_size) }} · ดาวน์โหลด {{ f.download_count }} ครั้ง</v-list-item-subtitle>
                    <template #append><v-icon icon="mdi-download" /></template>
                  </v-list-item>
                </template>
              </v-list>
            </template>

            <div v-if="post.tags.length" class="mt-6 d-flex flex-wrap ga-2">
              <v-chip v-for="t in post.tags" :key="t.id" size="small" prepend-icon="mdi-tag-outline" :to="`/news?tag=${t.slug}`">{{ t.name }}</v-chip>
            </div>

            <v-divider class="my-6" />
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="text-body-2 mr-2">แชร์ข่าวนี้</span>
              <v-btn :href="`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`" target="_blank" color="#1877F2" size="small" prepend-icon="mdi-facebook">Facebook</v-btn>
              <v-btn :href="`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(shareUrl)}`" target="_blank" color="#06C755" size="small" prepend-icon="mdi-message-text">LINE</v-btn>
              <v-btn size="small" variant="tonal" prepend-icon="mdi-link-variant" @click="copyLink">{{ copied ? 'คัดลอกแล้ว' : 'คัดลอกลิงก์' }}</v-btn>
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <h2 class="section-title">ข่าวที่เกี่ยวข้อง</h2>
          <div v-if="post.related.length" class="d-flex flex-column ga-4">
            <NuxtLink v-for="r in post.related" :key="r.id" :to="`/news/${r.slug}`" class="related d-flex ga-3">
              <v-img :src="r.cover_image || '/logo.svg'" :cover="!!r.cover_image" width="110" max-width="110" aspect-ratio="1.4" class="rounded flex-shrink-0 bg-primary" />
              <div>
                <div class="font-weight-medium line-clamp-2">{{ r.title }}</div>
                <div class="text-caption text-medium-emphasis mt-1">{{ thaiDate(r.published_at) }}</div>
              </div>
            </NuxtLink>
          </div>
          <p v-else class="text-medium-emphasis">ไม่มีข่าวที่เกี่ยวข้อง</p>
        </v-col>
      </v-row>
    </div>

    <!-- ดูภาพขนาดใหญ่ -->
    <v-dialog v-model="viewer" max-width="1100">
      <v-card color="black">
        <v-carousel v-model="viewIndex" hide-delimiters height="80vh" show-arrows="hover">
          <v-carousel-item v-for="img in post.images" :key="img.id" :src="img.image_url" contain>
            <div v-if="img.caption" class="caption">{{ img.caption }}</div>
          </v-carousel-item>
        </v-carousel>
        <v-btn icon="mdi-close" class="close" variant="text" color="white" aria-label="ปิด" @click="viewer = false" />
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const config = useRuntimeConfig()
const { data, error } = await useFetch<any>(() => `/api/posts/${encodeURIComponent(String(route.params.slug))}`)
if (error.value) throw createError({ statusCode: 404, message: 'ไม่พบข่าวนี้', fatal: true })
const post = computed(() => data.value?.data)

const shareUrl = computed(() => `${config.public.siteUrl}/news/${route.params.slug}`)
const viewer = ref(false)
const viewIndex = ref(0)
const copied = ref(false)
function openViewer(i: number) { viewIndex.value = i; viewer.value = true }
async function copyLink() {
  await navigator.clipboard.writeText(shareUrl.value)
  copied.value = true
  setTimeout(() => (copied.value = false), 2000)
}

useSeoMeta({
  title: () => post.value?.title,
  description: () => post.value?.excerpt,
  ogTitle: () => post.value?.title,
  ogDescription: () => post.value?.excerpt,
  ogImage: () => post.value?.cover_image ? config.public.siteUrl + post.value.cover_image : undefined,
  ogType: 'article',
})
</script>

<style scoped>
.post-title { font-size: clamp(1.4rem, 3vw, 1.9rem); font-weight: 500; line-height: 1.45; color: var(--kb-navy); }
.gallery { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.g-item { border-radius: 8px; overflow: hidden; cursor: zoom-in; }
.g-item:hover { opacity: .85; }
.related:hover .font-weight-medium { color: var(--kb-navy); text-decoration: underline; }
.close { position: absolute; top: 8px; right: 8px; z-index: 2; }
.caption { position: absolute; bottom: 0; left: 0; right: 0; background: rgba(0, 0, 0, .55); color: #fff; padding: 10px 16px; text-align: center; }
</style>

<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2 mb-4">
      <v-btn variant="text" prepend-icon="mdi-arrow-left" to="/admin/posts">กลับ</v-btn>
      <h1 class="text-h6">{{ isNew ? 'เขียนข่าวใหม่' : 'แก้ไขข่าว' }}</h1>
      <v-chip v-if="!isNew" size="small" :color="STATUS_LABEL[original.status]?.color">{{ STATUS_LABEL[original.status]?.text }}</v-chip>
      <v-spacer />
      <v-btn v-if="!isNew && original.status === 'published'" variant="text" prepend-icon="mdi-open-in-new" :href="`/news/${original.slug}`" target="_blank">ดูหน้าเว็บ</v-btn>
    </div>

    <v-form v-if="loaded" ref="formRef" @submit.prevent="save()">
      <v-row>
        <v-col cols="12" lg="8">
          <v-card elevation="1" class="pa-4 mb-4">
            <v-text-field v-model="f.title" label="หัวข้อข่าว *" :rules="[req]" counter="255" />
            <v-textarea v-model="f.excerpt" label="ข้อความย่อ (แสดงในหน้ารวมข่าวและตอนแชร์)" rows="2" counter="500" auto-grow />
            <div class="text-body-2 mb-1">เนื้อหา *</div>
            <AdminRichEditor v-model="f.content" />
          </v-card>

          <!-- อัลบั้มภาพ -->
          <v-card elevation="1" class="pa-4 mb-4">
            <div class="d-flex align-center mb-3">
              <div class="font-weight-medium">อัลบั้มภาพ ({{ f.images.length }})</div>
              <v-spacer />
              <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-image-multiple" :loading="uploading === 'images'" @click="imgPick?.click()">เพิ่มรูป</v-btn>
              <input ref="imgPick" type="file" accept="image/*" multiple hidden @change="addImages">
            </div>
            <div v-if="f.images.length" class="gal">
              <div v-for="(img, i) in f.images" :key="img.image_url + i" class="gal-item">
                <v-img :src="img.image_url" aspect-ratio="1.3" cover class="rounded" />
                <input v-model="img.caption" class="cap" placeholder="คำบรรยาย">
                <div class="tools">
                  <v-btn icon="mdi-chevron-left" size="x-small" variant="flat" :disabled="i === 0" aria-label="เลื่อนซ้าย" @click="move(f.images, i, -1)" />
                  <v-btn icon="mdi-image-check" size="x-small" variant="flat" title="ใช้เป็นภาพหน้าปก" aria-label="ใช้เป็นภาพหน้าปก" @click="f.cover_image = img.image_url" />
                  <v-btn icon="mdi-close" size="x-small" variant="flat" color="error" aria-label="ลบรูป" @click="f.images.splice(i, 1)" />
                </div>
              </div>
            </div>
            <p v-else class="text-body-2 text-medium-emphasis">ยังไม่มีรูป — เลือกได้หลายไฟล์พร้อมกัน</p>
          </v-card>

          <!-- เอกสารแนบ -->
          <v-card elevation="1" class="pa-4">
            <div class="d-flex align-center mb-2">
              <div class="font-weight-medium">เอกสารแนบ ({{ f.attachments.length }})</div>
              <v-spacer />
              <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-paperclip" :loading="uploading === 'files'" @click="filePick?.click()">แนบไฟล์</v-btn>
              <input ref="filePick" type="file" multiple hidden accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip,image/*" @change="addFiles">
            </div>
            <v-list v-if="f.attachments.length" density="compact" class="py-0">
              <v-list-item v-for="(a, i) in f.attachments" :key="a.file_url" class="px-0">
                <template #prepend><v-icon :icon="fileIcon(a.file_name)" color="accent" /></template>
                <v-text-field v-model="a.file_name" density="compact" hide-details variant="underlined" />
                <template #append>
                  <span class="text-caption mx-2">{{ fileSize(a.file_size) }}</span>
                  <v-btn icon="mdi-close" size="small" variant="text" color="error" aria-label="ลบไฟล์" @click="f.attachments.splice(i, 1)" />
                </template>
              </v-list-item>
            </v-list>
            <p v-else class="text-body-2 text-medium-emphasis">PDF, Word, Excel ฯลฯ ไม่เกิน 20 MB ต่อไฟล์</p>
          </v-card>
        </v-col>

        <v-col cols="12" lg="4">
          <v-card elevation="1" class="pa-4 mb-4">
            <div class="font-weight-medium mb-3">การเผยแพร่</div>
            <v-select v-model="f.status" :items="statusOptions" label="สถานะ" />
            <v-text-field v-model="f.published_at" type="datetime-local" label="วันเวลาเผยแพร่" hint="เว้นว่าง = เผยแพร่ทันที / ตั้งล่วงหน้าได้" persistent-hint class="mb-2" />
            <v-text-field v-model="f.expired_at" type="datetime-local" label="วันหมดอายุข่าวด่วน (ถ้ามี)" />
            <template v-if="auth.isEditor">
              <v-switch v-model="f.is_pinned" label="ปักหมุดไว้บนสุด" color="secondary" hide-details density="compact" />
              <v-switch v-model="f.is_urgent" label="แสดงในแถบข่าวด่วน" color="accent" hide-details density="compact" />
            </template>
            <v-alert v-else type="info" variant="tonal" density="compact" class="mt-2 text-body-2">
              ข่าวที่ส่งเผยแพร่จะรอบรรณาธิการอนุมัติก่อน
            </v-alert>
            <v-divider class="my-4" />
            <div class="d-flex ga-2">
              <v-btn variant="tonal" :loading="saving === 'draft'" @click="save('draft')">บันทึกร่าง</v-btn>
              <v-spacer />
              <v-btn color="primary" :loading="saving === 'publish'" prepend-icon="mdi-send" @click="save('published')">
                {{ auth.isEditor ? 'เผยแพร่' : 'ส่งอนุมัติ' }}
              </v-btn>
            </div>
          </v-card>

          <v-card elevation="1" class="pa-4 mb-4">
            <v-select v-model="f.category_id" :items="cats" item-title="name" item-value="id" label="หมวดข่าว *" :rules="[req]" />
            <v-autocomplete v-model="f.department_id" :items="depts" item-title="name" item-value="id" label="แผนก / งาน" clearable />
            <v-combobox v-model="f.tags" label="แท็ก" multiple chips closable-chips hint="พิมพ์แล้วกด Enter" persistent-hint />
          </v-card>

          <v-card elevation="1" class="pa-4">
            <AdminUploadField v-model="f.cover_image" label="ภาพหน้าปก" />
          </v-card>
        </v-col>
      </v-row>
    </v-form>
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'admin', title: 'ข่าว / ประกาศ' })
const auth = useAuthStore()
const route = useRoute()
const { api, uploadFile } = useApi()
const { ok, fail } = useToast()

const isNew = computed(() => route.params.id === 'new')
const formRef = ref()
const imgPick = ref<HTMLInputElement>()
const filePick = ref<HTMLInputElement>()
const loaded = ref(false)
const saving = ref<'' | 'draft' | 'publish'>('')
const uploading = ref<'' | 'images' | 'files'>('')
const original = ref<any>({})
const cats = ref<any[]>([])
const depts = ref<any[]>([])

const blank = () => ({
  title: '', excerpt: '', content: '', cover_image: '', category_id: null as number | null,
  department_id: auth.user?.department_id ?? null, status: 'draft', is_pinned: false, is_urgent: false,
  published_at: '', expired_at: '', tags: [] as string[], images: [] as any[], attachments: [] as any[],
})
const f = reactive(blank())

const statusOptions = computed(() => Object.entries(STATUS_LABEL)
  .filter(([v]) => auth.isEditor || v !== 'published')
  .map(([value, s]) => ({ title: s.text, value })))
const req = (v: any) => (v !== null && v !== undefined && String(v).trim() !== '') || 'จำเป็นต้องกรอก'

onMounted(async () => {
  const [c, d] = await Promise.all([
    api<any>('/api/admin/categories', { query: { all: 1 } }),
    api<any>('/api/admin/departments', { query: { all: 1 } }),
  ])
  cats.value = c.items
  depts.value = d.items
  if (!isNew.value) {
    try {
      const p = (await api<any>(`/api/admin/posts/${route.params.id}`)).data
      original.value = p
      Object.assign(f, {
        ...p,
        is_pinned: !!p.is_pinned, is_urgent: !!p.is_urgent,
        published_at: toInputDateTime(p.published_at), expired_at: toInputDateTime(p.expired_at),
        tags: p.tags.map((t: any) => t.name),
        images: p.images.map((i: any) => ({ image_url: i.image_url, caption: i.caption || '' })),
        attachments: p.attachments.map((a: any) => ({ file_url: a.file_url, file_name: a.file_name, mime_type: a.mime_type, file_size: a.file_size })),
      })
    } catch (e: any) { fail(e.message); return navigateTo('/admin/posts') }
  }
  loaded.value = true
})

function move(arr: any[], i: number, d: number) {
  const [x] = arr.splice(i, 1)
  arr.splice(i + d, 0, x)
}

async function addImages(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  uploading.value = 'images'
  try {
    for (const file of files) {
      const up = await uploadFile(file)
      f.images.push({ image_url: up.url, caption: '' })
      if (!f.cover_image) f.cover_image = up.url
    }
  } catch (err: any) { fail(err.message) } finally { uploading.value = ''; if (imgPick.value) imgPick.value.value = '' }
}

async function addFiles(e: Event) {
  const files = Array.from((e.target as HTMLInputElement).files || [])
  uploading.value = 'files'
  try {
    for (const file of files) {
      const up = await uploadFile(file)
      f.attachments.push({ file_url: up.url, file_name: up.file_name, mime_type: up.mime_type, file_size: up.file_size })
    }
  } catch (err: any) { fail(err.message) } finally { uploading.value = ''; if (filePick.value) filePick.value.value = '' }
}

async function save(status?: string) {
  const { valid } = await formRef.value.validate()
  if (!valid) return fail('กรุณากรอกข้อมูลที่จำเป็นให้ครบ')
  if (!f.content) return fail('กรุณาใส่เนื้อหาข่าว')
  if (status) f.status = status
  saving.value = status === 'draft' ? 'draft' : 'publish'
  try {
    const body = { ...f }
    const res = isNew.value
      ? await api<any>('/api/admin/posts', { method: 'POST', body })
      : await api<any>(`/api/admin/posts/${route.params.id}`, { method: 'PUT', body })
    original.value = res.data
    f.status = res.data.status
    f.published_at = toInputDateTime(res.data.published_at)
    ok(res.data.status === 'pending' ? 'ส่งให้บรรณาธิการอนุมัติแล้ว' : 'บันทึกเรียบร้อย')
    if (isNew.value) navigateTo(`/admin/posts/${res.data.id}`, { replace: true })
  } catch (e: any) { fail(e.message) } finally { saving.value = '' }
}
</script>

<style scoped>
.gal { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
.gal-item { position: relative; }
.cap { width: 100%; border: 1px solid #DDE3EA; border-radius: 6px; padding: 4px 8px; margin-top: 4px; font-size: .85rem; }
.tools { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; }
</style>

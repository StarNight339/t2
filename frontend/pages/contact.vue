<template>
  <div>
    <PageHeader title="ติดต่อเรา" :crumbs="[{ title: 'ติดต่อเรา' }]" />
    <div class="container-x">
      <v-row>
        <v-col cols="12" md="5">
          <v-card elevation="1" class="pa-6 h-100">
            <h2 class="section-title">{{ s.site_name }}</h2>
            <div class="d-flex flex-column ga-4">
              <div v-if="s.address" class="d-flex ga-3"><v-icon icon="mdi-map-marker-outline" color="primary" /><span>{{ s.address }}</span></div>
              <div v-if="s.phone" class="d-flex ga-3"><v-icon icon="mdi-phone-outline" color="primary" /><a :href="`tel:${s.phone}`">{{ s.phone }}</a></div>
              <div v-if="s.email" class="d-flex ga-3"><v-icon icon="mdi-email-outline" color="primary" /><a :href="`mailto:${s.email}`">{{ s.email }}</a></div>
              <div v-if="s.facebook_url" class="d-flex ga-3"><v-icon icon="mdi-facebook" color="primary" /><a :href="s.facebook_url" target="_blank" rel="noopener">Facebook</a></div>
            </div>
            <div v-if="mapSrc" class="map mt-6">
              <iframe :src="mapSrc" title="แผนที่วิทยาลัย" loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
            </div>
          </v-card>
        </v-col>

        <v-col cols="12" md="7">
          <v-card elevation="1" class="pa-6">
            <h2 class="section-title">ส่งข้อความถึงเรา</h2>
            <v-alert v-if="done" type="success" variant="tonal" class="mb-4">{{ done }}</v-alert>
            <v-alert v-if="err" type="error" variant="tonal" class="mb-4">{{ err }}</v-alert>
            <v-form ref="formRef" @submit.prevent="submit">
              <v-row dense>
                <v-col cols="12" sm="6"><v-text-field v-model="f.name" label="ชื่อ-สกุล *" :rules="[req]" /></v-col>
                <v-col cols="12" sm="6"><v-text-field v-model="f.phone" label="เบอร์โทรศัพท์" type="tel" /></v-col>
                <v-col cols="12"><v-text-field v-model="f.email" label="อีเมล" type="email" :rules="[emailRule]" /></v-col>
                <v-col cols="12"><v-text-field v-model="f.subject" label="เรื่อง *" :rules="[req]" /></v-col>
                <v-col cols="12"><v-textarea v-model="f.message" label="ข้อความ *" rows="5" :rules="[req]" counter="2000" /></v-col>
                <!-- ช่องดักบอท: คนจะไม่เห็นช่องนี้ -->
                <input v-model="f.website" type="text" tabindex="-1" autocomplete="off" class="hp" aria-hidden="true">
              </v-row>
              <v-btn type="submit" color="primary" size="large" :loading="sending" prepend-icon="mdi-send">ส่งข้อความ</v-btn>
            </v-form>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: site } = await useSite()
const s = computed(() => site.value?.settings || {} as Record<string, string>)
// รับได้ทั้งลิงก์ embed หรือโค้ด <iframe> ที่คัดลอกจาก Google Maps
const mapSrc = computed(() => {
  const v = s.value.map_embed || ''
  const m = v.match(/src="([^"]+)"/)
  const url = m ? m[1] : v
  return /^https:\/\/(www\.)?google\.[a-z.]+\/maps\/embed/.test(url) ? url : ''
})

const formRef = ref()
const f = reactive({ name: '', email: '', phone: '', subject: '', message: '', website: '' })
const sending = ref(false)
const done = ref('')
const err = ref('')
const req = (v: string) => !!v?.trim() || 'กรุณากรอกข้อมูล'
const emailRule = (v: string) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) || 'รูปแบบอีเมลไม่ถูกต้อง'

async function submit() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  sending.value = true
  done.value = err.value = ''
  try {
    const res = await $fetch<any>('/api/contact', { method: 'POST', body: f })
    done.value = res.message
    Object.assign(f, { name: '', email: '', phone: '', subject: '', message: '' })
    formRef.value.resetValidation()
  } catch (e: any) {
    err.value = e?.data?.message || 'ส่งข้อความไม่สำเร็จ'
  } finally { sending.value = false }
}

useSeoMeta({ title: 'ติดต่อเรา' })
</script>

<style scoped>
.map { aspect-ratio: 4/3; border-radius: 8px; overflow: hidden; }
.map iframe { width: 100%; height: 100%; border: 0; }
.hp { position: absolute; left: -9999px; width: 1px; height: 1px; }
</style>

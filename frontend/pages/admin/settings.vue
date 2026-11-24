<template>
  <v-card v-if="loaded" elevation="1" class="pa-5" max-width="900">
    <v-form @submit.prevent="save">
      <div class="font-weight-medium mb-3">ข้อมูลวิทยาลัย</div>
      <v-row dense>
        <v-col cols="12" md="6"><v-text-field v-model="f.site_name" label="ชื่อวิทยาลัย (ไทย)" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="f.site_name_en" label="ชื่อวิทยาลัย (อังกฤษ)" /></v-col>
        <v-col cols="12"><v-text-field v-model="f.slogan" label="คำขวัญ / ข้อความหน้าแรก" /></v-col>
        <v-col cols="12"><v-textarea v-model="f.about_short" label="คำอธิบายสั้น (แสดงส่วนท้ายเว็บ)" rows="2" auto-grow /></v-col>
        <v-col cols="12"><AdminUploadField v-model="f.logo_url" label="โลโก้ (เว้นว่าง = ใช้โลโก้เริ่มต้น)" class="mb-4" /></v-col>
      </v-row>

      <div class="font-weight-medium mb-3 mt-2">ช่องทางติดต่อ</div>
      <v-row dense>
        <v-col cols="12"><v-textarea v-model="f.address" label="ที่อยู่" rows="2" auto-grow /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="f.phone" label="โทรศัพท์" /></v-col>
        <v-col cols="12" md="6"><v-text-field v-model="f.email" label="อีเมล" /></v-col>
        <v-col cols="12"><v-text-field v-model="f.facebook_url" label="Facebook Page URL" /></v-col>
        <v-col cols="12">
          <v-textarea v-model="f.map_embed" label="แผนที่ Google Maps" rows="2" hint="Google Maps → แชร์ → ฝังแผนที่ → คัดลอก HTML มาวางที่นี่" persistent-hint />
        </v-col>
      </v-row>
      <v-btn type="submit" color="primary" class="mt-6" :loading="saving" prepend-icon="mdi-content-save">บันทึกการตั้งค่า</v-btn>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'ตั้งค่าเว็บไซต์', roles: ['admin'] })
const { api } = useApi()
const { ok, fail } = useToast()
const f = reactive<Record<string, string>>({})
const loaded = ref(false)
const saving = ref(false)

onMounted(async () => {
  Object.assign(f, (await api<any>('/api/settings')).data)
  loaded.value = true
})
async function save() {
  saving.value = true
  try {
    await api('/api/admin/settings', { method: 'PUT', body: f })
    clearNuxtData('site-common')
    ok('บันทึกการตั้งค่าแล้ว')
  } catch (e: any) { fail(e.message) } finally { saving.value = false }
}
</script>

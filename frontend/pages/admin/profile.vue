<template>
  <v-card elevation="1" class="pa-5" max-width="480">
    <div class="font-weight-medium mb-4">เปลี่ยนรหัสผ่าน</div>
    <v-form ref="formRef" @submit.prevent="save">
      <v-text-field v-model="f.current_password" label="รหัสผ่านเดิม" type="password" autocomplete="current-password" :rules="[(v: string) => !!v || 'จำเป็นต้องกรอก']" />
      <v-text-field v-model="f.new_password" label="รหัสผ่านใหม่" type="password" autocomplete="new-password" :rules="[(v: string) => v?.length >= 8 || 'อย่างน้อย 8 ตัวอักษร']" />
      <v-text-field v-model="confirm" label="ยืนยันรหัสผ่านใหม่" type="password" autocomplete="new-password" :rules="[(v: string) => v === f.new_password || 'รหัสผ่านไม่ตรงกัน']" />
      <v-btn type="submit" color="primary" :loading="saving">บันทึก</v-btn>
    </v-form>
  </v-card>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'admin', title: 'เปลี่ยนรหัสผ่าน' })
const { api } = useApi()
const { ok, fail } = useToast()
const formRef = ref()
const f = reactive({ current_password: '', new_password: '' })
const confirm = ref('')
const saving = ref(false)

async function save() {
  const { valid } = await formRef.value.validate()
  if (!valid) return
  saving.value = true
  try {
    await api('/api/auth/password', { method: 'PUT', body: f })
    ok('เปลี่ยนรหัสผ่านเรียบร้อย')
    Object.assign(f, { current_password: '', new_password: '' })
    confirm.value = ''
    formRef.value.resetValidation()
  } catch (e: any) { fail(e.message) } finally { saving.value = false }
}
</script>

<!-- ช่องรูปภาพ: อัปโหลดไฟล์ หรือวางลิงก์ แล้วแสดงตัวอย่าง -->
<template>
  <div>
    <div class="text-body-2 mb-1">{{ label }}</div>
    <div class="d-flex ga-3 align-start">
      <div class="preview">
        <v-img v-if="modelValue" :src="modelValue" cover aspect-ratio="1.6" />
        <div v-else class="empty d-flex align-center justify-center"><v-icon icon="mdi-image-outline" size="32" color="grey" /></div>
      </div>
      <div class="flex-grow-1">
        <v-text-field :model-value="modelValue" placeholder="/uploads/... หรือ https://..." density="compact" hide-details class="mb-2" @update:model-value="emit('update:modelValue', $event)" />
        <div class="d-flex ga-2">
          <v-btn size="small" color="primary" variant="tonal" prepend-icon="mdi-upload" :loading="busy" @click="pick?.click()">อัปโหลด</v-btn>
          <v-btn v-if="modelValue" size="small" variant="text" color="error" @click="emit('update:modelValue', '')">ลบ</v-btn>
        </div>
        <input ref="pick" type="file" accept="image/*" hidden @change="onFile">
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{ modelValue?: string | null, label?: string }>()
const emit = defineEmits<{ 'update:modelValue': [string] }>()
const { uploadFile } = useApi()
const { fail } = useToast()
const pick = ref<HTMLInputElement>()
const busy = ref(false)

async function onFile(e: Event) {
  const f = (e.target as HTMLInputElement).files?.[0]
  if (!f) return
  busy.value = true
  try { emit('update:modelValue', (await uploadFile(f)).url) } catch (err: any) { fail(err.message) } finally {
    busy.value = false
    if (pick.value) pick.value.value = ''
  }
}
</script>

<style scoped>
.preview { width: 140px; flex-shrink: 0; border-radius: 8px; overflow: hidden; border: 1px solid #DDE3EA; }
.empty { aspect-ratio: 1.6; background: #F5F7FA; }
</style>

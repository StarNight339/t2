<template>
  <v-dialog :model-value="modelValue" max-width="420" @update:model-value="emit('update:modelValue', $event)">
    <v-card>
      <v-card-title class="d-flex align-center ga-2"><v-icon icon="mdi-alert-circle-outline" color="error" /> {{ title }}</v-card-title>
      <v-card-text>{{ text }}</v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="emit('update:modelValue', false)">ยกเลิก</v-btn>
        <v-btn color="error" variant="flat" @click="emit('confirm')">{{ confirmText }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ modelValue: boolean, title?: string, text?: string, confirmText?: string }>(), {
  title: 'ยืนยันการลบ', text: '', confirmText: 'ลบ',
})
const emit = defineEmits<{ 'update:modelValue': [boolean], confirm: [] }>()
</script>

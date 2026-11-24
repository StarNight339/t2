<template>
  <v-card elevation="1" class="text-center pa-4 h-100">
    <v-avatar :size="big ? 132 : 104" color="grey-lighten-3" class="mb-3">
      <v-img v-if="p.photo_url" :src="p.photo_url" :alt="fullName" cover />
      <v-icon v-else icon="mdi-account" size="56" color="grey" />
    </v-avatar>
    <div class="font-head font-weight-medium">{{ fullName }}</div>
    <div class="text-body-2 text-primary">{{ p.position }}</div>
    <div v-if="showDept && p.department_name" class="text-caption text-medium-emphasis">{{ p.department_name }}</div>
    <div v-if="p.email || p.phone" class="text-caption text-medium-emphasis mt-2">
      <div v-if="p.phone"><v-icon size="12" icon="mdi-phone" /> {{ p.phone }}</div>
      <div v-if="p.email" class="text-truncate"><v-icon size="12" icon="mdi-email-outline" /> {{ p.email }}</div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
const props = defineProps<{ p: any, big?: boolean, showDept?: boolean }>()
// ภาษาไทยเขียนคำนำหน้าติดกับชื่อ เช่น "นายสมชาย ใจดี"
const fullName = computed(() => `${props.p.prefix || ''}${props.p.first_name} ${props.p.last_name}`)
</script>

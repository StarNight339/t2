<template>
  <v-app>
    <v-main class="login-bg d-flex align-center justify-center">
      <v-card width="400" max-width="92vw" class="pa-6" elevation="8">
        <div class="text-center mb-6">
          <img src="/logo.svg" width="72" height="72" alt="">
          <h1 class="text-h6 mt-2">ระบบจัดการเว็บไซต์</h1>
          <div class="text-body-2 text-medium-emphasis">วิทยาลัยเทคนิคกระบี่</div>
        </div>
        <v-alert v-if="err" type="error" variant="tonal" density="compact" class="mb-4">{{ err }}</v-alert>
        <v-form @submit.prevent="submit">
          <v-text-field v-model="login" label="อีเมล หรือ ชื่อผู้ใช้" prepend-inner-icon="mdi-account-outline" autocomplete="username" autofocus />
          <v-text-field
            v-model="password" label="รหัสผ่าน" prepend-inner-icon="mdi-lock-outline" autocomplete="current-password"
            :type="show ? 'text' : 'password'" :append-inner-icon="show ? 'mdi-eye-off' : 'mdi-eye'" @click:append-inner="show = !show"
          />
          <v-btn type="submit" color="primary" size="large" block :loading="loading" :disabled="!login || !password">เข้าสู่ระบบ</v-btn>
        </v-form>
        <div class="text-center mt-4"><NuxtLink to="/" class="text-body-2 text-primary">← กลับหน้าเว็บไซต์</NuxtLink></div>
      </v-card>
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: false })
useHead({ title: 'เข้าสู่ระบบ' })

const auth = useAuthStore()
const route = useRoute()
const login = ref('')
const password = ref('')
const show = ref(false)
const loading = ref(false)
const err = ref('')

async function submit() {
  loading.value = true
  err.value = ''
  try {
    const res = await $fetch<any>('/api/auth/login', { method: 'POST', body: { login: login.value, password: password.value } })
    auth.setAuth(res.accessToken, res.user)
    const next = String(route.query.next || '')
    await navigateTo(next.startsWith('/admin') ? next : '/admin')
  } catch (e: any) {
    err.value = e?.data?.message || 'เข้าสู่ระบบไม่สำเร็จ'
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-bg { min-height: 100vh; background: linear-gradient(135deg, #072648, #0B3A6E 60%, #174E8C); }
</style>

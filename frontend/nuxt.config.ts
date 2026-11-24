// nuxt.config.ts
import vuetify, { transformAssetUrls } from 'vite-plugin-vuetify'

export default defineNuxtConfig({
  compatibilityDate: '2025-10-12',
  devtools: { enabled: false },
  modules: ['@pinia/nuxt'],

  runtimeConfig: {
    // ที่อยู่ backend ที่ฝั่ง server ของ Nuxt ใช้เรียก (ตั้งผ่าน NUXT_API_INTERNAL)
    // เบราว์เซอร์จะเรียก /api และ /uploads ที่โดเมนเดียวกัน แล้ว Nuxt ส่งต่อให้ backend
    apiInternal: 'http://localhost:7000',
    public: {
      siteUrl: 'http://localhost:3000', // NUXT_PUBLIC_SITE_URL ใช้ทำลิงก์แชร์
    },
  },

  // หลังบ้านใช้ token ใน localStorage -> render ฝั่ง client อย่างเดียว
  routeRules: {
    '/admin/**': { ssr: false },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'th' },
      titleTemplate: '%s | วิทยาลัยเทคนิคกระบี่',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: 'ข่าวประชาสัมพันธ์ ประกาศ และกิจกรรมของวิทยาลัยเทคนิคกระบี่' },
        { name: 'theme-color', content: '#0B3A6E' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/logo.svg' },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600&family=Sarabun:wght@400;500;600&display=swap' },
      ],
    },
  },

  css: ['vuetify/styles', '@mdi/font/css/materialdesignicons.min.css', '~/assets/main.css'],

  build: { transpile: ['vuetify'] },
  vite: {
    ssr: { noExternal: ['vuetify'] },
    plugins: [vuetify({ autoImport: true })],
    vue: { template: { transformAssetUrls } },
  },
})

import { createVuetify } from 'vuetify'
import { th } from 'vuetify/locale'

export default defineNuxtPlugin((nuxtApp) => {
  const vuetify = createVuetify({
    ssr: true,
    locale: { locale: 'th', messages: { th } },
    theme: {
      defaultTheme: 'kbtc',
      themes: {
        kbtc: {
          dark: false,
          colors: {
            primary: '#0B3A6E',   // น้ำเงินเข้ม
            secondary: '#E3A008', // ทอง
            accent: '#C8102E',    // แดง (ข่าวด่วน)
            background: '#F5F7FA',
            surface: '#FFFFFF',
            success: '#2E7D32',
            info: '#1565C0',
            warning: '#ED6C02',
            error: '#C62828',
          },
        },
      },
    },
    defaults: {
      VBtn: { rounded: 'lg' },
      VCard: { rounded: 'lg' },
      VTextField: { variant: 'outlined', density: 'comfortable' },
      VTextarea: { variant: 'outlined', density: 'comfortable' },
      VSelect: { variant: 'outlined', density: 'comfortable' },
      VAutocomplete: { variant: 'outlined', density: 'comfortable' },
      VCombobox: { variant: 'outlined', density: 'comfortable' },
    },
  })
  nuxtApp.vueApp.use(vuetify)
})

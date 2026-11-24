import { defineStore } from 'pinia'

export interface AuthUser {
  id: number
  username: string
  name: string
  email: string
  role: 'admin' | 'editor' | 'writer'
  department_id: number | null
  department_name?: string | null
}

export const useAuthStore = defineStore('auth', {
  state: () => ({ token: null as string | null, user: null as AuthUser | null }),
  getters: {
    isLogged: (s) => !!s.token,
    isAdmin: (s) => s.user?.role === 'admin',
    isEditor: (s) => s.user?.role === 'admin' || s.user?.role === 'editor',
  },
  actions: {
    setAuth(token: string, user: AuthUser) {
      this.token = token
      this.user = user
      if (import.meta.client) {
        localStorage.setItem('kbtc_token', token)
        localStorage.setItem('kbtc_user', JSON.stringify(user))
      }
    },
    hydrate() {
      if (!import.meta.client || this.token) return
      const t = localStorage.getItem('kbtc_token')
      if (!t) return
      this.token = t
      try { this.user = JSON.parse(localStorage.getItem('kbtc_user') || 'null') } catch { this.user = null }
    },
    logout() {
      this.token = null
      this.user = null
      if (import.meta.client) {
        localStorage.removeItem('kbtc_token')
        localStorage.removeItem('kbtc_user')
      }
    },
  },
})

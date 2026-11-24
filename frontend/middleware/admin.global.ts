// ป้องกันหน้า /admin/** : ต้องล็อกอิน และ role ต้องตรงกับ meta.roles ของหน้า (ถ้ามี)
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware((to) => {
  if (!to.path.startsWith('/admin') || import.meta.server) return
  const auth = useAuthStore()
  auth.hydrate()

  if (to.path === '/admin/login') {
    if (auth.isLogged) return navigateTo('/admin')
    return
  }
  if (!auth.isLogged) return navigateTo({ path: '/admin/login', query: { next: to.fullPath } })

  const roles = to.meta.roles as string[] | undefined
  if (roles && !roles.includes(auth.user?.role || '')) return navigateTo('/admin')
})

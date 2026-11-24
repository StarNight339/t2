// เรียก API หลังบ้าน (แนบ token อัตโนมัติ และเด้งไปหน้า login เมื่อ token หมดอายุ)
import { useAuthStore } from '~/stores/auth'

export function useApi() {
  const auth = useAuthStore()

  async function api<T = any>(url: string, opts: any = {}): Promise<T> {
    try {
      return await $fetch<T>(url, {
        ...opts,
        headers: { ...(opts.headers || {}), ...(auth.token ? { Authorization: `Bearer ${auth.token}` } : {}) },
      })
    } catch (e: any) {
      if (e?.response?.status === 401 && auth.token) {
        auth.logout()
        navigateTo('/admin/login')
      }
      throw new Error(e?.data?.message || e?.message || 'เกิดข้อผิดพลาด')
    }
  }

  async function uploadFile(file: File) {
    const fd = new FormData()
    fd.append('file', file)
    const res = await api<{ data: { url: string, file_name: string, mime_type: string, file_size: number } }>(
      '/api/admin/upload', { method: 'POST', body: fd },
    )
    return res.data
  }

  return { api, uploadFile }
}

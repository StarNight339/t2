// ส่งต่อ /api/** และ /uploads/** ไปยัง backend (Express)
// ข้อดี: เบราว์เซอร์คุยกับโดเมนเดียว ไม่ต้องตั้ง CORS และรูปภาพใช้ path /uploads/... ได้ตรงๆ
export default defineEventHandler((event) => {
  const path = event.path || ''
  if (!path.startsWith('/api/') && !path.startsWith('/uploads/')) return

  const { apiInternal } = useRuntimeConfig(event)
  const ip = getRequestIP(event, { xForwardedFor: true })
  return proxyRequest(event, apiInternal.replace(/\/$/, '') + path, {
    headers: ip ? { 'x-forwarded-for': ip } : {},
  })
})

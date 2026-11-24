// ข้อมูลที่ใช้ร่วมกันทั้งเว็บ: การตั้งค่า, หมวดข่าว, เมนูหน้าเกี่ยวกับเรา (โหลดครั้งเดียว)
export function useSite() {
  return useAsyncData('site-common', async () => {
    const [settings, categories, pages, departments, links] = await Promise.all([
      $fetch<any>('/api/settings'),
      $fetch<any>('/api/categories?all=1'),
      $fetch<any>('/api/pages?all=1'),
      $fetch<any>('/api/departments?all=1&type=department'),
      $fetch<any>('/api/links?all=1'),
    ])
    return {
      settings: settings.data as Record<string, string>,
      categories: categories.items as any[],
      pages: (pages.items as any[]).filter((p) => p.show_in_menu),
      departments: departments.items as any[],
      links: links.items as any[],
    }
  }, { getCachedData: (key, nuxtApp) => nuxtApp.payload.data[key] ?? nuxtApp.static.data[key] })
}

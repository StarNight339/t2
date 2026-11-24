// ตั้งค่าหน้าจัดการข้อมูลแบบรวม (/admin/manage/:resource)
// type ของฟิลด์: text | textarea | number | switch | select | datetime | image | color | html
export interface Field {
  key: string
  label: string
  type?: 'text' | 'textarea' | 'number' | 'switch' | 'select' | 'datetime' | 'image' | 'color' | 'html'
  required?: boolean
  options?: { title: string, value: any }[]
  source?: string // โหลดตัวเลือกจาก API (ใช้ id/name)
  sourceTitle?: string
  cols?: number
  hint?: string
  default?: any
}
export interface Column { key: string, title: string, type?: 'image' | 'bool' | 'datetime' | 'color' | 'youtube' }
export interface ResourceDef {
  title: string
  icon: string
  columns: Column[]
  fields: Field[]
  wide?: boolean
}

const levelOptions = [
  { title: 'ผู้อำนวยการ', value: 'director' },
  { title: 'รองผู้อำนวยการ', value: 'deputy' },
  { title: 'หัวหน้าแผนก/งาน', value: 'head' },
  { title: 'ครู/บุคลากร', value: 'staff' },
]

export const RESOURCES: Record<string, ResourceDef> = {
  banners: {
    title: 'แบนเนอร์หน้าแรก', icon: 'mdi-image-multiple-outline',
    columns: [
      { key: 'image_url', title: 'รูป', type: 'image' }, { key: 'title', title: 'ชื่อ' },
      { key: 'end_at', title: 'แสดงถึง', type: 'datetime' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' },
    ],
    fields: [
      { key: 'image_url', label: 'รูปแบนเนอร์ (แนะนำ 1920×700 px)', type: 'image', required: true },
      { key: 'title', label: 'ชื่อ / คำอธิบายรูป' },
      { key: 'link_url', label: 'ลิงก์เมื่อคลิก', hint: 'เช่น /news/... หรือ https://...' },
      { key: 'start_at', label: 'เริ่มแสดง', type: 'datetime', cols: 6 },
      { key: 'end_at', label: 'สิ้นสุดการแสดง', type: 'datetime', cols: 6 },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 6, default: true },
    ],
  },
  events: {
    title: 'ปฏิทินกิจกรรม', icon: 'mdi-calendar-month-outline',
    columns: [
      { key: 'start_at', title: 'วันที่', type: 'datetime' }, { key: 'title', title: 'กิจกรรม' },
      { key: 'location', title: 'สถานที่' }, { key: 'department_name', title: 'แผนก/งาน' }, { key: 'is_public', title: 'สาธารณะ', type: 'bool' },
    ],
    fields: [
      { key: 'title', label: 'ชื่อกิจกรรม', required: true },
      { key: 'description', label: 'รายละเอียด', type: 'textarea' },
      { key: 'location', label: 'สถานที่', cols: 6 },
      { key: 'department_id', label: 'แผนก / งาน', type: 'select', source: 'departments', cols: 6 },
      { key: 'start_at', label: 'เริ่ม', type: 'datetime', required: true, cols: 6 },
      { key: 'end_at', label: 'สิ้นสุด', type: 'datetime', cols: 6 },
      { key: 'is_all_day', label: 'ทั้งวัน', type: 'switch', cols: 6, default: false },
      { key: 'is_public', label: 'แสดงบนเว็บ', type: 'switch', cols: 6, default: true },
    ],
  },
  categories: {
    title: 'หมวดข่าว', icon: 'mdi-shape-outline',
    columns: [{ key: 'color', title: 'สี', type: 'color' }, { key: 'name', title: 'ชื่อหมวด' }, { key: 'slug', title: 'slug' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' }],
    fields: [
      { key: 'name', label: 'ชื่อหมวด', required: true },
      { key: 'slug', label: 'slug (ใช้ใน URL)', hint: 'ภาษาอังกฤษ เช่น pr-news / เว้นว่างให้สร้างอัตโนมัติ', cols: 6 },
      { key: 'color', label: 'สี', type: 'color', cols: 6, default: '#0B3A6E' },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 6, default: true },
    ],
  },
  departments: {
    title: 'แผนก / งาน', icon: 'mdi-domain',
    columns: [{ key: 'image_url', title: 'รูป', type: 'image' }, { key: 'name', title: 'ชื่อ' }, { key: 'type', title: 'ประเภท' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' }],
    fields: [
      { key: 'name', label: 'ชื่อ', required: true },
      { key: 'type', label: 'ประเภท', type: 'select', cols: 6, default: 'department', options: [{ title: 'แผนกวิชา', value: 'department' }, { title: 'ฝ่าย', value: 'division' }, { title: 'งาน', value: 'work' }] },
      { key: 'slug', label: 'slug (ใช้ใน URL)', cols: 6, hint: 'เว้นว่างให้สร้างอัตโนมัติ' },
      { key: 'description', label: 'รายละเอียด / หลักสูตรที่เปิดสอน', type: 'textarea' },
      { key: 'image_url', label: 'รูปประจำแผนก', type: 'image' },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 6, default: true },
    ],
  },
  pages: {
    title: 'หน้าเกี่ยวกับเรา', icon: 'mdi-file-document-outline', wide: true,
    columns: [{ key: 'title', title: 'ชื่อหน้า' }, { key: 'slug', title: 'slug' }, { key: 'show_in_menu', title: 'ในเมนู', type: 'bool' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' }],
    fields: [
      { key: 'title', label: 'ชื่อหน้า', required: true, cols: 8 },
      { key: 'slug', label: 'slug', cols: 4, hint: 'เช่น history' },
      { key: 'content', label: 'เนื้อหา', type: 'html' },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 4, default: 0 },
      { key: 'show_in_menu', label: 'แสดงในเมนู', type: 'switch', cols: 4, default: true },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 4, default: true },
    ],
  },
  personnel: {
    title: 'บุคลากร', icon: 'mdi-account-tie-outline',
    columns: [{ key: 'photo_url', title: 'รูป', type: 'image' }, { key: 'first_name', title: 'ชื่อ' }, { key: 'last_name', title: 'สกุล' }, { key: 'position', title: 'ตำแหน่ง' }, { key: 'department_name', title: 'แผนก/งาน' }, { key: 'is_active', title: 'แสดง', type: 'bool' }],
    fields: [
      { key: 'prefix', label: 'คำนำหน้า', cols: 4, hint: 'นาย / นาง / นางสาว / ว่าที่ร.ต.' },
      { key: 'first_name', label: 'ชื่อ', required: true, cols: 4 },
      { key: 'last_name', label: 'นามสกุล', required: true, cols: 4 },
      { key: 'position', label: 'ตำแหน่ง', cols: 6 },
      { key: 'admin_level', label: 'ระดับ', type: 'select', options: levelOptions, cols: 6, default: 'staff' },
      { key: 'department_id', label: 'แผนก / งาน', type: 'select', source: 'departments', cols: 6 },
      { key: 'phone', label: 'โทรศัพท์', cols: 6 },
      { key: 'email', label: 'อีเมล' },
      { key: 'photo_url', label: 'รูปถ่าย (สัดส่วน 1:1)', type: 'image' },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'แสดงบนเว็บ', type: 'switch', cols: 6, default: true },
    ],
  },
  videos: {
    title: 'วิดีโอ', icon: 'mdi-youtube',
    columns: [{ key: 'youtube_id', title: 'วิดีโอ', type: 'youtube' }, { key: 'title', title: 'ชื่อ' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' }],
    fields: [
      { key: 'title', label: 'ชื่อวิดีโอ', required: true },
      { key: 'youtube_id', label: 'ลิงก์ YouTube หรือรหัสวิดีโอ', required: true, hint: 'วางลิงก์ YouTube ได้เลย ระบบจะดึงรหัสให้' },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 6, default: true },
    ],
  },
  links: {
    title: 'ลิงก์หน่วยงาน', icon: 'mdi-link-variant',
    columns: [{ key: 'title', title: 'ชื่อ' }, { key: 'url', title: 'ลิงก์' }, { key: 'group_name', title: 'กลุ่ม' }, { key: 'sort_order', title: 'ลำดับ' }, { key: 'is_active', title: 'เปิดใช้', type: 'bool' }],
    fields: [
      { key: 'title', label: 'ชื่อ', required: true },
      { key: 'url', label: 'URL', required: true },
      { key: 'group_name', label: 'กลุ่ม', type: 'select', cols: 6, default: 'agency', options: [{ title: 'หน่วยงานที่เกี่ยวข้อง', value: 'agency' }, { title: 'ระบบสารสนเทศ', value: 'system' }] },
      { key: 'sort_order', label: 'ลำดับ', type: 'number', cols: 6, default: 0 },
      { key: 'is_active', label: 'เปิดใช้งาน', type: 'switch', cols: 6, default: true },
    ],
  },
}

// ดึงรหัสวิดีโอจากลิงก์ YouTube
export function youtubeId(v: string) {
  const m = String(v || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)
  return m ? m[1] : String(v || '').trim()
}

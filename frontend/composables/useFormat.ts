// แปลงวันที่จาก API ('YYYY-MM-DD HH:mm:ss') เป็นภาษาไทย พ.ศ.
const toDate = (s?: string | null) => (s ? new Date(String(s).replace(' ', 'T')) : null)

export function thaiDate(s?: string | null, withTime = false) {
  const d = toDate(s)
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString('th-TH', {
    day: 'numeric', month: 'short', year: 'numeric',
    ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
  }) + (withTime ? ' น.' : '')
}

export function thaiDateLong(s?: string | null) {
  const d = toDate(s)
  if (!d || isNaN(d.getTime())) return ''
  return d.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

export function thaiMonthYear(s?: string | null) {
  const d = toDate(s)
  return d ? d.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' }) : ''
}

export function dayMonth(s?: string | null) {
  const d = toDate(s)
  if (!d) return { day: '', month: '' }
  return { day: String(d.getDate()), month: d.toLocaleDateString('th-TH', { month: 'short' }) }
}

export function timeOf(s?: string | null) {
  const d = toDate(s)
  return d ? d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' }) + ' น.' : ''
}

// สำหรับ <input type="datetime-local">
export function toInputDateTime(s?: string | null) {
  return s ? String(s).replace(' ', 'T').slice(0, 16) : ''
}

export function fileSize(bytes?: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export function fileIcon(name = '') {
  const ext = name.split('.').pop()?.toLowerCase()
  if (ext === 'pdf') return 'mdi-file-pdf-box'
  if (['doc', 'docx'].includes(ext!)) return 'mdi-file-word-box'
  if (['xls', 'xlsx'].includes(ext!)) return 'mdi-file-excel-box'
  if (['ppt', 'pptx'].includes(ext!)) return 'mdi-file-powerpoint-box'
  if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext!)) return 'mdi-file-image'
  return 'mdi-file-document-outline'
}

export const STATUS_LABEL: Record<string, { text: string, color: string }> = {
  draft: { text: 'ฉบับร่าง', color: 'grey' },
  pending: { text: 'รออนุมัติ', color: 'warning' },
  published: { text: 'เผยแพร่แล้ว', color: 'success' },
  archived: { text: 'เก็บถาวร', color: 'blue-grey' },
}

export const ROLE_LABEL: Record<string, string> = {
  admin: 'ผู้ดูแลระบบ', editor: 'บรรณาธิการ', writer: 'ผู้เขียนข่าว',
}

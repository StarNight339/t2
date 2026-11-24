// utils/helpers.js — ฟังก์ชันช่วยที่ใช้หลายที่
const db = require('../db/knex');

// สร้าง slug ที่รองรับภาษาไทย + ต่อท้ายด้วยรหัสสั้นๆ กันซ้ำ
function makeSlug(text) {
  const base = String(text || '')
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\p{M}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
  return `${base || 'item'}-${Date.now().toString(36)}`;
}

// อ่านค่า page / perPage จาก query
function paging(query, defPer = 10, maxPer = 100) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const perPage = Math.min(maxPer, Math.max(1, parseInt(query.perPage || query.itemsPerPage, 10) || defPer));
  return { page, perPage, offset: (page - 1) * perPage };
}

// แปลง '' -> null และ true/false -> 1/0 ก่อนบันทึก
function clean(value, type) {
  if (value === undefined) return undefined;
  if (type === 'bool') return value === true || value === 1 || value === '1' || value === 'true' ? 1 : 0;
  if (type === 'int') return value === '' || value === null ? null : Number(value);
  if (type === 'datetime') {
    if (!value) return null;
    // รับ 'YYYY-MM-DDTHH:mm' จาก input datetime-local
    return String(value).replace('T', ' ').slice(0, 19);
  }
  return value === '' ? null : value;
}

// บันทึก log การกระทำของผู้ใช้หลังบ้าน (ไม่ให้ error ของ log ทำให้ request พัง)
async function logActivity(req, action, tableName, recordId) {
  try {
    await db('activity_logs').insert({
      user_id: req.user?.id || null,
      action,
      table_name: tableName || null,
      record_id: recordId || null,
      ip_address: req.ip,
    });
  } catch (e) { /* ignore */ }
}

const nowSql = () => db.raw('NOW()');

module.exports = { makeSlug, paging, clean, logActivity, nowSql };

// กรอง HTML จาก editor กัน XSS (เหลือเฉพาะแท็กจัดรูปแบบ, รูป, ลิงก์, ตาราง, วิดีโอ YouTube)
const sanitizeHtml = require('sanitize-html');
function cleanHtml(html) {
  if (html == null) return html;
  return sanitizeHtml(String(html), {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'iframe', 'h1', 'h2', 'u', 's', 'span', 'figure', 'figcaption']),
    allowedAttributes: {
      a: ['href', 'name', 'target', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height'],
      iframe: ['src', 'width', 'height', 'allowfullscreen', 'frameborder', 'allow'],
      '*': ['style', 'class'],
    },
    allowedStyles: { '*': { 'text-align': [/^(left|right|center|justify)$/] } },
    allowedIframeHostnames: ['www.youtube.com', 'www.youtube-nocookie.com', 'www.google.com'],
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    exclusiveFilter: (f) => f.tag === 'iframe' && !f.attribs.src,
    transformTags: { a: sanitizeHtml.simpleTransform('a', { rel: 'noopener noreferrer' }) },
  });
}
module.exports.cleanHtml = cleanHtml;

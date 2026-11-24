// controllers/posts.controller.js — ข่าว / ประกาศ
const db = require('../db/knex');
const { makeSlug, paging, clean, logActivity, cleanHtml } = require('../utils/helpers');

// คอลัมน์ที่ใช้แสดงในรายการ (ไม่ดึง content ยาวๆ มาด้วย)
const LIST_COLS = [
  'posts.id', 'posts.title', 'posts.slug', 'posts.excerpt', 'posts.cover_image',
  'posts.status', 'posts.is_pinned', 'posts.is_urgent', 'posts.view_count',
  'posts.published_at', 'posts.expired_at', 'posts.created_at', 'posts.updated_at',
  'posts.category_id', 'posts.department_id', 'posts.author_id',
  'categories.name as category_name', 'categories.slug as category_slug', 'categories.color as category_color',
  'departments.name as department_name', 'departments.slug as department_slug',
  'users.full_name as author_name',
];

const baseQuery = () => db('posts')
  .leftJoin('categories', 'categories.id', 'posts.category_id')
  .leftJoin('departments', 'departments.id', 'posts.department_id')
  .leftJoin('users', 'users.id', 'posts.author_id');

// เงื่อนไขข่าวที่ "เผยแพร่แล้ว" และถึงเวลาแสดง
const isPublic = (q) => q.where('posts.status', 'published')
  .where('posts.published_at', '<=', db.raw('NOW()'));

const POST_FIELDS = {
  title: 'string', slug: 'string', excerpt: 'string', content: 'string', cover_image: 'string',
  category_id: 'int', department_id: 'int', status: 'string',
  is_pinned: 'bool', is_urgent: 'bool', published_at: 'datetime', expired_at: 'datetime',
};
const STATUSES = ['draft', 'pending', 'published', 'archived'];

async function loadRelations(post) {
  const [images, attachments, tags] = await Promise.all([
    db('post_images').where({ post_id: post.id }).orderBy('sort_order').orderBy('id'),
    db('post_attachments').where({ post_id: post.id }).orderBy('id'),
    db('tags').join('post_tags', 'post_tags.tag_id', 'tags.id').where('post_tags.post_id', post.id).select('tags.id', 'tags.name', 'tags.slug'),
  ]);
  return { ...post, images, attachments, tags };
}

// บันทึกรูป / ไฟล์แนบ / แท็ก (แทนที่ของเดิมทั้งหมด) ภายใน transaction
async function saveRelations(trx, postId, body) {
  if (Array.isArray(body.images)) {
    await trx('post_images').where({ post_id: postId }).del();
    const rows = body.images.filter((i) => i && i.image_url).map((i, idx) => ({
      post_id: postId, image_url: i.image_url, caption: i.caption || null, sort_order: idx,
    }));
    if (rows.length) await trx('post_images').insert(rows);
  }
  if (Array.isArray(body.attachments)) {
    // เก็บ download_count เดิมไว้ ถ้าเป็นไฟล์เดิม
    const old = await trx('post_attachments').where({ post_id: postId });
    const countByUrl = Object.fromEntries(old.map((a) => [a.file_url, a.download_count]));
    await trx('post_attachments').where({ post_id: postId }).del();
    const rows = body.attachments.filter((a) => a && a.file_url).map((a) => ({
      post_id: postId,
      file_name: a.file_name || a.file_url.split('/').pop(),
      file_url: a.file_url,
      mime_type: a.mime_type || null,
      file_size: a.file_size || null,
      download_count: countByUrl[a.file_url] || 0,
    }));
    if (rows.length) await trx('post_attachments').insert(rows);
  }
  if (Array.isArray(body.tags)) {
    await trx('post_tags').where({ post_id: postId }).del();
    const names = [...new Set(body.tags.map((t) => String(typeof t === 'object' ? t.name : t).trim()).filter(Boolean))];
    for (const name of names) {
      let tag = await trx('tags').where({ name }).first();
      if (!tag) {
        const [id] = await trx('tags').insert({ name, slug: makeSlug(name) });
        tag = { id };
      }
      await trx('post_tags').insert({ post_id: postId, tag_id: tag.id });
    }
  }
}

/* =========================== สาธารณะ =========================== */

/**
 * GET /api/posts?page&perPage&category=slug&department=slug&tag=slug&q=คำค้น&urgent=1
 */
exports.publicList = async (req, res, next) => {
  try {
    const { page, perPage, offset } = paging(req.query, 12, 50);
    const q = isPublic(baseQuery());
    if (req.query.category) q.where('categories.slug', req.query.category);
    if (req.query.department) q.where('departments.slug', req.query.department);
    if (req.query.urgent) q.where('posts.is_urgent', 1);
    if (req.query.tag) {
      q.whereIn('posts.id', db('post_tags').join('tags', 'tags.id', 'post_tags.tag_id').where('tags.slug', req.query.tag).select('post_tags.post_id'));
    }
    const s = String(req.query.q || '').trim();
    if (s) q.where((w) => w.where('posts.title', 'like', `%${s}%`).orWhere('posts.excerpt', 'like', `%${s}%`).orWhere('posts.content', 'like', `%${s}%`));

    const [{ cnt }] = await q.clone().count({ cnt: 'posts.id' });
    const items = await q.select(LIST_COLS)
      .orderBy('posts.is_pinned', 'desc')
      .orderBy('posts.published_at', 'desc')
      .limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  } catch (e) { next(e); }
};

/** GET /api/posts/:slug — อ่านข่าว + นับยอดวิว */
exports.publicGet = async (req, res, next) => {
  try {
    const post = await isPublic(baseQuery()).where('posts.slug', req.params.slug)
      .select([...LIST_COLS, 'posts.content']).first();
    if (!post) return res.status(404).json({ success: false, message: 'ไม่พบข่าวนี้' });

    await db('posts').where({ id: post.id }).increment('view_count', 1);
    post.view_count += 1;

    // ข่าวที่เกี่ยวข้อง: หมวดเดียวกัน 4 ข่าวล่าสุด
    const related = await isPublic(baseQuery()).where('posts.category_id', post.category_id)
      .whereNot('posts.id', post.id).select(LIST_COLS).orderBy('posts.published_at', 'desc').limit(4);

    res.json({ success: true, data: { ...(await loadRelations(post)), related } });
  } catch (e) { next(e); }
};

/** GET /api/attachments/:id/download — นับยอดดาวน์โหลดแล้ว redirect ไปไฟล์ */
exports.download = async (req, res, next) => {
  try {
    const file = await db('post_attachments').where({ id: req.params.id }).first();
    if (!file) return res.status(404).json({ success: false, message: 'ไม่พบไฟล์' });
    await db('post_attachments').where({ id: file.id }).increment('download_count', 1);
    res.redirect(file.file_url);
  } catch (e) { next(e); }
};

/* =========================== หลังบ้าน =========================== */

// writer เห็น/แก้ได้เฉพาะข่าวของตัวเอง
const canEdit = (user, post) => user.role !== 'writer' || post.author_id === user.id;

/** GET /api/admin/posts?page&perPage&status&category_id&search */
exports.adminList = async (req, res, next) => {
  try {
    const { page, perPage, offset } = paging(req.query, 20);
    const q = baseQuery();
    if (req.user.role === 'writer') q.where('posts.author_id', req.user.id);
    if (req.query.status) q.where('posts.status', req.query.status);
    if (req.query.category_id) q.where('posts.category_id', req.query.category_id);
    const s = String(req.query.search || '').trim();
    if (s) q.where('posts.title', 'like', `%${s}%`);

    const [{ cnt }] = await q.clone().count({ cnt: 'posts.id' });
    const items = await q.select(LIST_COLS).orderBy('posts.updated_at', 'desc').limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  } catch (e) { next(e); }
};

/** GET /api/admin/posts/:id */
exports.adminGet = async (req, res, next) => {
  try {
    const post = await baseQuery().where('posts.id', req.params.id).select([...LIST_COLS, 'posts.content']).first();
    if (!post) return res.status(404).json({ success: false, message: 'ไม่พบข่าว' });
    if (!canEdit(req.user, post)) return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะข่าวของตัวเอง' });
    res.json({ success: true, data: await loadRelations(post) });
  } catch (e) { next(e); }
};

function pickPost(body, user) {
  const data = {};
  for (const [col, type] of Object.entries(POST_FIELDS)) {
    const v = clean(body[col], type);
    if (v !== undefined) data[col] = v;
  }
  if (data.content) data.content = cleanHtml(data.content);
  if (data.status && !STATUSES.includes(data.status)) data.status = 'draft';
  // writer เผยแพร่เองไม่ได้ -> ส่งให้ editor อนุมัติ
  if (user.role === 'writer' && data.status === 'published') data.status = 'pending';
  // writer ปักหมุด / ข่าวด่วนเองไม่ได้
  if (user.role === 'writer') { delete data.is_pinned; delete data.is_urgent; }
  return data;
}

/** POST /api/admin/posts */
exports.create = async (req, res, next) => {
  try {
    const body = req.body || {};
    const data = pickPost(body, req.user);
    if (!data.title || !data.content || !data.category_id) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก หัวข้อข่าว, เนื้อหา และประเภทข่าว' });
    }
    if (!data.slug) data.slug = makeSlug(data.title);
    if (data.status === 'published' && !data.published_at) data.published_at = db.raw('NOW()');
    data.author_id = req.user.id;
    if (data.department_id === undefined && req.user.department_id) data.department_id = req.user.department_id;

    const id = await db.transaction(async (trx) => {
      const [newId] = await trx('posts').insert(data);
      await saveRelations(trx, newId, body);
      return newId;
    });
    await logActivity(req, 'create', 'posts', id);
    req.params.id = id;
    const post = await baseQuery().where('posts.id', id).select([...LIST_COLS, 'posts.content']).first();
    res.status(201).json({ success: true, data: await loadRelations(post) });
  } catch (e) { next(e); }
};

/** PUT /api/admin/posts/:id */
exports.update = async (req, res, next) => {
  try {
    const body = req.body || {};
    const post = await db('posts').where({ id: req.params.id }).first();
    if (!post) return res.status(404).json({ success: false, message: 'ไม่พบข่าว' });
    if (!canEdit(req.user, post)) return res.status(403).json({ success: false, message: 'แก้ไขได้เฉพาะข่าวของตัวเอง' });

    const data = pickPost(body, req.user);
    // writer แก้ข่าวที่เผยแพร่แล้ว -> กลับไปรออนุมัติ
    if (req.user.role === 'writer' && post.status === 'published' && !data.status) data.status = 'pending';
    if ('title' in data && !data.title) return res.status(400).json({ success: false, message: 'กรุณากรอกหัวข้อข่าว' });
    if ('slug' in data && !data.slug) delete data.slug;
    // ข่าวที่เผยแพร่ต้องมีวันเผยแพร่เสมอ (ถ้าว่าง ใช้เวลาปัจจุบัน)
    const finalStatus = data.status || post.status;
    const finalDate = 'published_at' in data ? data.published_at : post.published_at;
    if (finalStatus === 'published' && !finalDate) data.published_at = db.raw('NOW()');

    await db.transaction(async (trx) => {
      if (Object.keys(data).length) await trx('posts').where({ id: post.id }).update(data);
      await saveRelations(trx, post.id, body);
    });
    await logActivity(req, 'update', 'posts', post.id);
    const updated = await baseQuery().where('posts.id', post.id).select([...LIST_COLS, 'posts.content']).first();
    res.json({ success: true, data: await loadRelations(updated) });
  } catch (e) { next(e); }
};

/** DELETE /api/admin/posts/:id */
exports.remove = async (req, res, next) => {
  try {
    const post = await db('posts').where({ id: req.params.id }).first();
    if (!post) return res.status(404).json({ success: false, message: 'ไม่พบข่าว' });
    if (!canEdit(req.user, post)) return res.status(403).json({ success: false, message: 'ลบได้เฉพาะข่าวของตัวเอง' });
    await db('posts').where({ id: post.id }).del(); // รูป/ไฟล์แนบ/แท็ก ลบตาม (ON DELETE CASCADE)
    await logActivity(req, 'delete', 'posts', post.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

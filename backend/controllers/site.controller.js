// controllers/site.controller.js — หน้าแรก, ตั้งค่าเว็บ, ติดต่อเรา, อัปโหลด, สถิติ
const db = require('../db/knex');
const { paging, logActivity } = require('../utils/helpers');

const LIST_COLS = [
  'posts.id', 'posts.title', 'posts.slug', 'posts.excerpt', 'posts.cover_image', 'posts.is_pinned',
  'posts.is_urgent', 'posts.view_count', 'posts.published_at',
  'categories.name as category_name', 'categories.slug as category_slug', 'categories.color as category_color',
];
const publishedPosts = () => db('posts')
  .leftJoin('categories', 'categories.id', 'posts.category_id')
  .where('posts.status', 'published')
  .where('posts.published_at', '<=', db.raw('NOW()'))
  .select(LIST_COLS);

async function settingsObject() {
  const rows = await db('settings');
  return Object.fromEntries(rows.map((r) => [r.setting_key, r.setting_value]));
}

/** GET /api/settings — ค่าตั้งค่าเว็บ เป็น object */
exports.getSettings = async (req, res, next) => {
  try { res.json({ success: true, data: await settingsObject() }); } catch (e) { next(e); }
};

/** PUT /api/admin/settings  body: { key: value, ... } */
exports.updateSettings = async (req, res, next) => {
  try {
    const body = req.body || {};
    const entries = Object.entries(body).filter(([k]) => /^[a-z0-9_]{1,100}$/.test(k));
    for (const [k, v] of entries) {
      await db('settings')
        .insert({ setting_key: k, setting_value: v == null ? null : String(v) })
        .onConflict('setting_key').merge();
    }
    await logActivity(req, 'update', 'settings', null);
    res.json({ success: true, data: await settingsObject() });
  } catch (e) { next(e); }
};

/** GET /api/home — รวมข้อมูลหน้าแรกไว้ในคำขอเดียว */
exports.home = async (req, res, next) => {
  try {
    const now = db.raw('NOW()');
    const [settings, banners, urgent, latest, categories, events, videos, links] = await Promise.all([
      settingsObject(),
      db('banners').where('is_active', 1)
        .where((w) => w.whereNull('start_at').orWhere('start_at', '<=', now))
        .where((w) => w.whereNull('end_at').orWhere('end_at', '>=', now))
        .orderBy('sort_order').orderBy('id', 'desc'),
      publishedPosts().where('posts.is_urgent', 1)
        .where((w) => w.whereNull('posts.expired_at').orWhere('posts.expired_at', '>=', now))
        .orderBy('posts.published_at', 'desc').limit(5),
      publishedPosts().orderBy('posts.is_pinned', 'desc').orderBy('posts.published_at', 'desc').limit(7),
      db('categories').where('is_active', 1).orderBy('sort_order'),
      db('events').where('is_public', 1)
        .where((w) => w.where('start_at', '>=', db.raw('CURDATE()')).orWhere('end_at', '>=', now))
        .orderBy('start_at').limit(5),
      db('videos').where('is_active', 1).orderBy('sort_order').orderBy('id', 'desc').limit(3),
      db('links').where('is_active', 1).orderBy('sort_order'),
    ]);

    // ข่าวล่าสุดแยกตามหมวด (หมวดละ 4 ข่าว)
    const byCategory = await Promise.all(categories.map(async (c) => ({
      ...c,
      posts: await publishedPosts().where('posts.category_id', c.id).orderBy('posts.published_at', 'desc').limit(4),
    })));

    res.json({
      success: true,
      data: { settings, banners, urgent, latest, categories: byCategory.filter((c) => c.posts.length), events, videos, links },
    });
  } catch (e) { next(e); }
};

/* ------------------------- ติดต่อเรา ------------------------- */

// กันสแปมแบบง่าย: 1 IP ส่งได้ 5 ครั้ง / 10 นาที
const hits = new Map();
function tooMany(ip) {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
}

/** POST /api/contact */
exports.sendContact = async (req, res, next) => {
  try {
    const { name, email, phone, subject, message, website } = req.body || {};
    if (website) return res.json({ success: true }); // honeypot: บอทกรอกช่องที่ซ่อนไว้
    if (!name || !subject || !message) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก ชื่อ, หัวข้อ และข้อความ' });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'รูปแบบอีเมลไม่ถูกต้อง' });
    }
    if (tooMany(req.ip)) return res.status(429).json({ success: false, message: 'ส่งข้อความบ่อยเกินไป กรุณาลองใหม่ภายหลัง' });
    await db('contact_messages').insert({
      name: String(name).slice(0, 150), email: email || null, phone: phone || null,
      subject: String(subject).slice(0, 255), message: String(message).slice(0, 5000), ip_address: req.ip,
    });
    res.status(201).json({ success: true, message: 'ส่งข้อความเรียบร้อย ขอบคุณที่ติดต่อเรา' });
  } catch (e) { next(e); }
};

/** GET /api/admin/messages?status=new */
exports.listMessages = async (req, res, next) => {
  try {
    const { page, perPage, offset } = paging(req.query, 20);
    const q = db('contact_messages');
    if (req.query.status) q.where('status', req.query.status);
    const [{ cnt }] = await q.clone().count({ cnt: '*' });
    const items = await q.orderBy('id', 'desc').limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  } catch (e) { next(e); }
};

/** PUT /api/admin/messages/:id  body: { status } */
exports.updateMessage = async (req, res, next) => {
  try {
    const { status } = req.body || {};
    if (!['new', 'read', 'replied'].includes(status)) return res.status(400).json({ success: false, message: 'สถานะไม่ถูกต้อง' });
    const affected = await db('contact_messages').where({ id: req.params.id }).update({ status });
    if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบข้อความ' });
    res.json({ success: true });
  } catch (e) { next(e); }
};

exports.removeMessage = async (req, res, next) => {
  try {
    const affected = await db('contact_messages').where({ id: req.params.id }).del();
    if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบข้อความ' });
    res.json({ success: true });
  } catch (e) { next(e); }
};

/* ------------------------- อัปโหลด ------------------------- */

/** POST /api/admin/upload  (multipart field: file) */
exports.upload = (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'ไม่พบไฟล์' });
  res.status(201).json({
    success: true,
    data: {
      url: `/uploads/${req._uploadSub}/${req.file.filename}`,
      file_name: req.file.originalname,
      mime_type: req.file.mimetype,
      file_size: req.file.size,
    },
  });
};

/* ------------------------- สถิติ / log ------------------------- */

/** GET /api/admin/stats */
exports.stats = async (req, res, next) => {
  try {
    const count = (t, where) => db(t).where(where || {}).count({ c: '*' }).then((r) => Number(r[0].c));
    const [posts, published, pending, drafts, messagesNew, events, users, views] = await Promise.all([
      count('posts'), count('posts', { status: 'published' }), count('posts', { status: 'pending' }),
      count('posts', { status: 'draft' }), count('contact_messages', { status: 'new' }),
      db('events').where('start_at', '>=', db.raw('CURDATE()')).count({ c: '*' }).then((r) => Number(r[0].c)),
      count('users'), db('posts').sum({ s: 'view_count' }).then((r) => Number(r[0].s || 0)),
    ]);
    const popular = await db('posts').where('status', 'published').orderBy('view_count', 'desc').limit(5)
      .select('id', 'title', 'slug', 'view_count');
    const byCategory = await db('categories').leftJoin('posts', 'posts.category_id', 'categories.id')
      .groupBy('categories.id', 'categories.name', 'categories.color')
      .select('categories.name', 'categories.color').count({ total: 'posts.id' }).orderBy('categories.sort_order');
    res.json({
      success: true,
      data: { posts, published, pending, drafts, messagesNew, events, users, views, popular, byCategory },
    });
  } catch (e) { next(e); }
};

/** GET /api/admin/logs (admin) */
exports.logs = async (req, res, next) => {
  try {
    const { page, perPage, offset } = paging(req.query, 30);
    const [{ cnt }] = await db('activity_logs').count({ cnt: '*' });
    const items = await db('activity_logs').leftJoin('users', 'users.id', 'activity_logs.user_id')
      .select('activity_logs.*', 'users.full_name').orderBy('activity_logs.id', 'desc').limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  } catch (e) { next(e); }
};

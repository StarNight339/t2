// controllers/crud.factory.js
// ---------------------------------------------------------------
// สร้าง controller CRUD แบบมาตรฐานจากการตั้งค่า (config)
// ใช้กับตารางที่โครงสร้างเรียบๆ เช่น banners, links, videos, personnel ...
// ข่าว (posts) มี logic เยอะกว่า จึงแยกไปไว้ที่ posts.controller.js
// ---------------------------------------------------------------
const db = require('../db/knex');
const { makeSlug, paging, clean, logActivity, cleanHtml } = require('../utils/helpers');

/**
 * @param {object} cfg
 *  table      ชื่อตาราง
 *  fields     { column: 'string'|'int'|'bool'|'datetime' } ฟิลด์ที่อนุญาตให้เขียน
 *  required   ฟิลด์บังคับตอนสร้าง
 *  slugFrom   ถ้ามี -> สร้าง slug อัตโนมัติจากฟิลด์นี้เมื่อไม่ได้ส่ง slug มา
 *  orderBy    [[col, dir], ...]
 *  search     คอลัมน์ที่ใช้ค้นหา
 *  select     (q) => q  ปรับ query ตอนอ่าน (เช่น join ชื่อแผนก)
 *  publicWhere(q, req)  เงื่อนไขเพิ่มเติมสำหรับฝั่งสาธารณะ
 *  publicKey  'slug' หรือ 'id' สำหรับ GET /:key
 *  stamp      ชื่อคอลัมน์ที่ต้องใส่ user id ตอนสร้าง/แก้ (เช่น created_by)
 */
module.exports = function crud(cfg) {
  const t = cfg.table;
  const orderBy = cfg.orderBy || [['id', 'desc']];

  const base = () => {
    let q = db(t);
    if (cfg.select) q = cfg.select(q);
    else q = q.select(`${t}.*`);
    return q;
  };

  const applyOrder = (q) => { orderBy.forEach(([c, d]) => q.orderBy(c.includes('.') ? c : `${t}.${c}`, d)); return q; };

  const applySearch = (q, s) => {
    if (s && cfg.search?.length) {
      q.where((w) => cfg.search.forEach((c) => w.orWhere(c.includes('.') ? c : `${t}.${c}`, 'like', `%${s}%`)));
    }
    return q;
  };

  function pickBody(body, isCreate) {
    const data = {};
    for (const [col, type] of Object.entries(cfg.fields)) {
      const v = clean(body[col], type);
      if (v !== undefined) data[col] = v;
    }
    for (const f of cfg.html || []) if (data[f]) data[f] = cleanHtml(data[f]);
    if (cfg.slugFrom && 'slug' in cfg.fields) {
      if (isCreate && !data.slug) data.slug = makeSlug(body[cfg.slugFrom]);
      if (!isCreate && data.slug === null) delete data.slug; // ส่ง slug ว่างมาตอนแก้ = ใช้ของเดิม
    }
    return data;
  }

  async function listWith(q, req, res) {
    const all = req.query.all === '1' || req.query.all === 'true';
    applySearch(q, String(req.query.search || req.query.q || '').trim());
    if (all) {
      const items = await applyOrder(q);
      return res.json({ success: true, items, total: items.length });
    }
    const { page, perPage, offset } = paging(req.query, 20);
    const [{ cnt }] = await q.clone().clearSelect().clearOrder().count({ cnt: '*' });
    const items = await applyOrder(q).limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  }

  return {
    // ----- ฝั่งสาธารณะ -----
    publicList: async (req, res, next) => {
      try {
        const q = base();
        if (cfg.publicWhere) cfg.publicWhere(q, req);
        await listWith(q, req, res);
      } catch (e) { next(e); }
    },

    publicGet: async (req, res, next) => {
      try {
        const key = cfg.publicKey || 'id';
        const q = base().where(`${t}.${key}`, req.params.key);
        if (cfg.publicWhere) cfg.publicWhere(q, req);
        const row = await q.first();
        if (!row) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
        res.json({ success: true, data: row });
      } catch (e) { next(e); }
    },

    // ----- ฝั่งหลังบ้าน -----
    adminList: async (req, res, next) => {
      try { await listWith(base(), req, res); } catch (e) { next(e); }
    },

    adminGet: async (req, res, next) => {
      try {
        const row = await base().where(`${t}.id`, req.params.id).first();
        if (!row) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
        res.json({ success: true, data: row });
      } catch (e) { next(e); }
    },

    create: async (req, res, next) => {
      try {
        const data = pickBody(req.body || {}, true);
        const missing = (cfg.required || []).filter((f) => data[f] === undefined || data[f] === null);
        if (missing.length) {
          return res.status(400).json({ success: false, message: `กรุณากรอก: ${missing.join(', ')}` });
        }
        if (cfg.stamp) data[cfg.stamp] = req.user.id;
        const [id] = await db(t).insert(data);
        await logActivity(req, 'create', t, id);
        const row = await base().where(`${t}.id`, id).first();
        res.status(201).json({ success: true, data: row });
      } catch (e) { next(e); }
    },

    update: async (req, res, next) => {
      try {
        const data = pickBody(req.body || {}, false);
        for (const f of cfg.required || []) {
          if (f in data && data[f] === null) {
            return res.status(400).json({ success: false, message: `กรุณากรอก: ${f}` });
          }
        }
        if (cfg.stampUpdate) data[cfg.stampUpdate] = req.user.id;
        if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลที่จะแก้ไข' });
        const affected = await db(t).where({ id: req.params.id }).update(data);
        if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
        await logActivity(req, 'update', t, req.params.id);
        const row = await base().where(`${t}.id`, req.params.id).first();
        res.json({ success: true, data: row });
      } catch (e) { next(e); }
    },

    remove: async (req, res, next) => {
      try {
        const affected = await db(t).where({ id: req.params.id }).del();
        if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบข้อมูล' });
        await logActivity(req, 'delete', t, req.params.id);
        res.json({ success: true });
      } catch (e) { next(e); }
    },
  };
};

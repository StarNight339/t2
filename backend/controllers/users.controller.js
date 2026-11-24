// controllers/users.controller.js — จัดการผู้ใช้หลังบ้าน (admin เท่านั้น)
const db = require('../db/knex');
const bcrypt = require('bcrypt');
const { paging, clean, logActivity } = require('../utils/helpers');

const COLS = [
  'users.id', 'users.username', 'users.email', 'users.full_name', 'users.avatar_url',
  'users.role_id', 'roles.name as role', 'users.department_id', 'departments.name as department_name',
  'users.is_active', 'users.last_login_at', 'users.created_at',
];
const base = () => db('users')
  .join('roles', 'roles.id', 'users.role_id')
  .leftJoin('departments', 'departments.id', 'users.department_id')
  .select(COLS);

exports.roles = async (req, res, next) => {
  try { res.json({ success: true, items: await db('roles').orderBy('id') }); } catch (e) { next(e); }
};

exports.list = async (req, res, next) => {
  try {
    const { page, perPage, offset } = paging(req.query, 20);
    const q = base();
    const s = String(req.query.search || '').trim();
    if (s) q.where((w) => w.where('users.full_name', 'like', `%${s}%`).orWhere('users.email', 'like', `%${s}%`).orWhere('users.username', 'like', `%${s}%`));
    const [{ cnt }] = await q.clone().clearSelect().count({ cnt: '*' });
    const items = await q.orderBy('users.id', 'asc').limit(perPage).offset(offset);
    res.json({ success: true, items, total: Number(cnt), page, perPage });
  } catch (e) { next(e); }
};

exports.get = async (req, res, next) => {
  try {
    const row = await base().where('users.id', req.params.id).first();
    if (!row) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    res.json({ success: true, data: row });
  } catch (e) { next(e); }
};

function pick(body) {
  const data = {};
  const fields = { username: 'string', email: 'string', full_name: 'string', avatar_url: 'string', role_id: 'int', department_id: 'int', is_active: 'bool' };
  for (const [c, t] of Object.entries(fields)) {
    const v = clean(body[c], t);
    if (v !== undefined) data[c] = v;
  }
  return data;
}

exports.create = async (req, res, next) => {
  try {
    const data = pick(req.body || {});
    const { password } = req.body || {};
    if (!data.username || !data.email || !data.full_name || !data.role_id || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอก ชื่อผู้ใช้, อีเมล, ชื่อ-สกุล, สิทธิ์ และรหัสผ่าน' });
    }
    if (password.length < 8) return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
    data.password_hash = await bcrypt.hash(password, 10);
    const [id] = await db('users').insert(data);
    await logActivity(req, 'create', 'users', id);
    res.status(201).json({ success: true, data: await base().where('users.id', id).first() });
  } catch (e) { next(e); }
};

exports.update = async (req, res, next) => {
  try {
    const data = pick(req.body || {});
    const { password } = req.body || {};
    if (password) {
      if (password.length < 8) return res.status(400).json({ success: false, message: 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร' });
      data.password_hash = await bcrypt.hash(password, 10);
    }
    // กันแอดมินปิดบัญชี/ลดสิทธิ์ตัวเองจนเข้าระบบไม่ได้
    if (Number(req.params.id) === req.user.id && (data.is_active === 0 || (data.role_id && data.role_id !== 1))) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถปิดบัญชีหรือลดสิทธิ์ของตัวเองได้' });
    }
    if (!Object.keys(data).length) return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลที่จะแก้ไข' });
    const affected = await db('users').where({ id: req.params.id }).update(data);
    if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    await logActivity(req, 'update', 'users', req.params.id);
    res.json({ success: true, data: await base().where('users.id', req.params.id).first() });
  } catch (e) { next(e); }
};

exports.remove = async (req, res, next) => {
  try {
    if (Number(req.params.id) === req.user.id) {
      return res.status(400).json({ success: false, message: 'ไม่สามารถลบบัญชีของตัวเองได้' });
    }
    const hasPosts = await db('posts').where({ author_id: req.params.id }).first();
    if (hasPosts) {
      return res.status(409).json({ success: false, message: 'ผู้ใช้นี้มีข่าวอยู่ ให้ปิดการใช้งานแทนการลบ' });
    }
    const affected = await db('users').where({ id: req.params.id }).del();
    if (!affected) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    await logActivity(req, 'delete', 'users', req.params.id);
    res.json({ success: true });
  } catch (e) { next(e); }
};

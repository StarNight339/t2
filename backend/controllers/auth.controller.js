// controllers/auth.controller.js — เข้าสู่ระบบ / ข้อมูลตัวเอง / เปลี่ยนรหัสผ่าน
const db = require('../db/knex');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const userQuery = () => db('users')
  .join('roles', 'roles.id', 'users.role_id')
  .leftJoin('departments', 'departments.id', 'users.department_id');

const pickPublic = (u) => u && ({
  id: u.id, username: u.username, name: u.full_name, email: u.email,
  role: u.role, department_id: u.department_id, department_name: u.department_name || null,
  avatar_url: u.avatar_url,
});

/**
 * POST /api/auth/login
 * body: { login (email หรือ username), password }
 * 200: { success, accessToken, user }
 */
exports.login = async (req, res, next) => {
  try {
    const { password } = req.body || {};
    const login = (req.body?.login || req.body?.email || req.body?.username || '').trim();
    if (!login || !password) {
      return res.status(400).json({ success: false, message: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }
    const user = await userQuery()
      .select('users.*', 'roles.name as role', 'departments.name as department_name')
      .where((w) => w.where('users.email', login).orWhere('users.username', login))
      .first();

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ success: false, message: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }
    if (!user.is_active) return res.status(403).json({ success: false, message: 'บัญชีนี้ถูกระงับการใช้งาน' });

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.full_name, department_id: user.department_id },
      process.env.JWT_SECRET || 'change-me',
      { expiresIn: process.env.JWT_EXPIRES || '8h' },
    );
    await db('users').where({ id: user.id }).update({ last_login_at: db.raw('NOW()') });
    await db('activity_logs').insert({ user_id: user.id, action: 'login', ip_address: req.ip }).catch(() => {});

    res.json({ success: true, accessToken: token, user: pickPublic(user) });
  } catch (e) { next(e); }
};

/** GET /api/auth/me */
exports.me = async (req, res, next) => {
  try {
    const user = await userQuery()
      .select('users.*', 'roles.name as role', 'departments.name as department_name')
      .where('users.id', req.user.id).first();
    if (!user) return res.status(404).json({ success: false, message: 'ไม่พบผู้ใช้' });
    res.json({ success: true, data: pickPublic(user) });
  } catch (e) { next(e); }
};

/** PUT /api/auth/password  body: { current_password, new_password } */
exports.changePassword = async (req, res, next) => {
  try {
    const { current_password, new_password } = req.body || {};
    if (!current_password || !new_password || new_password.length < 8) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร' });
    }
    const user = await db('users').where({ id: req.user.id }).first();
    if (!user || !(await bcrypt.compare(current_password, user.password_hash))) {
      return res.status(400).json({ success: false, message: 'รหัสผ่านเดิมไม่ถูกต้อง' });
    }
    await db('users').where({ id: user.id }).update({ password_hash: await bcrypt.hash(new_password, 10) });
    res.json({ success: true, message: 'เปลี่ยนรหัสผ่านเรียบร้อย' });
  } catch (e) { next(e); }
};

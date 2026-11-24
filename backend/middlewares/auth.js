// middlewares/auth.js
// requireAuth()                 -> ต้องล็อกอิน
// requireAuth('admin','editor') -> ต้องล็อกอิน และมี role ตามที่กำหนด
const jwt = require('jsonwebtoken');

function readToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function requireAuth(...roles) {
  return (req, res, next) => {
    const token = readToken(req);
    if (!token) return res.status(401).json({ success: false, message: 'กรุณาเข้าสู่ระบบ' });
    try {
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'change-me');
      if (roles.length && !roles.includes(payload.role)) {
        return res.status(403).json({ success: false, message: 'ไม่มีสิทธิ์ใช้งานส่วนนี้' });
      }
      req.user = payload; // { id, role, name, department_id }
      next();
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Token ไม่ถูกต้องหรือหมดอายุ' });
    }
  };
}

module.exports = { requireAuth };

// middlewares/upload.js — เก็บไฟล์ไว้ที่ uploads/ปี/เดือน/
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const MAX_MB = Number(process.env.UPLOAD_MAX_MB || 20);

const ALLOWED = new Set([
  'image/png', 'image/jpeg', 'image/webp', 'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip', 'application/x-zip-compressed',
]);

const UPLOAD_ROOT = path.join(__dirname, '..', 'uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const now = new Date();
    const sub = path.join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const dest = path.join(UPLOAD_ROOT, sub);
    fs.mkdirSync(dest, { recursive: true });
    req._uploadSub = sub.split(path.sep).join('/');
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const rand = Math.random().toString(36).slice(2, 8);
    cb(null, `${Date.now()}_${rand}${ext}`);
  },
});

function fileFilter(req, file, cb) {
  // multer อ่านชื่อไฟล์เป็น latin1 -> แปลงกลับเป็น utf8 เพื่อให้ชื่อภาษาไทยถูกต้อง
  file.originalname = Buffer.from(file.originalname, 'latin1').toString('utf8');
  if (!ALLOWED.has(file.mimetype)) {
    const err = new Error('ไม่รองรับไฟล์ประเภทนี้');
    err.status = 400;
    return cb(err, false);
  }
  cb(null, true);
}

module.exports = multer({ storage, fileFilter, limits: { fileSize: MAX_MB * 1024 * 1024 } });
module.exports.UPLOAD_ROOT = UPLOAD_ROOT;

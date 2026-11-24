// routes/index.js — รวมเส้นทาง API ทั้งหมด
const router = require('express').Router();
const { requireAuth } = require('../middlewares/auth');
const upload = require('../middlewares/upload');

const auth = require('../controllers/auth.controller');
const posts = require('../controllers/posts.controller');
const users = require('../controllers/users.controller');
const site = require('../controllers/site.controller');
const R = require('../controllers/resources');

const STAFF = requireAuth('admin', 'editor', 'writer'); // ทุกคนที่ล็อกอินหลังบ้าน
const EDITOR = requireAuth('admin', 'editor');          // จัดการเนื้อหาทั้งเว็บ
const ADMIN = requireAuth('admin');                     // ผู้ดูแลระบบ

/* ---------------- สาธารณะ (ไม่ต้องล็อกอิน) ---------------- */
router.get('/home', site.home);
router.get('/settings', site.getSettings);
router.post('/contact', site.sendContact);

router.get('/posts', posts.publicList);
router.get('/posts/:slug', posts.publicGet);
router.get('/attachments/:id/download', posts.download);

// GET /api/{categories|departments|banners|events|pages|personnel|videos|links}
for (const name of Object.keys(R)) {
  router.get(`/${name}`, R[name].publicList);
  router.get(`/${name}/:key`, R[name].publicGet);
}

/* ---------------- เข้าสู่ระบบ ---------------- */
router.post('/auth/login', auth.login);
router.get('/auth/me', STAFF, auth.me);
router.put('/auth/password', STAFF, auth.changePassword);

/* ---------------- หลังบ้าน ---------------- */
router.get('/admin/stats', STAFF, site.stats);
router.post('/admin/upload', STAFF, upload.single('file'), site.upload);

router.get('/admin/posts', STAFF, posts.adminList);
router.get('/admin/posts/:id', STAFF, posts.adminGet);
router.post('/admin/posts', STAFF, posts.create);
router.put('/admin/posts/:id', STAFF, posts.update);
router.delete('/admin/posts/:id', STAFF, posts.remove);

for (const name of Object.keys(R)) {
  router.get(`/admin/${name}`, STAFF, R[name].adminList); // writer อ่านได้ (ใช้เลือกหมวด/แผนก)
  router.get(`/admin/${name}/:id`, EDITOR, R[name].adminGet);
  router.post(`/admin/${name}`, EDITOR, R[name].create);
  router.put(`/admin/${name}/:id`, EDITOR, R[name].update);
  router.delete(`/admin/${name}/:id`, EDITOR, R[name].remove);
}

router.get('/admin/messages', EDITOR, site.listMessages);
router.put('/admin/messages/:id', EDITOR, site.updateMessage);
router.delete('/admin/messages/:id', EDITOR, site.removeMessage);

router.put('/admin/settings', ADMIN, site.updateSettings);
router.get('/admin/logs', ADMIN, site.logs);

router.get('/admin/roles', ADMIN, users.roles);
router.get('/admin/users', ADMIN, users.list);
router.get('/admin/users/:id', ADMIN, users.get);
router.post('/admin/users', ADMIN, users.create);
router.put('/admin/users/:id', ADMIN, users.update);
router.delete('/admin/users/:id', ADMIN, users.remove);

module.exports = router;

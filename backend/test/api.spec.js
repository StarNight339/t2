// test/api.spec.js — ทดสอบ API กับฐานข้อมูลจริง (ต้องโหลด schema.sql ก่อน)
// รัน: npm test   (ใช้ค่าจาก .env หรือ DB_* ใน environment)
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
const app = require('../app');
const db = require('../db/knex');

let adminToken;
let writerToken;
let writerId;
let postId;
let postSlug;
const created = { banners: null };

const A = () => ({ Authorization: `Bearer ${adminToken}` });
const W = () => ({ Authorization: `Bearer ${writerToken}` });

beforeAll(async () => {
  const res = await request(app).post('/api/auth/login').send({ login: 'admin@kbtc.ac.th', password: 'admin1234' });
  adminToken = res.body.accessToken;
});

afterAll(async () => {
  if (postId) await db('posts').where({ id: postId }).del();
  await db('posts').where('title', 'like', 'ข่าวทดสอบ writer%').del();
  if (writerId) await db('users').where({ id: writerId }).del();
  if (created.banners) await db('banners').where({ id: created.banners }).del();
  await db('contact_messages').where({ subject: 'ทดสอบระบบ' }).del();
  await db('tags').where('name', 'like', 'ทดสอบ%').del();
  await db.destroy();
});

describe('public', () => {
  it('GET /health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
  });

  it('GET /api/home returns sections', async () => {
    const res = await request(app).get('/api/home');
    expect(res.status).toBe(200);
    expect(res.body.data.settings.site_name).toBe('วิทยาลัยเทคนิคกระบี่');
    expect(Array.isArray(res.body.data.latest)).toBe(true);
    expect(res.body.data.urgent.length).toBeGreaterThan(0);
  });

  it('GET /api/posts paginates & filters by category', async () => {
    const res = await request(app).get('/api/posts?perPage=2&category=admission');
    expect(res.status).toBe(200);
    expect(res.body.items.every((p) => p.category_slug === 'admission')).toBe(true);
    const all = await request(app).get('/api/posts?perPage=2');
    expect(all.body.items.length).toBeLessThanOrEqual(2);
    expect(all.body.total).toBeGreaterThanOrEqual(4);
  });

  it('search Thai text', async () => {
    const res = await request(app).get('/api/posts?q=' + encodeURIComponent('รับสมัคร'));
    expect(res.body.items.length).toBeGreaterThan(0);
  });

  it('GET resources', async () => {
    for (const r of ['categories', 'departments', 'events', 'pages', 'links', 'personnel', 'videos', 'banners']) {
      const res = await request(app).get(`/api/${r}?all=1`);
      expect(res.status, r).toBe(200);
    }
    const page = await request(app).get('/api/pages/history');
    expect(page.body.data.title).toBe('ประวัติวิทยาลัย');
    const ev = await request(app).get('/api/events?upcoming=1&all=1');
    expect(ev.body.items.length).toBeGreaterThan(0);
  });

  it('404 unknown post', async () => {
    const res = await request(app).get('/api/posts/nope-123');
    expect(res.status).toBe(404);
  });
});

describe('auth', () => {
  it('rejects wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({ login: 'admin', password: 'x' });
    expect(res.status).toBe(401);
  });
  it('admin logged in', () => expect(adminToken).toBeTruthy());
  it('admin routes need token', async () => {
    expect((await request(app).get('/api/admin/posts')).status).toBe(401);
  });
  it('GET /api/auth/me', async () => {
    const res = await request(app).get('/api/auth/me').set(A());
    expect(res.body.data.role).toBe('admin');
  });
});

describe('posts admin', () => {
  it('creates post with images, attachments, tags', async () => {
    const res = await request(app).post('/api/admin/posts').set(A()).send({
      title: 'ข่าวทดสอบ ระบบใหม่', content: '<p>เนื้อหา</p>', category_id: 1, status: 'published',
      images: [{ image_url: '/uploads/a.jpg', caption: 'รูป 1' }],
      attachments: [{ file_url: '/uploads/a.pdf', file_name: 'เอกสาร.pdf' }],
      tags: ['ทดสอบ1', 'ทดสอบ2'],
    });
    expect(res.status).toBe(201);
    postId = res.body.data.id;
    postSlug = res.body.data.slug;
    expect(postSlug).toMatch(/^ข่าวทดสอบ-ระบบใหม่-/);
    expect(res.body.data.images).toHaveLength(1);
    expect(res.body.data.tags).toHaveLength(2);
    expect(res.body.data.published_at).toBeTruthy();
  });

  it('public detail increments views and returns relations', async () => {
    const r1 = await request(app).get('/api/posts/' + encodeURIComponent(postSlug));
    expect(r1.status).toBe(200);
    expect(r1.body.data.attachments[0].file_name).toBe('เอกสาร.pdf');
    const r2 = await request(app).get('/api/posts/' + encodeURIComponent(postSlug));
    expect(r2.body.data.view_count).toBe(r1.body.data.view_count + 1);
  });

  it('download redirects and counts', async () => {
    const d = await request(app).get('/api/posts/' + encodeURIComponent(postSlug));
    const id = d.body.data.attachments[0].id;
    const res = await request(app).get(`/api/attachments/${id}/download`);
    expect(res.status).toBe(302);
  });

  it('update keeps download count, replaces tags', async () => {
    const res = await request(app).put(`/api/admin/posts/${postId}`).set(A()).send({
      title: 'ข่าวทดสอบ แก้ไขแล้ว', tags: ['ทดสอบ3'],
      attachments: [{ file_url: '/uploads/a.pdf', file_name: 'เอกสาร.pdf' }],
    });
    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('ข่าวทดสอบ แก้ไขแล้ว');
    expect(res.body.data.tags.map((t) => t.name)).toEqual(['ทดสอบ3']);
    expect(res.body.data.attachments[0].download_count).toBe(1);
    expect(res.body.data.images).toHaveLength(1); // ไม่ส่ง images = ไม่แตะของเดิม
  });

  it('clearing published_at on a published post keeps it visible', async () => {
    const res = await request(app).put(`/api/admin/posts/${postId}`).set(A()).send({ published_at: '' });
    expect(res.body.data.published_at).toBeTruthy();
  });

  it('draft is hidden from public', async () => {
    await request(app).put(`/api/admin/posts/${postId}`).set(A()).send({ status: 'draft' });
    const res = await request(app).get('/api/posts/' + encodeURIComponent(postSlug));
    expect(res.status).toBe(404);
  });

  it('strips script from content', async () => {
    const res = await request(app).put(`/api/admin/posts/${postId}`).set(A()).send({ content: '<p onclick="x()">ok</p><script>alert(1)</script><iframe src="https://evil.com"></iframe>' });
    expect(res.body.data.content).toBe('<p>ok</p>');
  });

  it('validates required fields', async () => {
    const res = await request(app).post('/api/admin/posts').set(A()).send({ title: 'x' });
    expect(res.status).toBe(400);
  });
});

describe('writer role', () => {
  it('admin creates writer', async () => {
    const res = await request(app).post('/api/admin/users').set(A()).send({
      username: 'writer_test', email: 'writer_test@kbtc.ac.th', full_name: 'ครูทดสอบ',
      role_id: 3, department_id: 5, password: 'writer1234',
    });
    expect(res.status).toBe(201);
    writerId = res.body.data.id;
    const login = await request(app).post('/api/auth/login').send({ login: 'writer_test', password: 'writer1234' });
    writerToken = login.body.accessToken;
    expect(writerToken).toBeTruthy();
  });

  it('writer publishing becomes pending, gets own department', async () => {
    const res = await request(app).post('/api/admin/posts').set(W()).send({
      title: 'ข่าวทดสอบ writer', content: '<p>x</p>', category_id: 2, status: 'published', is_pinned: true,
    });
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('pending');
    expect(res.body.data.is_pinned).toBe(0);
    expect(res.body.data.department_id).toBe(5);
  });

  it('writer sees only own posts and cannot edit others', async () => {
    const list = await request(app).get('/api/admin/posts').set(W());
    expect(list.body.items.every((p) => p.author_id === writerId)).toBe(true);
    const res = await request(app).put('/api/admin/posts/1').set(W()).send({ title: 'hack' });
    expect(res.status).toBe(403);
  });

  it('writer cannot manage banners/users/settings', async () => {
    expect((await request(app).post('/api/admin/banners').set(W()).send({ image_url: 'x' })).status).toBe(403);
    expect((await request(app).get('/api/admin/users').set(W())).status).toBe(403);
    expect((await request(app).put('/api/admin/settings').set(W()).send({ a: 1 })).status).toBe(403);
  });

  it('cannot delete user with posts', async () => {
    const res = await request(app).delete(`/api/admin/users/${writerId}`).set(A());
    expect(res.status).toBe(409);
  });
});

describe('crud + misc', () => {
  it('banners CRUD + schedule filter', async () => {
    const res = await request(app).post('/api/admin/banners').set(A()).send({
      title: 'แบนเนอร์ทดสอบ', image_url: '/uploads/b.jpg', end_at: '2000-01-01T00:00',
    });
    expect(res.status).toBe(201);
    created.banners = res.body.data.id;
    const pub = await request(app).get('/api/banners?all=1');
    expect(pub.body.items.find((b) => b.id === created.banners)).toBeUndefined(); // หมดเวลาแล้ว
    const upd = await request(app).put(`/api/admin/banners/${created.banners}`).set(A()).send({ end_at: '' });
    expect(upd.body.data.end_at).toBeNull();
    const pub2 = await request(app).get('/api/banners?all=1');
    expect(pub2.body.items.find((b) => b.id === created.banners)).toBeTruthy();
    expect((await request(app).post('/api/admin/banners').set(A()).send({ title: 'x' })).status).toBe(400);
  });

  it('category delete blocked when used', async () => {
    const res = await request(app).delete('/api/admin/categories/1').set(A());
    expect(res.status).toBe(409);
  });

  it('contact form + admin inbox', async () => {
    const bad = await request(app).post('/api/contact').send({ name: 'a' });
    expect(bad.status).toBe(400);
    const ok = await request(app).post('/api/contact').send({ name: 'ผู้ปกครอง', subject: 'ทดสอบระบบ', message: 'สวัสดี', email: 'a@b.co' });
    expect(ok.status).toBe(201);
    const inbox = await request(app).get('/api/admin/messages?status=new').set(A());
    const msg = inbox.body.items.find((m) => m.subject === 'ทดสอบระบบ');
    expect(msg).toBeTruthy();
    expect((await request(app).put(`/api/admin/messages/${msg.id}`).set(A()).send({ status: 'read' })).status).toBe(200);
  });

  it('settings update', async () => {
    const res = await request(app).put('/api/admin/settings').set(A()).send({ phone: '075-000000' });
    expect(res.body.data.phone).toBe('075-000000');
    await request(app).put('/api/admin/settings').set(A()).send({ phone: '0-0000-0000' });
  });

  it('upload accepts image with Thai name, rejects exe', async () => {
    const tmp = path.join(os.tmpdir(), 'ภาพ.png');
    fs.writeFileSync(tmp, Buffer.from('89504e470d0a1a0a', 'hex'));
    const res = await request(app).post('/api/admin/upload').set(A()).attach('file', tmp, { contentType: 'image/png' });
    expect(res.status).toBe(201);
    expect(res.body.data.file_name).toBe('ภาพ.png');
    expect(res.body.data.url).toMatch(/^\/uploads\/\d{4}\/\d{2}\//);
    fs.unlinkSync(path.join(__dirname, '..', res.body.data.url));
    const bad = await request(app).post('/api/admin/upload').set(A()).attach('file', Buffer.from('MZ'), { filename: 'a.exe', contentType: 'application/x-msdownload' });
    expect(bad.status).toBe(400);
  });

  it('stats & logs', async () => {
    const s = await request(app).get('/api/admin/stats').set(A());
    expect(s.body.data.posts).toBeGreaterThan(0);
    const l = await request(app).get('/api/admin/logs').set(A());
    expect(l.body.items.length).toBeGreaterThan(0);
  });
});

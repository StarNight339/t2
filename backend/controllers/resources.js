// controllers/resources.js — ตั้งค่า CRUD ของแต่ละตาราง
const crud = require('./crud.factory');
const db = require('../db/knex');

const active = (t) => (q) => q.where(`${t}.is_active`, 1);

module.exports = {
  categories: crud({
    table: 'categories',
    fields: { name: 'string', slug: 'string', color: 'string', sort_order: 'int', is_active: 'bool' },
    required: ['name'],
    slugFrom: 'name',
    orderBy: [['sort_order', 'asc'], ['id', 'asc']],
    search: ['name'],
    publicWhere: active('categories'),
    publicKey: 'slug',
  }),

  departments: crud({
    table: 'departments',
    fields: { name: 'string', slug: 'string', type: 'string', description: 'string', image_url: 'string', sort_order: 'int', is_active: 'bool' },
    required: ['name'],
    slugFrom: 'name',
    orderBy: [['sort_order', 'asc'], ['id', 'asc']],
    search: ['name'],
    publicWhere: (q, req) => {
      q.where('departments.is_active', 1);
      if (req.query.type) q.where('departments.type', req.query.type);
    },
    publicKey: 'slug',
  }),

  banners: crud({
    table: 'banners',
    fields: { title: 'string', image_url: 'string', link_url: 'string', sort_order: 'int', start_at: 'datetime', end_at: 'datetime', is_active: 'bool' },
    required: ['image_url'],
    orderBy: [['sort_order', 'asc'], ['id', 'desc']],
    search: ['title'],
    // แสดงเฉพาะแบนเนอร์ที่เปิดอยู่ และอยู่ในช่วงเวลาที่ตั้งไว้
    publicWhere: (q) => q.where('banners.is_active', 1)
      .where((w) => w.whereNull('banners.start_at').orWhere('banners.start_at', '<=', db.raw('NOW()')))
      .where((w) => w.whereNull('banners.end_at').orWhere('banners.end_at', '>=', db.raw('NOW()'))),
  }),

  events: crud({
    table: 'events',
    html: [],
    fields: { title: 'string', description: 'string', location: 'string', department_id: 'int', post_id: 'int', start_at: 'datetime', end_at: 'datetime', is_all_day: 'bool', is_public: 'bool' },
    required: ['title', 'start_at'],
    stamp: 'created_by',
    orderBy: [['start_at', 'asc']],
    search: ['title', 'location'],
    select: (q) => q.select('events.*', 'departments.name as department_name', 'posts.slug as post_slug')
      .leftJoin('departments', 'departments.id', 'events.department_id')
      .leftJoin('posts', 'posts.id', 'events.post_id'),
    // ?from=YYYY-MM-DD&to=YYYY-MM-DD  หรือ ?upcoming=1
    publicWhere: (q, req) => {
      q.where('events.is_public', 1);
      if (req.query.upcoming) q.where((w) => w.where('events.start_at', '>=', db.raw('CURDATE()')).orWhere('events.end_at', '>=', db.raw('NOW()')));
      if (req.query.from) q.where('events.start_at', '>=', req.query.from);
      if (req.query.to) q.where('events.start_at', '<', db.raw('DATE_ADD(?, INTERVAL 1 DAY)', [req.query.to]));
    },
  }),

  pages: crud({
    table: 'pages',
    fields: { title: 'string', slug: 'string', content: 'string', parent_id: 'int', show_in_menu: 'bool', sort_order: 'int', is_active: 'bool' },
    required: ['title'],
    slugFrom: 'title',
    html: ['content'],
    stamp: 'updated_by',
    stampUpdate: 'updated_by',
    orderBy: [['sort_order', 'asc'], ['id', 'asc']],
    search: ['title'],
    publicWhere: active('pages'),
    publicKey: 'slug',
  }),

  personnel: crud({
    table: 'personnel',
    fields: { prefix: 'string', first_name: 'string', last_name: 'string', position: 'string', admin_level: 'string', department_id: 'int', photo_url: 'string', email: 'string', phone: 'string', sort_order: 'int', is_active: 'bool' },
    required: ['first_name', 'last_name'],
    orderBy: [['sort_order', 'asc'], ['id', 'asc']],
    search: ['first_name', 'last_name', 'position'],
    select: (q) => q.select('personnel.*', 'departments.name as department_name', 'departments.slug as department_slug')
      .leftJoin('departments', 'departments.id', 'personnel.department_id'),
    publicWhere: (q, req) => {
      q.where('personnel.is_active', 1);
      if (req.query.department) q.where('departments.slug', req.query.department);
      if (req.query.level) q.where('personnel.admin_level', req.query.level);
    },
  }),

  videos: crud({
    table: 'videos',
    fields: { title: 'string', youtube_id: 'string', sort_order: 'int', is_active: 'bool' },
    required: ['title', 'youtube_id'],
    orderBy: [['sort_order', 'asc'], ['id', 'desc']],
    search: ['title'],
    publicWhere: active('videos'),
  }),

  links: crud({
    table: 'links',
    fields: { title: 'string', url: 'string', icon_url: 'string', group_name: 'string', sort_order: 'int', is_active: 'bool' },
    required: ['title', 'url'],
    orderBy: [['sort_order', 'asc'], ['id', 'asc']],
    search: ['title'],
    publicWhere: (q, req) => {
      q.where('links.is_active', 1);
      if (req.query.group) q.where('links.group_name', req.query.group);
    },
  }),
};

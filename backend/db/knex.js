// backend/db/knex.js — ตัวเชื่อม MySQL ผ่าน Knex
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const knex = require('knex');

const db = knex({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.DB_PASS || 'rootpassword',
    database: process.env.DB_NAME || 'kbtc_pr',
    port: Number(process.env.DB_PORT) || 3306,
    charset: 'utf8mb4',
    // คืนค่า DATETIME เป็น string 'YYYY-MM-DD HH:mm:ss' ตรงๆ ไม่แปลง timezone
    dateStrings: true,
    connectTimeout: 15000,
  },
  pool: { min: 0, max: 10 },
});

module.exports = db;

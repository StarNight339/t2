// app.js — ตั้งค่า Express (แยกจาก server.js เพื่อให้เทสด้วย supertest ได้)
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

const app = express();

app.set('trust proxy', true); // อยู่หลัง reverse proxy -> req.ip เป็น IP จริงของผู้ใช้
app.use(cors({ origin: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : '*' }));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// ไฟล์ที่อัปโหลด (รูปข่าว, PDF)
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

app.get('/health', (req, res) => res.json({ service: 'kbtc-pr-api', time: new Date().toISOString() }));

app.use('/api', require('./routes'));

app.use((req, res) => res.status(404).json({ success: false, message: 'ไม่พบหน้านี้' }));
app.use(require('./middlewares/error'));

module.exports = app;

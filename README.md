# เว็บประชาสัมพันธ์ วิทยาลัยเทคนิคกระบี่

เว็บไซต์ข่าวประชาสัมพันธ์ ประกาศ และปฏิทินกิจกรรมของวิทยาลัย พร้อมระบบหลังบ้านสำหรับเจ้าหน้าที่

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Nuxt 3 + Vuetify 3 (SSR เพื่อ SEO และแชร์ลิงก์ข่าวลง Facebook/LINE ได้สวย) |
| Backend | Node.js + Express + Knex |
| Database | MySQL 8 (`schema.sql`) |

## เริ่มใช้งานเร็วด้วย Docker

```bash
docker compose up -d --build
```

- เว็บไซต์: http://localhost:3000
- หลังบ้าน: http://localhost:3000/admin
- phpMyAdmin: http://localhost:8080

บัญชีเริ่มต้น **admin@kbtc.ac.th / admin1234** — เข้าระบบแล้วเปลี่ยนรหัสผ่านทันที และตั้ง `JWT_SECRET` เป็นค่าสุ่มก่อนขึ้นระบบจริง

## รันแบบนักพัฒนา (ไม่ใช้ Docker)

```bash
# 1) ฐานข้อมูล
mysql -u root -p < schema.sql

# 2) Backend  -> http://localhost:7000
cd backend
cp .env.example .env      # แก้ค่า DB_* และ JWT_SECRET
npm install
npm run dev

# 3) Frontend -> http://localhost:3000
cd ../frontend
npm install
npm run dev               # ส่งต่อ /api และ /uploads ไปที่ localhost:7000 อัตโนมัติ
```

ถ้า backend ไม่ได้อยู่ที่ `localhost:7000` ให้ตั้ง `NUXT_API_INTERNAL=http://host:port`

## ความสามารถ

**หน้าเว็บ**
- หน้าแรก: สไลด์แบนเนอร์ (ตั้งเวลาแสดงได้), แถบข่าวด่วน, ข่าวปักหมุด, ข่าวแยกตามหมวด, กิจกรรมที่จะมาถึง, วิดีโอ YouTube
- ข่าว: กรองตามหมวด/แผนก/แท็ก, ค้นหาภาษาไทย, แบ่งหน้า, อัลบั้มภาพแบบเปิดดูภาพใหญ่, ไฟล์แนบพร้อมนับยอดดาวน์โหลด, ปุ่มแชร์ Facebook/LINE, ข่าวที่เกี่ยวข้อง
- ปฏิทินกิจกรรมรายเดือน, หน้าเกี่ยวกับวิทยาลัย, แผนกวิชา, ทำเนียบบุคลากร, ฟอร์มติดต่อ (กันสแปม)
- รองรับมือถือ

**หลังบ้าน** (`/admin`)
- แดชบอร์ด: สถิติ, ข่าวยอดนิยม, จำนวนข่าวตามหมวด
- เขียนข่าวด้วย editor แบบ WYSIWYG, อัปโหลดรูปหลายรูปพร้อมกัน, แนบไฟล์ PDF/Word/Excel, ตั้งเวลาเผยแพร่ล่วงหน้า
- จัดการแบนเนอร์, ปฏิทิน, หมวดข่าว, หน้าเกี่ยวกับเรา, แผนก, บุคลากร, วิดีโอ, ลิงก์หน่วยงาน
- กล่องข้อความติดต่อ, ตั้งค่าเว็บไซต์, จัดการผู้ใช้, ประวัติการใช้งาน

### สิทธิ์ผู้ใช้

| สิทธิ์ | ทำอะไรได้ |
|---|---|
| ผู้ดูแลระบบ (admin) | ทุกอย่าง รวมถึงผู้ใช้และการตั้งค่า |
| บรรณาธิการ (editor) | จัดการเนื้อหาทั้งเว็บ อนุมัติข่าว |
| ผู้เขียนข่าว (writer) | เขียน/แก้ข่าวของตัวเอง ข่าวที่ส่งจะ "รออนุมัติ" จนกว่าบรรณาธิการจะเผยแพร่ |

## โครงสร้างโปรเจกต์

```
schema.sql                  ฐานข้อมูล + ข้อมูลตัวอย่าง
backend/
  app.js, server.js
  routes/index.js           เส้นทาง API ทั้งหมด
  controllers/
    posts.controller.js     ข่าว (รูป ไฟล์แนบ แท็ก)
    crud.factory.js         CRUD มาตรฐาน
    resources.js            ตั้งค่า CRUD ของแต่ละตาราง
    auth / users / site     ล็อกอิน, ผู้ใช้, หน้าแรก/ตั้งค่า/ติดต่อ/อัปโหลด/สถิติ
  middlewares/              auth (JWT + role), upload (multer), error
  test/api.spec.js          ทดสอบ API กับฐานข้อมูลจริง
frontend/
  pages/                    หน้าเว็บ (news, events, about, departments, personnel, contact)
  pages/admin/              หลังบ้าน
  server/middleware/proxy.ts ส่งต่อ /api และ /uploads ไป backend
```

## API หลัก

| Method | Path | คำอธิบาย |
|---|---|---|
| GET | `/api/home` | ข้อมูลหน้าแรกทั้งหมด |
| GET | `/api/posts?category=&department=&tag=&q=&page=` | รายการข่าวที่เผยแพร่ |
| GET | `/api/posts/:slug` | อ่านข่าว (+1 ยอดอ่าน) |
| GET | `/api/{categories,departments,banners,events,pages,personnel,videos,links}` | ข้อมูลสาธารณะ |
| POST | `/api/contact` | ส่งข้อความติดต่อ |
| POST | `/api/auth/login` | `{ login, password }` → `{ accessToken, user }` |
| * | `/api/admin/...` | หลังบ้าน (ต้องส่ง `Authorization: Bearer <token>`) |

## ทดสอบ

```bash
cd backend
npm test        # ต้องโหลด schema.sql และตั้งค่า DB ใน .env ก่อน
```

## หมายเหตุ

- รายชื่อแผนก ข่าว และกิจกรรมใน `schema.sql` เป็นข้อมูลตัวอย่าง แก้ให้ตรงกับวิทยาลัยได้ในหลังบ้าน
- ที่อยู่ เบอร์โทร โลโก้ และแผนที่ ตั้งค่าได้ที่ หลังบ้าน → ตั้งค่าเว็บไซต์
- เนื้อหา HTML จาก editor ผ่านการกรอง (sanitize-html) ก่อนบันทึก เพื่อกันสคริปต์อันตราย

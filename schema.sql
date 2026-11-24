-- =====================================================================
--  ฐานข้อมูลเว็บประชาสัมพันธ์ วิทยาลัยเทคนิคกระบี่
--  MySQL 8.0+  |  utf8mb4 (รองรับภาษาไทย + อีโมจิ)
-- =====================================================================

CREATE DATABASE IF NOT EXISTS kbtc_pr
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE kbtc_pr;

-- ---------------------------------------------------------------------
-- 1) ผู้ใช้งานระบบหลังบ้าน (แอดมิน / ผู้เขียนข่าว)
-- ---------------------------------------------------------------------
CREATE TABLE roles (
  id          TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(50)  NOT NULL UNIQUE,      -- admin, editor, writer
  description VARCHAR(255) NULL
) ENGINE=InnoDB;

CREATE TABLE departments (                       -- แผนกวิชา / งาน / ฝ่าย
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,             -- แผนกวิชาช่างไฟฟ้ากำลัง
  slug        VARCHAR(150) NOT NULL UNIQUE,
  type        ENUM('department','division','work') NOT NULL DEFAULT 'department',
                                                 -- แผนกวิชา / ฝ่าย / งาน
  description TEXT NULL,
  image_url   VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role_id       TINYINT UNSIGNED NOT NULL,
  department_id INT UNSIGNED NULL,               -- ผู้เขียนสังกัดแผนก/งานไหน
  username      VARCHAR(50)  NOT NULL UNIQUE,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,           -- bcrypt / argon2
  full_name     VARCHAR(150) NOT NULL,
  avatar_url    VARCHAR(255) NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at DATETIME NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (role_id)       REFERENCES roles(id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 2) ข่าว / ประกาศ (หัวใจของเว็บ)
-- ---------------------------------------------------------------------
CREATE TABLE categories (                        -- ประเภทข่าว
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,             -- ข่าวประชาสัมพันธ์, ข่าวกิจกรรม,
  slug        VARCHAR(100) NOT NULL UNIQUE,      -- ประกาศ, จัดซื้อจัดจ้าง, รับสมัครงาน,
  color       VARCHAR(7)   NULL,                 -- รับสมัครนักเรียน, ผลงาน/รางวัล
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

CREATE TABLE posts (
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  category_id    INT UNSIGNED NOT NULL,
  department_id  INT UNSIGNED NULL,              -- ข่าวของแผนกไหน (ถ้ามี)
  author_id      INT UNSIGNED NOT NULL,
  title          VARCHAR(255) NOT NULL,
  slug           VARCHAR(255) NOT NULL UNIQUE,
  excerpt        VARCHAR(500) NULL,              -- เนื้อหาย่อ แสดงหน้ารวมข่าว
  content        MEDIUMTEXT   NOT NULL,          -- HTML จาก editor
  cover_image    VARCHAR(255) NULL,
  status         ENUM('draft','pending','published','archived') NOT NULL DEFAULT 'draft',
  is_pinned      BOOLEAN NOT NULL DEFAULT FALSE, -- ปักหมุดข่าวสำคัญ
  is_urgent      BOOLEAN NOT NULL DEFAULT FALSE, -- ข่าวด่วน (แถบวิ่ง)
  view_count     INT UNSIGNED NOT NULL DEFAULT 0,
  published_at   DATETIME NULL,
  expired_at     DATETIME NULL,                  -- เช่น ประกาศรับสมัครหมดเขต
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id)   REFERENCES categories(id),
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (author_id)     REFERENCES users(id),
  INDEX idx_posts_list (status, published_at),
  INDEX idx_posts_cat  (category_id, status, published_at)
) ENGINE=InnoDB;

CREATE TABLE post_images (                       -- อัลบั้มภาพประกอบข่าว
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id     INT UNSIGNED NOT NULL,
  image_url   VARCHAR(255) NOT NULL,
  caption     VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE post_attachments (                  -- ไฟล์แนบ PDF/DOCX
  id             INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  post_id        INT UNSIGNED NOT NULL,
  file_name      VARCHAR(255) NOT NULL,          -- ชื่อที่แสดง
  file_url       VARCHAR(255) NOT NULL,
  mime_type      VARCHAR(100) NULL,
  file_size      INT UNSIGNED NULL,              -- bytes
  download_count INT UNSIGNED NOT NULL DEFAULT 0,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE tags (
  id    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE post_tags (                         -- many-to-many
  post_id INT UNSIGNED NOT NULL,
  tag_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY (post_id, tag_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 3) ปฏิทินกิจกรรม
-- ---------------------------------------------------------------------
CREATE TABLE events (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NULL,
  post_id       INT UNSIGNED NULL,               -- ลิงก์ไปข่าวที่เกี่ยวข้อง
  created_by    INT UNSIGNED NOT NULL,
  title         VARCHAR(255) NOT NULL,
  description   TEXT NULL,
  location      VARCHAR(255) NULL,               -- หอประชุม, อาคาร 1 ...
  start_at      DATETIME NOT NULL,
  end_at        DATETIME NULL,
  is_all_day    BOOLEAN NOT NULL DEFAULT FALSE,
  is_public     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL,
  FOREIGN KEY (post_id)       REFERENCES posts(id)       ON DELETE SET NULL,
  FOREIGN KEY (created_by)    REFERENCES users(id),
  INDEX idx_events_start (start_at)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 4) เนื้อหาหน้าเว็บ
-- ---------------------------------------------------------------------
CREATE TABLE banners (                           -- สไลด์หน้าแรก
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NULL,
  image_url   VARCHAR(255) NOT NULL,
  link_url    VARCHAR(255) NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  start_at    DATETIME NULL,                     -- ตั้งเวลาแสดง
  end_at      DATETIME NULL,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE pages (                             -- หน้าคงที่: ประวัติ, วิสัยทัศน์,
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,  -- พันธกิจ, โครงสร้างองค์กร
  parent_id   INT UNSIGNED NULL,                 -- ทำเมนูซ้อนได้
  title       VARCHAR(255) NOT NULL,
  slug        VARCHAR(255) NOT NULL UNIQUE,
  content     MEDIUMTEXT NULL,
  show_in_menu BOOLEAN NOT NULL DEFAULT TRUE,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  updated_by  INT UNSIGNED NULL,
  updated_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id)  REFERENCES pages(id) ON DELETE SET NULL,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE personnel (                         -- ทำเนียบบุคลากร
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  department_id INT UNSIGNED NULL,
  prefix        VARCHAR(30)  NULL,               -- นาย/นาง/ว่าที่ร้อยตรี
  first_name    VARCHAR(100) NOT NULL,
  last_name     VARCHAR(100) NOT NULL,
  position      VARCHAR(150) NULL,               -- ผู้อำนวยการ, ครู คศ.2, หัวหน้าแผนก
  admin_level   ENUM('director','deputy','head','staff') NOT NULL DEFAULT 'staff',
  photo_url     VARCHAR(255) NULL,
  email         VARCHAR(150) NULL,
  phone         VARCHAR(30)  NULL,
  sort_order    INT NOT NULL DEFAULT 0,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE videos (                            -- วิดีโอประชาสัมพันธ์ (YouTube)
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(255) NOT NULL,
  youtube_id  VARCHAR(20)  NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE links (                             -- ลิงก์หน่วยงาน: สอศ., ระบบ RMS, ศธ.02
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  title       VARCHAR(150) NOT NULL,
  url         VARCHAR(255) NOT NULL,
  icon_url    VARCHAR(255) NULL,
  group_name  VARCHAR(50)  NULL,                 -- 'agency', 'system', 'footer'
  sort_order  INT NOT NULL DEFAULT 0,
  is_active   BOOLEAN NOT NULL DEFAULT TRUE
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- 5) ติดต่อ / ตั้งค่า / Log
-- ---------------------------------------------------------------------
CREATE TABLE contact_messages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  email       VARCHAR(150) NULL,
  phone       VARCHAR(30)  NULL,
  subject     VARCHAR(255) NOT NULL,
  message     TEXT NOT NULL,
  ip_address  VARCHAR(45)  NULL,
  status      ENUM('new','read','replied') NOT NULL DEFAULT 'new',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE settings (                          -- key-value: ชื่อเว็บ, ที่อยู่, เบอร์,
  setting_key   VARCHAR(100) PRIMARY KEY,        -- Facebook, โลโก้, แผนที่
  setting_value TEXT NULL,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE activity_logs (                     -- ใครแก้อะไรเมื่อไหร่
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NULL,
  action      VARCHAR(50)  NOT NULL,             -- create, update, delete, login
  table_name  VARCHAR(50)  NULL,
  record_id   INT UNSIGNED NULL,
  ip_address  VARCHAR(45)  NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_logs_user (user_id, created_at)
) ENGINE=InnoDB;

-- =====================================================================
--  ข้อมูลตั้งต้น
-- =====================================================================
INSERT INTO roles (name, description) VALUES
 ('admin',  'ผู้ดูแลระบบ จัดการได้ทุกอย่าง'),
 ('editor', 'ตรวจ/อนุมัติข่าวก่อนเผยแพร่'),
 ('writer', 'เขียนข่าวของแผนก/งานตนเอง');

INSERT INTO categories (name, slug, color, sort_order) VALUES
 ('ข่าวประชาสัมพันธ์', 'pr-news',     '#1E88E5', 1),
 ('ข่าวกิจกรรม',      'activities',  '#43A047', 2),
 ('ประกาศ',           'announcements','#E53935', 3),
 ('รับสมัครนักเรียน นักศึกษา', 'admission', '#FB8C00', 4),
 ('จัดซื้อจัดจ้าง',     'procurement', '#6D4C41', 5),
 ('รับสมัครงาน',       'jobs',        '#8E24AA', 6),
 ('ผลงาน/รางวัล',      'awards',      '#FDD835', 7);

INSERT INTO settings (setting_key, setting_value) VALUES
 ('site_name',    'วิทยาลัยเทคนิคกระบี่'),
 ('site_name_en', 'Krabi Technical College'),
 ('slogan',       'ทักษะเยี่ยม เปี่ยมคุณธรรม นำเทคโนโลยี'),
 ('address',      'วิทยาลัยเทคนิคกระบี่ จ.กระบี่ (แก้ไขที่อยู่ได้ในหน้าตั้งค่า)'),
 ('phone',        '0-0000-0000'),
 ('email',        'info@kbtc.ac.th'),
 ('facebook_url', 'https://www.facebook.com/'),
 ('logo_url',     ''),
 ('map_embed',    ''),
 ('about_short',  'สถานศึกษาสังกัดสำนักงานคณะกรรมการการอาชีวศึกษา จัดการเรียนการสอนระดับ ปวช. และ ปวส.');

-- =====================================================================
--  ข้อมูลตัวอย่าง (ลบได้เมื่อขึ้นระบบจริง)
--  ผู้ดูแลระบบเริ่มต้น: admin@kbtc.ac.th / admin1234  << เปลี่ยนรหัสทันที
-- =====================================================================
INSERT INTO departments (name, slug, type, description, sort_order) VALUES
 ('แผนกวิชาช่างยนต์',              'automotive',   'department', 'เรียนรู้งานซ่อมบำรุงเครื่องยนต์และระบบรถยนต์', 1),
 ('แผนกวิชาช่างกลโรงงาน',          'machine-shop', 'department', 'งานเครื่องมือกล กลึง กัด เจียระไน', 2),
 ('แผนกวิชาช่างไฟฟ้ากำลัง',        'electrical',   'department', 'ติดตั้งและควบคุมระบบไฟฟ้า', 3),
 ('แผนกวิชาช่างอิเล็กทรอนิกส์',      'electronics',  'department', 'วงจรอิเล็กทรอนิกส์และระบบสมองกลฝังตัว', 4),
 ('แผนกวิชาเทคโนโลยีสารสนเทศ',     'it',           'department', 'ระบบเครือข่าย พัฒนาเว็บและแอปพลิเคชัน', 5),
 ('งานประชาสัมพันธ์',               'pr',           'work',       'เผยแพร่ข่าวสารของวิทยาลัย', 10),
 ('ฝ่ายบริหารทรัพยากร',             'resources',    'division',   NULL, 20);

INSERT INTO users (role_id, department_id, username, email, password_hash, full_name) VALUES
 (1, 6, 'admin', 'admin@kbtc.ac.th', '$2b$10$Q4wkaHx9TYt82eu53wavX.ZwB7wdvH.MbOQWviiQDzmHLqLnBq9WS', 'ผู้ดูแลระบบ');

INSERT INTO posts (category_id, department_id, author_id, title, slug, excerpt, content, status, is_pinned, is_urgent, published_at) VALUES
 (4, NULL, 1, 'รับสมัครนักเรียน นักศึกษาใหม่ ระดับ ปวช. และ ปวส.', 'admission-sample',
  'เปิดรับสมัครนักเรียน นักศึกษาใหม่ทุกสาขาวิชา สมัครได้ที่งานทะเบียน',
  '<p>วิทยาลัยเทคนิคกระบี่เปิดรับสมัครนักเรียน นักศึกษาใหม่ ระดับ ปวช. และ ปวส. ทุกสาขาวิชา</p><p>สอบถามรายละเอียดเพิ่มเติมได้ที่งานทะเบียน</p>',
  'published', TRUE, TRUE, NOW()),
 (2, 5, 1, 'แผนกวิชาเทคโนโลยีสารสนเทศจัดอบรมการพัฒนาเว็บไซต์', 'it-web-workshop-sample',
  'นักศึกษาแผนก IT ร่วมอบรมเชิงปฏิบัติการพัฒนาเว็บไซต์ด้วย Nuxt และ Express',
  '<p>แผนกวิชาเทคโนโลยีสารสนเทศจัดอบรมเชิงปฏิบัติการการพัฒนาเว็บไซต์ให้กับนักศึกษา</p>',
  'published', FALSE, FALSE, NOW() - INTERVAL 1 DAY),
 (3, NULL, 1, 'ประกาศวันหยุดราชการประจำเดือน', 'holiday-announcement-sample',
  'ประกาศวันหยุดราชการให้นักเรียน นักศึกษา และบุคลากรทราบ',
  '<p>ตามประกาศของวิทยาลัย ให้หยุดทำการเรียนการสอนตามวันหยุดราชการ</p>',
  'published', FALSE, FALSE, NOW() - INTERVAL 2 DAY),
 (7, 3, 1, 'นักศึกษาช่างไฟฟ้าคว้ารางวัลการแข่งขันทักษะวิชาชีพ', 'electrical-award-sample',
  'ขอแสดงความยินดีกับนักศึกษาที่ได้รับรางวัลการแข่งขันทักษะวิชาชีพระดับภาค',
  '<p>ขอแสดงความยินดีกับนักศึกษาแผนกวิชาช่างไฟฟ้ากำลังที่ได้รับรางวัล</p>',
  'published', FALSE, FALSE, NOW() - INTERVAL 3 DAY);

INSERT INTO events (department_id, created_by, title, description, location, start_at, end_at, is_all_day) VALUES
 (NULL, 1, 'ปฐมนิเทศนักเรียน นักศึกษาใหม่', 'กิจกรรมปฐมนิเทศ', 'หอประชุมวิทยาลัย', NOW() + INTERVAL 7 DAY, NULL, TRUE),
 (5,    1, 'แข่งขันพัฒนาเว็บไซต์', 'การแข่งขันทักษะภายในแผนก', 'อาคาร IT', NOW() + INTERVAL 14 DAY, NOW() + INTERVAL 14 DAY + INTERVAL 4 HOUR, FALSE);

INSERT INTO pages (title, slug, content, sort_order) VALUES
 ('ประวัติวิทยาลัย', 'history', '<p>ใส่ประวัติความเป็นมาของวิทยาลัยเทคนิคกระบี่ที่นี่</p>', 1),
 ('วิสัยทัศน์ พันธกิจ', 'vision', '<p>ใส่วิสัยทัศน์และพันธกิจของวิทยาลัยที่นี่</p>', 2),
 ('โครงสร้างการบริหาร', 'structure', '<p>ใส่แผนภูมิโครงสร้างการบริหารที่นี่</p>', 3);

INSERT INTO links (title, url, group_name, sort_order) VALUES
 ('สำนักงานคณะกรรมการการอาชีวศึกษา', 'https://www.vec.go.th', 'agency', 1),
 ('กระทรวงศึกษาธิการ', 'https://www.moe.go.th', 'agency', 2);

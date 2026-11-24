// middlewares/error.js — จัดการ error รวมศูนย์ (ไม่ส่ง stack trace ออกไป)
module.exports = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // แปลง error ที่พบบ่อยจาก MySQL ให้อ่านง่าย
  if (err.code === 'ER_DUP_ENTRY') { status = 409; message = 'ข้อมูลซ้ำกับที่มีอยู่แล้ว'; }
  if (err.code === 'ER_ROW_IS_REFERENCED_2') { status = 409; message = 'ลบไม่ได้ เพราะมีข้อมูลอื่นอ้างอิงอยู่'; }
  if (err.code === 'ER_NO_REFERENCED_ROW_2') { status = 400; message = 'ข้อมูลอ้างอิงไม่ถูกต้อง'; }
  if (err.code === 'LIMIT_FILE_SIZE') { status = 413; message = 'ไฟล์มีขนาดใหญ่เกินกำหนด'; }

  if (status >= 500 && process.env.NODE_ENV !== 'test') console.error('[ERROR]', err);
  if (status >= 500 && process.env.NODE_ENV === 'production') message = 'Internal Server Error';
  res.status(status).json({ success: false, message });
};

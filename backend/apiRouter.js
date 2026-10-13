import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";
import express from "express";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, "db.json");

// ========================================================
// SECURITY SUITE: HASHING, SESSIONS & RATE LIMITING
// ========================================================

// 1. Password Hashing using Scrypt + Salt
export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export function verifyPassword(password, storedPassword) {
  if (!storedPassword || typeof password !== "string") return false;
  // If stored as legacy plaintext, compare and allow migration
  if (!storedPassword.includes(":")) {
    return password === storedPassword;
  }
  try {
    const [salt, key] = storedPassword.split(":");
    const keyBuffer = Buffer.from(key, "hex");
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

// 2. Brute Force Protection & Rate Limiting
const loginAttempts = new Map(); // key: ip, value: { count, firstAttemptAt, lockedUntil }
const MAX_ATTEMPTS = 5;
const LOCK_TIME_MS = 10 * 60 * 1000; // 10 minutes lock
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes tracking window

function checkRateLimit(ip) {
  const record = loginAttempts.get(ip);
  if (!record) return { allowed: true };
  const now = Date.now();
  if (record.lockedUntil && record.lockedUntil > now) {
    const remainingSec = Math.ceil((record.lockedUntil - now) / 1000);
    const remainingMin = Math.ceil(remainingSec / 60);
    return {
      allowed: false,
      message: `ตรวจพบการพยายามเข้าสู่ระบบผิดพลาดเกิน 5 ครั้ง บัญชีถูกระงับชั่วคราวอีกประมาณ ${remainingMin} นาที เพื่อความปลอดภัย`
    };
  }
  if (now - record.firstAttemptAt > WINDOW_MS) {
    loginAttempts.delete(ip);
    return { allowed: true };
  }
  return { allowed: true };
}

function recordFailedLogin(ip) {
  const now = Date.now();
  const record = loginAttempts.get(ip) || { count: 0, firstAttemptAt: now };
  record.count += 1;
  if (record.count >= MAX_ATTEMPTS) {
    record.lockedUntil = now + LOCK_TIME_MS;
  }
  loginAttempts.set(ip, record);
  return MAX_ATTEMPTS - record.count;
}

function resetFailedLogin(ip) {
  loginAttempts.delete(ip);
}

// 3. Active Sessions in Memory with 4-Hour Expiration
const activeTokens = new Map();
const SESSION_DURATION_MS = 4 * 60 * 60 * 1000; // 4 hours

function cleanExpiredTokens() {
  const now = Date.now();
  for (const [token, session] of activeTokens.entries()) {
    if (session.expiresAt && session.expiresAt <= now) {
      activeTokens.delete(token);
    }
  }
}
setInterval(cleanExpiredTokens, 10 * 60 * 1000);

// 4. Authentication Middleware
export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: กรุณาเข้าสู่ระบบในฐานะผู้ดูแลระบบก่อนดำเนินการ"
    });
  }
  const token = authHeader.split(" ")[1];
  const session = activeTokens.get(token);
  if (!session) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่"
    });
  }
  if (session.expiresAt && session.expiresAt <= Date.now()) {
    activeTokens.delete(token);
    return res.status(401).json({
      success: false,
      message: "Unauthorized: เซสชันหมดอายุแล้ว กรุณาเข้าสู่ระบบใหม่"
    });
  }
  req.admin = session;
  next();
}

// ========================================================
// DATABASE ACCESS HELPERS
// ========================================================
export function getDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initialDb = {
        generalInfo: {},
        curriculum: [],
        faculty: [],
        announcements: [],
        applications: [],
        contacts: [],
        admins: [
          {
            id: "admin-1",
            username: "admin",
            password: hashPassword("sesskru!"),
            name: "ผู้ดูแลระบบ SSKRU",
            role: "Super Admin",
            email: "admin@sskru.ac.th"
          }
        ]
      };
      saveDb(initialDb);
      return initialDb;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const db = JSON.parse(raw);

    // Auto-migrate plaintext passwords to scrypt hashes
    if (db.admins && Array.isArray(db.admins)) {
      let needsSave = false;
      db.admins.forEach((a) => {
        if (a.password && !a.password.includes(":")) {
          a.password = hashPassword(a.password);
          needsSave = true;
        }
      });
      if (needsSave) {
        saveDb(db);
      }
    }

    return db;
  } catch (err) {
    console.error("Error reading db.json:", err);
    return {
      generalInfo: {},
      curriculum: [],
      faculty: [],
      announcements: [],
      applications: [],
      contacts: [],
      admins: []
    };
  }
}

export function saveDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("Error writing db.json:", err);
    return false;
  }
}

// ========================================================
// API ROUTES ROUTER
// ========================================================
export const apiRouter = express.Router();
apiRouter.use(express.json());

// ----------------------------------------------------
// 0. AUTHENTICATION (แอดมิน ล็อคอิน / ตรวจสอบสิทธิ์)
// ----------------------------------------------------
apiRouter.post("/auth/login", (req, res) => {
  const ip = req.ip || req.socket.remoteAddress || "unknown-ip";
  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return res.status(429).json({ success: false, message: rateCheck.message });
  }

  const { username, password } = req.body;
  if (!username || !password || typeof username !== "string" || typeof password !== "string") {
    return res.status(400).json({ success: false, message: "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน" });
  }

  const db = getDb();
  const admins = db.admins || [];
  const admin = admins.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());

  if (!admin || !verifyPassword(password, admin.password)) {
    const remaining = recordFailedLogin(ip);
    if (remaining <= 0) {
      return res.status(429).json({
        success: false,
        message: "รหัสผ่านไม่ถูกต้องเกิน 5 ครั้ง บัญชีถูกระงับชั่วคราว 10 นาทีเพื่อความปลอดภัย"
      });
    }
    return res.status(401).json({
      success: false,
      message: `ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง (เหลือโอกาสลองอีก ${remaining} ครั้ง)`
    });
  }

  // Reset failed attempts on success
  resetFailedLogin(ip);

  // If password was plaintext, upgrade to hash automatically
  if (!admin.password.includes(":")) {
    admin.password = hashPassword(password);
    saveDb(db);
  }

  // Generate cryptographically secure token
  const token = "sskru-" + crypto.randomBytes(32).toString("hex");
  const expiresAt = Date.now() + SESSION_DURATION_MS;

  activeTokens.set(token, {
    adminId: admin.id,
    username: admin.username,
    name: admin.name,
    role: admin.role,
    email: admin.email,
    createdAt: Date.now(),
    expiresAt
  });

  res.json({
    success: true,
    message: "เข้าสู่ระบบสำเร็จ",
    token,
    user: {
      username: admin.username,
      name: admin.name,
      role: admin.role,
      email: admin.email
    },
    expiresIn: SESSION_DURATION_MS / 1000
  });
});

apiRouter.get("/auth/me", requireAdmin, (req, res) => {
  res.json({ success: true, user: req.admin });
});

apiRouter.post("/auth/logout", (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    activeTokens.delete(token);
  }
  res.json({ success: true, message: "ออกจากระบบเรียบร้อย" });
});

apiRouter.post("/auth/change-password", requireAdmin, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "กรุณากรอกข้อมูลให้ครบถ้วน" });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" });
  }

  const db = getDb();
  const admins = db.admins || [];
  const adminIndex = admins.findIndex((a) => a.username === req.admin.username);

  if (adminIndex === -1) {
    return res.status(404).json({ success: false, message: "ไม่พบบัญชีผู้ดูแลนี้" });
  }

  const admin = admins[adminIndex];
  if (!verifyPassword(currentPassword, admin.password)) {
    return res.status(401).json({ success: false, message: "รหัสผ่านปัจจุบันไม่ถูกต้อง" });
  }

  // Save strong hash
  admin.password = hashPassword(newPassword);
  admins[adminIndex] = admin;
  db.admins = admins;
  saveDb(db);

  res.json({ success: true, message: "เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย" });
});

// ----------------------------------------------------
// 1. DATA BUNDLE (SECURELY SANITIZED)
// Public gets only curriculum, faculty, news & stats.
// Applications and Contacts (PII) are only sent to authenticated Admins.
// ----------------------------------------------------
apiRouter.get("/data", (req, res) => {
  const db = getDb();
  const safeDb = {
    generalInfo: db.generalInfo || {},
    curriculum: db.curriculum || [],
    faculty: db.faculty || [],
    announcements: db.announcements || [],
    applications: [],
    contacts: []
  };

  // If authenticated admin, include private applications and contacts
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const session = activeTokens.get(token);
    if (session && session.expiresAt > Date.now()) {
      safeDb.applications = db.applications || [];
      safeDb.contacts = db.contacts || [];
    }
  }

  res.json({ success: true, data: safeDb });
});

// ----------------------------------------------------
// 2. GENERAL INFO
// ----------------------------------------------------
apiRouter.get("/general", (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.generalInfo || {} });
});

apiRouter.put("/general", requireAdmin, (req, res) => {
  const db = getDb();
  db.generalInfo = { ...db.generalInfo, ...req.body };
  saveDb(db);
  res.json({ success: true, data: db.generalInfo });
});

// ----------------------------------------------------
// 3. CURRICULUM (หลักสูตร)
// ----------------------------------------------------
apiRouter.get("/curriculum", (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.curriculum || [] });
});

apiRouter.post("/curriculum", requireAdmin, (req, res) => {
  const db = getDb();
  const newItem = {
    id: "c-" + Date.now(),
    icon: req.body.icon || "💻",
    nameEn: req.body.nameEn || "New Course",
    nameTh: req.body.nameTh || "รายวิชาใหม่",
    description: req.body.description || "",
    category: req.body.category || "Core"
  };
  db.curriculum = db.curriculum || [];
  db.curriculum.push(newItem);
  saveDb(db);
  res.status(201).json({ success: true, data: newItem });
});

apiRouter.put("/curriculum/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const index = (db.curriculum || []).findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Course not found" });

  db.curriculum[index] = { ...db.curriculum[index], ...req.body, id: req.params.id };
  saveDb(db);
  res.json({ success: true, data: db.curriculum[index] });
});

apiRouter.delete("/curriculum/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.curriculum = (db.curriculum || []).filter((c) => c.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: "Deleted successfully" });
});

// ----------------------------------------------------
// 4. FACULTY (อาจารย์)
// ----------------------------------------------------
apiRouter.get("/faculty", (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.faculty || [] });
});

apiRouter.post("/faculty", requireAdmin, (req, res) => {
  const db = getDb();
  const newProf = {
    id: "f-" + Date.now(),
    name: req.body.name || "ชื่ออาจารย์",
    role: req.body.role || "อาจารย์ประจำสาขาวิชา",
    specialty: req.body.specialty || "Computer Science",
    image: req.body.image || "/images/prof_sskr_1.jpg",
    email: req.body.email || ""
  };
  db.faculty = db.faculty || [];
  db.faculty.push(newProf);
  saveDb(db);
  res.status(201).json({ success: true, data: newProf });
});

apiRouter.put("/faculty/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const index = (db.faculty || []).findIndex((f) => f.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Faculty not found" });

  db.faculty[index] = { ...db.faculty[index], ...req.body, id: req.params.id };
  saveDb(db);
  res.json({ success: true, data: db.faculty[index] });
});

apiRouter.delete("/faculty/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.faculty = (db.faculty || []).filter((f) => f.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: "Deleted successfully" });
});

// ----------------------------------------------------
// 5. ANNOUNCEMENTS / ข่าวสาร-ส่วนรวม
// ----------------------------------------------------
apiRouter.get("/announcements", (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.announcements || [] });
});

apiRouter.post("/announcements", requireAdmin, (req, res) => {
  const db = getDb();
  const today = new Date().toISOString().split("T")[0];
  const newPost = {
    id: "a-" + Date.now(),
    title: req.body.title || "หัวข้อข่าวใหม่",
    content: req.body.content || "",
    date: req.body.date || today,
    tag: req.body.tag || "ข่าวทั่วไป",
    pinned: Boolean(req.body.pinned)
  };
  db.announcements = db.announcements || [];
  db.announcements.unshift(newPost);
  saveDb(db);
  res.status(201).json({ success: true, data: newPost });
});

apiRouter.put("/announcements/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const index = (db.announcements || []).findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Announcement not found" });

  db.announcements[index] = { ...db.announcements[index], ...req.body, id: req.params.id };
  saveDb(db);
  res.json({ success: true, data: db.announcements[index] });
});

apiRouter.delete("/announcements/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.announcements = (db.announcements || []).filter((a) => a.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: "Deleted successfully" });
});

// ----------------------------------------------------
// 6. ADMISSION APPLICATIONS (ผู้สมัครเรียน)
// Public can POST (Apply), but only Admin can GET / PUT / DELETE
// ----------------------------------------------------
apiRouter.get("/applications", requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.applications || [] });
});

apiRouter.post("/applications", (req, res) => {
  const db = getDb();
  const now = new Date();
  const dateStr = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH");
  const newApp = {
    id: "app-" + Date.now(),
    name: req.body.name || "",
    phone: req.body.phone || "",
    email: req.body.email || "",
    school: req.body.school || "",
    status: "รอการตรวจสอบ",
    createdAt: dateStr
  };
  db.applications = db.applications || [];
  db.applications.unshift(newApp);
  saveDb(db);
  res.status(201).json({ success: true, data: newApp, message: "บันทึกข้อมูลใบสมัครสำเร็จ" });
});

apiRouter.put("/applications/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const index = (db.applications || []).findIndex((a) => a.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Application not found" });

  db.applications[index] = { ...db.applications[index], ...req.body, id: req.params.id };
  saveDb(db);
  res.json({ success: true, data: db.applications[index] });
});

apiRouter.delete("/applications/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.applications = (db.applications || []).filter((a) => a.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: "Deleted successfully" });
});

// ----------------------------------------------------
// 7. CONTACT MESSAGES (ข้อความติดต่อ)
// Public can POST, but only Admin can GET / PUT / DELETE
// ----------------------------------------------------
apiRouter.get("/contacts", requireAdmin, (req, res) => {
  const db = getDb();
  res.json({ success: true, data: db.contacts || [] });
});

apiRouter.post("/contacts", (req, res) => {
  const db = getDb();
  const now = new Date();
  const dateStr = now.toLocaleDateString("th-TH") + " " + now.toLocaleTimeString("th-TH");
  const newContact = {
    id: "cnt-" + Date.now(),
    name: req.body.name || "ผู้สอบถาม",
    email: req.body.email || "",
    subject: req.body.subject || "ติดต่อสอบถามทั่วไป",
    message: req.body.message || "",
    status: "ยังไม่ได้อ่าน",
    createdAt: dateStr
  };
  db.contacts = db.contacts || [];
  db.contacts.unshift(newContact);
  saveDb(db);
  res.status(201).json({ success: true, data: newContact, message: "ส่งข้อความติดต่อเรียบร้อยแล้ว" });
});

apiRouter.put("/contacts/:id", requireAdmin, (req, res) => {
  const db = getDb();
  const index = (db.contacts || []).findIndex((c) => c.id === req.params.id);
  if (index === -1) return res.status(404).json({ success: false, message: "Contact not found" });

  db.contacts[index] = { ...db.contacts[index], ...req.body, id: req.params.id };
  saveDb(db);
  res.json({ success: true, data: db.contacts[index] });
});

apiRouter.delete("/contacts/:id", requireAdmin, (req, res) => {
  const db = getDb();
  db.contacts = (db.contacts || []).filter((c) => c.id !== req.params.id);
  saveDb(db);
  res.json({ success: true, message: "Deleted successfully" });
});

// ----------------------------------------------------
// 8. FILE & IMAGE UPLOAD (CMS MEDIA STORAGE)
// Requires Admin Authentication
// ----------------------------------------------------
apiRouter.post("/upload", requireAdmin, (req, res) => {
  try {
    const { filename, data } = req.body;
    if (!filename || !data) {
      return res.status(400).json({ success: false, message: "กรุณาส่งชื่อไฟล์และข้อมูลรูปภาพ" });
    }

    // Extract base64
    let buffer;
    const matches = data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], "base64");
    } else {
      buffer = Buffer.from(data, "base64");
    }

    // Clean extension and filename
    const ext = path.extname(filename).toLowerCase() || ".webp";
    const baseName = path.basename(filename, ext).replace(/[^a-zA-Z0-9_\-\u0E00-\u0E7F]/g, "_");
    const safeFilename = `${Date.now()}_${baseName}${ext}`;

    const targetDirs = [
      path.join(__dirname, "../frontend/public/images"),
      path.join(__dirname, "../frontend/dist/images")
    ];
    if (fs.existsSync(path.join(__dirname, "../dist"))) {
      targetDirs.push(path.join(__dirname, "../dist/images"));
    }

    for (const dir of targetDirs) {
      try {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(path.join(dir, safeFilename), buffer);
      } catch (err) {
        console.warn(`Could not save uploaded file to ${dir}:`, err.message);
      }
    }

    const publicUrl = `/images/${safeFilename}`;
    res.json({
      success: true,
      url: publicUrl,
      filename: safeFilename,
      message: "อัปโหลดรูปภาพสำเร็จ"
    });
  } catch (error) {
    console.error("Upload handler error:", error);
    res.status(500).json({
      success: false,
      message: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ: " + error.message
    });
  }
});


# Technical Implementation & Architecture Overview
> สรุปกระบวนการทางเทคนิคและสถาปัตยกรรมระบบ (Technical Engineering Overview) — มุ่งเน้นที่กลไกการพัฒนาและระบบการทำงาน

---

## 1. กลไก Scrollytelling (Scroll-Driven Video Scrubbing Engine)

หลักการทำงานของระบบเล่าเรื่องตามการเลื่อนหน้าจอ:

```
[User Window Scroll]
       │
       ▼
[BoundingClientRect Calculation] ──▶ Normalization (0.00 to 1.00)
       │
       ├──▶ [Target Time Calculation] ──▶ targetTime = progress * duration
       │                                         │
       │                                         ▼
       │                            [video.currentTime = targetTime]
       │                            (ป้องกัน Seek Overlap ด้วย Flag isSeeking / pendingSeek)
       │
       └──▶ [Interpolation Ranges] ────▶ Opacity (0.0 -> 1.0 -> 0.0)
                                       ▶ Transform (translateY: 50px -> 0px -> -50px)
                                       ▶ Pointer-events (none <-> all)
```

1. **Sticky Viewport Pinning**:
   - ใช้คอนเทนเนอร์แม่ความสูงขยายตามจำนวนซีน (เช่น `540vh`)
   - ใช้วิวพอร์ตลูก `position: sticky; top: 0; width: 100vw; height: 100vh;` ตรึงวิดีโอและองค์ประกอบทั้งหมดให้อยู่กับที่ตลอดช่วงการเลื่อน
2. **Scroll Progress Normalization**:
   - วัดระยะผ่าน `getBoundingClientRect().top` เทียบกับความสูงแทร็กที่เหลือ (`offsetHeight - innerHeight`)
   - แปลงค่าเป็นทศนิยมสัมบูรณ์ `progress` ระหว่าง `0.0` ถึง `1.0`
3. **Seek Decoupling & Pipeline Locking**:
   - คำนวณ `targetTime = progress * video.duration`
   - มีระบบ Lock (`isSeeking`, `pendingSeek`) เพื่อไม่ให้การเลื่อนที่รวดเร็วสั่งเปลี่ยน `currentTime` ถี่เกินไปจนเกิดอาการเฟรมค้างหรือกระตุก (Frame Dropping)

---

## 2. ระบบสลับวิดีโอแยกตามอุปกรณ์ (Device-Adaptive Video Engine)

การรับมือกับสัดส่วนหน้าจอคอมพิวเตอร์และมือถือ:

1. **Viewport Detection**:
   - ตรวจจับผ่าน `window.innerWidth <= 768` ร่วมกับ `window.matchMedia("(max-width: 768px)").matches`
2. **Dual-Asset Strategy**:
   - **Desktop / Wide Display**: โหลดไฟล์วิดีโอสัดส่วนแนวนอน 16:9 (`se2.mp4`)
   - **Mobile / Portrait Display**: โหลดไฟล์วิดีโอสัดส่วนแนวตั้ง 9:16 (`phonese.MP4`)
3. **State-Preserving Hot Swap**:
   - มี Listener ดักจับ `resize` / `orientationchange`
   - เมื่อข้าม Breakpoint จะคำนวณตำแหน่งเดิม: `currentProgress = currentTime / oldDuration`
   - สลับค่า `video.src` และเมื่อ `loadedmetadata` ทำงาน จะกระโดดไปยัง `currentProgress * newDuration` ทันทีเพื่อความต่อเนื่อง

---

## 3. สถาปัตยกรรมการจัดสรรหน้าจอมือถือ (Mobile Layout Isolation)

การแก้ปัญหา Header ล้นและการควบคุมขนาดบนหน้าจอขนาดเล็ก:

1. **Header Element Hierarchy**:
   - บนหน้าจอคอมพิวเตอร์: แสดง Logo, Navigation Links, Video Status Pill, Sound Button, CMS Button, และ Apply Button ในแถบเดียว
   - บนหน้าจอมือถือ (`<= 768px`):
     - ซ่อน Video Status, CMS Button, Sound Button ออกจาก Header ด้านบน
     - คงเหลือเฉพาะ: **Logo** (ฝั่งซ้าย) + **CTA Button & Hamburger Button** (ฝั่งขวา)
2. **Off-Canvas Drawer Integration**:
   - ย้ายเมนูนำทาง ลิงก์ระบบจัดการ CMS ตัวควบคุมเสียง และสถานะไทม์ไลน์ เข้าไปรวมใน Drawer ด้านข้าง/ด้านบน
   - ควบคุมการเปิด-ปิดด้วย CSS Class `mobile-nav-open` พร้อม Smooth Cubic-Bezier Transition
3. **HUD Clamping**:
   - ปรับตำแหน่งและขนาดของกล่องสถานะ (Scrubbing HUD) ให้ย่อความกว้างอัตโนมัติ (`max-width: calc(100vw - 1.5rem)`) พร้อม `text-overflow: ellipsis` เพื่อป้องกันการซ้อนทับเนื้อหา

---

## 4. ระบบจัดการเนื้อหาและการอัปโหลด (Full-Stack CMS & Media Ingestion)

สถาปัตยกรรมระบบจัดการหลังบ้าน:

```
[Client Admin Dashboard]
       │
       ├── File Input (<input type="file" accept="image/*">)
       ├── FileReader (Base64 DataURL Encoding)
       │
       ▼ POST /api/upload (Authorization: Bearer <Token>)
[Express.js Server]
       │
       ├── JSON Body Parser (Limit: 25MB)
       ├── Regex Buffer Decoding (data:image/...;base64,xxxx)
       ├── Filename Sanitization (Timestamp + Safe String)
       ├── Multi-Target Disk Write:
       │     ├── frontend/public/images/
       │     └── frontend/dist/images/ (พร้อมใช้งานทันทีโดยไม่ต้อง Rebuild)
       │
       ▼ Response { success: true, url: "/images/xxx.webp" }
[Client Form Autocomplete & Preview Thumbnail]
```

1. **Authentication & Session Security**:
   - เก็บรหัสผ่านในฐานข้อมูลด้วยการเข้ารหัส **Scrypt + Salt** (`crypto.scryptSync`)
   - ป้องกัน Brute-force: ล็อคการล็อกอินอัตโนมัติ 10 นาทีเมื่อกรอกผิดติดต่อกัน 5 ครั้ง
   - ตรวจสอบสิทธิ์ผ่าน Memory Session Token (`Bearer <token>`) อายุ 4 ชั่วโมง
2. **Direct Image Upload Stream**:
   - ใช้งาน Base64 JSON Payload ส่งตรงสู่ Backend ผ่าน Express 5
   - ปลอดภัยจาก Dependency ภายนอก (ไม่ต้องพึ่ง Multer บน Remote Production)
   - ไฟล์จะถูกบันทึกลงทั้งโฟลเดอร์ Source (`public/`) และ Build Directory (`dist/`) เพื่อให้เรียกแสดงผลผ่าน HTTP ได้ทันที

---

## 5. กระบวนการ Build และ Deployment (Production Pipeline)

1. **Build Tooling**:
   - ใช้ **Vite** แปลงโค้ด ES Modules, Minify JavaScript/CSS และทำ Asset Bundling
2. **Single-Port Unified Server**:
   - Express ให้บริการทั้ง REST API (`/api/*`) และ Static Web Files (`express.static(distPath)`)
   - มี Route Fallback ส่ง `index.html` สำหรับรองรับ Client-Side Routing
3. **Process & Proxy Layer**:
   - ทำงานเป็น Background Service ภายใต้ **PM2** (Zero-downtime reload)
   - เชื่อมต่อเครือข่ายภายนอกผ่าน **Apache2 Reverse Proxy** (ProxyPass จาก Port 443 ไปยัง Port 5005)

# SSKRU Software Engineering — Architecture & Apache2 Deployment Guide
> เอกสารสถาปัตยกรรมระบบและคู่มือการ Deploy ด้วย Apache2 สำหรับนักพัฒนาและ AI Agent

---

## 📌 1. ภาพรวมระบบ (System Architecture Overview)

โปรเจกต์นี้เป็นเว็บไซต์หลักของ **สาขาวิชาวิศวกรรมซอฟต์แวร์ มหาวิทยาลัยราชภัฏศรีสะเกษ (SSKRU)** ประกอบด้วย:
1. **Frontend (Scrollytelling Web App)**: 
   - เทคโนโลยี: Vanilla JavaScript (ES Module) + HTML5 Semantic + Vanilla CSS3 + Three.js / Canvas Confetti (Build ด้วย Vite)
   - หน้าหลัก: `index.html` (วิดีโอ Scrollytelling 5 สเตจ + เนื้อหาหลักสูตร อาจารย์ กิจกรรม ข่าวสาร)
   - หน้าผู้ดูแลระบบ: `admin.html` (CMS Dashboard แบบ Minimalist White UI สำหรับจัดการข้อมูล CRUD)
2. **Backend (API & File Server)**:
   - เทคโนโลยี: Node.js (ES Module) + Express.js 5
   - ฐานข้อมูล: `backend/db.json` (Flat-file JSON Database เข้ารหัสรหัสผ่านด้วย `crypto.scryptSync` + Salt)
   - โครงสร้าง: **All-in-One Deployment** — เซิร์ฟเวอร์ Express ตัวเดียวรับทั้งคำขอ `/api/*` และเสิร์ฟหน้าเว็บ Frontend (`frontend/dist/*`) บนพอร์ตเดียวกัน

```
[ผู้ใช้งาน Browser] 
       │ 
       ▼ HTTPS (Port 443) / HTTP (Port 80)
[Cloudflare DNS (sci-sskru.com)]
       │
       ▼
[Ubuntu Server (Oracle Cloud aarch64)]
       │
       ▼
[Apache2 Web Server (Reverse Proxy)]
       │ (ProxyPass ไปยัง localhost:5005)
       ▼
[Node.js Express Server (PM2 Process: "sewed")] ──▶ [backend/db.json]
       ├── /api/*          (REST API: CRUD, Auth, Uploads)
       └── /*              (Static Files: frontend/dist/index.html & admin.html)
```

---

## ⚠️ 2. กฎเหล็กของเซิร์ฟเวอร์นี้ (CRITICAL RULES FOR AI & DEVELOPERS)

> [!CAUTION]
> **ห้ามติดตั้งหรือเปิดใช้งาน NGINX บนเซิร์ฟเวอร์นี้เด็ดขาด (DO NOT USE NGINX)**
> เซิร์ฟเวอร์นี้เป็นเครื่องรวมโปรเจกต์ของมหาวิทยาลัย (`ubuntu@fiwos:~/project`) ซึ่งมีโปรเจกต์อื่นที่ใช้งานจริงเปิดอยู่บน **Apache2** (เช่น `kaichon-plus`, `charoensri-wellness`, `fiw`, ฯลฯ)
> การเปิดใช้งาน Nginx จะทำให้พอร์ต 80/443 ชนกัน (`bind() failed: Address already in use`) และส่งผลให้เว็บไซต์เดิมทั้งหมดในเซิร์ฟเวอร์ล่มได้
> **ต้องตั้งค่า Reverse Proxy ผ่าน Apache2 เท่านั้น!**

---

## 🌐 3. ข้อมูลโครงข่ายและการตั้งค่า (Server & Domain Specs)

| ข้อมูล | รายละเอียด |
| :--- | :--- |
| **โดเมนใช้งานจริง** | `seai.sci-sskru.com` |
| **โดเมนหลัก (Apex)** | `sci-sskru.com` (จัดการผ่าน Cloudflare) |
| **โฮสต์เซิร์ฟเวอร์** | Ubuntu 24.04 LTS (Oracle Cloud aarch64) |
| **ไดเรกทอรีโปรเจกต์บนเซิร์ฟเวอร์** | `/home/ubuntu/project/sewed` |
| **GitHub Repository** | `https://github.com/chutisorn01/sewed.git` |
| **พอร์ตภายใน (Internal Port)** | `5005` (`http://localhost:5005`) |
| **ชื่อโปรเซส PM2** | `sewed` |
| **เว็บเซิร์ฟเวอร์หลัก** | **Apache2** |

---

## 🛠️ 4. ขั้นตอนการ Deploy ด้วย Apache2 แบบสมบูรณ์ (Step-by-Step)

### ขั้นตอนที่ 1: เตรียมโปรเจกต์บนเซิร์ฟเวอร์
```bash
cd ~/project
git clone https://github.com/chutisorn01/sewed.git
cd sewed

# ติดตั้ง dependencies และ build frontend + backend ด้วยคำสั่งเดียว
npm run build
```

### ขั้นตอนที่ 2: สั่งให้ PM2 รันระบบเบื้องหลัง
```bash
pm2 start backend/server.js --name "sewed"
pm2 save
```

### ขั้นตอนที่ 3: เปิดโมดูล Proxy ใน Apache2
```bash
sudo a2enmod proxy proxy_http proxy_wstunnel rewrite headers
```

### ขั้นตอนที่ 4: สร้างไฟล์ VirtualHost สำหรับโดเมน
สร้างไฟล์ `/etc/apache2/sites-available/seai.sci-sskru.com.conf`:
```bash
sudo tee /etc/apache2/sites-available/seai.sci-sskru.com.conf << 'EOF'
<VirtualHost *:80>
    ServerName seai.sci-sskru.com

    # ส่งต่อ Request ทั้งหมดไปยัง Node.js Express พอร์ต 5005
    ProxyPreserveHost On
    ProxyPass / http://localhost:5005/
    ProxyPassReverse / http://localhost:5005/

    # รองรับ WebSocket
    RewriteEngine on
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/?(.*) "ws://localhost:5005/$1" [P,L]

    # บันทึก Logs แยกโดเมน
    ErrorLog ${APACHE_LOG_DIR}/seai_error.log
    CustomLog ${APACHE_LOG_DIR}/seai_access.log combined
</VirtualHost>
EOF
```

### ขั้นตอนที่ 5: เปิดใช้งานไซต์และรีโหลด Apache2
```bash
sudo a2ensite seai.sci-sskru.com.conf
sudo apache2ctl configtest
sudo systemctl restart apache2
```
*(ต้องขึ้น `Syntax OK` และ Apache2 ทำงานปกติ)*

### ขั้นตอนที่ 6: การตั้งค่า DNS & SSL (HTTPS)
1. **ในแดชบอร์ด Cloudflare (`sci-sskru.com`)**:
   - เพิ่ม **A Record**:
     - Name: `seai`
     - IPv4 Address: `<IP สาธารณะของเซิร์ฟเวอร์ จากคำสั่ง curl ifconfig.me>`
     - Proxy status: **Proxied (ก้อนเมฆสีส้ม ☁️)** ➔ *Cloudflare จะออกใบรับรอง SSL/HTTPS ให้อัตโนมัติ ไม่ต้องรัน Certbot เพิ่มเติม*
2. **(ทางเลือก) หากปิดเมฆ Cloudflare เป็น DNS Only (สีเทา)**:
   - ให้รัน Certbot สำหรับ Apache บนเซิร์ฟเวอร์:
     ```bash
     sudo certbot --apache -d seai.sci-sskru.com
     ```

---

## 🔄 5. คำสั่งอัปเดตระบบเมื่อมีการแก้ไขโค้ดใหม่ (CI/CD Update Workflow)

เมื่อแก้ไขโค้ดบนเครื่อง Local และ Push ขึ้น GitHub เรียบร้อยแล้ว บนเซิร์ฟเวอร์ให้รันเพียง 3 คำสั่งนี้:

```bash
cd ~/project/sewed
git pull origin main
npm run build
pm2 restart sewed
```

---

## 🔍 6. คำสั่งตรวจสอบและแก้ปัญหา (Troubleshooting & Monitoring)

- **ดูสถานะโปรเซส Node.js ทั้งหมด**:
  ```bash
  pm2 status
  ```
- **ดู Real-time Log ของโปรเจกต์ `sewed`**:
  ```bash
  pm2 logs sewed --lines 50
  ```
- **ดู Log ข้อผิดพลาดของ Apache2**:
  ```bash
  sudo tail -f /var/log/apache2/seai_error.log
  ```
- **ตรวจสอบสถานะ Apache2**:
  ```bash
  sudo systemctl status apache2
  ```
- **ทดสอบยิง API ภายในเครื่องเซิร์ฟเวอร์**:
  ```bash
  curl http://localhost:5005/api/data
  ```

---

## 🔐 7. ข้อมูลความปลอดภัยและการจัดการ (Security & Admin)
- เส้นทางเข้าสู่ระบบ CMS: `https://seai.sci-sskru.com/admin.html`
- ชื่อผู้ใช้เริ่มต้น: `admin`
- รหัสผ่านได้รับการเข้ารหัสแบบ Hash ปลอดภัยใน `backend/db.json`
- การแก้ไขข้อมูลในหน้า CMS ทำงานแบบเรียลไทม์ผ่าน RESTful API ของ Express.js

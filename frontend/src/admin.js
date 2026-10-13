// ========================================================
// SSKRU SOFTWARE ENGINEERING - ADMIN DASHBOARD CLIENT
// Standalone Minimalist White Admin Controller with Auth Security
// ========================================================

let appData = {
  generalInfo: {},
  curriculum: [],
  faculty: [],
  announcements: [],
  applications: [],
  contacts: []
};

const searchState = {
  curri: "",
  faculty: "",
  news: "",
  apps: "",
  contacts: ""
};

// ----------------------------------------------------
// TOAST NOTIFICATIONS
// ----------------------------------------------------
function showToast(message, type = "success") {
  const toast = document.getElementById("admin-toast");
  const icon = document.getElementById("toast-icon");
  const text = document.getElementById("toast-text");
  if (!toast) return;

  text.textContent = message;
  toast.className = `admin-toast active ${type}`;
  if (icon) {
    icon.textContent = type === "success" ? "✓" : (type === "info" ? "💡" : "✕");
  }

  setTimeout(() => {
    toast.classList.remove("active");
  }, 3500);
}

// ----------------------------------------------------
// AUTHENTICATION & SECURE TOKEN STORAGE
// ----------------------------------------------------
function getToken() {
  return localStorage.getItem("sskru_admin_token");
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("sskru_admin_user") || "null");
  } catch {
    return null;
  }
}

function setSession(token, user) {
  localStorage.setItem("sskru_admin_token", token);
  localStorage.setItem("sskru_admin_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("sskru_admin_token");
  localStorage.removeItem("sskru_admin_user");
}

// Authenticated Fetch Helper: Injects Bearer Token & Auto-detects 401 Expiration
async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {})
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearSession();
    checkAuthState();
    showToast("เซสชันหมดอายุหรือไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่", "error");
    throw new Error("Unauthorized");
  }
  return res;
}

// Helper: Upload image file to server
async function uploadImageFile(file) {
  if (!file) throw new Error("ไม่ได้เลือกไฟล์");
  if (file.size > 20 * 1024 * 1024) {
    throw new Error("ขนาดไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 20MB)");
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const res = await authFetch("/api/upload", {
          method: "POST",
          body: JSON.stringify({
            filename: file.name,
            data: base64Data
          })
        });
        const data = await res.json();
        if (data.success && data.url) {
          resolve(data.url);
        } else {
          reject(new Error(data.message || "อัปโหลดล้มเหลว"));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    reader.readAsDataURL(file);
  });
}

function checkAuthState() {
  const token = getToken();
  const user = getUser();
  const loginView = document.getElementById("admin-login-view");
  const dashView = document.getElementById("admin-dashboard-view");
  const labelName = document.getElementById("label-admin-name");

  if (token && user) {
    if (loginView) loginView.style.display = "none";
    if (dashView) dashView.style.display = "flex";
    if (labelName) labelName.textContent = user.name || user.username || "Super Admin";
    loadAllData();
  } else {
    if (loginView) loginView.style.display = "flex";
    if (dashView) dashView.style.display = "none";
  }
}

// ----------------------------------------------------
// DATA LOADER
// ----------------------------------------------------
async function loadAllData() {
  try {
    const res = await authFetch("/api/data");
    const json = await res.json();
    if (json.success && json.data) {
      appData = json.data;
      renderAllTables();
      updateBadges();
      populateGeneralForm();
    }
  } catch (err) {
    console.warn("Error fetching data:", err);
  }
}

function updateBadges() {
  const setB = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(count || 0);
  };
  setB("badge-count-curri", appData.curriculum?.length);
  setB("badge-count-faculty", appData.faculty?.length);
  setB("badge-count-news", appData.announcements?.length);
  setB("badge-count-apps", appData.applications?.length);
  setB("badge-count-contacts", appData.contacts?.length);
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------------------------------------------
// RENDER ALL TABLES
// ----------------------------------------------------
function renderAllTables() {
  renderCurriculum();
  renderFaculty();
  renderNews();
  renderApplications();
  renderContacts();
}

// 1. CURRICULUM (CRUD)
function renderCurriculum() {
  const tbody = document.getElementById("tbody-curri");
  if (!tbody || !appData.curriculum) return;

  const q = searchState.curri;
  const list = appData.curriculum.filter((c) => {
    if (!q) return true;
    return (
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      (c.nameTh && c.nameTh.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const label = document.getElementById("count-label-curri");
  if (label) label.textContent = `แสดง ${list.length} จาก ${appData.curriculum.length} วิชา`;

  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
      <td style="text-align: center; font-size: 1.3rem;">${c.icon || "💻"}</td>
      <td>
        <strong style="color: var(--text-main);">${escapeHtml(c.nameEn)}</strong><br>
        <span style="color: var(--text-muted); font-size: 0.82rem;">${escapeHtml(c.nameTh)}</span>
      </td>
      <td><span class="badge-clean badge-blue">${escapeHtml(c.category || 'Core')}</span></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${escapeHtml(c.description || '-')}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-curri" data-id="${c.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-curri" data-id="${c.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".btn-edit-curri").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.curriculum.find((c) => c.id === id);
      if (item) openEditModal("curriculum", item);
    });
  });

  tbody.querySelectorAll(".btn-del-curri").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบรายวิชานี้ใช่หรือไม่?")) return;
      try {
        await authFetch(`/api/curriculum/${id}`, { method: "DELETE" });
        showToast("ลบรายวิชาสำเร็จ");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    });
  });
}

// 2. FACULTY (CRUD)
function renderFaculty() {
  const tbody = document.getElementById("tbody-faculty");
  if (!tbody || !appData.faculty) return;

  const q = searchState.faculty;
  const list = appData.faculty.filter((f) => {
    if (!q) return true;
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.role && f.role.toLowerCase().includes(q)) ||
      (f.specialty && f.specialty.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  const label = document.getElementById("count-label-faculty");
  if (label) label.textContent = `แสดง ${list.length} จาก ${appData.faculty.length} ท่าน`;

  tbody.innerHTML = list.map((f, idx) => `
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
      <td style="text-align: center;">
        <img src="${escapeHtml(f.image)}" class="table-thumbnail" onerror="this.src='/images/prof_sskr_1.jpg'">
      </td>
      <td><strong style="color: var(--text-main);">${escapeHtml(f.name)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.84rem;">${escapeHtml(f.role)}</span></td>
      <td><span class="badge-clean badge-green">${escapeHtml(f.specialty)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${escapeHtml(f.email || '-')}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-faculty" data-id="${f.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-faculty" data-id="${f.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".btn-edit-faculty").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.faculty.find((f) => f.id === id);
      if (item) openEditModal("faculty", item);
    });
  });

  tbody.querySelectorAll(".btn-del-faculty").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบข้อมูลอาจารย์ท่านนี้ใช่หรือไม่?")) return;
      try {
        await authFetch(`/api/faculty/${id}`, { method: "DELETE" });
        showToast("ลบข้อมูลอาจารย์สำเร็จ");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    });
  });
}

// 3. NEWS & ANNOUNCEMENTS (CRUD)
function renderNews() {
  const tbody = document.getElementById("tbody-news");
  if (!tbody || !appData.announcements) return;

  const q = searchState.news;
  const list = appData.announcements.filter((a) => {
    if (!q) return true;
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.tag && a.tag.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q))
    );
  });

  const label = document.getElementById("count-label-news");
  if (label) label.textContent = `แสดง ${list.length} จาก ${appData.announcements.length} รายการ`;

  tbody.innerHTML = list.map((a, idx) => `
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
      <td>
        <strong style="color: var(--text-main);">${escapeHtml(a.title)}</strong>
        ${a.pinned ? '<span class="badge-clean badge-amber" style="margin-left: 0.4rem;">⭐ ปักหมุด</span>' : ''}
        <br>
        <span style="color: var(--text-muted); font-size: 0.8rem; display: inline-block; margin-top: 0.2rem;">${escapeHtml(a.content).substring(0, 85)}...</span>
      </td>
      <td><span class="badge-clean badge-blue">${escapeHtml(a.tag || 'ข่าวสาร')}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${escapeHtml(a.date)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-news" data-id="${a.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-news" data-id="${a.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".btn-edit-news").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.announcements.find((a) => a.id === id);
      if (item) openEditModal("announcement", item);
    });
  });

  tbody.querySelectorAll(".btn-del-news").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบข่าวสารนี้ใช่หรือไม่?")) return;
      try {
        await authFetch(`/api/announcements/${id}`, { method: "DELETE" });
        showToast("ลบข่าวสารเรียบร้อย");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    });
  });
}

// 4. APPLICATIONS (CRUD)
function renderApplications() {
  const tbody = document.getElementById("tbody-apps");
  if (!tbody || !appData.applications) return;

  const q = searchState.apps;
  const list = appData.applications.filter((a) => {
    if (!q) return true;
    return (
      (a.name && a.name.toLowerCase().includes(q)) ||
      (a.phone && a.phone.toLowerCase().includes(q)) ||
      (a.email && a.email.toLowerCase().includes(q)) ||
      (a.school && a.school.toLowerCase().includes(q)) ||
      (a.status && a.status.toLowerCase().includes(q))
    );
  });

  const label = document.getElementById("count-label-apps");
  if (label) label.textContent = `ทั้งหมด ${list.length} คน`;

  tbody.innerHTML = list.map((a, idx) => `
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
      <td><strong style="color: var(--text-main);">${escapeHtml(a.name)}</strong></td>
      <td><a href="tel:${escapeHtml(a.phone)}" style="color: var(--primary); text-decoration: none; font-weight: 500;">${escapeHtml(a.phone)}</a></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem;">${escapeHtml(a.email || '-')}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${escapeHtml(a.school || '-')}</span></td>
      <td>
        <select class="form-select select-app-status" data-id="${a.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="รอการตรวจสอบ" ${a.status === 'รอการตรวจสอบ' ? 'selected' : ''}>รอการตรวจสอบ</option>
          <option value="ตรวจสอบแล้ว" ${a.status === 'ตรวจสอบแล้ว' ? 'selected' : ''}>ตรวจสอบแล้ว</option>
          <option value="ผ่านการคัดเลือก" ${a.status === 'ผ่านการคัดเลือก' ? 'selected' : ''}>ผ่านการคัดเลือก</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${escapeHtml(a.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-app" data-id="${a.id}" title="ลบใบสมัคร">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".select-app-status").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = sel.getAttribute("data-id");
      try {
        await authFetch(`/api/applications/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: sel.value })
        });
        showToast("อัปเดตสถานะใบสมัครเรียบร้อย");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการอัปเดต", "error");
      }
    });
  });

  tbody.querySelectorAll(".btn-del-app").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("ต้องการลบข้อมูลผู้สมัครรายนี้ใช่หรือไม่?")) return;
      try {
        await authFetch(`/api/applications/${id}`, { method: "DELETE" });
        showToast("ลบข้อมูลเรียบร้อย");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    });
  });
}

// 5. CONTACTS (CRUD)
function renderContacts() {
  const tbody = document.getElementById("tbody-contacts");
  if (!tbody || !appData.contacts) return;

  const q = searchState.contacts;
  const list = appData.contacts.filter((c) => {
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.message && c.message.toLowerCase().includes(q))
    );
  });

  const label = document.getElementById("count-label-contacts");
  if (label) label.textContent = `ทั้งหมด ${list.length} ข้อความ`;

  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${idx + 1}</td>
      <td><strong style="color: var(--text-main);">${escapeHtml(c.name)}</strong></td>
      <td><a href="mailto:${escapeHtml(c.email)}" style="color: var(--primary); text-decoration: none;">${escapeHtml(c.email)}</a></td>
      <td><strong style="color: var(--text-main); font-size: 0.84rem;">${escapeHtml(c.subject)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${escapeHtml(c.message)}</span></td>
      <td>
        <select class="form-select select-contact-status" data-id="${c.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="ยังไม่ได้อ่าน" ${c.status === 'ยังไม่ได้อ่าน' ? 'selected' : ''}>ยังไม่ได้อ่าน</option>
          <option value="อ่านแล้ว" ${c.status === 'อ่านแล้ว' ? 'selected' : ''}>อ่านแล้ว</option>
          <option value="ตอบกลับแล้ว" ${c.status === 'ตอบกลับแล้ว' ? 'selected' : ''}>ตอบกลับแล้ว</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${escapeHtml(c.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-contact" data-id="${c.id}" title="ลบข้อความ">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".select-contact-status").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = sel.getAttribute("data-id");
      try {
        await authFetch(`/api/contacts/${id}`, {
          method: "PUT",
          body: JSON.stringify({ status: sel.value })
        });
        showToast("อัปเดตสถานะข้อความเรียบร้อย");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการอัปเดต", "error");
      }
    });
  });

  tbody.querySelectorAll(".btn-del-contact").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("ต้องการลบข้อความนี้ใช่หรือไม่?")) return;
      try {
        await authFetch(`/api/contacts/${id}`, { method: "DELETE" });
        showToast("ลบข้อความเรียบร้อย");
        await loadAllData();
      } catch {
        showToast("เกิดข้อผิดพลาดในการลบ", "error");
      }
    });
  });
}

// 6. POPULATE GENERAL FORM
function populateGeneralForm() {
  const g = appData.generalInfo || {};
  const setV = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : "";
  };
  setV("gen-students", g.studentsCount);
  setV("gen-faculty", g.facultyCount);
  setV("gen-labs", g.labCount);
  setV("gen-rate", g.employmentRate);
  setV("gen-phone", g.phone);
  setV("gen-email", g.email);
  setV("gen-fb", g.facebook);
  setV("gen-slogan", g.slogan);
}

// ----------------------------------------------------
// UNIVERSAL EDIT MODAL CONTROLLER
// ----------------------------------------------------
function openEditModal(type, item) {
  const modal = document.getElementById("modal-edit");
  const title = document.getElementById("modal-edit-title");
  const typeInp = document.getElementById("edit-type");
  const idInp = document.getElementById("edit-id");
  const container = document.getElementById("edit-inputs-container");

  if (!modal || !container) return;

  typeInp.value = type;
  idInp.value = item.id;

  if (type === "curriculum") {
    title.textContent = `✏️ แก้ไขรายวิชา: ${item.nameEn}`;
    container.innerHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ไอคอน (Emoji)</label>
          <input type="text" id="edit-curri-icon" class="form-control no-icon" value="${escapeHtml(item.icon || '💻')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">หมวดหมู่วิชา</label>
          <select id="edit-curri-cat" class="form-select">
            <option value="Core" ${item.category === 'Core' ? 'selected' : ''}>Core (วิชาแกนหลัก)</option>
            <option value="Design" ${item.category === 'Design' ? 'selected' : ''}>Design (ออกแบบซอฟต์แวร์)</option>
            <option value="Data" ${item.category === 'Data' ? 'selected' : ''}>Data (ข้อมูลและฐานข้อมูล)</option>
            <option value="Advanced" ${item.category === 'Advanced' ? 'selected' : ''}>Advanced (ขั้นสูง / AI)</option>
            <option value="Application" ${item.category === 'Application' ? 'selected' : ''}>Application (เว็บและโมบายล์)</option>
            <option value="Quality" ${item.category === 'Quality' ? 'selected' : ''}>Quality (ทดสอบและ QA)</option>
            <option value="System" ${item.category === 'System' ? 'selected' : ''}>System (คลาวด์และระบบ)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อภาษาอังกฤษ</label>
          <input type="text" id="edit-curri-nameEn" class="form-control no-icon" value="${escapeHtml(item.nameEn || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อภาษาไทย</label>
          <input type="text" id="edit-curri-nameTh" class="form-control no-icon" value="${escapeHtml(item.nameTh || '')}" required>
        </div>
        <div class="form-group span-2">
          <label class="form-label">คำอธิบายรายวิชา</label>
          <textarea id="edit-curri-desc" class="form-textarea" rows="3">${escapeHtml(item.description || '')}</textarea>
        </div>
      </div>
    `;
  } else if (type === "faculty") {
    title.textContent = `✏️ แก้ไขข้อมูลอาจารย์: ${item.name}`;
    container.innerHTML = `
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ชื่อ - นามสกุล (พร้อมคำนำหน้า)</label>
          <input type="text" id="edit-fac-name" class="form-control no-icon" value="${escapeHtml(item.name || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ตำแหน่ง</label>
          <input type="text" id="edit-fac-role" class="form-control no-icon" value="${escapeHtml(item.role || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ความเชี่ยวชาญ (Specialty)</label>
          <input type="text" id="edit-fac-specialty" class="form-control no-icon" value="${escapeHtml(item.specialty || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">อีเมล</label>
          <input type="email" id="edit-fac-email" class="form-control no-icon" value="${escapeHtml(item.email || '')}">
        </div>
        <div class="form-group span-2">
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>รูปภาพอาจารย์</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">รองรับ .WEBP, .JPG, .PNG</span>
          </label>
          <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.6rem;">
            <img id="edit-fac-preview" src="${escapeHtml(item.image || '/images/oau.WEBP')}" alt="Preview" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,0.06); background: #f8fafc;" onerror="this.src='/images/prof_sskr_1.jpg'">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 0.35rem;">
              <label class="btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; padding: 0.45rem 0.85rem; font-size: 0.85rem; border-radius: 6px; width: fit-content; margin: 0;">
                📁 เลือกไฟล์รูปภาพจากเครื่อง
                <input type="file" id="edit-fac-file" accept="image/*" style="display: none;">
              </label>
              <span id="edit-fac-upload-status" style="font-size: 0.75rem; color: var(--text-muted);">เลือกไฟล์รูปจากเครื่องเพื่ออัปโหลดอัตโนมัติ หรือพิมพ์ URL ด้านล่าง</span>
            </div>
          </div>
          <input type="text" id="edit-fac-image" class="form-control no-icon" value="${escapeHtml(item.image || '/images/oau.WEBP')}" placeholder="/images/oau.WEBP">
        </div>
      </div>
    `;

    // Bind file upload for faculty edit modal
    const fileInput = document.getElementById("edit-fac-file");
    const imgInput = document.getElementById("edit-fac-image");
    const previewImg = document.getElementById("edit-fac-preview");
    const statusText = document.getElementById("edit-fac-upload-status");

    imgInput?.addEventListener("input", (e) => {
      if (previewImg) previewImg.src = e.target.value || "/images/prof_sskr_1.jpg";
    });

    fileInput?.addEventListener("change", async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (statusText) statusText.textContent = "⏳ กำลังอัปโหลดรูปภาพ...";
      try {
        const url = await uploadImageFile(file);
        if (imgInput) imgInput.value = url;
        if (previewImg) previewImg.src = url;
        if (statusText) statusText.textContent = `✅ อัปโหลดสำเร็จ: ${file.name}`;
        showToast("อัปโหลดรูปภาพสำเร็จ!");
      } catch (err) {
        if (statusText) statusText.textContent = `❌ ${err.message}`;
        showToast(err.message || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
      }
    });
  } else if (type === "announcement") {
    title.textContent = `✏️ แก้ไขข่าวสาร: ${item.title}`;
    container.innerHTML = `
      <div class="form-grid-2">
        <div class="form-group span-2">
          <label class="form-label">หัวข้อข่าว / กิจกรรม</label>
          <input type="text" id="edit-news-title" class="form-control no-icon" value="${escapeHtml(item.title || '')}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ป้ายกำกับ (Tag)</label>
          <input type="text" id="edit-news-tag" class="form-control no-icon" value="${escapeHtml(item.tag || 'ข่าวสาร')}">
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; padding-top: 1.5rem;">
          <input type="checkbox" id="edit-news-pinned" style="width: 20px; height: 20px; accent-color: var(--primary);" ${item.pinned ? 'checked' : ''}>
          <label for="edit-news-pinned" style="margin: 0; font-weight: 600; cursor: pointer;">⭐ ปักหมุดข่าวนี้</label>
        </div>
        <div class="form-group span-2">
          <label class="form-label">เนื้อหาข่าว / รายละเอียด</label>
          <textarea id="edit-news-content" class="form-textarea" rows="4" required>${escapeHtml(item.content || '')}</textarea>
        </div>
      </div>
    `;
  }

  modal.classList.add("active");
}

// ----------------------------------------------------
// INITIALIZE ADMIN APPLICATION
// ----------------------------------------------------
function initAdminApp() {
  // Check auth state immediately
  checkAuthState();

  // 1. LOGIN FORM CONTROLS
  const formLogin = document.getElementById("form-login");
  const loginAlert = document.getElementById("login-alert");
  const btnTogglePwd = document.getElementById("btn-toggle-pwd");
  const inputPwd = document.getElementById("login-password");
  const inputUsername = document.getElementById("login-username");
  const btnLoginSubmit = document.getElementById("btn-login-submit");

  // Toggle password visibility
  btnTogglePwd?.addEventListener("click", (e) => {
    e?.preventDefault?.();
    const p = document.getElementById("login-password");
    if (!p) return;
    const isP = p.type === "password";
    p.type = isP ? "text" : "password";
    btnTogglePwd.textContent = isP ? "🙈" : "👁️";
  });

  // Dedicated Login Handler
  async function handleLogin(e) {
    if (e) e.preventDefault();
    if (loginAlert) {
      loginAlert.style.display = "none";
      loginAlert.textContent = "";
    }

    const username = document.getElementById("login-username")?.value.trim();
    const password = document.getElementById("login-password")?.value;

    if (!username || !password) {
      if (loginAlert) {
        loginAlert.textContent = "⚠️ กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน";
        loginAlert.style.display = "block";
      }
      return;
    }

    if (btnLoginSubmit) {
      btnLoginSubmit.disabled = true;
      btnLoginSubmit.innerHTML = `<span>⏳ กำลังตรวจสอบสิทธิ์...</span>`;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        setSession(data.token, data.user);
        checkAuthState();
        showToast(`🎉 ยินดีต้อนรับคุณ ${data.user.name || data.user.username}`);
      } else {
        if (loginAlert) {
          loginAlert.textContent = "❌ " + (data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง");
          loginAlert.style.display = "block";
        }
      }
    } catch {
      if (loginAlert) {
        loginAlert.textContent = "❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ (Port 5005)";
        loginAlert.style.display = "block";
      }
    } finally {
      if (btnLoginSubmit) {
        btnLoginSubmit.disabled = false;
        btnLoginSubmit.innerHTML = `<span>เข้าสู่ระบบ (Sign In)</span><span>→</span>`;
      }
    }
  }

  // Handle both form submission and direct button clicks
  formLogin?.addEventListener("submit", handleLogin);
  btnLoginSubmit?.addEventListener("click", handleLogin);

  // Pressing Enter inside either input submits the form
  const handleEnterKey = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleLogin(e);
    }
  };
  inputUsername?.addEventListener("keydown", handleEnterKey);
  inputPwd?.addEventListener("keydown", handleEnterKey);

  // 2. LOGOUT
  document.getElementById("btn-logout")?.addEventListener("click", async () => {
    const token = getToken();
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch {}
    clearSession();
    checkAuthState();
    showToast("ออกจากระบบเรียบร้อย");
  });

  // 3. SIDEBAR TABS SWITCHING
  const sidebarItems = document.querySelectorAll(".sidebar-item[data-tab]");
  const panels = document.querySelectorAll(".tab-content-panel");

  sidebarItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.getAttribute("data-tab");
      sidebarItems.forEach((i) => i.classList.remove("active"));
      panels.forEach((p) => p.classList.remove("active"));

      item.classList.add("active");
      document.getElementById(`panel-${target}`)?.classList.add("active");
    });
  });

  // 4. LIVE SEARCH FILTERS
  const setupSearch = (inpId, key, renderFn) => {
    document.getElementById(inpId)?.addEventListener("input", (e) => {
      searchState[key] = e.target.value.toLowerCase().trim();
      renderFn();
    });
  };
  setupSearch("search-curri", "curri", renderCurriculum);
  setupSearch("search-faculty", "faculty", renderFaculty);
  setupSearch("search-news", "news", renderNews);
  setupSearch("search-apps", "apps", renderApplications);
  setupSearch("search-contacts", "contacts", renderContacts);

  // 5. ADD FORM: CURRICULUM
  document.getElementById("form-add-curri")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      icon: document.getElementById("input-curri-icon").value || "💻",
      category: document.getElementById("input-curri-cat").value,
      nameEn: document.getElementById("input-curri-nameEn").value.trim(),
      nameTh: document.getElementById("input-curri-nameTh").value.trim(),
      description: document.getElementById("input-curri-desc").value.trim(),
    };

    try {
      const res = await authFetch("/api/curriculum", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("เพิ่มรายวิชาสำเร็จ!");
        e.target.reset();
        document.getElementById("input-curri-icon").value = "💻";
        await loadAllData();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });

  // 6. ADD FORM: FACULTY
  const addFacFile = document.getElementById("input-fac-file");
  const addFacImg = document.getElementById("input-fac-image");
  const addFacPreview = document.getElementById("input-fac-preview");
  const addFacStatus = document.getElementById("input-fac-upload-status");

  addFacImg?.addEventListener("input", (e) => {
    if (addFacPreview) addFacPreview.src = e.target.value || "/images/prof_sskr_1.jpg";
  });

  addFacFile?.addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (addFacStatus) addFacStatus.textContent = "⏳ กำลังอัปโหลดรูปภาพ...";
    try {
      const url = await uploadImageFile(file);
      if (addFacImg) addFacImg.value = url;
      if (addFacPreview) addFacPreview.src = url;
      if (addFacStatus) addFacStatus.textContent = `✅ อัปโหลดสำเร็จ: ${file.name}`;
      showToast("อัปโหลดรูปภาพสำเร็จ!");
    } catch (err) {
      if (addFacStatus) addFacStatus.textContent = `❌ ${err.message}`;
      showToast(err.message || "เกิดข้อผิดพลาดในการอัปโหลด", "error");
    }
  });

  document.getElementById("form-add-faculty")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      name: document.getElementById("input-fac-name").value.trim(),
      role: document.getElementById("input-fac-role").value.trim(),
      specialty: document.getElementById("input-fac-specialty").value.trim(),
      email: document.getElementById("input-fac-email").value.trim(),
      image: document.getElementById("input-fac-image").value.trim() || "/images/oau.WEBP",
    };

    try {
      const res = await authFetch("/api/faculty", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("เพิ่มข้อมูลอาจารย์สำเร็จ!");
        e.target.reset();
        if (addFacImg) addFacImg.value = "/images/oau.WEBP";
        if (addFacPreview) addFacPreview.src = "/images/oau.WEBP";
        if (addFacStatus) addFacStatus.textContent = "เลือกไฟล์รูปจากเครื่องเพื่ออัปโหลดอัตโนมัติ หรือพิมพ์ URL ด้านล่าง";
        await loadAllData();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });

  // 7. ADD FORM: NEWS
  document.getElementById("form-add-news")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      title: document.getElementById("input-news-title").value.trim(),
      tag: document.getElementById("input-news-tag").value.trim() || "ข่าวสาร",
      pinned: document.getElementById("input-news-pinned").checked,
      content: document.getElementById("input-news-content").value.trim(),
    };

    try {
      const res = await authFetch("/api/announcements", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("โพสต์ข่าวสารเรียบร้อย!");
        e.target.reset();
        await loadAllData();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });

  // 8. EXPORT APPS TO CSV
  document.getElementById("btn-export-csv")?.addEventListener("click", () => {
    if (!appData.applications || appData.applications.length === 0) {
      alert("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }
    const headers = ["ID", "ชื่อ-นามสกุล", "เบอร์โทร", "อีเมล", "โรงเรียน", "สถานะ", "วันที่สมัคร"];
    const rows = appData.applications.map(a => [
      a.id,
      `"${a.name}"`,
      `"${a.phone}"`,
      `"${a.email}"`,
      `"${a.school}"`,
      `"${a.status}"`,
      `"${a.createdAt}"`
    ]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `SSKRU_SE_Applicants_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  // 9. GENERAL INFO FORM
  document.getElementById("form-general")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
      studentsCount: Number(document.getElementById("gen-students").value) || 180,
      facultyCount: Number(document.getElementById("gen-faculty").value) || 5,
      labCount: Number(document.getElementById("gen-labs").value) || 4,
      employmentRate: document.getElementById("gen-rate").value || "98%",
      phone: document.getElementById("gen-phone").value,
      email: document.getElementById("gen-email").value,
      facebook: document.getElementById("gen-fb").value,
      slogan: document.getElementById("gen-slogan").value,
    };

    try {
      const res = await authFetch("/api/general", {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกข้อมูลส่วนรวมเรียบร้อย!");
        await loadAllData();
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });

  // 10. CHANGE PASSWORD FORM
  document.getElementById("form-pwd")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("pwd-curr").value;
    const newPassword = document.getElementById("pwd-new").value;
    const confirmPassword = document.getElementById("pwd-conf").value;

    if (newPassword !== confirmPassword) {
      showToast("รหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }

    try {
      const res = await authFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast("เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย");
        e.target.reset();
      } else {
        showToast(data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้", "error");
    }
  });

  // 11. UNIVERSAL EDIT MODAL FORM SUBMISSION
  const modalEdit = document.getElementById("modal-edit");
  document.getElementById("btn-close-edit-modal")?.addEventListener("click", () => modalEdit?.classList.remove("active"));
  document.getElementById("btn-cancel-edit-modal")?.addEventListener("click", () => modalEdit?.classList.remove("active"));
  modalEdit?.addEventListener("click", (e) => {
    if (e.target === modalEdit) modalEdit.classList.remove("active");
  });

  document.getElementById("form-edit-item")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("edit-type")?.value;
    const id = document.getElementById("edit-id")?.value;

    let url = "";
    let payload = {};

    if (type === "curriculum") {
      url = `/api/curriculum/${id}`;
      payload = {
        icon: document.getElementById("edit-curri-icon").value || "💻",
        category: document.getElementById("edit-curri-cat").value,
        nameEn: document.getElementById("edit-curri-nameEn").value.trim(),
        nameTh: document.getElementById("edit-curri-nameTh").value.trim(),
        description: document.getElementById("edit-curri-desc").value.trim(),
      };
    } else if (type === "faculty") {
      url = `/api/faculty/${id}`;
      payload = {
        name: document.getElementById("edit-fac-name").value.trim(),
        role: document.getElementById("edit-fac-role").value.trim(),
        specialty: document.getElementById("edit-fac-specialty").value.trim(),
        email: document.getElementById("edit-fac-email").value.trim(),
        image: document.getElementById("edit-fac-image").value.trim() || "/images/oau.WEBP",
      };
    } else if (type === "announcement") {
      url = `/api/announcements/${id}`;
      payload = {
        title: document.getElementById("edit-news-title").value.trim(),
        tag: document.getElementById("edit-news-tag").value.trim() || "ข่าวสาร",
        pinned: Boolean(document.getElementById("edit-news-pinned").checked),
        content: document.getElementById("edit-news-content").value.trim(),
      };
    }

    try {
      const res = await authFetch(url, {
        method: "PUT",
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกการแก้ไขเรียบร้อย!");
        modalEdit?.classList.remove("active");
        await loadAllData();
      } else {
        showToast(data.message || "เกิดข้อผิดพลาดในการแก้ไข", "error");
      }
    } catch {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

// Auto-run whether DOMContentLoaded has already fired or is still loading
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAdminApp);
} else {
  initAdminApp();
}

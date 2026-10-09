// ========================================================
// SSKRU SOFTWARE ENGINEERING - CMS & DATABASE CLIENT ENGINE
// Complete Authentication, Multi-Tab Navigation & Full CRUD
// ========================================================

let appData = {
  generalInfo: {},
  curriculum: [],
  faculty: [],
  announcements: [],
  applications: [],
  contacts: []
};

// Filter states for tables
const searchFilters = {
  curri: "",
  faculty: "",
  news: "",
  apps: "",
  contacts: ""
};

// ----------------------------------------------------
// TOAST NOTIFICATION HELPER
// ----------------------------------------------------
export function showToast(message, type = "success") {
  let toast = document.getElementById("cms-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "cms-toast";
    toast.className = "cms-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = `cms-toast show ${type}`;
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3500);
}

// ----------------------------------------------------
// AUTHENTICATION STATE & HELPERS
// ----------------------------------------------------
export function getAdminToken() {
  return localStorage.getItem("sskru_admin_token") || null;
}

export function getAdminUser() {
  try {
    const raw = localStorage.getItem("sskru_admin_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAdminSession(token, user) {
  localStorage.setItem("sskru_admin_token", token);
  localStorage.setItem("sskru_admin_user", JSON.stringify(user));
  updateNavbarAdminState();
}

export function clearAdminSession() {
  localStorage.removeItem("sskru_admin_token");
  localStorage.removeItem("sskru_admin_user");
  updateNavbarAdminState();
}

function updateNavbarAdminState() {
  const btnAdmin = document.getElementById("btn-admin-cms");
  const user = getAdminUser();
  if (btnAdmin) {
    const cmsText = btnAdmin.querySelector(".cms-text");
    if (user && getAdminToken()) {
      btnAdmin.classList.add("admin-logged-in");
      if (cmsText) cmsText.textContent = `CMS (${user.username})`;
      btnAdmin.title = `เข้าสู่ระบบในชื่อ: ${user.name} (${user.role})`;
    } else {
      btnAdmin.classList.remove("admin-logged-in");
      if (cmsText) cmsText.textContent = "CMS";
      btnAdmin.title = "เข้าสู่ระบบจัดการเนื้อหา CMS";
    }
  }

  const userDisplay = document.getElementById("admin-user-display");
  if (userDisplay && user) {
    userDisplay.textContent = `${user.name} (@${user.username})`;
  }
}

// ----------------------------------------------------
// FETCH ALL DATA & HYDRATE FRONTEND
// ----------------------------------------------------
export async function loadInitialData() {
  try {
    const res = await fetch("/api/data");
    if (!res.ok) throw new Error("Failed to fetch /api/data");
    const json = await res.json();
    if (json.success && json.data) {
      appData = json.data;
      renderAll();
      updateBadgeCounts();
    }
  } catch (err) {
    console.warn("Using fallback local data due to fetch error:", err);
  }
}

// Render dynamic sections on the main public scrollytelling page
export function renderAll() {
  renderCurriculum();
  renderFaculty();
  renderAnnouncements();
  renderGeneralInfo();
}

// 1. RENDER CURRICULUM ON PUBLIC SITE
function renderCurriculum() {
  const container = document.getElementById("curriculum-grid");
  if (!container || !appData.curriculum) return;

  container.innerHTML = appData.curriculum.map((item) => `
    <div class="curri-box" data-tilt data-id="${item.id}">
      <div class="curri-icon">${item.icon || "💻"}</div>
      <div class="curri-name-en">${escapeHtml(item.nameEn)}</div>
      <div class="curri-name-th">${escapeHtml(item.nameTh)}</div>
      ${item.description ? `<p class="curri-desc">${escapeHtml(item.description)}</p>` : ""}
    </div>
  `).join("");
}

// 2. RENDER FACULTY ON PUBLIC SITE
function renderFaculty() {
  const container = document.getElementById("faculty-grid");
  if (!container || !appData.faculty) return;

  container.innerHTML = appData.faculty.map((prof) => `
    <div class="sskr-faculty-card" data-tilt data-id="${prof.id}">
      <div class="prof-portrait-wrap">
        <img src="${escapeHtml(prof.image || '/images/prof_sskr_1.jpg')}" alt="${escapeHtml(prof.name)}" class="prof-pic" onerror="this.src='/images/prof_sskr_1.jpg'">
      </div>
      <h3 class="prof-name">${escapeHtml(prof.name)}</h3>
      <p class="prof-role">${escapeHtml(prof.role)}</p>
      <div class="prof-badge-specialty">
        <span>${escapeHtml(prof.specialty)}</span>
      </div>
      ${prof.email ? `<p class="prof-email">✉️ ${escapeHtml(prof.email)}</p>` : ""}
    </div>
  `).join("");
}

// 3. RENDER ANNOUNCEMENTS ON PUBLIC SITE
function renderAnnouncements() {
  const container = document.getElementById("news-cards-grid");
  if (!container || !appData.announcements) return;

  container.innerHTML = appData.announcements.map((post) => `
    <article class="news-card ${post.pinned ? 'pinned-news' : ''}" data-tilt>
      <div class="news-meta">
        <span class="news-tag">${escapeHtml(post.tag || 'ข่าวสาร')}</span>
        <span class="news-date">📅 ${escapeHtml(post.date || '')}</span>
        ${post.pinned ? '<span class="pinned-badge">⭐ ปักหมุด</span>' : ''}
      </div>
      <h3 class="news-title">${escapeHtml(post.title)}</h3>
      <p class="news-desc">${escapeHtml(post.content)}</p>
    </article>
  `).join("");
}

// 4. RENDER GENERAL INFO ON PUBLIC SITE
function renderGeneralInfo() {
  const info = appData.generalInfo;
  if (!info) return;

  const statStudents = document.getElementById("stat-students");
  if (statStudents && info.studentsCount) statStudents.textContent = info.studentsCount + "+";

  const statEmployment = document.getElementById("stat-employment");
  if (statEmployment && info.employmentRate) statEmployment.textContent = info.employmentRate;

  const statLabs = document.getElementById("stat-labs");
  if (statLabs && info.labCount) statLabs.textContent = info.labCount;
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Update badges on CMS menu tabs
function updateBadgeCounts() {
  const setBadge = (id, count) => {
    const el = document.getElementById(id);
    if (el) el.textContent = String(count || 0);
  };
  setBadge("badge-curri-count", appData.curriculum?.length || 0);
  setBadge("badge-faculty-count", appData.faculty?.length || 0);
  setBadge("badge-news-count", appData.announcements?.length || 0);
  setBadge("badge-apps-count", appData.applications?.length || 0);
  setBadge("badge-contacts-count", appData.contacts?.length || 0);
}

// ========================================================
// ADMIN CMS DASHBOARD & AUTH CONTROLLER
// ========================================================
export function initAdminCMS() {
  const modalLogin = document.getElementById("modal-admin-login");
  const modalAdmin = document.getElementById("modal-admin-cms");
  const modalEdit = document.getElementById("modal-admin-edit");

  const btnOpenAdmin = document.getElementById("btn-admin-cms");
  const btnCloseLogin = document.getElementById("btn-close-admin-login");
  const btnCloseAdmin = document.getElementById("btn-close-admin");
  const btnCloseEdit = document.getElementById("btn-close-edit");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const btnLogout = document.getElementById("btn-admin-logout");

  const navTabs = document.querySelectorAll(".cms-tab-btn");
  const tabPanels = document.querySelectorAll(".cms-panel");

  // Initial navbar state
  updateNavbarAdminState();

  // 1. OPEN CMS BUTTON (Go directly to standalone white minimalist admin page)
  btnOpenAdmin?.addEventListener("click", (e) => {
    // If it's an anchor, let it navigate naturally; if not, force navigate
    window.location.href = "/admin.html";
  });

  // Close modals
  btnCloseLogin?.addEventListener("click", () => modalLogin?.classList.remove("active"));
  btnCloseAdmin?.addEventListener("click", () => modalAdmin?.classList.remove("active"));
  btnCloseEdit?.addEventListener("click", () => modalEdit?.classList.remove("active"));
  btnCancelEdit?.addEventListener("click", () => modalEdit?.classList.remove("active"));

  modalLogin?.addEventListener("click", (e) => {
    if (e.target === modalLogin) modalLogin.classList.remove("active");
  });
  modalAdmin?.addEventListener("click", (e) => {
    if (e.target === modalAdmin) modalAdmin.classList.remove("active");
  });
  modalEdit?.addEventListener("click", (e) => {
    if (e.target === modalEdit) modalEdit.classList.remove("active");
  });

  // 2. LOGIN FORM HANDLING
  setupLoginForm();

  // 3. LOGOUT HANDLING
  btnLogout?.addEventListener("click", async () => {
    const token = getAdminToken();
    try {
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (e) {
      console.warn("Logout error:", e);
    }
    clearAdminSession();
    modalAdmin?.classList.remove("active");
    showToast("🚪 ออกจากระบบเรียบร้อยแล้ว", "success");
  });

  // 4. CMS TAB NAVIGATION
  navTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      const target = tab.getAttribute("data-tab");
      navTabs.forEach((t) => t.classList.remove("active"));
      tabPanels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(`panel-${target}`)?.classList.add("active");
    });
  });

  // 5. SEARCH BARS SETUP
  setupSearchFilters();

  // 6. SETUP ADD FORMS & ACTIONS
  setupCurriculumCMS();
  setupFacultyCMS();
  setupAnnouncementsCMS();
  setupApplicationsCMS();
  setupContactsCMS();
  setupGeneralInfoCMS();
  setupSecurityCMS();
  setupUniversalEditModal();
}

// ----------------------------------------------------
// SETUP LOGIN FORM & ACTIONS
// ----------------------------------------------------
function setupLoginForm() {
  const form = document.getElementById("form-admin-login");
  const modalLogin = document.getElementById("modal-admin-login");
  const modalAdmin = document.getElementById("modal-admin-cms");
  const alertBox = document.getElementById("login-error-alert");
  const btnToggleEye = document.getElementById("btn-toggle-password");
  const inputPwd = document.getElementById("login-password");
  const btnSubmit = document.getElementById("btn-submit-login");

  // Toggle password eye
  btnToggleEye?.addEventListener("click", () => {
    if (!inputPwd) return;
    const isPwd = inputPwd.type === "password";
    inputPwd.type = isPwd ? "text" : "password";
    btnToggleEye.textContent = isPwd ? "🙈" : "👁️";
  });

  // Form submit handler
  async function handleCmsLogin(e) {
    if (e) e.preventDefault();
    if (alertBox) alertBox.style.display = "none";

    const username = document.getElementById("login-username")?.value.trim();
    const password = inputPwd?.value;

    if (!username || !password) {
      if (alertBox) {
        alertBox.textContent = "กรุณากรอกชื่อผู้ใช้และรหัสผ่าน";
        alertBox.style.display = "block";
      }
      return;
    }

    if (btnSubmit) {
      btnSubmit.disabled = true;
      btnSubmit.classList.add("loading");
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const data = await res.json();

      if (data.success && data.token) {
        setAdminSession(data.token, data.user);
        modalLogin?.classList.remove("active");
        form.reset();
        showToast(`🎉 เข้าสู่ระบบสำเร็จ ยินดีต้อนรับคุณ ${data.user.name}`);
        
        // Open CMS directly
        modalAdmin?.classList.add("active");
        renderAdminTables();
        updateBadgeCounts();
      } else {
        if (alertBox) {
          alertBox.textContent = data.message || "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง";
          alertBox.style.display = "block";
        }
      }
    } catch (err) {
      if (alertBox) {
        alertBox.textContent = "เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์";
        alertBox.style.display = "block";
      }
    } finally {
      if (btnSubmit) {
        btnSubmit.disabled = false;
        btnSubmit.classList.remove("loading");
      }
    }
  }

  form?.addEventListener("submit", handleCmsLogin);
  btnSubmit?.addEventListener("click", handleCmsLogin);
}

// ----------------------------------------------------
// SETUP LIVE SEARCH FILTERS
// ----------------------------------------------------
function setupSearchFilters() {
  const attachFilter = (inputId, key, renderFn) => {
    const el = document.getElementById(inputId);
    el?.addEventListener("input", (e) => {
      searchFilters[key] = e.target.value.toLowerCase().trim();
      renderFn();
    });
  };

  attachFilter("search-curri", "curri", renderCurriculumTable);
  attachFilter("search-faculty", "faculty", renderFacultyTable);
  attachFilter("search-news", "news", renderAnnouncementsTable);
  attachFilter("search-apps", "apps", renderApplicationsTable);
  attachFilter("search-contacts", "contacts", renderContactsTable);
}

// ----------------------------------------------------
// RENDER ALL TABLES IN ADMIN DASHBOARD
// ----------------------------------------------------
function renderAdminTables() {
  renderCurriculumTable();
  renderFacultyTable();
  renderAnnouncementsTable();
  renderApplicationsTable();
  renderContactsTable();
  populateGeneralInfoForm();
}

// ----------------------------------------------------
// 1. CMS: CURRICULUM (CRUD)
// ----------------------------------------------------
function setupCurriculumCMS() {
  const form = document.getElementById("form-add-curri");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newItem = {
      icon: document.getElementById("curri-input-icon").value || "💻",
      nameEn: document.getElementById("curri-input-nameEn").value.trim(),
      nameTh: document.getElementById("curri-input-nameTh").value.trim(),
      category: document.getElementById("curri-input-cat").value,
      description: document.getElementById("curri-input-desc").value.trim(),
    };

    try {
      const res = await fetch("/api/curriculum", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem)
      });
      const data = await res.json();
      if (data.success) {
        showToast("เพิ่มรายวิชาใหม่สำเร็จ!");
        form.reset();
        document.getElementById("curri-input-icon").value = "💻";
        await loadInitialData();
        renderCurriculumTable();
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

function renderCurriculumTable() {
  const tbody = document.getElementById("admin-curri-tbody");
  if (!tbody || !appData.curriculum) return;

  const q = searchFilters.curri;
  const list = appData.curriculum.filter((c) => {
    if (!q) return true;
    return (
      (c.nameEn && c.nameEn.toLowerCase().includes(q)) ||
      (c.nameTh && c.nameTh.toLowerCase().includes(q)) ||
      (c.category && c.category.toLowerCase().includes(q)) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const statsLabel = document.getElementById("label-curri-stats");
  if (statsLabel) statsLabel.textContent = `แสดง ${list.length} จาก ${appData.curriculum.length} วิชา`;

  tbody.innerHTML = list.map((c, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-center font-emoji">${c.icon || "💻"}</td>
      <td><strong>${escapeHtml(c.nameEn)}</strong><br><small class="text-dim">${escapeHtml(c.nameTh)}</small></td>
      <td><span class="badge-cat">${escapeHtml(c.category || 'Core')}</span></td>
      <td><small class="text-muted line-clamp-2">${escapeHtml(c.description || '-')}</small></td>
      <td class="text-center">
        <div class="cms-row-actions">
          <button class="btn-sm btn-edit btn-edit-curri" data-id="${c.id}" title="แก้ไขรายวิชา">✏️ แก้ไข</button>
          <button class="btn-sm btn-danger btn-del-curri" data-id="${c.id}" title="ลบรายวิชา">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach Edit Click
  tbody.querySelectorAll(".btn-edit-curri").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.curriculum.find((c) => c.id === id);
      if (item) openUniversalEditModal("curriculum", item);
    });
  });

  // Attach Delete Click
  tbody.querySelectorAll(".btn-del-curri").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบรายวิชานี้ใช่หรือไม่?")) return;
      try {
        await fetch(`/api/curriculum/${id}`, { method: "DELETE" });
        showToast("ลบรายวิชาเรียบร้อย");
        await loadInitialData();
        renderCurriculumTable();
      } catch (err) {
        showToast("ไม่สามารถลบได้", "error");
      }
    });
  });
}

// ----------------------------------------------------
// 2. CMS: FACULTY (CRUD)
// ----------------------------------------------------
function setupFacultyCMS() {
  const form = document.getElementById("form-add-faculty");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newProf = {
      name: document.getElementById("faculty-input-name").value.trim(),
      role: document.getElementById("faculty-input-role").value.trim(),
      specialty: document.getElementById("faculty-input-specialty").value.trim(),
      email: document.getElementById("faculty-input-email").value.trim(),
      image: document.getElementById("faculty-input-image").value.trim() || "/images/prof_sskr_1.jpg",
    };

    try {
      const res = await fetch("/api/faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newProf)
      });
      const data = await res.json();
      if (data.success) {
        showToast("เพิ่มข้อมูลอาจารย์สำเร็จ!");
        form.reset();
        document.getElementById("faculty-input-image").value = "/images/prof_sskr_1.jpg";
        await loadInitialData();
        renderFacultyTable();
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

function renderFacultyTable() {
  const tbody = document.getElementById("admin-faculty-tbody");
  if (!tbody || !appData.faculty) return;

  const q = searchFilters.faculty;
  const list = appData.faculty.filter((f) => {
    if (!q) return true;
    return (
      (f.name && f.name.toLowerCase().includes(q)) ||
      (f.role && f.role.toLowerCase().includes(q)) ||
      (f.specialty && f.specialty.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q))
    );
  });

  const statsLabel = document.getElementById("label-faculty-stats");
  if (statsLabel) statsLabel.textContent = `แสดง ${list.length} จาก ${appData.faculty.length} ท่าน`;

  tbody.innerHTML = list.map((f, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td class="text-center">
        <img src="${escapeHtml(f.image)}" class="table-avatar" onerror="this.src='/images/prof_sskr_1.jpg'">
      </td>
      <td><strong>${escapeHtml(f.name)}</strong></td>
      <td>${escapeHtml(f.role)}</td>
      <td><span class="badge-specialty">${escapeHtml(f.specialty)}</span></td>
      <td><small class="text-dim">${escapeHtml(f.email || '-')}</small></td>
      <td class="text-center">
        <div class="cms-row-actions">
          <button class="btn-sm btn-edit btn-edit-faculty" data-id="${f.id}" title="แก้ไขอาจารย์">✏️ แก้ไข</button>
          <button class="btn-sm btn-danger btn-del-faculty" data-id="${f.id}" title="ลบอาจารย์">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach Edit Click
  tbody.querySelectorAll(".btn-edit-faculty").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.faculty.find((f) => f.id === id);
      if (item) openUniversalEditModal("faculty", item);
    });
  });

  // Attach Delete Click
  tbody.querySelectorAll(".btn-del-faculty").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบข้อมูลอาจารย์ท่านนี้ใช่หรือไม่?")) return;
      try {
        await fetch(`/api/faculty/${id}`, { method: "DELETE" });
        showToast("ลบข้อมูลอาจารย์เรียบร้อย");
        await loadInitialData();
        renderFacultyTable();
      } catch (err) {
        showToast("ไม่สามารถลบได้", "error");
      }
    });
  });
}

// ----------------------------------------------------
// 3. CMS: ANNOUNCEMENTS & NEWS (CRUD)
// ----------------------------------------------------
function setupAnnouncementsCMS() {
  const form = document.getElementById("form-add-news");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const newPost = {
      title: document.getElementById("news-input-title").value.trim(),
      content: document.getElementById("news-input-content").value.trim(),
      tag: document.getElementById("news-input-tag").value.trim() || "ข่าวสาร",
      pinned: document.getElementById("news-input-pinned").checked
    };

    try {
      const res = await fetch("/api/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newPost)
      });
      const data = await res.json();
      if (data.success) {
        showToast("โพสต์ข่าวสารเรียบร้อย!");
        form.reset();
        await loadInitialData();
        renderAnnouncementsTable();
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

function renderAnnouncementsTable() {
  const tbody = document.getElementById("admin-news-tbody");
  if (!tbody || !appData.announcements) return;

  const q = searchFilters.news;
  const list = appData.announcements.filter((a) => {
    if (!q) return true;
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.tag && a.tag.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q))
    );
  });

  const statsLabel = document.getElementById("label-news-stats");
  if (statsLabel) statsLabel.textContent = `แสดง ${list.length} จาก ${appData.announcements.length} รายการ`;

  tbody.innerHTML = list.map((a, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${escapeHtml(a.title)}</strong> ${a.pinned ? '<span class="badge-gold">⭐ ปักหมุด</span>' : ''}</td>
      <td><span class="badge-cat">${escapeHtml(a.tag || 'ข่าวสาร')}</span></td>
      <td><small>${escapeHtml(a.date)}</small></td>
      <td class="text-center">
        <div class="cms-row-actions">
          <button class="btn-sm btn-edit btn-edit-news" data-id="${a.id}" title="แก้ไขข่าว">✏️ แก้ไข</button>
          <button class="btn-sm btn-danger btn-del-news" data-id="${a.id}" title="ลบข่าว">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join("");

  // Attach Edit Click
  tbody.querySelectorAll(".btn-edit-news").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const item = appData.announcements.find((a) => a.id === id);
      if (item) openUniversalEditModal("announcement", item);
    });
  });

  // Attach Delete Click
  tbody.querySelectorAll(".btn-del-news").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("คุณต้องการลบข่าวสารนี้ใช่หรือไม่?")) return;
      try {
        await fetch(`/api/announcements/${id}`, { method: "DELETE" });
        showToast("ลบข่าวสารเรียบร้อย");
        await loadInitialData();
        renderAnnouncementsTable();
      } catch (err) {
        showToast("ไม่สามารถลบได้", "error");
      }
    });
  });
}

// ----------------------------------------------------
// 4. CMS: APPLICATIONS (CRUD)
// ----------------------------------------------------
function setupApplicationsCMS() {
  document.getElementById("btn-export-apps")?.addEventListener("click", () => {
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
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `SSKRU_SE_Applicants_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });
}

function renderApplicationsTable() {
  const tbody = document.getElementById("admin-apps-tbody");
  if (!tbody || !appData.applications) return;

  const q = searchFilters.apps;
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

  const statsLabel = document.getElementById("label-apps-stats");
  if (statsLabel) statsLabel.textContent = `แสดง ${list.length} จาก ${appData.applications.length} คน`;

  tbody.innerHTML = list.map((app, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${escapeHtml(app.name)}</strong></td>
      <td><a href="tel:${escapeHtml(app.phone)}" class="text-gold">${escapeHtml(app.phone)}</a></td>
      <td><small>${escapeHtml(app.email)}</small></td>
      <td><small class="text-muted">${escapeHtml(app.school || '-')}</small></td>
      <td>
        <select class="select-app-status cms-select-mini" data-id="${app.id}">
          <option value="รอการตรวจสอบ" ${app.status === 'รอการตรวจสอบ' ? 'selected' : ''}>รอการตรวจสอบ</option>
          <option value="ตรวจสอบแล้ว" ${app.status === 'ตรวจสอบแล้ว' ? 'selected' : ''}>ตรวจสอบแล้ว</option>
          <option value="ผ่านการคัดเลือก" ${app.status === 'ผ่านการคัดเลือก' ? 'selected' : ''}>ผ่านการคัดเลือก</option>
        </select>
      </td>
      <td><small class="text-dim">${escapeHtml(app.createdAt)}</small></td>
      <td class="text-center">
        <button class="btn-sm btn-danger btn-del-app" data-id="${app.id}" title="ลบใบสมัคร">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".select-app-status").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = sel.getAttribute("data-id");
      try {
        await fetch(`/api/applications/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: sel.value })
        });
        showToast("อัปเดตสถานะสำเร็จ");
        await loadInitialData();
      } catch (err) {
        showToast("เกิดข้อผิดพลาด", "error");
      }
    });
  });

  tbody.querySelectorAll(".btn-del-app").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("ต้องการลบข้อมูลผู้สมัครรายนี้ใช่หรือไม่?")) return;
      try {
        await fetch(`/api/applications/${id}`, { method: "DELETE" });
        showToast("ลบข้อมูลสำเร็จ");
        await loadInitialData();
        renderApplicationsTable();
      } catch (err) {
        showToast("ไม่สามารถลบได้", "error");
      }
    });
  });
}

// ----------------------------------------------------
// 5. CMS: CONTACTS (CRUD)
// ----------------------------------------------------
function setupContactsCMS() {}

function renderContactsTable() {
  const tbody = document.getElementById("admin-contacts-tbody");
  if (!tbody || !appData.contacts) return;

  const q = searchFilters.contacts;
  const list = appData.contacts.filter((c) => {
    if (!q) return true;
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q)) ||
      (c.subject && c.subject.toLowerCase().includes(q)) ||
      (c.message && c.message.toLowerCase().includes(q))
    );
  });

  const statsLabel = document.getElementById("label-contacts-stats");
  if (statsLabel) statsLabel.textContent = `แสดง ${list.length} จาก ${appData.contacts.length} ข้อความ`;

  tbody.innerHTML = list.map((cnt, idx) => `
    <tr>
      <td class="text-center">${idx + 1}</td>
      <td><strong>${escapeHtml(cnt.name)}</strong></td>
      <td><a href="mailto:${escapeHtml(cnt.email)}" class="text-gold">${escapeHtml(cnt.email)}</a></td>
      <td><strong>${escapeHtml(cnt.subject)}</strong></td>
      <td><small class="text-muted line-clamp-2">${escapeHtml(cnt.message)}</small></td>
      <td>
        <select class="select-contact-status cms-select-mini" data-id="${cnt.id}">
          <option value="ยังไม่ได้อ่าน" ${cnt.status === 'ยังไม่ได้อ่าน' ? 'selected' : ''}>ยังไม่ได้อ่าน</option>
          <option value="อ่านแล้ว" ${cnt.status === 'อ่านแล้ว' ? 'selected' : ''}>อ่านแล้ว</option>
          <option value="ตอบกลับแล้ว" ${cnt.status === 'ตอบกลับแล้ว' ? 'selected' : ''}>ตอบกลับแล้ว</option>
        </select>
      </td>
      <td><small class="text-dim">${escapeHtml(cnt.createdAt)}</small></td>
      <td class="text-center">
        <button class="btn-sm btn-danger btn-del-contact" data-id="${cnt.id}" title="ลบข้อความ">🗑️</button>
      </td>
    </tr>
  `).join("");

  tbody.querySelectorAll(".select-contact-status").forEach((sel) => {
    sel.addEventListener("change", async () => {
      const id = sel.getAttribute("data-id");
      try {
        await fetch(`/api/contacts/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: sel.value })
        });
        showToast("อัปเดตสถานะข้อความเรียบร้อย");
        await loadInitialData();
      } catch (err) {
        showToast("เกิดข้อผิดพลาด", "error");
      }
    });
  });

  tbody.querySelectorAll(".btn-del-contact").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-id");
      if (!confirm("ต้องการลบข้อความนี้ใช่หรือไม่?")) return;
      try {
        await fetch(`/api/contacts/${id}`, { method: "DELETE" });
        showToast("ลบข้อความเรียบร้อย");
        await loadInitialData();
        renderContactsTable();
      } catch (err) {
        showToast("ไม่สามารถลบได้", "error");
      }
    });
  });
}

// ----------------------------------------------------
// 6. CMS: GENERAL INFO & STATS (CRUD)
// ----------------------------------------------------
function populateGeneralInfoForm() {
  const info = appData.generalInfo || {};
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = val !== undefined && val !== null ? val : "";
  };
  setVal("gen-input-students", info.studentsCount);
  setVal("gen-input-faculty", info.facultyCount);
  setVal("gen-input-labs", info.labCount);
  setVal("gen-input-rate", info.employmentRate);
  setVal("gen-input-phone", info.phone);
  setVal("gen-input-email", info.email);
  setVal("gen-input-fb", info.facebook);
  setVal("gen-input-slogan", info.slogan);
}

function setupGeneralInfoCMS() {
  const form = document.getElementById("form-general-info");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const updated = {
      studentsCount: Number(document.getElementById("gen-input-students").value) || 180,
      facultyCount: Number(document.getElementById("gen-input-faculty").value) || 5,
      labCount: Number(document.getElementById("gen-input-labs").value) || 4,
      employmentRate: document.getElementById("gen-input-rate").value || "98%",
      phone: document.getElementById("gen-input-phone").value,
      email: document.getElementById("gen-input-email").value,
      facebook: document.getElementById("gen-input-fb").value,
      slogan: document.getElementById("gen-input-slogan")?.value || "",
    };

    try {
      const res = await fetch("/api/general", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated)
      });
      const data = await res.json();
      if (data.success) {
        showToast("อัปเดตข้อมูลส่วนรวมเรียบร้อย!");
        await loadInitialData();
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

// ----------------------------------------------------
// 7. CMS: SECURITY / PASSWORD MANAGEMENT
// ----------------------------------------------------
function setupSecurityCMS() {
  const form = document.getElementById("form-change-password");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const currentPassword = document.getElementById("pwd-current")?.value;
    const newPassword = document.getElementById("pwd-new")?.value;
    const confirmPassword = document.getElementById("pwd-confirm")?.value;

    if (newPassword !== confirmPassword) {
      showToast("รหัสผ่านใหม่ไม่ตรงกัน", "error");
      return;
    }

    const user = getAdminUser();
    const username = user?.username || "admin";

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, currentPassword, newPassword })
      });
      const data = await res.json();
      if (data.success) {
        showToast("🎉 เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย");
        form.reset();
      } else {
        showToast(data.message || "เกิดข้อผิดพลาด", "error");
      }
    } catch {
      showToast("ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้", "error");
    }
  });
}

// ----------------------------------------------------
// 8. UNIVERSAL EDIT MODAL (CURRICULUM, FACULTY, NEWS)
// ----------------------------------------------------
function setupUniversalEditModal() {
  const form = document.getElementById("form-admin-edit");
  const modalEdit = document.getElementById("modal-admin-edit");

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const type = document.getElementById("edit-item-type")?.value;
    const id = document.getElementById("edit-item-id")?.value;

    let url = "";
    let payload = {};

    if (type === "curriculum") {
      url = `/api/curriculum/${id}`;
      payload = {
        icon: document.getElementById("edit-curri-icon")?.value || "💻",
        nameEn: document.getElementById("edit-curri-nameEn")?.value.trim(),
        nameTh: document.getElementById("edit-curri-nameTh")?.value.trim(),
        category: document.getElementById("edit-curri-cat")?.value,
        description: document.getElementById("edit-curri-desc")?.value.trim(),
      };
    } else if (type === "faculty") {
      url = `/api/faculty/${id}`;
      payload = {
        name: document.getElementById("edit-faculty-name")?.value.trim(),
        role: document.getElementById("edit-faculty-role")?.value.trim(),
        specialty: document.getElementById("edit-faculty-specialty")?.value.trim(),
        email: document.getElementById("edit-faculty-email")?.value.trim(),
        image: document.getElementById("edit-faculty-image")?.value.trim() || "/images/prof_sskr_1.jpg",
      };
    } else if (type === "announcement") {
      url = `/api/announcements/${id}`;
      payload = {
        title: document.getElementById("edit-news-title")?.value.trim(),
        tag: document.getElementById("edit-news-tag")?.value.trim() || "ข่าวสาร",
        content: document.getElementById("edit-news-content")?.value.trim(),
        pinned: Boolean(document.getElementById("edit-news-pinned")?.checked),
      };
    }

    try {
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast("บันทึกการแก้ไขเรียบร้อย!");
        modalEdit?.classList.remove("active");
        await loadInitialData();
        renderAdminTables();
      } else {
        showToast(data.message || "เกิดข้อผิดพลาดในการแก้ไข", "error");
      }
    } catch (err) {
      showToast("เกิดข้อผิดพลาดในการบันทึก", "error");
    }
  });
}

function openUniversalEditModal(type, item) {
  const modalEdit = document.getElementById("modal-admin-edit");
  const titleEl = document.getElementById("edit-modal-title");
  const subEl = document.getElementById("edit-modal-subtitle");
  const typeInput = document.getElementById("edit-item-type");
  const idInput = document.getElementById("edit-item-id");
  const container = document.getElementById("edit-fields-container");

  if (!modalEdit || !container) return;

  typeInput.value = type;
  idInput.value = item.id;

  if (type === "curriculum") {
    titleEl.textContent = `✏️ แก้ไขรายวิชา: ${item.nameEn}`;
    subEl.textContent = "หมวดหมู่วิชาและคำอธิบายหลักสูตร";
    container.innerHTML = `
      <div class="cms-form-grid">
        <div class="cms-form-group">
          <label>ไอคอน (Emoji)</label>
          <input type="text" id="edit-curri-icon" class="cms-input" value="${escapeHtml(item.icon || '💻')}" required>
        </div>
        <div class="cms-form-group">
          <label>หมวดหมู่</label>
          <select id="edit-curri-cat" class="cms-select">
            <option value="Core" ${item.category === 'Core' ? 'selected' : ''}>Core</option>
            <option value="Design" ${item.category === 'Design' ? 'selected' : ''}>Design</option>
            <option value="Data" ${item.category === 'Data' ? 'selected' : ''}>Data</option>
            <option value="Advanced" ${item.category === 'Advanced' ? 'selected' : ''}>Advanced</option>
            <option value="Application" ${item.category === 'Application' ? 'selected' : ''}>Application</option>
            <option value="Quality" ${item.category === 'Quality' ? 'selected' : ''}>Quality</option>
            <option value="System" ${item.category === 'System' ? 'selected' : ''}>System</option>
          </select>
        </div>
        <div class="cms-form-group">
          <label>ชื่อวิชา (ภาษาอังกฤษ)</label>
          <input type="text" id="edit-curri-nameEn" class="cms-input" value="${escapeHtml(item.nameEn || '')}" required>
        </div>
        <div class="cms-form-group">
          <label>ชื่อวิชา (ภาษาไทย)</label>
          <input type="text" id="edit-curri-nameTh" class="cms-input" value="${escapeHtml(item.nameTh || '')}" required>
        </div>
        <div class="cms-form-group span-2">
          <label>คำอธิบายเนื้อหารายวิชา</label>
          <textarea id="edit-curri-desc" class="cms-textarea" rows="3">${escapeHtml(item.description || '')}</textarea>
        </div>
      </div>
    `;
  } else if (type === "faculty") {
    titleEl.textContent = `✏️ แก้ไขข้อมูลอาจารย์: ${item.name}`;
    subEl.textContent = "ประวัติ ตำแหน่ง และความเชี่ยวชาญ";
    container.innerHTML = `
      <div class="cms-form-grid">
        <div class="cms-form-group">
          <label>ชื่อ-นามสกุล (พร้อมคำนำหน้า)</label>
          <input type="text" id="edit-faculty-name" class="cms-input" value="${escapeHtml(item.name || '')}" required>
        </div>
        <div class="cms-form-group">
          <label>ตำแหน่ง</label>
          <input type="text" id="edit-faculty-role" class="cms-input" value="${escapeHtml(item.role || '')}" required>
        </div>
        <div class="cms-form-group">
          <label>ความเชี่ยวชาญ (Specialty)</label>
          <input type="text" id="edit-faculty-specialty" class="cms-input" value="${escapeHtml(item.specialty || '')}" required>
        </div>
        <div class="cms-form-group">
          <label>อีเมล</label>
          <input type="email" id="edit-faculty-email" class="cms-input" value="${escapeHtml(item.email || '')}">
        </div>
        <div class="cms-form-group span-2">
          <label>ลิงก์รูปภาพ (URL หรือ /images/...)</label>
          <input type="text" id="edit-faculty-image" class="cms-input" value="${escapeHtml(item.image || '/images/prof_sskr_1.jpg')}">
        </div>
      </div>
    `;
  } else if (type === "announcement") {
    titleEl.textContent = `✏️ แก้ไขข่าวสาร: ${item.title}`;
    subEl.textContent = "เนื้อหาข่าว กิจกรรม และการปักหมุด";
    container.innerHTML = `
      <div class="cms-form-grid">
        <div class="cms-form-group span-2">
          <label>หัวข้อข่าว / กิจกรรม</label>
          <input type="text" id="edit-news-title" class="cms-input" value="${escapeHtml(item.title || '')}" required>
        </div>
        <div class="cms-form-group">
          <label>ป้ายกำกับ (Tag)</label>
          <input type="text" id="edit-news-tag" class="cms-input" value="${escapeHtml(item.tag || 'ข่าวสาร')}">
        </div>
        <div class="cms-form-group" style="flex-direction: row; align-items: center; gap: 0.5rem; margin-top: 1.5rem;">
          <input type="checkbox" id="edit-news-pinned" style="width: 18px; height: 18px; accent-color: #ffcc00;" ${item.pinned ? 'checked' : ''}>
          <label for="edit-news-pinned" style="margin: 0; cursor: pointer;">⭐ ปักหมุดข่าวนี้</label>
        </div>
        <div class="cms-form-group span-2">
          <label>เนื้อหาข่าว</label>
          <textarea id="edit-news-content" class="cms-textarea" rows="4" required>${escapeHtml(item.content || '')}</textarea>
        </div>
      </div>
    `;
  }

  modalEdit.classList.add("active");
}

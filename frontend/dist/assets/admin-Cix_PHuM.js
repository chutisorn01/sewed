import"./modulepreload-polyfill-P2Xu9kJm.js";var e={generalInfo:{},curriculum:[],faculty:[],announcements:[],applications:[],contacts:[]},t={curri:``,faculty:``,news:``,apps:``,contacts:``};function n(e,t=`success`){let n=document.getElementById(`admin-toast`),r=document.getElementById(`toast-icon`),i=document.getElementById(`toast-text`);n&&(i.textContent=e,n.className=`admin-toast active ${t}`,r&&(r.textContent=t===`success`?`✓`:t===`info`?`💡`:`✕`),setTimeout(()=>{n.classList.remove(`active`)},3500))}function r(){return localStorage.getItem(`sskru_admin_token`)}function i(){try{return JSON.parse(localStorage.getItem(`sskru_admin_user`)||`null`)}catch{return null}}function a(e,t){localStorage.setItem(`sskru_admin_token`,e),localStorage.setItem(`sskru_admin_user`,JSON.stringify(t))}function o(){localStorage.removeItem(`sskru_admin_token`),localStorage.removeItem(`sskru_admin_user`)}async function s(e,t={}){let i=r(),a={"Content-Type":`application/json`,...t.headers||{}};i&&(a.Authorization=`Bearer ${i}`);let s=await fetch(e,{...t,headers:a});if(s.status===401)throw o(),l(),n(`เซสชันหมดอายุหรือไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่`,`error`),Error(`Unauthorized`);return s}async function c(e){if(!e)throw Error(`ไม่ได้เลือกไฟล์`);if(e.size>20971520)throw Error(`ขนาดไฟล์ใหญ่เกินไป (จำกัดไม่เกิน 20MB)`);return new Promise((t,n)=>{let r=new FileReader;r.onload=async()=>{try{let i=r.result,a=await(await s(`/api/upload`,{method:`POST`,body:JSON.stringify({filename:e.name,data:i})})).json();a.success&&a.url?t(a.url):n(Error(a.message||`อัปโหลดล้มเหลว`))}catch(e){n(e)}},r.onerror=()=>n(Error(`ไม่สามารถอ่านไฟล์ได้`)),r.readAsDataURL(e)})}function l(){let e=r(),t=i(),n=document.getElementById(`admin-login-view`),a=document.getElementById(`admin-dashboard-view`),o=document.getElementById(`label-admin-name`);e&&t?(n&&(n.style.display=`none`),a&&(a.style.display=`flex`),o&&(o.textContent=t.name||t.username||`Super Admin`),u()):(n&&(n.style.display=`flex`),a&&(a.style.display=`none`))}async function u(){try{let t=await(await s(`/api/data`)).json();t.success&&t.data&&(e=t.data,p(),d(),y())}catch(e){console.warn(`Error fetching data:`,e)}}function d(){let t=(e,t)=>{let n=document.getElementById(e);n&&(n.textContent=String(t||0))};t(`badge-count-curri`,e.curriculum?.length),t(`badge-count-faculty`,e.faculty?.length),t(`badge-count-news`,e.announcements?.length),t(`badge-count-apps`,e.applications?.length),t(`badge-count-contacts`,e.contacts?.length)}function f(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}function p(){m(),h(),g(),_(),v()}function m(){let r=document.getElementById(`tbody-curri`);if(!r||!e.curriculum)return;let i=t.curri,a=e.curriculum.filter(e=>!i||e.nameEn&&e.nameEn.toLowerCase().includes(i)||e.nameTh&&e.nameTh.toLowerCase().includes(i)||e.category&&e.category.toLowerCase().includes(i)||e.description&&e.description.toLowerCase().includes(i)),o=document.getElementById(`count-label-curri`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.curriculum.length} วิชา`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td style="text-align: center; font-size: 1.3rem;">${e.icon||`💻`}</td>
      <td>
        <strong style="color: var(--text-main);">${f(e.nameEn)}</strong><br>
        <span style="color: var(--text-muted); font-size: 0.82rem;">${f(e.nameTh)}</span>
      </td>
      <td><span class="badge-clean badge-blue">${f(e.category||`Core`)}</span></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${f(e.description||`-`)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-curri" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-curri" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-curri`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.curriculum.find(e=>e.id===n);r&&b(`curriculum`,r)})}),r.querySelectorAll(`.btn-del-curri`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบรายวิชานี้ใช่หรือไม่?`))try{await s(`/api/curriculum/${t}`,{method:`DELETE`}),n(`ลบรายวิชาสำเร็จ`),await u()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function h(){let r=document.getElementById(`tbody-faculty`);if(!r||!e.faculty)return;let i=t.faculty,a=e.faculty.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.role&&e.role.toLowerCase().includes(i)||e.specialty&&e.specialty.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)),o=document.getElementById(`count-label-faculty`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.faculty.length} ท่าน`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td style="text-align: center;">
        <img src="${f(e.image)}" class="table-thumbnail" onerror="this.src='/images/prof_sskr_1.jpg'">
      </td>
      <td><strong style="color: var(--text-main);">${f(e.name)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.84rem;">${f(e.role)}</span></td>
      <td><span class="badge-clean badge-green">${f(e.specialty)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${f(e.email||`-`)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-faculty" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-faculty" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-faculty`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.faculty.find(e=>e.id===n);r&&b(`faculty`,r)})}),r.querySelectorAll(`.btn-del-faculty`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบข้อมูลอาจารย์ท่านนี้ใช่หรือไม่?`))try{await s(`/api/faculty/${t}`,{method:`DELETE`}),n(`ลบข้อมูลอาจารย์สำเร็จ`),await u()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function g(){let r=document.getElementById(`tbody-news`);if(!r||!e.announcements)return;let i=t.news,a=e.announcements.filter(e=>!i||e.title&&e.title.toLowerCase().includes(i)||e.tag&&e.tag.toLowerCase().includes(i)||e.content&&e.content.toLowerCase().includes(i)),o=document.getElementById(`count-label-news`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.announcements.length} รายการ`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td>
        <strong style="color: var(--text-main);">${f(e.title)}</strong>
        ${e.pinned?`<span class="badge-clean badge-amber" style="margin-left: 0.4rem;">⭐ ปักหมุด</span>`:``}
        <br>
        <span style="color: var(--text-muted); font-size: 0.8rem; display: inline-block; margin-top: 0.2rem;">${f(e.content).substring(0,85)}...</span>
      </td>
      <td><span class="badge-clean badge-blue">${f(e.tag||`ข่าวสาร`)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${f(e.date)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-news" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-news" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-news`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.announcements.find(e=>e.id===n);r&&b(`announcement`,r)})}),r.querySelectorAll(`.btn-del-news`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบข่าวสารนี้ใช่หรือไม่?`))try{await s(`/api/announcements/${t}`,{method:`DELETE`}),n(`ลบข่าวสารเรียบร้อย`),await u()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function _(){let r=document.getElementById(`tbody-apps`);if(!r||!e.applications)return;let i=t.apps,a=e.applications.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.phone&&e.phone.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)||e.school&&e.school.toLowerCase().includes(i)||e.status&&e.status.toLowerCase().includes(i)),o=document.getElementById(`count-label-apps`);o&&(o.textContent=`ทั้งหมด ${a.length} คน`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td><strong style="color: var(--text-main);">${f(e.name)}</strong></td>
      <td><a href="tel:${f(e.phone)}" style="color: var(--primary); text-decoration: none; font-weight: 500;">${f(e.phone)}</a></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem;">${f(e.email||`-`)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${f(e.school||`-`)}</span></td>
      <td>
        <select class="form-select select-app-status" data-id="${e.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="รอการตรวจสอบ" ${e.status===`รอการตรวจสอบ`?`selected`:``}>รอการตรวจสอบ</option>
          <option value="ตรวจสอบแล้ว" ${e.status===`ตรวจสอบแล้ว`?`selected`:``}>ตรวจสอบแล้ว</option>
          <option value="ผ่านการคัดเลือก" ${e.status===`ผ่านการคัดเลือก`?`selected`:``}>ผ่านการคัดเลือก</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${f(e.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-app" data-id="${e.id}" title="ลบใบสมัคร">🗑️</button>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.select-app-status`).forEach(e=>{e.addEventListener(`change`,async()=>{let t=e.getAttribute(`data-id`);try{await s(`/api/applications/${t}`,{method:`PUT`,body:JSON.stringify({status:e.value})}),n(`อัปเดตสถานะใบสมัครเรียบร้อย`),await u()}catch{n(`เกิดข้อผิดพลาดในการอัปเดต`,`error`)}})}),r.querySelectorAll(`.btn-del-app`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`ต้องการลบข้อมูลผู้สมัครรายนี้ใช่หรือไม่?`))try{await s(`/api/applications/${t}`,{method:`DELETE`}),n(`ลบข้อมูลเรียบร้อย`),await u()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function v(){let r=document.getElementById(`tbody-contacts`);if(!r||!e.contacts)return;let i=t.contacts,a=e.contacts.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)||e.subject&&e.subject.toLowerCase().includes(i)||e.message&&e.message.toLowerCase().includes(i)),o=document.getElementById(`count-label-contacts`);o&&(o.textContent=`ทั้งหมด ${a.length} ข้อความ`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td><strong style="color: var(--text-main);">${f(e.name)}</strong></td>
      <td><a href="mailto:${f(e.email)}" style="color: var(--primary); text-decoration: none;">${f(e.email)}</a></td>
      <td><strong style="color: var(--text-main); font-size: 0.84rem;">${f(e.subject)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${f(e.message)}</span></td>
      <td>
        <select class="form-select select-contact-status" data-id="${e.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="ยังไม่ได้อ่าน" ${e.status===`ยังไม่ได้อ่าน`?`selected`:``}>ยังไม่ได้อ่าน</option>
          <option value="อ่านแล้ว" ${e.status===`อ่านแล้ว`?`selected`:``}>อ่านแล้ว</option>
          <option value="ตอบกลับแล้ว" ${e.status===`ตอบกลับแล้ว`?`selected`:``}>ตอบกลับแล้ว</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${f(e.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-contact" data-id="${e.id}" title="ลบข้อความ">🗑️</button>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.select-contact-status`).forEach(e=>{e.addEventListener(`change`,async()=>{let t=e.getAttribute(`data-id`);try{await s(`/api/contacts/${t}`,{method:`PUT`,body:JSON.stringify({status:e.value})}),n(`อัปเดตสถานะข้อความเรียบร้อย`),await u()}catch{n(`เกิดข้อผิดพลาดในการอัปเดต`,`error`)}})}),r.querySelectorAll(`.btn-del-contact`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`ต้องการลบข้อความนี้ใช่หรือไม่?`))try{await s(`/api/contacts/${t}`,{method:`DELETE`}),n(`ลบข้อความเรียบร้อย`),await u()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function y(){let t=e.generalInfo||{},n=(e,t)=>{let n=document.getElementById(e);n&&(n.value=t??``)};n(`gen-students`,t.studentsCount),n(`gen-faculty`,t.facultyCount),n(`gen-labs`,t.labCount),n(`gen-rate`,t.employmentRate),n(`gen-phone`,t.phone),n(`gen-email`,t.email),n(`gen-fb`,t.facebook),n(`gen-slogan`,t.slogan)}function b(e,t){let r=document.getElementById(`modal-edit`),i=document.getElementById(`modal-edit-title`),a=document.getElementById(`edit-type`),o=document.getElementById(`edit-id`),s=document.getElementById(`edit-inputs-container`);if(r&&s){if(a.value=e,o.value=t.id,e===`curriculum`)i.textContent=`✏️ แก้ไขรายวิชา: ${t.nameEn}`,s.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ไอคอน (Emoji)</label>
          <input type="text" id="edit-curri-icon" class="form-control no-icon" value="${f(t.icon||`💻`)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">หมวดหมู่วิชา</label>
          <select id="edit-curri-cat" class="form-select">
            <option value="Core" ${t.category===`Core`?`selected`:``}>Core (วิชาแกนหลัก)</option>
            <option value="Design" ${t.category===`Design`?`selected`:``}>Design (ออกแบบซอฟต์แวร์)</option>
            <option value="Data" ${t.category===`Data`?`selected`:``}>Data (ข้อมูลและฐานข้อมูล)</option>
            <option value="Advanced" ${t.category===`Advanced`?`selected`:``}>Advanced (ขั้นสูง / AI)</option>
            <option value="Application" ${t.category===`Application`?`selected`:``}>Application (เว็บและโมบายล์)</option>
            <option value="Quality" ${t.category===`Quality`?`selected`:``}>Quality (ทดสอบและ QA)</option>
            <option value="System" ${t.category===`System`?`selected`:``}>System (คลาวด์และระบบ)</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อภาษาอังกฤษ</label>
          <input type="text" id="edit-curri-nameEn" class="form-control no-icon" value="${f(t.nameEn||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อภาษาไทย</label>
          <input type="text" id="edit-curri-nameTh" class="form-control no-icon" value="${f(t.nameTh||``)}" required>
        </div>
        <div class="form-group span-2">
          <label class="form-label">คำอธิบายรายวิชา</label>
          <textarea id="edit-curri-desc" class="form-textarea" rows="3">${f(t.description||``)}</textarea>
        </div>
      </div>
    `;else if(e===`faculty`){i.textContent=`✏️ แก้ไขข้อมูลอาจารย์: ${t.name}`,s.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ชื่อ - นามสกุล (พร้อมคำนำหน้า)</label>
          <input type="text" id="edit-fac-name" class="form-control no-icon" value="${f(t.name||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ตำแหน่ง</label>
          <input type="text" id="edit-fac-role" class="form-control no-icon" value="${f(t.role||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ความเชี่ยวชาญ (Specialty)</label>
          <input type="text" id="edit-fac-specialty" class="form-control no-icon" value="${f(t.specialty||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">อีเมล</label>
          <input type="email" id="edit-fac-email" class="form-control no-icon" value="${f(t.email||``)}">
        </div>
        <div class="form-group span-2">
          <label class="form-label" style="display: flex; justify-content: space-between; align-items: center;">
            <span>รูปภาพอาจารย์</span>
            <span style="font-size: 0.8rem; font-weight: normal; color: var(--text-muted);">รองรับ .WEBP, .JPG, .PNG</span>
          </label>
          <div style="display: flex; gap: 0.85rem; align-items: center; margin-bottom: 0.6rem;">
            <img id="edit-fac-preview" src="${f(t.image||`/images/oau.WEBP`)}" alt="Preview" style="width: 56px; height: 56px; border-radius: 8px; object-fit: cover; border: 1px solid var(--border); box-shadow: 0 2px 6px rgba(0,0,0,0.06); background: #f8fafc;" onerror="this.src='/images/prof_sskr_1.jpg'">
            <div style="flex: 1; display: flex; flex-direction: column; gap: 0.35rem;">
              <label class="btn-secondary" style="display: inline-flex; align-items: center; justify-content: center; gap: 0.4rem; cursor: pointer; padding: 0.45rem 0.85rem; font-size: 0.85rem; border-radius: 6px; width: fit-content; margin: 0;">
                📁 เลือกไฟล์รูปภาพจากเครื่อง
                <input type="file" id="edit-fac-file" accept="image/*" style="display: none;">
              </label>
              <span id="edit-fac-upload-status" style="font-size: 0.75rem; color: var(--text-muted);">เลือกไฟล์รูปจากเครื่องเพื่ออัปโหลดอัตโนมัติ หรือพิมพ์ URL ด้านล่าง</span>
            </div>
          </div>
          <input type="text" id="edit-fac-image" class="form-control no-icon" value="${f(t.image||`/images/oau.WEBP`)}" placeholder="/images/oau.WEBP">
        </div>
      </div>
    `;let e=document.getElementById(`edit-fac-file`),r=document.getElementById(`edit-fac-image`),a=document.getElementById(`edit-fac-preview`),o=document.getElementById(`edit-fac-upload-status`);r?.addEventListener(`input`,e=>{a&&(a.src=e.target.value||`/images/prof_sskr_1.jpg`)}),e?.addEventListener(`change`,async e=>{let t=e.target.files?.[0];if(t){o&&(o.textContent=`⏳ กำลังอัปโหลดรูปภาพ...`);try{let e=await c(t);r&&(r.value=e),a&&(a.src=e),o&&(o.textContent=`✅ อัปโหลดสำเร็จ: ${t.name}`),n(`อัปโหลดรูปภาพสำเร็จ!`)}catch(e){o&&(o.textContent=`❌ ${e.message}`),n(e.message||`เกิดข้อผิดพลาดในการอัปโหลด`,`error`)}}})}else e===`announcement`&&(i.textContent=`✏️ แก้ไขข่าวสาร: ${t.title}`,s.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group span-2">
          <label class="form-label">หัวข้อข่าว / กิจกรรม</label>
          <input type="text" id="edit-news-title" class="form-control no-icon" value="${f(t.title||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ป้ายกำกับ (Tag)</label>
          <input type="text" id="edit-news-tag" class="form-control no-icon" value="${f(t.tag||`ข่าวสาร`)}">
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; padding-top: 1.5rem;">
          <input type="checkbox" id="edit-news-pinned" style="width: 20px; height: 20px; accent-color: var(--primary);" ${t.pinned?`checked`:``}>
          <label for="edit-news-pinned" style="margin: 0; font-weight: 600; cursor: pointer;">⭐ ปักหมุดข่าวนี้</label>
        </div>
        <div class="form-group span-2">
          <label class="form-label">เนื้อหาข่าว / รายละเอียด</label>
          <textarea id="edit-news-content" class="form-textarea" rows="4" required>${f(t.content||``)}</textarea>
        </div>
      </div>
    `);r.classList.add(`active`)}}function x(){l();let i=document.getElementById(`form-login`),d=document.getElementById(`login-alert`),f=document.getElementById(`btn-toggle-pwd`),p=document.getElementById(`login-password`),y=document.getElementById(`login-username`),b=document.getElementById(`btn-login-submit`);f?.addEventListener(`click`,e=>{e?.preventDefault?.();let t=document.getElementById(`login-password`);if(!t)return;let n=t.type===`password`;t.type=n?`text`:`password`,f.textContent=n?`🙈`:`👁️`});async function x(e){e&&e.preventDefault(),d&&(d.style.display=`none`,d.textContent=``);let t=document.getElementById(`login-username`)?.value.trim(),r=document.getElementById(`login-password`)?.value;if(!t||!r){d&&(d.textContent=`⚠️ กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน`,d.style.display=`block`);return}b&&(b.disabled=!0,b.innerHTML=`<span>⏳ กำลังตรวจสอบสิทธิ์...</span>`);try{let e=await(await fetch(`/api/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:t,password:r})})).json();e.success&&e.token?(a(e.token,e.user),l(),n(`🎉 ยินดีต้อนรับคุณ ${e.user.name||e.user.username}`)):d&&(d.textContent=`❌ `+(e.message||`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง`),d.style.display=`block`)}catch{d&&(d.textContent=`❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ (Port 5005)`,d.style.display=`block`)}finally{b&&(b.disabled=!1,b.innerHTML=`<span>เข้าสู่ระบบ (Sign In)</span><span>→</span>`)}}i?.addEventListener(`submit`,x),b?.addEventListener(`click`,x);let S=e=>{e.key===`Enter`&&(e.preventDefault(),x(e))};y?.addEventListener(`keydown`,S),p?.addEventListener(`keydown`,S),document.getElementById(`btn-logout`)?.addEventListener(`click`,async()=>{let e=r();try{e&&await fetch(`/api/auth/logout`,{method:`POST`,headers:{Authorization:`Bearer ${e}`}})}catch{}o(),l(),n(`ออกจากระบบเรียบร้อย`)});let C=document.querySelectorAll(`.sidebar-item[data-tab]`),w=document.querySelectorAll(`.tab-content-panel`);C.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);C.forEach(e=>e.classList.remove(`active`)),w.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),document.getElementById(`panel-${t}`)?.classList.add(`active`)})});let T=(e,n,r)=>{document.getElementById(e)?.addEventListener(`input`,e=>{t[n]=e.target.value.toLowerCase().trim(),r()})};T(`search-curri`,`curri`,m),T(`search-faculty`,`faculty`,h),T(`search-news`,`news`,g),T(`search-apps`,`apps`,_),T(`search-contacts`,`contacts`,v),document.getElementById(`form-add-curri`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={icon:document.getElementById(`input-curri-icon`).value||`💻`,category:document.getElementById(`input-curri-cat`).value,nameEn:document.getElementById(`input-curri-nameEn`).value.trim(),nameTh:document.getElementById(`input-curri-nameTh`).value.trim(),description:document.getElementById(`input-curri-desc`).value.trim()};try{(await(await s(`/api/curriculum`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`เพิ่มรายวิชาสำเร็จ!`),e.target.reset(),document.getElementById(`input-curri-icon`).value=`💻`,await u())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}});let E=document.getElementById(`input-fac-file`),D=document.getElementById(`input-fac-image`),O=document.getElementById(`input-fac-preview`),k=document.getElementById(`input-fac-upload-status`);D?.addEventListener(`input`,e=>{O&&(O.src=e.target.value||`/images/prof_sskr_1.jpg`)}),E?.addEventListener(`change`,async e=>{let t=e.target.files?.[0];if(t){k&&(k.textContent=`⏳ กำลังอัปโหลดรูปภาพ...`);try{let e=await c(t);D&&(D.value=e),O&&(O.src=e),k&&(k.textContent=`✅ อัปโหลดสำเร็จ: ${t.name}`),n(`อัปโหลดรูปภาพสำเร็จ!`)}catch(e){k&&(k.textContent=`❌ ${e.message}`),n(e.message||`เกิดข้อผิดพลาดในการอัปโหลด`,`error`)}}}),document.getElementById(`form-add-faculty`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={name:document.getElementById(`input-fac-name`).value.trim(),role:document.getElementById(`input-fac-role`).value.trim(),specialty:document.getElementById(`input-fac-specialty`).value.trim(),email:document.getElementById(`input-fac-email`).value.trim(),image:document.getElementById(`input-fac-image`).value.trim()||`/images/oau.WEBP`};try{(await(await s(`/api/faculty`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`เพิ่มข้อมูลอาจารย์สำเร็จ!`),e.target.reset(),D&&(D.value=`/images/oau.WEBP`),O&&(O.src=`/images/oau.WEBP`),k&&(k.textContent=`เลือกไฟล์รูปจากเครื่องเพื่ออัปโหลดอัตโนมัติ หรือพิมพ์ URL ด้านล่าง`),await u())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`form-add-news`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={title:document.getElementById(`input-news-title`).value.trim(),tag:document.getElementById(`input-news-tag`).value.trim()||`ข่าวสาร`,pinned:document.getElementById(`input-news-pinned`).checked,content:document.getElementById(`input-news-content`).value.trim()};try{(await(await s(`/api/announcements`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`โพสต์ข่าวสารเรียบร้อย!`),e.target.reset(),await u())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`btn-export-csv`)?.addEventListener(`click`,()=>{if(!e.applications||e.applications.length===0){alert(`ไม่มีข้อมูลสำหรับส่งออก`);return}let t=[`ID`,`ชื่อ-นามสกุล`,`เบอร์โทร`,`อีเมล`,`โรงเรียน`,`สถานะ`,`วันที่สมัคร`],n=e.applications.map(e=>[e.id,`"${e.name}"`,`"${e.phone}"`,`"${e.email}"`,`"${e.school}"`,`"${e.status}"`,`"${e.createdAt}"`]),r=`data:text/csv;charset=utf-8,﻿`+[t.join(`,`),...n.map(e=>e.join(`,`))].join(`
`),i=document.createElement(`a`);i.href=encodeURI(r),i.download=`SSKRU_SE_Applicants_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(i),i.click(),document.body.removeChild(i)}),document.getElementById(`form-general`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={studentsCount:Number(document.getElementById(`gen-students`).value)||180,facultyCount:Number(document.getElementById(`gen-faculty`).value)||5,labCount:Number(document.getElementById(`gen-labs`).value)||4,employmentRate:document.getElementById(`gen-rate`).value||`98%`,phone:document.getElementById(`gen-phone`).value,email:document.getElementById(`gen-email`).value,facebook:document.getElementById(`gen-fb`).value,slogan:document.getElementById(`gen-slogan`).value};try{(await(await s(`/api/general`,{method:`PUT`,body:JSON.stringify(t)})).json()).success&&(n(`บันทึกข้อมูลส่วนรวมเรียบร้อย!`),await u())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`form-pwd`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`pwd-curr`).value,r=document.getElementById(`pwd-new`).value;if(r!==document.getElementById(`pwd-conf`).value){n(`รหัสผ่านใหม่ไม่ตรงกัน`,`error`);return}try{let i=await(await s(`/api/auth/change-password`,{method:`POST`,body:JSON.stringify({currentPassword:t,newPassword:r})})).json();i.success?(n(`เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย`),e.target.reset()):n(i.message||`เกิดข้อผิดพลาด`,`error`)}catch{n(`ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้`,`error`)}});let A=document.getElementById(`modal-edit`);document.getElementById(`btn-close-edit-modal`)?.addEventListener(`click`,()=>A?.classList.remove(`active`)),document.getElementById(`btn-cancel-edit-modal`)?.addEventListener(`click`,()=>A?.classList.remove(`active`)),A?.addEventListener(`click`,e=>{e.target===A&&A.classList.remove(`active`)}),document.getElementById(`form-edit-item`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`edit-type`)?.value,r=document.getElementById(`edit-id`)?.value,i=``,a={};t===`curriculum`?(i=`/api/curriculum/${r}`,a={icon:document.getElementById(`edit-curri-icon`).value||`💻`,category:document.getElementById(`edit-curri-cat`).value,nameEn:document.getElementById(`edit-curri-nameEn`).value.trim(),nameTh:document.getElementById(`edit-curri-nameTh`).value.trim(),description:document.getElementById(`edit-curri-desc`).value.trim()}):t===`faculty`?(i=`/api/faculty/${r}`,a={name:document.getElementById(`edit-fac-name`).value.trim(),role:document.getElementById(`edit-fac-role`).value.trim(),specialty:document.getElementById(`edit-fac-specialty`).value.trim(),email:document.getElementById(`edit-fac-email`).value.trim(),image:document.getElementById(`edit-fac-image`).value.trim()||`/images/oau.WEBP`}):t===`announcement`&&(i=`/api/announcements/${r}`,a={title:document.getElementById(`edit-news-title`).value.trim(),tag:document.getElementById(`edit-news-tag`).value.trim()||`ข่าวสาร`,pinned:!!document.getElementById(`edit-news-pinned`).checked,content:document.getElementById(`edit-news-content`).value.trim()});try{let e=await(await s(i,{method:`PUT`,body:JSON.stringify(a)})).json();e.success?(n(`บันทึกการแก้ไขเรียบร้อย!`),A?.classList.remove(`active`),await u()):n(e.message||`เกิดข้อผิดพลาดในการแก้ไข`,`error`)}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,x):x();
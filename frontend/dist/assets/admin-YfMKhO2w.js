import"./modulepreload-polyfill-P2Xu9kJm.js";var e={generalInfo:{},curriculum:[],faculty:[],announcements:[],applications:[],contacts:[]},t={curri:``,faculty:``,news:``,apps:``,contacts:``};function n(e,t=`success`){let n=document.getElementById(`admin-toast`),r=document.getElementById(`toast-icon`),i=document.getElementById(`toast-text`);n&&(i.textContent=e,n.className=`admin-toast active ${t}`,r&&(r.textContent=t===`success`?`✓`:t===`info`?`💡`:`✕`),setTimeout(()=>{n.classList.remove(`active`)},3500))}function r(){return localStorage.getItem(`sskru_admin_token`)}function i(){try{return JSON.parse(localStorage.getItem(`sskru_admin_user`)||`null`)}catch{return null}}function a(e,t){localStorage.setItem(`sskru_admin_token`,e),localStorage.setItem(`sskru_admin_user`,JSON.stringify(t))}function o(){localStorage.removeItem(`sskru_admin_token`),localStorage.removeItem(`sskru_admin_user`)}async function s(e,t={}){let i=r(),a={"Content-Type":`application/json`,...t.headers||{}};i&&(a.Authorization=`Bearer ${i}`);let s=await fetch(e,{...t,headers:a});if(s.status===401)throw o(),c(),n(`เซสชันหมดอายุหรือไม่มีสิทธิ์เข้าถึง กรุณาเข้าสู่ระบบใหม่`,`error`),Error(`Unauthorized`);return s}function c(){let e=r(),t=i(),n=document.getElementById(`admin-login-view`),a=document.getElementById(`admin-dashboard-view`),o=document.getElementById(`label-admin-name`);e&&t?(n&&(n.style.display=`none`),a&&(a.style.display=`flex`),o&&(o.textContent=t.name||t.username||`Super Admin`),l()):(n&&(n.style.display=`flex`),a&&(a.style.display=`none`))}async function l(){try{let t=await(await s(`/api/data`)).json();t.success&&t.data&&(e=t.data,f(),u(),v())}catch(e){console.warn(`Error fetching data:`,e)}}function u(){let t=(e,t)=>{let n=document.getElementById(e);n&&(n.textContent=String(t||0))};t(`badge-count-curri`,e.curriculum?.length),t(`badge-count-faculty`,e.faculty?.length),t(`badge-count-news`,e.announcements?.length),t(`badge-count-apps`,e.applications?.length),t(`badge-count-contacts`,e.contacts?.length)}function d(e){return e?String(e).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#039;`):``}function f(){p(),m(),h(),g(),_()}function p(){let r=document.getElementById(`tbody-curri`);if(!r||!e.curriculum)return;let i=t.curri,a=e.curriculum.filter(e=>!i||e.nameEn&&e.nameEn.toLowerCase().includes(i)||e.nameTh&&e.nameTh.toLowerCase().includes(i)||e.category&&e.category.toLowerCase().includes(i)||e.description&&e.description.toLowerCase().includes(i)),o=document.getElementById(`count-label-curri`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.curriculum.length} วิชา`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td style="text-align: center; font-size: 1.3rem;">${e.icon||`💻`}</td>
      <td>
        <strong style="color: var(--text-main);">${d(e.nameEn)}</strong><br>
        <span style="color: var(--text-muted); font-size: 0.82rem;">${d(e.nameTh)}</span>
      </td>
      <td><span class="badge-clean badge-blue">${d(e.category||`Core`)}</span></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${d(e.description||`-`)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-curri" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-curri" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-curri`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.curriculum.find(e=>e.id===n);r&&y(`curriculum`,r)})}),r.querySelectorAll(`.btn-del-curri`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบรายวิชานี้ใช่หรือไม่?`))try{await s(`/api/curriculum/${t}`,{method:`DELETE`}),n(`ลบรายวิชาสำเร็จ`),await l()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function m(){let r=document.getElementById(`tbody-faculty`);if(!r||!e.faculty)return;let i=t.faculty,a=e.faculty.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.role&&e.role.toLowerCase().includes(i)||e.specialty&&e.specialty.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)),o=document.getElementById(`count-label-faculty`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.faculty.length} ท่าน`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td style="text-align: center;">
        <img src="${d(e.image)}" class="table-thumbnail" onerror="this.src='/images/prof_sskr_1.jpg'">
      </td>
      <td><strong style="color: var(--text-main);">${d(e.name)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.84rem;">${d(e.role)}</span></td>
      <td><span class="badge-clean badge-green">${d(e.specialty)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${d(e.email||`-`)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-faculty" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-faculty" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-faculty`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.faculty.find(e=>e.id===n);r&&y(`faculty`,r)})}),r.querySelectorAll(`.btn-del-faculty`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบข้อมูลอาจารย์ท่านนี้ใช่หรือไม่?`))try{await s(`/api/faculty/${t}`,{method:`DELETE`}),n(`ลบข้อมูลอาจารย์สำเร็จ`),await l()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function h(){let r=document.getElementById(`tbody-news`);if(!r||!e.announcements)return;let i=t.news,a=e.announcements.filter(e=>!i||e.title&&e.title.toLowerCase().includes(i)||e.tag&&e.tag.toLowerCase().includes(i)||e.content&&e.content.toLowerCase().includes(i)),o=document.getElementById(`count-label-news`);o&&(o.textContent=`แสดง ${a.length} จาก ${e.announcements.length} รายการ`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td>
        <strong style="color: var(--text-main);">${d(e.title)}</strong>
        ${e.pinned?`<span class="badge-clean badge-amber" style="margin-left: 0.4rem;">⭐ ปักหมุด</span>`:``}
        <br>
        <span style="color: var(--text-muted); font-size: 0.8rem; display: inline-block; margin-top: 0.2rem;">${d(e.content).substring(0,85)}...</span>
      </td>
      <td><span class="badge-clean badge-blue">${d(e.tag||`ข่าวสาร`)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${d(e.date)}</span></td>
      <td style="text-align: center;">
        <div class="action-btn-group" style="justify-content: center;">
          <button class="btn-action-edit btn-edit-news" data-id="${e.id}">✏️ แก้ไข</button>
          <button class="btn-action-delete btn-del-news" data-id="${e.id}">🗑️ ลบ</button>
        </div>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.btn-edit-news`).forEach(t=>{t.addEventListener(`click`,()=>{let n=t.getAttribute(`data-id`),r=e.announcements.find(e=>e.id===n);r&&y(`announcement`,r)})}),r.querySelectorAll(`.btn-del-news`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`คุณต้องการลบข่าวสารนี้ใช่หรือไม่?`))try{await s(`/api/announcements/${t}`,{method:`DELETE`}),n(`ลบข่าวสารเรียบร้อย`),await l()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function g(){let r=document.getElementById(`tbody-apps`);if(!r||!e.applications)return;let i=t.apps,a=e.applications.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.phone&&e.phone.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)||e.school&&e.school.toLowerCase().includes(i)||e.status&&e.status.toLowerCase().includes(i)),o=document.getElementById(`count-label-apps`);o&&(o.textContent=`ทั้งหมด ${a.length} คน`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td><strong style="color: var(--text-main);">${d(e.name)}</strong></td>
      <td><a href="tel:${d(e.phone)}" style="color: var(--primary); text-decoration: none; font-weight: 500;">${d(e.phone)}</a></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem;">${d(e.email||`-`)}</span></td>
      <td><span style="color: var(--text-muted); font-size: 0.82rem;">${d(e.school||`-`)}</span></td>
      <td>
        <select class="form-select select-app-status" data-id="${e.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="รอการตรวจสอบ" ${e.status===`รอการตรวจสอบ`?`selected`:``}>รอการตรวจสอบ</option>
          <option value="ตรวจสอบแล้ว" ${e.status===`ตรวจสอบแล้ว`?`selected`:``}>ตรวจสอบแล้ว</option>
          <option value="ผ่านการคัดเลือก" ${e.status===`ผ่านการคัดเลือก`?`selected`:``}>ผ่านการคัดเลือก</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${d(e.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-app" data-id="${e.id}" title="ลบใบสมัคร">🗑️</button>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.select-app-status`).forEach(e=>{e.addEventListener(`change`,async()=>{let t=e.getAttribute(`data-id`);try{await s(`/api/applications/${t}`,{method:`PUT`,body:JSON.stringify({status:e.value})}),n(`อัปเดตสถานะใบสมัครเรียบร้อย`),await l()}catch{n(`เกิดข้อผิดพลาดในการอัปเดต`,`error`)}})}),r.querySelectorAll(`.btn-del-app`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`ต้องการลบข้อมูลผู้สมัครรายนี้ใช่หรือไม่?`))try{await s(`/api/applications/${t}`,{method:`DELETE`}),n(`ลบข้อมูลเรียบร้อย`),await l()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function _(){let r=document.getElementById(`tbody-contacts`);if(!r||!e.contacts)return;let i=t.contacts,a=e.contacts.filter(e=>!i||e.name&&e.name.toLowerCase().includes(i)||e.email&&e.email.toLowerCase().includes(i)||e.subject&&e.subject.toLowerCase().includes(i)||e.message&&e.message.toLowerCase().includes(i)),o=document.getElementById(`count-label-contacts`);o&&(o.textContent=`ทั้งหมด ${a.length} ข้อความ`),r.innerHTML=a.map((e,t)=>`
    <tr>
      <td style="color: var(--text-dim); font-size: 0.8rem;">${t+1}</td>
      <td><strong style="color: var(--text-main);">${d(e.name)}</strong></td>
      <td><a href="mailto:${d(e.email)}" style="color: var(--primary); text-decoration: none;">${d(e.email)}</a></td>
      <td><strong style="color: var(--text-main); font-size: 0.84rem;">${d(e.subject)}</strong></td>
      <td><span style="color: var(--text-body); font-size: 0.82rem; line-height: 1.4;">${d(e.message)}</span></td>
      <td>
        <select class="form-select select-contact-status" data-id="${e.id}" style="height: 34px; font-size: 0.8rem; padding: 0 0.5rem;">
          <option value="ยังไม่ได้อ่าน" ${e.status===`ยังไม่ได้อ่าน`?`selected`:``}>ยังไม่ได้อ่าน</option>
          <option value="อ่านแล้ว" ${e.status===`อ่านแล้ว`?`selected`:``}>อ่านแล้ว</option>
          <option value="ตอบกลับแล้ว" ${e.status===`ตอบกลับแล้ว`?`selected`:``}>ตอบกลับแล้ว</option>
        </select>
      </td>
      <td><span style="color: var(--text-dim); font-size: 0.78rem;">${d(e.createdAt)}</span></td>
      <td style="text-align: center;">
        <button class="btn-action-delete btn-del-contact" data-id="${e.id}" title="ลบข้อความ">🗑️</button>
      </td>
    </tr>
  `).join(``),r.querySelectorAll(`.select-contact-status`).forEach(e=>{e.addEventListener(`change`,async()=>{let t=e.getAttribute(`data-id`);try{await s(`/api/contacts/${t}`,{method:`PUT`,body:JSON.stringify({status:e.value})}),n(`อัปเดตสถานะข้อความเรียบร้อย`),await l()}catch{n(`เกิดข้อผิดพลาดในการอัปเดต`,`error`)}})}),r.querySelectorAll(`.btn-del-contact`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.getAttribute(`data-id`);if(confirm(`ต้องการลบข้อความนี้ใช่หรือไม่?`))try{await s(`/api/contacts/${t}`,{method:`DELETE`}),n(`ลบข้อความเรียบร้อย`),await l()}catch{n(`เกิดข้อผิดพลาดในการลบ`,`error`)}})})}function v(){let t=e.generalInfo||{},n=(e,t)=>{let n=document.getElementById(e);n&&(n.value=t??``)};n(`gen-students`,t.studentsCount),n(`gen-faculty`,t.facultyCount),n(`gen-labs`,t.labCount),n(`gen-rate`,t.employmentRate),n(`gen-phone`,t.phone),n(`gen-email`,t.email),n(`gen-fb`,t.facebook),n(`gen-slogan`,t.slogan)}function y(e,t){let n=document.getElementById(`modal-edit`),r=document.getElementById(`modal-edit-title`),i=document.getElementById(`edit-type`),a=document.getElementById(`edit-id`),o=document.getElementById(`edit-inputs-container`);n&&o&&(i.value=e,a.value=t.id,e===`curriculum`?(r.textContent=`✏️ แก้ไขรายวิชา: ${t.nameEn}`,o.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ไอคอน (Emoji)</label>
          <input type="text" id="edit-curri-icon" class="form-control no-icon" value="${d(t.icon||`💻`)}" required>
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
          <input type="text" id="edit-curri-nameEn" class="form-control no-icon" value="${d(t.nameEn||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ชื่อภาษาไทย</label>
          <input type="text" id="edit-curri-nameTh" class="form-control no-icon" value="${d(t.nameTh||``)}" required>
        </div>
        <div class="form-group span-2">
          <label class="form-label">คำอธิบายรายวิชา</label>
          <textarea id="edit-curri-desc" class="form-textarea" rows="3">${d(t.description||``)}</textarea>
        </div>
      </div>
    `):e===`faculty`?(r.textContent=`✏️ แก้ไขข้อมูลอาจารย์: ${t.name}`,o.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group">
          <label class="form-label">ชื่อ - นามสกุล (พร้อมคำนำหน้า)</label>
          <input type="text" id="edit-fac-name" class="form-control no-icon" value="${d(t.name||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ตำแหน่ง</label>
          <input type="text" id="edit-fac-role" class="form-control no-icon" value="${d(t.role||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ความเชี่ยวชาญ (Specialty)</label>
          <input type="text" id="edit-fac-specialty" class="form-control no-icon" value="${d(t.specialty||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">อีเมล</label>
          <input type="email" id="edit-fac-email" class="form-control no-icon" value="${d(t.email||``)}">
        </div>
        <div class="form-group span-2">
          <label class="form-label">ลิงก์รูปภาพ (URL หรือ /images/...)</label>
          <input type="text" id="edit-fac-image" class="form-control no-icon" value="${d(t.image||`/images/prof_sskr_1.jpg`)}">
        </div>
      </div>
    `):e===`announcement`&&(r.textContent=`✏️ แก้ไขข่าวสาร: ${t.title}`,o.innerHTML=`
      <div class="form-grid-2">
        <div class="form-group span-2">
          <label class="form-label">หัวข้อข่าว / กิจกรรม</label>
          <input type="text" id="edit-news-title" class="form-control no-icon" value="${d(t.title||``)}" required>
        </div>
        <div class="form-group">
          <label class="form-label">ป้ายกำกับ (Tag)</label>
          <input type="text" id="edit-news-tag" class="form-control no-icon" value="${d(t.tag||`ข่าวสาร`)}">
        </div>
        <div class="form-group" style="display: flex; align-items: center; gap: 0.5rem; padding-top: 1.5rem;">
          <input type="checkbox" id="edit-news-pinned" style="width: 20px; height: 20px; accent-color: var(--primary);" ${t.pinned?`checked`:``}>
          <label for="edit-news-pinned" style="margin: 0; font-weight: 600; cursor: pointer;">⭐ ปักหมุดข่าวนี้</label>
        </div>
        <div class="form-group span-2">
          <label class="form-label">เนื้อหาข่าว / รายละเอียด</label>
          <textarea id="edit-news-content" class="form-textarea" rows="4" required>${d(t.content||``)}</textarea>
        </div>
      </div>
    `),n.classList.add(`active`))}function b(){c();let i=document.getElementById(`form-login`),u=document.getElementById(`login-alert`),d=document.getElementById(`btn-toggle-pwd`),f=document.getElementById(`login-password`),v=document.getElementById(`login-username`),y=document.getElementById(`btn-login-submit`);d?.addEventListener(`click`,e=>{e?.preventDefault?.();let t=document.getElementById(`login-password`);if(!t)return;let n=t.type===`password`;t.type=n?`text`:`password`,d.textContent=n?`🙈`:`👁️`});async function b(e){e&&e.preventDefault(),u&&(u.style.display=`none`,u.textContent=``);let t=document.getElementById(`login-username`)?.value.trim(),r=document.getElementById(`login-password`)?.value;if(!t||!r){u&&(u.textContent=`⚠️ กรุณากรอกชื่อผู้ใช้และรหัสผ่านให้ครบถ้วน`,u.style.display=`block`);return}y&&(y.disabled=!0,y.innerHTML=`<span>⏳ กำลังตรวจสอบสิทธิ์...</span>`);try{let e=await(await fetch(`/api/auth/login`,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({username:t,password:r})})).json();e.success&&e.token?(a(e.token,e.user),c(),n(`🎉 ยินดีต้อนรับคุณ ${e.user.name||e.user.username}`)):u&&(u.textContent=`❌ `+(e.message||`ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง`),u.style.display=`block`)}catch{u&&(u.textContent=`❌ ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์หลังบ้านได้ (Port 5005)`,u.style.display=`block`)}finally{y&&(y.disabled=!1,y.innerHTML=`<span>เข้าสู่ระบบ (Sign In)</span><span>→</span>`)}}i?.addEventListener(`submit`,b),y?.addEventListener(`click`,b);let x=e=>{e.key===`Enter`&&(e.preventDefault(),b(e))};v?.addEventListener(`keydown`,x),f?.addEventListener(`keydown`,x),document.getElementById(`btn-logout`)?.addEventListener(`click`,async()=>{let e=r();try{e&&await fetch(`/api/auth/logout`,{method:`POST`,headers:{Authorization:`Bearer ${e}`}})}catch{}o(),c(),n(`ออกจากระบบเรียบร้อย`)});let S=document.querySelectorAll(`.sidebar-item[data-tab]`),C=document.querySelectorAll(`.tab-content-panel`);S.forEach(e=>{e.addEventListener(`click`,()=>{let t=e.getAttribute(`data-tab`);S.forEach(e=>e.classList.remove(`active`)),C.forEach(e=>e.classList.remove(`active`)),e.classList.add(`active`),document.getElementById(`panel-${t}`)?.classList.add(`active`)})});let w=(e,n,r)=>{document.getElementById(e)?.addEventListener(`input`,e=>{t[n]=e.target.value.toLowerCase().trim(),r()})};w(`search-curri`,`curri`,p),w(`search-faculty`,`faculty`,m),w(`search-news`,`news`,h),w(`search-apps`,`apps`,g),w(`search-contacts`,`contacts`,_),document.getElementById(`form-add-curri`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={icon:document.getElementById(`input-curri-icon`).value||`💻`,category:document.getElementById(`input-curri-cat`).value,nameEn:document.getElementById(`input-curri-nameEn`).value.trim(),nameTh:document.getElementById(`input-curri-nameTh`).value.trim(),description:document.getElementById(`input-curri-desc`).value.trim()};try{(await(await s(`/api/curriculum`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`เพิ่มรายวิชาสำเร็จ!`),e.target.reset(),document.getElementById(`input-curri-icon`).value=`💻`,await l())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`form-add-faculty`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={name:document.getElementById(`input-fac-name`).value.trim(),role:document.getElementById(`input-fac-role`).value.trim(),specialty:document.getElementById(`input-fac-specialty`).value.trim(),email:document.getElementById(`input-fac-email`).value.trim(),image:document.getElementById(`input-fac-image`).value.trim()||`/images/prof_sskr_1.jpg`};try{(await(await s(`/api/faculty`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`เพิ่มข้อมูลอาจารย์สำเร็จ!`),e.target.reset(),document.getElementById(`input-fac-image`).value=`/images/prof_sskr_1.jpg`,await l())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`form-add-news`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={title:document.getElementById(`input-news-title`).value.trim(),tag:document.getElementById(`input-news-tag`).value.trim()||`ข่าวสาร`,pinned:document.getElementById(`input-news-pinned`).checked,content:document.getElementById(`input-news-content`).value.trim()};try{(await(await s(`/api/announcements`,{method:`POST`,body:JSON.stringify(t)})).json()).success&&(n(`โพสต์ข่าวสารเรียบร้อย!`),e.target.reset(),await l())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`btn-export-csv`)?.addEventListener(`click`,()=>{if(!e.applications||e.applications.length===0){alert(`ไม่มีข้อมูลสำหรับส่งออก`);return}let t=[`ID`,`ชื่อ-นามสกุล`,`เบอร์โทร`,`อีเมล`,`โรงเรียน`,`สถานะ`,`วันที่สมัคร`],n=e.applications.map(e=>[e.id,`"${e.name}"`,`"${e.phone}"`,`"${e.email}"`,`"${e.school}"`,`"${e.status}"`,`"${e.createdAt}"`]),r=`data:text/csv;charset=utf-8,﻿`+[t.join(`,`),...n.map(e=>e.join(`,`))].join(`
`),i=document.createElement(`a`);i.href=encodeURI(r),i.download=`SSKRU_SE_Applicants_${new Date().toISOString().slice(0,10)}.csv`,document.body.appendChild(i),i.click(),document.body.removeChild(i)}),document.getElementById(`form-general`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t={studentsCount:Number(document.getElementById(`gen-students`).value)||180,facultyCount:Number(document.getElementById(`gen-faculty`).value)||5,labCount:Number(document.getElementById(`gen-labs`).value)||4,employmentRate:document.getElementById(`gen-rate`).value||`98%`,phone:document.getElementById(`gen-phone`).value,email:document.getElementById(`gen-email`).value,facebook:document.getElementById(`gen-fb`).value,slogan:document.getElementById(`gen-slogan`).value};try{(await(await s(`/api/general`,{method:`PUT`,body:JSON.stringify(t)})).json()).success&&(n(`บันทึกข้อมูลส่วนรวมเรียบร้อย!`),await l())}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}}),document.getElementById(`form-pwd`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`pwd-curr`).value,r=document.getElementById(`pwd-new`).value;if(r!==document.getElementById(`pwd-conf`).value){n(`รหัสผ่านใหม่ไม่ตรงกัน`,`error`);return}try{let i=await(await s(`/api/auth/change-password`,{method:`POST`,body:JSON.stringify({currentPassword:t,newPassword:r})})).json();i.success?(n(`เปลี่ยนรหัสผ่านสำเร็จเรียบร้อย`),e.target.reset()):n(i.message||`เกิดข้อผิดพลาด`,`error`)}catch{n(`ไม่สามารถเปลี่ยนรหัสผ่านได้ในขณะนี้`,`error`)}});let T=document.getElementById(`modal-edit`);document.getElementById(`btn-close-edit-modal`)?.addEventListener(`click`,()=>T?.classList.remove(`active`)),document.getElementById(`btn-cancel-edit-modal`)?.addEventListener(`click`,()=>T?.classList.remove(`active`)),T?.addEventListener(`click`,e=>{e.target===T&&T.classList.remove(`active`)}),document.getElementById(`form-edit-item`)?.addEventListener(`submit`,async e=>{e.preventDefault();let t=document.getElementById(`edit-type`)?.value,r=document.getElementById(`edit-id`)?.value,i=``,a={};t===`curriculum`?(i=`/api/curriculum/${r}`,a={icon:document.getElementById(`edit-curri-icon`).value||`💻`,category:document.getElementById(`edit-curri-cat`).value,nameEn:document.getElementById(`edit-curri-nameEn`).value.trim(),nameTh:document.getElementById(`edit-curri-nameTh`).value.trim(),description:document.getElementById(`edit-curri-desc`).value.trim()}):t===`faculty`?(i=`/api/faculty/${r}`,a={name:document.getElementById(`edit-fac-name`).value.trim(),role:document.getElementById(`edit-fac-role`).value.trim(),specialty:document.getElementById(`edit-fac-specialty`).value.trim(),email:document.getElementById(`edit-fac-email`).value.trim(),image:document.getElementById(`edit-fac-image`).value.trim()||`/images/prof_sskr_1.jpg`}):t===`announcement`&&(i=`/api/announcements/${r}`,a={title:document.getElementById(`edit-news-title`).value.trim(),tag:document.getElementById(`edit-news-tag`).value.trim()||`ข่าวสาร`,pinned:!!document.getElementById(`edit-news-pinned`).checked,content:document.getElementById(`edit-news-content`).value.trim()});try{let e=await(await s(i,{method:`PUT`,body:JSON.stringify(a)})).json();e.success?(n(`บันทึกการแก้ไขเรียบร้อย!`),T?.classList.remove(`active`),await l()):n(e.message||`เกิดข้อผิดพลาดในการแก้ไข`,`error`)}catch{n(`เกิดข้อผิดพลาดในการบันทึก`,`error`)}})}document.readyState===`loading`?document.addEventListener(`DOMContentLoaded`,b):b();
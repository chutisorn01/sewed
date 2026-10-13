/**
 * ============================================================================
 * TECHNICAL ARCHITECTURE & SCROLLYTELLING ENGINE OVERVIEW
 * ============================================================================
 * 
 * 1. SCROLL-DRIVEN VIDEO SCRUBBING ENGINE:
 *    - Parent Container: Extended track height (540vh) for multi-stage story pacing.
 *    - Pinned Viewport: position: sticky with 100vw x 100vh window.
 *    - Normalization: Normalized scroll progress = -rect.top / (trackHeight - innerHeight).
 *    - Seek Synchronization: targetTime = progress * video.duration.
 *    - Concurrency Lock: isSeeking & pendingSeek flags prevent decode pipeline stall.
 * 
 * 2. DEVICE-ADAPTIVE VIDEO PIPELINE:
 *    - Desktop: 16:9 widescreen footage (/videos/se2.mp4).
 *    - Mobile (<= 768px): 9:16 portrait mobile footage (/videos/phonese.MP4).
 *    - Hot-swap: On resize/orientationchange, preserves playback timeline position.
 * 
 * 3. LAYER TRANSITIONS (INTERPOLATION):
 *    - Linear interpolation of opacity & translateY across progress intervals.
 *    - Automatic pointer-events toggling (none/all) to eliminate ghost clicks.
 * 
 * 4. MOBILE LAYOUT ISOLATION:
 *    - Top Bar: Clutter-free branding + CTA + hamburger toggle.
 *    - Drawer: Off-canvas navigation containing status indicators and CMS entry points.
 * ============================================================================
 */

import confetti from "canvas-confetti";
import { loadInitialData, initAdminCMS, showToast } from "./cms.js";

function initMain() {
  // Load database content & setup CMS
  loadInitialData();
  initAdminCMS();

  // Direct instant scrolling helper (No floaty smooth momentum)
  function scrollToTarget(target, offset = -70) {
    if (typeof target === "number") {
      window.scrollTo({ top: target, behavior: "auto" });
      return;
    }
    const el = typeof target === "string" ? document.querySelector(target) : target;
    if (el) {
      const targetTop = el.getBoundingClientRect().top + window.scrollY + offset;
      window.scrollTo({ top: targetTop, behavior: "auto" });
    }
  }

  // 2. Video Scrubbing Engine
  const video = document.getElementById("scrolly-video");
  const videoTrack = document.getElementById("video-track");
  const overlay1 = document.getElementById("overlay-1");
  const overlay2 = document.getElementById("overlay-2");
  const overlay3 = document.getElementById("overlay-3");
  const overlay4 = document.getElementById("overlay-4");
  const overlay5 = document.getElementById("overlay-5");
  const hudStageName = document.getElementById("hud-stage-name");
  const hudPct = document.getElementById("hud-pct");
  const timeLabel = document.querySelector(".time-label");

  const DESKTOP_VIDEO = "/videos/se2.mp4";
  const MOBILE_VIDEO = "/videos/phonese.MP4";

  function isMobileViewport() {
    return window.innerWidth <= 768 || window.matchMedia("(max-width: 768px)").matches;
  }

  function getAppropriateVideoSrc() {
    return isMobileViewport() ? MOBILE_VIDEO : DESKTOP_VIDEO;
  }

  let duration = 10.0;
  let targetTime = 0;
  let isSeeking = false;
  let pendingSeek = false;

  // Prime and prepare video
  if (video) {
    video.muted = true;
    video.playsInline = true;

    // Detect device and explicitly set responsive source
    const targetSrc = getAppropriateVideoSrc();
    if (!video.src || !video.src.includes(targetSrc)) {
      video.src = targetSrc;
      video.load();
    }

    const initVideo = () => {
      if (video.duration && !isNaN(video.duration)) {
        duration = video.duration;
      }
      // Prime video decode pipeline
      video.play().then(() => {
        video.pause();
        requestSeek(0.01);
      }).catch(() => {
        requestSeek(0.01);
      });
    };

    video.addEventListener("loadedmetadata", initVideo);
    video.addEventListener("canplay", initVideo, { once: true });

    video.addEventListener("seeked", () => {
      isSeeking = false;
      if (pendingSeek) {
        requestSeek(targetTime);
      }
    });

    // Also prime on first user interaction
    const primeOnInteraction = () => {
      initVideo();
      window.removeEventListener("wheel", primeOnInteraction);
      window.removeEventListener("touchstart", primeOnInteraction);
    };
    window.addEventListener("wheel", primeOnInteraction, { passive: true, once: true });
    window.addEventListener("touchstart", primeOnInteraction, { passive: true, once: true });

    // Seamlessly swap video if window crosses mobile/desktop breakpoint or rotates
    let currentMode = isMobileViewport() ? "mobile" : "desktop";
    window.addEventListener("resize", () => {
      const newMode = isMobileViewport() ? "mobile" : "desktop";
      if (newMode !== currentMode) {
        currentMode = newMode;
        const newSrc = getAppropriateVideoSrc();
        const currentProgress = duration > 0 ? (video.currentTime / duration) : 0;
        video.src = newSrc;
        video.load();
        video.addEventListener("loadedmetadata", () => {
          duration = video.duration || 10.0;
          requestSeek(currentProgress * duration);
        }, { once: true });
      }
    }, { passive: true });
  }

  function requestSeek(time) {
    if (!video) return;
    targetTime = Math.max(0, Math.min(duration, time));

    if (isSeeking) {
      pendingSeek = true;
      return;
    }

    try {
      if (Math.abs(video.currentTime - targetTime) > 0.03) {
        isSeeking = true;
        pendingSeek = false;
        video.currentTime = targetTime;
      }
    } catch (e) {
      console.warn("Seek error:", e);
    }
  }

  // Helper for applying smooth opacity & translateY
  function applyOverlayTransition(el, progress, startIn, fullIn, startOut, fullOut) {
    if (!el) return;

    if (startIn === 0 && progress <= startOut) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0px)";
      el.style.pointerEvents = "all";
      return;
    }

    if (progress < startIn) {
      el.style.opacity = "0";
      el.style.transform = "translateY(50px)";
      el.style.pointerEvents = "none";
    } else if (progress < fullIn) {
      const p = (progress - startIn) / (fullIn - startIn);
      el.style.opacity = String(p);
      el.style.transform = `translateY(${(1 - p) * 50}px)`;
      el.style.pointerEvents = p > 0.5 ? "all" : "none";
    } else if (progress <= startOut) {
      el.style.opacity = "1";
      el.style.transform = "translateY(0px)";
      el.style.pointerEvents = "all";
    } else if (progress < fullOut) {
      const p = (progress - startOut) / (fullOut - startOut);
      el.style.opacity = String(Math.max(0, 1 - p));
      el.style.transform = `translateY(-${p * 50}px)`;
      el.style.pointerEvents = "none";
    } else {
      el.style.opacity = "0";
      el.style.transform = "translateY(-50px)";
      el.style.pointerEvents = "none";
    }
  }

  // Scroll event handler for video scrubbing across 5 scenes
  function handleVideoScroll() {
    if (!videoTrack || !video) return;

    const rect = videoTrack.getBoundingClientRect();
    const trackHeight = videoTrack.offsetHeight - window.innerHeight;

    if (trackHeight <= 0) return;

    // Progress 0.0 to 1.0 within the video track
    const progress = Math.max(0, Math.min(1, -rect.top / trackHeight));
    const seekTime = progress * duration;

    requestSeek(seekTime);

    // Update HUD indicator
    if (hudPct) {
      hudPct.textContent = Math.round(progress * 100) + "%";
    }
    if (timeLabel) {
      timeLabel.textContent = seekTime.toFixed(1) + "s / " + duration.toFixed(1) + "s";
    }
    const mobileTime = document.querySelector(".mobile-time-label");
    if (mobileTime) {
      mobileTime.textContent = seekTime.toFixed(1) + "s / " + duration.toFixed(1) + "s";
    }

    // Dynamic HUD Stage Name
    if (hudStageName) {
      if (progress < 0.20) {
        hudStageName.textContent = "STAGE 01: จุดเริ่มต้น (นักศึกษา + เฟือง)";
      } else if (progress < 0.40) {
        hudStageName.textContent = "STAGE 02: เราสร้างมัน (ชิ้นส่วน Robot)";
      } else if (progress < 0.60) {
        hudStageName.textContent = "STAGE 03: จากโค้ดสู่ระบบ (ห้องโค้ดดิ้ง)";
      } else if (progress < 0.80) {
        hudStageName.textContent = "STAGE 04: มิติดิจิทัล (WARP SPEED)";
      } else {
        hudStageName.textContent = "STAGE 05: สู่อนาคตวิศวกรซอฟต์แวร์ (SOFTWARE CAREERS)";
      }
    }

    // SCENE 1 (0.00 - 0.20) - 100% visible at 0% scroll
    applyOverlayTransition(overlay1, progress, 0.00, 0.00, 0.14, 0.20);

    // SCENE 2 (0.20 - 0.40)
    applyOverlayTransition(overlay2, progress, 0.18, 0.24, 0.34, 0.40);

    // SCENE 3 (0.40 - 0.60)
    applyOverlayTransition(overlay3, progress, 0.38, 0.44, 0.54, 0.60);

    // SCENE 4 (0.60 - 0.80)
    applyOverlayTransition(overlay4, progress, 0.58, 0.64, 0.74, 0.80);

    // SCENE 5 (0.80 - 1.00)
    applyOverlayTransition(overlay5, progress, 0.78, 0.84, 0.99, 1.00);
  }

  // Direct native scroll for instant video scrubbing & scene triggers
  window.addEventListener("scroll", handleVideoScroll, { passive: true });
  
  // Initial call on load
  handleVideoScroll();

  // 3. Progress Bar & Nav Active Links
  const progressBar = document.getElementById("scroll-progress");
  const navbar = document.getElementById("navbar");
  const navLinks = document.querySelectorAll(".nav-link");
  const scenes = document.querySelectorAll("section[id]");

  window.addEventListener("scroll", () => {
    const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
    const progress = totalHeight > 0 ? window.scrollY / totalHeight : 0;

    if (progressBar) progressBar.style.width = (progress * 100) + "%";

    if (window.scrollY > 40) {
      navbar?.classList.add("scrolled");
    } else {
      navbar?.classList.remove("scrolled");
    }

    let currentId = "";
    scenes.forEach((scene) => {
      const r = scene.getBoundingClientRect();
      if (r.top <= window.innerHeight * 0.4 && r.bottom >= window.innerHeight * 0.2) {
        currentId = scene.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      const href = link.getAttribute("href");
      if (href === "#" + currentId) {
        link.classList.add("active");
      } else {
        link.classList.remove("active");
      }
    });
  }, { passive: true });

  // Mobile Nav Toggle & Smooth Navigation Links
  const btnMobileNav = document.getElementById("btn-mobile-nav");
  if (btnMobileNav && navbar) {
    btnMobileNav.addEventListener("click", () => {
      const isOpen = navbar.classList.toggle("mobile-nav-open");
      btnMobileNav.setAttribute("aria-expanded", String(isOpen));
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      const href = link.getAttribute("href");
      if (href && href.startsWith("#")) {
        e.preventDefault();
        const target = document.querySelector(href);
        if (target) {
          scrollToTarget(target, -70);
        }
        navbar?.classList.remove("mobile-nav-open");
        btnMobileNav?.setAttribute("aria-expanded", "false");
      }
    });
  });

  const brandLink = document.getElementById("brand-link");
  if (brandLink) {
    brandLink.addEventListener("click", (e) => {
      e.preventDefault();
      scrollToTarget(0);
      navbar?.classList.remove("mobile-nav-open");
      btnMobileNav?.setAttribute("aria-expanded", "false");
    });
  }

  document.addEventListener("click", (e) => {
    if (navbar && navbar.classList.contains("mobile-nav-open") && !navbar.contains(e.target)) {
      navbar.classList.remove("mobile-nav-open");
      btnMobileNav?.setAttribute("aria-expanded", "false");
    }
  });

  // 4. Scroll buttons & Scroll Drive Guide
  document.querySelectorAll(".btn-scroll-to").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const target = btn.getAttribute("data-target");
      const el = document.querySelector(target);
      if (el) scrollToTarget(el, -60);
    });
  });

  const scrollDriveGuide = document.querySelector(".scroll-drive-guide");
  if (scrollDriveGuide) {
    scrollDriveGuide.addEventListener("click", () => {
      scrollToTarget(window.innerHeight * 1.3);
    });
  }

  // 5. 3D Tilt Effect on Cards (Event delegation for dynamic elements)
  document.addEventListener("mousemove", (e) => {
    const card = e.target.closest("[data-tilt]");
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const rotX = ((y - cy) / cy) * -8;
    const rotY = ((x - cx) / cx) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) translateY(-4px)`;
  });

  document.addEventListener("mouseout", (e) => {
    const card = e.target.closest("[data-tilt]");
    if (!card) return;
    if (!card.contains(e.relatedTarget)) {
      card.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)";
    }
  });

  // 6. Locked Earth Scrollytelling Parallax & Zoom Animation
  const earthTrack = document.querySelector(".earth-locked-track");
  const stickyEarthImg = document.getElementById("sticky-earth-img");
  const radarPinpoint = document.querySelector(".earth-radar-pinpoint");

  if (earthTrack && stickyEarthImg) {
    window.addEventListener("scroll", () => {
      const rect = earthTrack.getBoundingClientRect();
      const trackHeight = earthTrack.offsetHeight - window.innerHeight;
      if (trackHeight > 0) {
        // Progress through the locked earth track: 0 (enter) to 1 (leave)
        const progress = Math.max(0, Math.min(1, -rect.top / trackHeight));
        // Deep zoom and subtle breathing shift
        const scale = 1.02 + progress * 0.16;
        const translateY = progress * -2;
        stickyEarthImg.style.transform = `scale(${scale}) translateY(${translateY}%)`;

        if (radarPinpoint) {
          radarPinpoint.style.opacity = progress > 0.85 ? String(Math.max(0, (1 - progress) * 6)) : "1";
        }
      }
    }, { passive: true });
  }

  // 7. Modals (Apply & Contact)
  const modalApply = document.getElementById("modal-apply");
  const btnOpenApply = [
    document.getElementById("btn-open-apply"),
    document.getElementById("btn-footer-apply")
  ];
  const btnCloseApply = document.getElementById("btn-close-apply");

  btnOpenApply.forEach((btn) => {
    btn?.addEventListener("click", (e) => {
      e.preventDefault();
      modalApply?.classList.add("active");
    });
  });

  btnCloseApply?.addEventListener("click", () => modalApply?.classList.remove("active"));
  modalApply?.addEventListener("click", (e) => {
    if (e.target === modalApply) modalApply.classList.remove("active");
  });

  // Admission Form (Saves directly to Database /api/applications)
  const formApply = document.getElementById("form-apply");
  if (formApply) {
    formApply.addEventListener("submit", async (e) => {
      e.preventDefault();
      const applicant = {
        name: document.getElementById("apply-name")?.value || "",
        phone: document.getElementById("apply-phone")?.value || "",
        email: document.getElementById("apply-email")?.value || "",
        school: document.getElementById("apply-school")?.value || ""
      };

      try {
        const res = await fetch("/api/applications", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(applicant)
        });
        const resData = await res.json();

        confetti({
          particleCount: 150,
          spread: 85,
          origin: { y: 0.6 },
          colors: ["#ffaa00", "#ffdd66", "#b91c1c", "#ffffff"]
        });

        showToast("🎉 ยืนยันใบสมัครของคุณ " + applicant.name + " เรียบร้อยแล้ว!");
        formApply.reset();
        modalApply?.classList.remove("active");
        loadInitialData(); // Refresh CMS data in background
      } catch (err) {
        showToast("บันทึกข้อมูลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง", "error");
      }
    });
  }

  // Contact Modal & Form (Saves directly to Database /api/contacts)
  const modalContact = document.getElementById("modal-contact");
  const btnOpenContact = document.getElementById("btn-footer-contact");
  const btnCloseContact = document.getElementById("btn-close-contact");
  const formContact = document.getElementById("form-contact");

  btnOpenContact?.addEventListener("click", (e) => {
    e.preventDefault();
    modalContact?.classList.add("active");
  });

  btnCloseContact?.addEventListener("click", () => modalContact?.classList.remove("active"));
  modalContact?.addEventListener("click", (e) => {
    if (e.target === modalContact) modalContact.classList.remove("active");
  });

  if (formContact) {
    formContact.addEventListener("submit", async (e) => {
      e.preventDefault();
      const contactData = {
        name: document.getElementById("contact-name")?.value || "",
        email: document.getElementById("contact-email")?.value || "",
        subject: document.getElementById("contact-subject")?.value || "",
        message: document.getElementById("contact-message")?.value || ""
      };

      try {
        const res = await fetch("/api/contacts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(contactData)
        });
        const json = await res.json();
        showToast("📨 ส่งข้อความติดต่อถึงสาขาวิชาเรียบร้อยแล้ว!");
        formContact.reset();
        modalContact?.classList.remove("active");
        loadInitialData();
      } catch (err) {
        showToast("ไม่สามารถส่งข้อความได้ในขณะนี้", "error");
      }
    });
  }

  // Study Plan Modal
  const modalStudyPlan = document.getElementById("modal-study-plan");
  const btnOpenStudyPlan = document.getElementById("btn-open-study-plan");
  const btnCloseStudyPlan = document.getElementById("btn-close-study-plan");

  btnOpenStudyPlan?.addEventListener("click", (e) => {
    e.preventDefault();
    modalStudyPlan?.classList.add("active");
  });
  btnCloseStudyPlan?.addEventListener("click", () => modalStudyPlan?.classList.remove("active"));
  modalStudyPlan?.addEventListener("click", (e) => {
    if (e.target === modalStudyPlan) modalStudyPlan.classList.remove("active");
  });

  document.getElementById("btn-view-curriculum-hero")?.addEventListener("click", () => {
    const curriSec = document.getElementById("scene-6");
    if (curriSec) scrollToTarget(curriSec, -60);
  });

  // 8. Sound
  const soundBtn = document.getElementById("sound-btn");
  let audioCtx = null;
  let isSoundPlaying = false;
  let oscNodes = [];

  const startAmbientSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AudioContext();

      const freqs = [146.83, 220.00, 293.66, 440.00];
      const gainNode = audioCtx.createGain();
      gainNode.gain.setValueAtTime(0.035, audioCtx.currentTime);

      const filter = audioCtx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(500, audioCtx.currentTime);

      gainNode.connect(filter);
      filter.connect(audioCtx.destination);

      oscNodes = freqs.map((f) => {
        const osc = audioCtx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(f, audioCtx.currentTime);
        osc.connect(gainNode);
        osc.start();
        return osc;
      });

      isSoundPlaying = true;
      soundBtn?.classList.add("playing");
      document.getElementById("mobile-sound-btn")?.classList.add("playing");
    } catch (e) {
      console.warn("Audio Context:", e);
    }
  };

  const stopAmbientSound = () => {
    oscNodes.forEach((o) => {
      try {
        o.stop();
        o.disconnect();
      } catch (e) {}
    });
    oscNodes = [];
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    isSoundPlaying = false;
    soundBtn?.classList.remove("playing");
    document.getElementById("mobile-sound-btn")?.classList.remove("playing");
  };

  const toggleSound = () => {
    if (!isSoundPlaying) startAmbientSound();
    else stopAmbientSound();
  };

  soundBtn?.addEventListener("click", toggleSound);
  document.getElementById("mobile-sound-btn")?.addEventListener("click", toggleSound);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initMain);
} else {
  initMain();
}


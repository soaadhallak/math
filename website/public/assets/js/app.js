(function () {
  let contactSubmitted = false;

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function closeLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    menu.hidden = true;
    trigger.classList.remove("is-open");
    trigger.setAttribute("aria-expanded", "false");
  }

  function toggleLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    const open = menu.hidden;

    menu.hidden = !open;
    trigger.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeMobileMenu() {
    if (window.AsasMobileNav) {
      window.AsasMobileNav.close();
    }
  }

  function showContactFormView() {
    const formView = $("#contact-form-view");
    const successView = $("#contact-success-view");

    if (formView) formView.hidden = false;
    if (successView) successView.hidden = true;
  }

  function showContactSuccessView() {
    const formView = $("#contact-form-view");
    const successView = $("#contact-success-view");

    if (formView) formView.hidden = true;
    if (successView) successView.hidden = false;
  }

  function openContact() {
    if (contactSubmitted) {
      showContactSuccessView();
    } else {
      showContactFormView();
    }

    const modal = $("#contact-modal");
    if (modal) modal.hidden = false;
  }

  function closeContact() {
    const modal = $("#contact-modal");
    if (modal) modal.hidden = true;
  }

  function handleAction(action) {
    if (action === "top") {
      const scroller = document.scrollingElement || document.documentElement;

      scroller.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      return;
    }

    if (action === "contact") {
      openContact();
    }
  }

  function isEmulatedMobileUa() {
    return /iPhone|iPod|iPad|Android|Mobile|Nexus|Pixel|Samsung|webOS|BlackBerry/i.test(
      navigator.userAgent,
    );
  }

  function isIphoneSE() {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const portrait = Math.abs(w - 375) <= 1 && Math.abs(h - 667) <= 1;

    const landscape = Math.abs(w - 667) <= 1 && Math.abs(h - 375) <= 1;

    if (portrait || landscape) return true;

    return (
      window.matchMedia("(width: 375px) and (height: 667px)").matches ||
      window.matchMedia("(width: 667px) and (height: 375px)").matches
    );
  }

  function isLockedDevicePreset() {
    if (isIphoneSE()) return true;

    const w = window.innerWidth;
    const h = window.innerHeight;

    const exact = [
      [412, 968],
      [968, 412],
      [744, 860],
      [860, 744], // Galaxy Z Fold 6
      [1280, 800], // Nest Hub Max
    ];

    return exact.some(([a, b]) => w === a && h === b);
  }

  function isFinePointerDesktopVideo() {
    // Device-preset UA → mobile/tablet video.
    // Resized laptop keeps desktop UA.
    if (isEmulatedMobileUa()) return false;
    if (isIphoneSE()) return false;
    if (window.matchMedia("(any-pointer: coarse)").matches) return false;
    if (isLockedDevicePreset()) return false;

    return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  }

  function resolveHeroVideoSrc() {
    // Resized laptop window (mouse only): laptop video.
    // DevTools touch presets keep width-based split.
    // Phones only (≤699): mobile plate.
    // All iPads (≥700): laptop plate.
    if (isFinePointerDesktopVideo()) {
      return "/assets/videos/hero-background.mp4";
    }

    return window.matchMedia("(max-width: 699px)").matches
      ? "/assets/videos/hero-mobile-background.mp4"
      : "/assets/videos/hero-background.mp4";
  }

  function heroVideoPath(el) {
    if (!el) return "";

    const raw = el.getAttribute("src") || el.currentSrc || el.src || "";

    try {
      return new URL(raw, window.location.href).pathname;
    } catch (_) {
      return raw;
    }
  }

  function playVideo() {
    const primary = $("#hero-background-video");

    if (!primary) return;

    // Avoid stacking duplicate loop clones on HMR / re-entry.
    primary.parentElement
      ?.querySelectorAll("video:not(#hero-background-video)")
      .forEach((el) => el.remove());

    const applySrc = (el, src) => {
      if (!el) return;

      if (heroVideoPath(el) === src && el.getAttribute("src") === src) {
        return;
      }

      el.setAttribute("src", src);
      el.load();
    };

    let desiredSrc = resolveHeroVideoSrc();

    primary.querySelectorAll("source").forEach((el) => el.remove());

    applySrc(primary, desiredSrc);

    primary.defaultMuted = true;
    primary.muted = true;
    primary.loop = false;
    primary.removeAttribute("loop");
    primary.classList.add("is-active");

    const secondary = primary.cloneNode(false);

    secondary.removeAttribute("id");
    secondary.removeAttribute("autoplay");
    secondary.removeAttribute("loop");

    secondary.loop = false;
    secondary.classList.remove("is-active");

    secondary.defaultMuted = true;
    secondary.muted = true;
    secondary.playsInline = true;

    secondary.setAttribute("playsinline", "");
    secondary.setAttribute("muted", "");
    secondary.setAttribute("aria-hidden", "true");

    secondary.preload = "auto";

    applySrc(secondary, desiredSrc);

    primary.after(secondary);

    let active = primary;
    let idle = secondary;
    let swapping = false;
    let armed = false;

    const ARM_LEAD_S = 0.55;
    const CUT_LEAD_S = 0.08;

    const tryPlay = (el) => {
      const p = el.play();

      if (p !== undefined) {
        p.catch((err) => console.warn("Autoplay notice:", err));
      }

      return p;
    };

    const seekToStart = (el) =>
      new Promise((resolve) => {
        if (el.readyState >= 2 && el.currentTime <= 0.001) {
          resolve();
          return;
        }

        let done = false;

        const finish = () => {
          if (done) return;

          done = true;
          el.removeEventListener("seeked", finish);
          resolve();
        };

        el.addEventListener("seeked", finish);

        try {
          el.currentTime = 0;
        } catch (_) {
          finish();
          return;
        }

        window.setTimeout(finish, 250);
      });

    const armIdle = async () => {
      if (armed || swapping) return;

      armed = true;

      try {
        idle.pause();
      } catch (_) {
        /* ignore */
      }

      await seekToStart(idle);
    };

    const cutOver = async () => {
      if (swapping) return;

      swapping = true;

      if (!armed) {
        await seekToStart(idle);
      }

      idle.classList.add("is-active");
      active.classList.remove("is-active");

      tryPlay(idle);

      const prev = active;

      active = idle;
      idle = prev;

      try {
        prev.pause();
      } catch (_) {
        /* ignore */
      }

      armed = false;
      swapping = false;

      seekToStart(idle);
      watchActive();
    };

    const checkLoop = () => {
      const el = active;

      if (!el || swapping || el.paused) return;

      const duration = el.duration;

      if (!duration || !Number.isFinite(duration)) {
        return;
      }

      const left = duration - el.currentTime;

      if (left <= ARM_LEAD_S) {
        armIdle();
      }

      if (left <= CUT_LEAD_S) {
        cutOver();
      }
    };

    const watchActive = () => {
      const el = active;

      if (!el) return;

      if ("requestVideoFrameCallback" in HTMLVideoElement.prototype) {
        const onFrame = () => {
          checkLoop();

          if (active === el && !el.paused) {
            el.requestVideoFrameCallback(onFrame);
          }
        };

        el.requestVideoFrameCallback(onFrame);
        return;
      }

      const tick = () => {
        checkLoop();

        if (active === el && !el.paused) {
          requestAnimationFrame(tick);
        }
      };

      requestAnimationFrame(tick);
    };

    const syncBreakpointSrc = async () => {
      const next = resolveHeroVideoSrc();

      if (next === desiredSrc) return;

      desiredSrc = next;
      swapping = true;

      try {
        primary.pause();
        secondary.pause();
      } catch (_) {
        /* ignore */
      }

      applySrc(primary, desiredSrc);
      applySrc(secondary, desiredSrc);

      active = primary;
      idle = secondary;

      primary.classList.add("is-active");
      secondary.classList.remove("is-active");

      armed = false;
      swapping = false;

      await seekToStart(secondary);

      armed = true;

      await seekToStart(primary);

      tryPlay(primary);
      watchActive();
    };

    [primary, secondary].forEach((el) => {
      el.addEventListener("ended", (event) => {
        event.preventDefault?.();

        if (el === active) {
          armIdle().then(cutOver);
        }
      });

      el.addEventListener("playing", () => {
        if (el === active) {
          watchActive();
        }
      });
    });

    // Keep the standby copy parked on frame 0,
    // fully opaque under active.
    secondary.pause();

    seekToStart(secondary).then(() => {
      armed = true;
    });

    tryPlay(primary);
    watchActive();

    const mq = window.matchMedia("(max-width: 699px)");

    const fineMq = window.matchMedia("(hover: hover) and (pointer: fine)");

    const coarseAnyMq = window.matchMedia("(any-pointer: coarse)");

    const onBreakpoint = () => {
      syncBreakpointSrc();
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onBreakpoint);

      fineMq.addEventListener("change", onBreakpoint);

      coarseAnyMq.addEventListener("change", onBreakpoint);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onBreakpoint);
      fineMq.addListener(onBreakpoint);
      coarseAnyMq.addListener(onBreakpoint);
    }
  }

  document.addEventListener("click", (event) => {
    const socialEl = event.target.closest(".footer-social-link");

    if (
      socialEl &&
      (socialEl.getAttribute("href") === "#" || !socialEl.getAttribute("href"))
    ) {
      event.preventDefault();
    }

    const actionEl = event.target.closest("[data-action]");

    if (actionEl) {
      handleAction(actionEl.dataset.action);

      if (actionEl.closest("#mobile-menu")) {
        closeMobileMenu();
      }
    }

    const closeEl = event.target.closest("[data-close]");

    if (closeEl) {
      if (closeEl.dataset.close === "contact") {
        closeContact();
      }
    }

    // Language switching is now handled by normal
    // server-side navigation (?lang=en/ar/tr).
    // JS only closes the dropdown.
    const langOpt = event.target.closest(".lang-option, .mobile-lang-btn");

    if (langOpt) {
      closeLangMenu();
    }
  });

  const languageTrigger = $("#language-selector-trigger");

  if (languageTrigger) {
    languageTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLangMenu();
    });
  }

  document.addEventListener("mousedown", (event) => {
    const dropdown = $("#lang-dropdown");

    if (dropdown && !dropdown.contains(event.target)) {
      closeLangMenu();
    }
  });

  const contactForm = $("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      contactSubmitted = true;
      showContactSuccessView();
    });
  }

  const contactDoneBtn = $("#contact-done-btn");

  if (contactDoneBtn) {
    contactDoneBtn.addEventListener("click", () => {
      contactSubmitted = false;
      showContactFormView();
      closeContact();
    });
  }

  playVideo();
})();

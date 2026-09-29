/**
 * Shared mobile nav — smooth open/close transitions.
 * Enter: ease-out · Exit: ease-in · Icon morph synced · reduced-motion safe
 */
(function () {
  "use strict";

  var toggle = document.getElementById("mobile-menu-toggle-btn");
  var menu = document.getElementById("mobile-menu");
  var backdrop = document.getElementById("mobile-menu-backdrop");
  if (!toggle || !menu) return;

  var ANIM_MS = 360;
  var closeTimer = 0;
  var closing = false;
  var onTransitionEnd = null;

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function isOpen() {
    return document.body.classList.contains("menu-open");
  }

  function firstFocusable() {
    return menu.querySelector(
      'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
    );
  }

  function clearCloseTimer() {
    if (closeTimer) {
      window.clearTimeout(closeTimer);
      closeTimer = 0;
    }
    if (onTransitionEnd) {
      menu.removeEventListener("transitionend", onTransitionEnd);
      onTransitionEnd = null;
    }
  }

  function finishHide() {
    if (!closing) return;
    menu.hidden = true;
    if (backdrop) backdrop.hidden = true;
    closing = false;
    closeTimer = 0;
    if (onTransitionEnd) {
      menu.removeEventListener("transitionend", onTransitionEnd);
      onTransitionEnd = null;
    }
  }

  function setMobileMenu(open, immediate) {
    clearCloseTimer();

    if (open) {
      closing = false;
      menu.hidden = false;
      if (backdrop) backdrop.hidden = false;

      // Next frame so CSS can transition from the closed styles.
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () {
          if (closing) return;
          menu.classList.add("is-open");
          if (backdrop) backdrop.classList.add("is-open");
        });
      });

      toggle.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      menu.setAttribute("aria-hidden", "false");
      if (backdrop) backdrop.setAttribute("aria-hidden", "false");
      document.body.classList.add("menu-open");

      var focusEl = firstFocusable();
      if (focusEl) {
        window.requestAnimationFrame(function () {
          focusEl.focus({ preventScroll: true });
        });
      }
      return;
    }

    // Closing — animate out, then hide after transition.
    closing = true;
    menu.classList.remove("is-open");
    if (backdrop) backdrop.classList.remove("is-open");
    toggle.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    menu.setAttribute("aria-hidden", "true");
    if (backdrop) backdrop.setAttribute("aria-hidden", "true");
    document.body.classList.remove("menu-open");

    if (document.activeElement && menu.contains(document.activeElement)) {
      toggle.focus({ preventScroll: true });
    }

    if (immediate || reducedMotion()) {
      finishHide();
      return;
    }

    onTransitionEnd = function (event) {
      if (event.target !== menu) return;
      if (event.propertyName !== "opacity") return;
      finishHide();
    };
    menu.addEventListener("transitionend", onTransitionEnd);
    closeTimer = window.setTimeout(finishHide, ANIM_MS + 40);
  }

  function closeMobileMenu() {
    if (isOpen() || (!menu.hidden && menu.classList.contains("is-open"))) {
      setMobileMenu(false);
      return;
    }
    // Mid-open or still visible without body class
    if (!menu.hidden) setMobileMenu(false);
  }

  function toggleMobileMenu() {
    if (closing) {
      // Interrupted close — reopen smoothly
      setMobileMenu(true);
      return;
    }
    setMobileMenu(!isOpen());
  }

  window.AsasMobileNav = {
    open: function () {
      setMobileMenu(true);
    },
    close: closeMobileMenu,
    toggle: toggleMobileMenu,
    isOpen: isOpen,
  };

  toggle.addEventListener("click", function (event) {
    event.stopPropagation();
    toggleMobileMenu();
  });

  if (backdrop) {
    backdrop.addEventListener("click", closeMobileMenu);
  }

  document.addEventListener("click", function (event) {
    if (!isOpen()) return;
    var target = event.target;
    if (toggle.contains(target) || menu.contains(target)) return;
    if (backdrop && target === backdrop) return;
    closeMobileMenu();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (!isOpen() && menu.hidden) return;
    closeMobileMenu();
    toggle.focus({ preventScroll: true });
  });

  menu.addEventListener("click", function (event) {
    var link = event.target.closest("a");
    if (link) closeMobileMenu();
  });

  document.addEventListener("asas:mobile-menu-close", closeMobileMenu);

  setMobileMenu(false, true);
})();

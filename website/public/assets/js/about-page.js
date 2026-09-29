(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  /*
   * Mobile navigation
   */
  function closeMobileMenu() {
    if (window.AsasMobileNav) {
      window.AsasMobileNav.close();
    }
  }

  /*
   * Language dropdown
   *
   * Language switching itself is handled by EJS/i18next
   * through normal links such as:
   *
   * ?lang=en
   * ?lang=ar
   * ?lang=tr
   *
   * JavaScript only controls opening/closing the dropdown.
   */
  function toggleLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) {
      return;
    }

    const open = menu.hidden;

    menu.hidden = !open;

    trigger.setAttribute("aria-expanded", open ? "true" : "false");
  }

  function closeLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) {
      return;
    }

    menu.hidden = true;

    trigger.setAttribute("aria-expanded", "false");
  }

  /*
   * Contact modal
   */
  function openContact() {
    const modal = $("#contact-modal");

    if (!modal) {
      return;
    }

    modal.hidden = false;
    document.body.classList.add("modal-open");
  }

  function closeContact() {
    const modal = $("#contact-modal");

    if (!modal) {
      return;
    }

    modal.hidden = true;
    document.body.classList.remove("modal-open");
  }

  function showContactSuccessView() {
    const formView = $("#contact-form-view");
    const successView = $("#contact-success-view");

    if (formView) {
      formView.hidden = true;
    }

    if (successView) {
      successView.hidden = false;
    }
  }

  function showContactFormView() {
    const formView = $("#contact-form-view");
    const successView = $("#contact-success-view");

    if (formView) {
      formView.hidden = false;
    }

    if (successView) {
      successView.hidden = true;
    }
  }

  /*
   * General actions
   */
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
      return;
    }

    if (action === "services") {
      window.location.href = "/services";
      return;
    }

    if (action === "projects") {
      window.location.href = "/projects";
    }
  }

  /*
   * Global click handling
   */
  document.addEventListener("click", (event) => {
    /*
     * Footer social links
     */
    const socialEl = event.target.closest(".footer-social-link");

    if (
      socialEl &&
      (socialEl.getAttribute("href") === "#" || !socialEl.getAttribute("href"))
    ) {
      event.preventDefault();
    }

    /*
     * General actions
     */
    const actionEl = event.target.closest("[data-action]");

    if (actionEl) {
      const action = actionEl.dataset.action;

      /*
       * Projects can use a normal href.
       * Let the browser handle navigation.
       */
      if (action === "projects") {
        // Let the href navigate.
      } else {
        event.preventDefault();
        handleAction(action);
      }

      /*
       * Close mobile navigation after an action.
       */
      if (actionEl.closest("#mobile-menu")) {
        closeMobileMenu();
      }
    }

    /*
     * Contact modal close buttons
     */
    const closeEl = event.target.closest("[data-close]");

    if (closeEl && closeEl.dataset.close === "contact") {
      closeContact();
    }

    /*
     * Language options
     *
     * Do NOT preventDefault().
     * The EJS <a href="?lang=..."> link must navigate
     * so the server can render the selected language.
     */
    const langOpt = event.target.closest(".lang-option, .mobile-lang-btn");

    if (langOpt) {
      closeLangMenu();
    }
  });

  /*
   * Language dropdown trigger
   */
  const langTrigger = $("#language-selector-trigger");

  if (langTrigger) {
    langTrigger.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleLangMenu();
    });
  }

  /*
   * Close language dropdown when clicking outside
   */
  document.addEventListener("mousedown", (event) => {
    const dropdown = $("#lang-dropdown");

    if (dropdown && !dropdown.contains(event.target)) {
      closeLangMenu();
    }
  });

  /*
   * Contact form
   */
  const contactForm = $("#contact-form");

  if (contactForm) {
    contactForm.addEventListener("submit", (event) => {
      event.preventDefault();

      showContactSuccessView();
    });
  }

  /*
   * Contact modal done button
   */
  const doneBtn = $("#contact-done-btn");

  if (doneBtn) {
    doneBtn.addEventListener("click", () => {
      showContactFormView();
      closeContact();
    });
  }

  /*
   * Touch interaction for value cards
   *
   * Touch devices do not have :hover.
   * Reuse the existing tilt animation on tap.
   */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  $$(".about-value-card").forEach((card) => {
    card.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" || reduceMotion.matches) {
        return;
      }

      if (card.classList.contains("is-tilting")) {
        return;
      }

      card.classList.add("is-tilting");
    });

    card.addEventListener("animationend", (event) => {
      if (event.animationName === "about-value-tilt") {
        card.classList.remove("is-tilting");
      }
    });
  });
})();

(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const state = {
    filter: "all",
    page: 1,
    pageSize: 5,
  };

  function allCards() {
    return Array.from(
      document.querySelectorAll("#projects-grid .projects-card"),
    );
  }

  function filteredCards() {
    const cards = allCards();

    if (state.filter === "all") {
      return cards;
    }

    return cards.filter((card) => card.dataset.type === state.filter);
  }

  function updatePager() {
    const list = filteredCards();

    const totalPages = Math.max(
      1,
      Math.ceil(list.length / state.pageSize) || 1,
    );

    if (state.page > totalPages) {
      state.page = totalPages;
    }

    const start = (state.page - 1) * state.pageSize;
    const end = start + state.pageSize;

    const empty = $("#projects-empty");

    allCards().forEach((card) => {
      card.hidden = true;
    });

    list.forEach((card, index) => {
      card.hidden = !(index >= start && index < end);
    });

    if (empty) {
      empty.hidden = list.length > 0;
    }

    const status = $("#projects-page-status");

    if (status) {
      /*
       * The initial text is rendered by EJS.
       * The JavaScript only updates the numbers.
       */
      const template = status.dataset.template;

      if (template) {
        status.textContent = template
          .replace("{current}", String(state.page))
          .replace("{total}", String(totalPages));
      } else {
        status.textContent = `Page ${state.page} of ${totalPages}`;
      }
    }

    const prev = $("#projects-prev");
    const next = $("#projects-next");

    if (prev) {
      prev.disabled = state.page <= 1 || list.length === 0;
    }

    if (next) {
      next.disabled = state.page >= totalPages || list.length === 0;
    }
  }

  function setFilter(filter) {
    state.filter = filter;
    state.page = 1;

    document.querySelectorAll(".projects-filter").forEach((btn) => {
      const active = btn.dataset.filter === filter;

      btn.classList.toggle("is-active", active);

      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    updatePager();
  }

  function setPageSize(size) {
    state.pageSize = size;
    state.page = 1;

    document.querySelectorAll(".projects-page-size-btn").forEach((btn) => {
      const active = Number(btn.dataset.size) === size;

      btn.classList.toggle("is-active", active);

      btn.setAttribute("aria-pressed", active ? "true" : "false");
    });

    updatePager();
  }

  function closeMobileMenu() {
    if (window.AsasMobileNav) {
      window.AsasMobileNav.close();
    }
  }

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

  function handleAction(action) {
    if (action === "top") {
      const scroller = document.scrollingElement || document.documentElement;

      scroller.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

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
     * Project filters
     */
    const filterBtn = event.target.closest(".projects-filter");

    if (filterBtn && filterBtn.dataset.filter) {
      setFilter(filterBtn.dataset.filter);
      return;
    }

    /*
     * Projects page size
     */
    const sizeBtn = event.target.closest(".projects-page-size-btn");

    if (sizeBtn && sizeBtn.dataset.size) {
      setPageSize(Number(sizeBtn.dataset.size));

      return;
    }

    /*
     * Previous page
     */
    if (event.target.closest("#projects-prev")) {
      if (state.page > 1) {
        state.page -= 1;
        updatePager();
      }

      return;
    }

    /*
     * Next page
     */
    if (event.target.closest("#projects-next")) {
      const totalPages = Math.max(
        1,
        Math.ceil(filteredCards().length / state.pageSize) || 1,
      );

      if (state.page < totalPages) {
        state.page += 1;
        updatePager();
      }

      return;
    }

    /*
     * General actions
     */
    const actionEl = event.target.closest("[data-action]");

    if (actionEl) {
      const action = actionEl.dataset.action;

      if (action === "top") {
        event.preventDefault();
        handleAction(action);
      }

      if (actionEl.closest("#mobile-menu")) {
        closeMobileMenu();
      }
    }

    /*
     * Language options
     *
     * Language switching is now handled by
     * normal EJS links such as:
     *
     * ?lang=en
     * ?lang=ar
     * ?lang=tr
     *
     * Therefore we only close the dropdown here.
     * We DO NOT call preventDefault().
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
   * Initial state
   */
  setFilter("all");
  setPageSize(5);
})();

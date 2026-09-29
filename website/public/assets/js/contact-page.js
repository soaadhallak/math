(function () {
  const CONTACT_EMAIL = "info@asassoft.com";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function closeMobileMenu() {
    if (window.AsasMobileNav) {
      window.AsasMobileNav.close();
    }
  }

  function closeLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    menu.hidden = true;
    trigger.setAttribute("aria-expanded", "false");
  }

  function toggleLangMenu() {
    const menu = $("#language-dropdown-menu");
    const trigger = $("#language-selector-trigger");

    if (!menu || !trigger) return;

    const open = menu.hidden;

    menu.hidden = !open;
    trigger.setAttribute("aria-expanded", open ? "true" : "false");
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

    if (action === "projects") {
      window.location.href = "/projects";
    }
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /*
   * Dynamic translations are rendered server-side in EJS
   * and exposed through data-* attributes on the form.
   */
  function getFormTranslation(form, key) {
    const attributeMap = {
      required: "errRequired",
      email: "errEmail",
      formSummary: "errSummary",
      spam: "errSpam",
      submitOpening: "msgOpening",
      fullName: "lblFullName",
      emailLabel: "lblEmail",
      subject: "lblSubject",
      message: "lblMessage",
    };

    const attribute = attributeMap[key];

    if (!attribute) return "";

    return form.dataset[attribute] || "";
  }

  function clearFieldErrors(form) {
    $$(".field", form).forEach((field) => {
      field.classList.remove("is-invalid");

      const err = $(".contact-field-error", field);

      if (err) {
        err.remove();
      }

      const control = $("input, textarea", field);

      if (control) {
        control.removeAttribute("aria-invalid");
        control.removeAttribute("aria-describedby");
      }
    });
  }

  function showFieldError(field, message) {
    if (!field) return;

    field.classList.add("is-invalid");

    const control = $("input, textarea", field);

    let err = $(".contact-field-error", field);

    if (!err) {
      err = document.createElement("p");
      err.className = "contact-field-error";
      err.setAttribute("role", "alert");

      err.id = `contact-error-${control?.id || Date.now()}`;

      field.appendChild(err);
    }

    err.textContent = message;

    if (control) {
      control.setAttribute("aria-invalid", "true");

      const describedBy = [err.id];

      if (control.id === "contact-page-message") {
        describedBy.unshift("contact-message-count");
      }

      control.setAttribute("aria-describedby", describedBy.join(" "));
    }
  }

  function setFormStatus(message, isError = false) {
    const status = $("#contact-form-status");

    if (!status) return;

    status.textContent = message || "";

    status.classList.toggle("is-error", Boolean(isError && message));

    status.classList.toggle("is-ok", Boolean(!isError && message));

    status.setAttribute("role", isError && message ? "alert" : "status");
  }

  function updateMessageCount() {
    const message = $("#contact-page-message");
    const counter = $("#contact-message-count");

    if (!message || !counter) return;

    const max = Number(message.getAttribute("maxlength")) || 1000;

    const length = message.value.length;

    counter.textContent = `${length} / ${max}`;

    counter.classList.toggle("is-near-limit", length >= max * 0.9);
  }

  function validateSingleField(input, form) {
    const field = input.closest(".field");

    if (!field) return true;

    const value = input.value.trim();

    const err = $(".contact-field-error", field);

    if (err) {
      err.remove();
    }

    field.classList.remove("is-invalid");

    if (input) {
      input.removeAttribute("aria-invalid");

      if (input.id === "contact-page-message") {
        input.setAttribute("aria-describedby", "contact-message-count");
      } else {
        input.removeAttribute("aria-describedby");
      }
    }

    if (
      input.id === "contact-page-full-name" ||
      input.id === "contact-page-subject" ||
      input.id === "contact-page-message"
    ) {
      if (!value) {
        showFieldError(field, getFormTranslation(form, "required"));

        return false;
      }

      return true;
    }

    if (input.id === "contact-page-email") {
      if (!value) {
        showFieldError(field, getFormTranslation(form, "required"));

        return false;
      }

      if (!isValidEmail(value)) {
        showFieldError(field, getFormTranslation(form, "email"));

        return false;
      }

      return true;
    }

    return true;
  }

  function validateContactForm(form) {
    clearFieldErrors(form);

    let valid = true;

    const fullName = $("#contact-page-full-name", form);
    const email = $("#contact-page-email", form);
    const subject = $("#contact-page-subject", form);
    const message = $("#contact-page-message", form);

    if (!fullName.value.trim()) {
      showFieldError(
        fullName.closest(".field"),
        getFormTranslation(form, "required"),
      );

      valid = false;
    }

    if (!email.value.trim()) {
      showFieldError(
        email.closest(".field"),
        getFormTranslation(form, "required"),
      );

      valid = false;
    } else if (!isValidEmail(email.value.trim())) {
      showFieldError(
        email.closest(".field"),
        getFormTranslation(form, "email"),
      );

      valid = false;
    }

    if (!subject.value.trim()) {
      showFieldError(
        subject.closest(".field"),
        getFormTranslation(form, "required"),
      );

      valid = false;
    }

    if (!message.value.trim()) {
      showFieldError(
        message.closest(".field"),
        getFormTranslation(form, "required"),
      );

      valid = false;
    }

    if (!valid) {
      const firstInvalid = $(
        ".field.is-invalid input, .field.is-invalid textarea",
        form,
      );

      if (firstInvalid) {
        firstInvalid.focus();
      }

      setFormStatus(getFormTranslation(form, "formSummary"), true);
    } else {
      setFormStatus("");
    }

    return valid;
  }

  function buildMailtoUrl(form) {
    const fullName = $("#contact-page-full-name", form).value.trim();

    const email = $("#contact-page-email", form).value.trim();

    const subject = $("#contact-page-subject", form).value.trim();

    const message = $("#contact-page-message", form).value.trim();

    /*
     * Labels are translated server-side
     * and exposed through data-* attributes.
     */
    const bodyLines = [
      `${getFormTranslation(form, "fullName")}: ${fullName}`,
      `${getFormTranslation(form, "emailLabel")}: ${email}`,
      `${getFormTranslation(form, "subject")}: ${subject}`,
      "",
      `${getFormTranslation(form, "message")}:`,
      message,
    ];

    const params = new URLSearchParams();

    params.set("subject", subject);
    params.set("body", bodyLines.join("\n"));

    return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
  }

  function initContactForm() {
    const form = $("#contact-page-form");

    if (!form) return;

    const submitBtn = $(".contact-submit-btn", form);

    const submitLabel = submitBtn ? $("span:first-child", submitBtn) : null;

    /*
     * The default button text is already translated by EJS.
     * Keep it so we can restore it after submission.
     */
    const defaultSubmitLabel = submitLabel ? submitLabel.textContent : "";

    form.addEventListener("submit", (event) => {
      event.preventDefault();

      setFormStatus("");

      const honeypot = $("#contact-page-company", form);

      if (honeypot && honeypot.value.trim()) {
        setFormStatus(getFormTranslation(form, "spam"), true);

        return;
      }

      if (!validateContactForm(form)) {
        return;
      }

      if (submitBtn && submitLabel) {
        submitBtn.disabled = true;

        submitLabel.textContent = getFormTranslation(form, "submitOpening");
      }

      setFormStatus(getFormTranslation(form, "submitOpening"));

      window.location.href = buildMailtoUrl(form);

      window.setTimeout(() => {
        if (submitBtn && submitLabel) {
          submitBtn.disabled = false;

          submitLabel.textContent = defaultSubmitLabel;
        }

        setFormStatus("");
      }, 2400);
    });

    const messageField = $("#contact-page-message", form);

    if (messageField) {
      updateMessageCount();

      messageField.addEventListener("input", updateMessageCount);
    }

    $$("input:not(#contact-page-company), textarea", form).forEach((input) => {
      input.addEventListener("blur", () => {
        if (
          input.value.trim() ||
          input.closest(".field")?.classList.contains("is-invalid")
        ) {
          validateSingleField(input, form);
        }
      });

      input.addEventListener("input", () => {
        const field = input.closest(".field");

        if (field && field.classList.contains("is-invalid")) {
          validateSingleField(input, form);
        }
      });
    });
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
      const action = actionEl.dataset.action;

      if (action !== "projects") {
        event.preventDefault();
      }

      handleAction(action);

      if (actionEl.closest("#mobile-menu")) {
        closeMobileMenu();
      }
    }

    /*
     * Language content is rendered server-side.
     * Language navigation itself will be finalized
     * with the header implementation.
     */
    const langOpt = event.target.closest(".lang-option, .mobile-lang-btn");

    if (langOpt) {
      closeLangMenu();
    }
  });

  const langTrigger = $("#language-selector-trigger");

  if (langTrigger) {
    langTrigger.addEventListener("click", (event) => {
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

  function initContactFaq() {
    const list = $("#contact-faq-list");

    if (!list) return;

    function setFaqOpen(item, open) {
      const trigger = $(".contact-faq-trigger", item);

      const panel = $(".contact-faq-panel", item);

      if (!trigger || !panel) return;

      item.classList.toggle("is-open", open);

      trigger.setAttribute("aria-expanded", open ? "true" : "false");

      panel.hidden = !open;
    }

    list.addEventListener("click", (event) => {
      const trigger = event.target.closest(".contact-faq-trigger");

      if (!trigger || !list.contains(trigger)) {
        return;
      }

      const item = trigger.closest(".contact-faq-item");

      if (!item) return;

      const willOpen = !item.classList.contains("is-open");

      $$(".contact-faq-item", list).forEach((faqItem) => {
        setFaqOpen(faqItem, faqItem === item ? willOpen : false);
      });
    });
  }

  initContactForm();
  initContactFaq();
})();

(function () {
  const stage = document.getElementById("why-stage");
  const accordion = document.getElementById("why-accordion");
  if (!stage || !accordion) return;

  const panels = Array.from(accordion.querySelectorAll("[data-why-panel]"));
  if (!panels.length) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const COUNT_MS = 2100;
  const chartTimers = new WeakMap();
  const countControllers = new WeakMap();
  let activeIndex = 0;
  let isInView = false;

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function formatStat(el, value) {
    const decimals = Number(el.dataset.whyDecimals || 0);
    const prefix = el.dataset.whyPrefix || "";
    const suffix = el.dataset.whySuffix || "";
    return `${prefix}${value.toFixed(decimals)}${suffix}`;
  }

  function setStatInstant(el, value) {
    el.textContent = formatStat(el, value);
  }

  function cancelCount(el) {
    const prev = countControllers.get(el);
    if (prev) cancelAnimationFrame(prev);
    countControllers.delete(el);
  }

  function animateCount(el) {
    const target = Number(el.dataset.whyValue || 0);
    cancelCount(el);

    if (reducedMotion) {
      setStatInstant(el, target);
      return;
    }

    setStatInstant(el, 0);
    const start = performance.now();

    function frame(now) {
      const t = Math.min(1, (now - start) / COUNT_MS);
      const value = target * easeOutCubic(t);
      setStatInstant(el, value);
      if (t < 1) {
        const id = requestAnimationFrame(frame);
        countControllers.set(el, id);
      } else {
        setStatInstant(el, target);
        countControllers.delete(el);
      }
    }

    const id = requestAnimationFrame(frame);
    countControllers.set(el, id);
  }

  function replayChart(panel) {
    const chartWrap = panel.querySelector(".why-panel-chart");
    if (!chartWrap) return;

    const prev = chartTimers.get(panel);
    if (prev) clearTimeout(prev);

    panel.classList.remove("is-chart-on");
    void chartWrap.offsetWidth;

    if (reducedMotion) {
      panel.classList.add("is-chart-on");
      return;
    }

    requestAnimationFrame(() => {
      panel.classList.add("is-chart-on");
    });
  }

  function playPanelMotion(panel) {
    const stat = panel.querySelector(".why-panel-stat");
    if (stat) animateCount(stat);
    replayChart(panel);
  }

  function settleClosedPanels(exceptIndex) {
    panels.forEach((panel, i) => {
      if (i === exceptIndex) return;
      // Keep charts visible on closed cards (like reference)
      if (isInView) {
        panel.classList.add("is-chart-on");
      } else {
        panel.classList.remove("is-chart-on");
      }
      const stat = panel.querySelector(".why-panel-stat");
      if (!stat) return;
      cancelCount(stat);
      if (isInView) {
        setStatInstant(stat, Number(stat.dataset.whyValue || 0));
      } else {
        setStatInstant(stat, 0);
      }
    });
  }

  function openPanel(index, { animate = true } = {}) {
    activeIndex = index;
    panels.forEach((panel, i) => {
      const isOpen = i === index;
      panel.classList.toggle("is-open", isOpen);
      panel.setAttribute("aria-selected", isOpen ? "true" : "false");
      panel.tabIndex = isOpen ? 0 : -1;
    });

    settleClosedPanels(index);

    if (animate && isInView) {
      playPanelMotion(panels[index]);
    } else if (!animate) {
      panels[index].classList.remove("is-chart-on");
      const stat = panels[index].querySelector(".why-panel-stat");
      if (stat) setStatInstant(stat, 0);
    }
  }

  function revealCopy() {
    stage.classList.remove("is-inview");
    void stage.offsetWidth;
    stage.classList.add("is-inview");
  }

  function resetSectionMotion() {
    stage.classList.remove("is-inview");
    panels.forEach((panel) => {
      panel.classList.remove("is-chart-on");
      const stat = panel.querySelector(".why-panel-stat");
      if (!stat) return;
      cancelCount(stat);
      setStatInstant(stat, 0);
    });
  }

  function onEnter() {
    if (isInView) return;
    isInView = true;
    revealCopy();
    openPanel(activeIndex, { animate: true });
  }

  function onLeave() {
    if (!isInView) return;
    isInView = false;
    resetSectionMotion();
  }

  panels.forEach((panel, index) => {
    const stat = panel.querySelector(".why-panel-stat");
    if (stat) setStatInstant(stat, 0);

    panel.addEventListener("click", () => {
      if (index === activeIndex) return;
      openPanel(index, { animate: true });
    });

    panel.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPanel(index, { animate: true });
      }
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        event.preventDefault();
        const dir = event.key === "ArrowRight" ? 1 : -1;
        const rtl = document.documentElement.dir === "rtl";
        const step = rtl ? -dir : dir;
        const next = (index + step + panels.length) % panels.length;
        openPanel(next, { animate: true });
        panels[next].focus();
      }
    });
  });

  openPanel(0, { animate: false });

  if (reducedMotion) {
    isInView = true;
    stage.classList.add("is-inview");
    panels.forEach((panel) => {
      const stat = panel.querySelector(".why-panel-stat");
      if (stat) setStatInstant(stat, Number(stat.dataset.whyValue || 0));
      panel.classList.add("is-chart-on");
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          onEnter();
        } else if (!entry.isIntersecting || entry.intersectionRatio <= 0.08) {
          onLeave();
        }
      });
    },
    { threshold: [0, 0.08, 0.28, 0.4] },
  );

  observer.observe(stage);
})();

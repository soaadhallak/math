/**
 * Project CTA — replay reveal each time content enters view.
 */
(function () {
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const configs = [
    {
      stage: document.getElementById("section-start"),
      targetSelector: ".careers-cta-inner",
    },
  ].filter((item) => item.stage);

  if (!configs.length) return;

  function reset(stage) {
    stage.classList.remove("is-inview");
    void stage.offsetWidth;
  }

  function reveal(stage) {
    reset(stage);
    stage.classList.add("is-inview");
  }

  if (reducedMotion) {
    configs.forEach(({ stage }) => {
      stage.classList.remove("has-motion");
      stage.classList.add("is-inview");
    });
    return;
  }

  const visible = new WeakMap();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const stageId = entry.target.getAttribute("data-reveal-stage");
        const stage = document.getElementById(stageId);
        if (!stage) return;

        if (entry.isIntersecting && entry.intersectionRatio >= 0.28) {
          if (visible.get(stage)) return;
          visible.set(stage, true);
          reveal(stage);
          return;
        }

        if (!entry.isIntersecting || entry.intersectionRatio <= 0.02) {
          visible.set(stage, false);
          reset(stage);
        }
      });
    },
    {
      threshold: [0, 0.02, 0.28, 0.45],
      rootMargin: "0px 0px -10% 0px",
    },
  );

  configs.forEach(({ stage, targetSelector }) => {
    const target = stage.querySelector(targetSelector) || stage;
    target.setAttribute("data-reveal-stage", stage.id);
    stage.classList.add("has-motion");
    reset(stage);
    visible.set(stage, false);
    observer.observe(target);
  });

  window.addEventListener("pagehide", () => observer.disconnect(), {
    once: true,
  });
})();

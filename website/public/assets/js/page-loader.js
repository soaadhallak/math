/**
 * Brand page loader — ui-ux-pro-max:
 * 1–2 motions, ease-out enter / ease-in exit, prefers-reduced-motion.
 */
(function () {
  const root = document.documentElement;
  const loader = document.getElementById("page-loader");
  if (!loader) {
    root.classList.remove("is-loading");
    return;
  }

  const brand = document.getElementById("page-loader-brand");
  const logo = document.getElementById("page-loader-logo");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* Logo in ~900ms — keep splash visible long enough to finish cleanly */
  const MIN_MS = reduceMotion ? 160 : 1100;
  const MAX_MS = reduceMotion ? 800 : 4000;
  const started = performance.now();
  let progress = reduceMotion ? 100 : 8;
  let finished = false;
  let tickId = 0;

  function arm() {
    loader.classList.add("is-armed");
    if (brand) brand.classList.add("is-in");
  }

  function setProgress(value) {
    progress = Math.max(progress, Math.min(100, value));
    loader.style.setProperty("--loader-fill", progress.toFixed(1) + "%");
  }

  function tick() {
    if (finished) return;
    if (progress < 78) {
      const step = progress < 35 ? 2.4 : progress < 58 ? 1.15 : 0.35;
      setProgress(progress + step);
    }
    tickId = window.setTimeout(tick, 95);
  }

  function dismiss() {
    if (finished) return;
    finished = true;
    window.clearTimeout(tickId);
    setProgress(100);
    if (brand) brand.classList.add("is-ready");

    const hold = reduceMotion ? 30 : 220;
    window.setTimeout(function () {
      loader.classList.add("is-done");
      loader.setAttribute("aria-busy", "false");
      root.classList.remove("is-loading");
      window.setTimeout(
        function () {
          if (loader.parentNode) loader.parentNode.removeChild(loader);
        },
        reduceMotion ? 200 : 480,
      );
    }, hold);
  }

  function tryFinish() {
    const elapsed = performance.now() - started;
    window.setTimeout(dismiss, Math.max(0, MIN_MS - elapsed));
  }

  function startReveal() {
    if (reduceMotion) {
      arm();
      setProgress(100);
      return;
    }
    window.requestAnimationFrame(function () {
      window.setTimeout(arm, 50);
    });
  }

  setProgress(progress);
  startReveal();
  if (!reduceMotion) tick();

  if (logo && !logo.complete) {
    logo.addEventListener("load", startReveal, { once: true });
  }

  if (document.readyState === "complete") {
    tryFinish();
  } else {
    window.addEventListener("load", tryFinish, { once: true });
  }

  window.setTimeout(function () {
    if (!finished) tryFinish();
  }, MAX_MS);
})();

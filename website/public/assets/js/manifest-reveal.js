(function () {
  const stage = document.getElementById("manifest-stage");
  const textEl = document.getElementById("manifest-text");
  const inner = document.getElementById("manifest-inner");
  const progressBar = document.getElementById("manifest-progress-bar");
  const progressTrack = stage?.querySelector(".manifest-progress");
  if (!stage || !textEl || !inner) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const mobileMotion = window.matchMedia("(max-width: 640px)");

  const FADE_IN_START = 0;
  const FADE_IN_END = 0.06;
  const REVEAL_START = 0;
  const REVEAL_END = 0.82;
  /** Start word reveal before the section sticks (fraction of viewport height). */
  const LEAD_IN_VH = 0.55;
  const Y_FROM = 60;
  const Y_TO = -120;
  const TRANSLATE_Z = 15;
  const LERP = 0.12;

  let words = [];
  let targetProgress = 0;
  let smoothProgress = 0;
  let rafId = 0;

  function clamp01(value) {
    return Math.max(0, Math.min(1, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function rotateXForViewport() {
    return mobileMotion.matches ? 12 : 24;
  }

  function yRangeForViewport() {
    if (mobileMotion.matches) return { from: 36, to: -64 };
    return { from: Y_FROM, to: Y_TO };
  }

  function buildWords() {
    const raw = (
      textEl.getAttribute("data-full-text") ||
      textEl.textContent ||
      ""
    )
      .trim()
      .replace(/\s+/g, " ");
    textEl.setAttribute("data-full-text", raw);
    textEl.textContent = "";

    const parts = raw.split(" ");
    words = parts.map((word, index) => {
      const span = document.createElement("span");
      span.className = "manifest-word";
      span.textContent = word;
      textEl.appendChild(span);
      if (index < parts.length - 1) {
        textEl.appendChild(document.createTextNode(" "));
      }
      return span;
    });

    applyProgress(smoothProgress);
  }

  function readProgress() {
    const top = stage.offsetTop;
    const leadIn = window.innerHeight * LEAD_IN_VH;
    const stickyRun = Math.max(1, stage.offsetHeight - window.innerHeight);
    const runnable = stickyRun + leadIn;
    return clamp01((window.scrollY - (top - leadIn)) / runnable);
  }

  function applyCinematic(progress) {
    if (progressBar) {
      progressBar.style.width = `${(progress * 100).toFixed(2)}%`;
    }
    if (progressTrack) {
      progressTrack.setAttribute(
        "aria-valuenow",
        String(Math.round(progress * 100)),
      );
    }

    if (reducedMotion) {
      inner.style.opacity = "1";
      inner.style.transform = "none";
      return;
    }

    const blockOpacity = clamp01(
      (progress - FADE_IN_START) /
        Math.max(0.0001, FADE_IN_END - FADE_IN_START),
    );
    const yRange = yRangeForViewport();
    const y = lerp(yRange.from, yRange.to, progress);
    const rotateX = rotateXForViewport();
    const z = mobileMotion.matches ? 8 : TRANSLATE_Z;

    inner.style.opacity = String(blockOpacity);
    inner.style.transform = `rotateX(${rotateX}deg) translateY(${y.toFixed(2)}px) translateZ(${z}px)`;
  }

  function applyWordColors(progress) {
    if (!words.length) return;

    if (reducedMotion) {
      words.forEach((word) => {
        word.style.color = "rgba(147, 197, 253, 1)";
      });
      return;
    }

    const count = words.length;
    const t = clamp01((progress - REVEAL_START) / (REVEAL_END - REVEAL_START));

    words.forEach((word, index) => {
      const start = index / count;
      const end = Math.min(1, (index + 1) / count + 0.14);
      const local = clamp01((t - start) / Math.max(0.0001, end - start));
      const eased = local * local * (3 - 2 * local);
      const r = Math.round(127 + eased * (217 - 127));
      const g = Math.round(208 + eased * (242 - 208));
      const b = Math.round(247 + eased * (255 - 247));
      const a = 0.28 + eased * 0.72;
      word.style.color = `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    });
  }

  function applyProgress(progress) {
    applyCinematic(progress);
    applyWordColors(progress);
  }

  function tick() {
    smoothProgress += (targetProgress - smoothProgress) * LERP;
    applyProgress(smoothProgress);

    if (Math.abs(targetProgress - smoothProgress) > 0.0004) {
      rafId = requestAnimationFrame(tick);
    } else {
      smoothProgress = targetProgress;
      applyProgress(smoothProgress);
      rafId = 0;
    }
  }

  function onScroll() {
    targetProgress = readProgress();
    if (reducedMotion) {
      applyProgress(targetProgress);
      return;
    }
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function refreshTextFromI18n() {
    const next = (textEl.textContent || "").trim();
    if (next) textEl.setAttribute("data-full-text", next.replace(/\s+/g, " "));
    buildWords();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  if (mobileMotion.addEventListener) {
    mobileMotion.addEventListener("change", onScroll);
  }
  window.addEventListener("asas:lang", () => {
    requestAnimationFrame(refreshTextFromI18n);
  });

  textEl.setAttribute(
    "data-full-text",
    (textEl.textContent || "").trim().replace(/\s+/g, " "),
  );
  buildWords();
  onScroll();
})();

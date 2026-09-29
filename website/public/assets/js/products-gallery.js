(function () {
  const runway = document.getElementById("products-runway");
  const stage = document.getElementById("products-stage");
  const track = document.getElementById("products-track");
  if (!runway || !stage || !track) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (reducedMotion) {
    runway.classList.add("is-reduced-motion");
    return;
  }

  // Hold first/last card briefly, but keep scroll runway from feeling long/heavy.
  const LEAD_IN_VH = 0.5;
  const LEAD_OUT_VH = 0.28;
  // Higher = snappier/lighter; lower = heavier lag.
  const LERP = 0.28;

  let currentX = 0;
  let targetX = 0;
  let rafId = 0;

  function viewW() {
    return document.documentElement.clientWidth || window.innerWidth;
  }

  function viewH() {
    return window.innerHeight;
  }

  function leadIn() {
    return Math.round(viewH() * LEAD_IN_VH);
  }

  function leadOut() {
    return Math.round(viewH() * LEAD_OUT_VH);
  }

  function distance() {
    return Math.max(0, track.scrollWidth - viewW());
  }

  function isRtl() {
    return document.documentElement.dir === "rtl";
  }

  function applyX(x) {
    track.style.transform = `translate3d(${x}px,0,0)`;
  }

  function tick() {
    const delta = targetX - currentX;
    if (Math.abs(delta) < 0.2) {
      currentX = targetX;
      applyX(currentX);
      rafId = 0;
      return;
    }
    currentX += delta * LERP;
    applyX(currentX);
    rafId = requestAnimationFrame(tick);
  }

  function setTrackProgress(progress) {
    const p = Math.min(1, Math.max(0, progress));
    const d = distance();
    targetX = (isRtl() ? d : -d) * p;
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function setTrackInstant(progress) {
    const p = Math.min(1, Math.max(0, progress));
    const d = distance();
    targetX = (isRtl() ? d : -d) * p;
    currentX = targetX;
    applyX(currentX);
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
  }

  function sizeRunway() {
    runway.style.height = `${viewH() + distance() + leadIn() + leadOut()}px`;
  }

  function progressFromScroll(scrolled, dist) {
    const inn = leadIn();
    const outStart = inn + dist;
    if (scrolled <= inn) return 0;
    if (scrolled >= outStart) return 1;
    // Slight ease-out so mid-track feels lighter / less draggy
    const t = (scrolled - inn) / Math.max(dist, 1);
    return 1 - Math.pow(1 - t, 1.15);
  }

  function update() {
    sizeRunway();
    const dist = distance();
    const rect = runway.getBoundingClientRect();
    const vh = viewH();

    if (dist <= 1) {
      runway.classList.remove("is-before", "is-active", "is-after");
      runway.classList.add("is-before");
      setTrackInstant(0);
      return;
    }

    if (rect.top > 0) {
      runway.classList.remove("is-active", "is-after");
      runway.classList.add("is-before");
      setTrackInstant(0);
      return;
    }

    if (rect.bottom <= vh + 0.5) {
      runway.classList.remove("is-before", "is-active");
      runway.classList.add("is-after");
      setTrackInstant(1);
      return;
    }

    runway.classList.remove("is-before", "is-after");
    runway.classList.add("is-active");
    setTrackProgress(progressFromScroll(-rect.top, dist));
  }

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      update();
      ticking = false;
    });
  }

  function refresh() {
    sizeRunway();
    update();
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", refresh, { passive: true });
  window.addEventListener("asas:lang", refresh);

  const imgs = track.querySelectorAll("img");
  let pending = imgs.length;
  const onImg = () => {
    pending -= 1;
    if (pending <= 0) refresh();
  };
  imgs.forEach((img) => {
    if (img.complete) onImg();
    else img.addEventListener("load", onImg, { once: true });
  });

  refresh();
  window.setTimeout(refresh, 300);
  window.setTimeout(refresh, 1000);
})();

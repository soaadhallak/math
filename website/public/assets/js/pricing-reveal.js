/**
 * Pricing section motion — toggle each effect via data attrs on #pricing-stage:
 *   data-anim-cards     → header + card stagger
 *   data-anim-features  → feature rows stagger
 *   data-anim-featured  → accent border on .pricing-card--featured
 * Soft sequential reveal: cards settle, features cascade, then featured accent.
 * Replays when the section fully leaves then re-enters.
 */
(function () {
  const stage = document.getElementById("pricing-stage");
  if (!stage) return;

  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  const wantCards = stage.hasAttribute("data-anim-cards");
  const wantFeatures = stage.hasAttribute("data-anim-features");
  const wantFeatured = stage.hasAttribute("data-anim-featured");

  if (!wantCards && !wantFeatures && !wantFeatured) return;

  function showAll() {
    stage.classList.add("is-inview", "is-features-on", "is-featured-on");
  }

  if (reducedMotion) {
    showAll();
    return;
  }

  stage.classList.add("has-motion");

  // Overlap slightly with the last card so the sequence feels continuous.
  const featuresDelay = wantCards ? 720 : 160;
  const featuredDelay = wantFeatures
    ? featuresDelay + 720
    : featuresDelay + 280;

  let timers = [];
  let isPlaying = false;
  let isVisible = false;

  function clearTimers() {
    timers.forEach(clearTimeout);
    timers = [];
  }

  function reset() {
    clearTimers();
    isPlaying = false;
    isVisible = false;
    stage.classList.add("is-resetting");
    stage.classList.remove("is-inview", "is-features-on", "is-featured-on");
    void stage.offsetWidth;
    stage.classList.remove("is-resetting");
  }

  function play() {
    if (isPlaying) return;
    isPlaying = true;
    isVisible = true;

    stage.classList.add("is-inview");

    if (wantFeatures) {
      timers.push(
        setTimeout(() => stage.classList.add("is-features-on"), featuresDelay),
      );
    } else {
      stage.classList.add("is-features-on");
    }

    if (wantFeatured) {
      timers.push(
        setTimeout(() => stage.classList.add("is-featured-on"), featuredDelay),
      );
    } else {
      stage.classList.add("is-featured-on");
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const ratio = entry.intersectionRatio;

        if (ratio === 0) {
          reset();
          return;
        }

        if (ratio >= 0.12 && !isVisible) {
          play();
        }
      });
    },
    { threshold: [0, 0.12, 0.25, 0.5, 1], rootMargin: "0px 0px 0px 0px" },
  );

  observer.observe(stage);

  window.addEventListener(
    "pagehide",
    () => {
      clearTimers();
      observer.disconnect();
    },
    { once: true },
  );
})();

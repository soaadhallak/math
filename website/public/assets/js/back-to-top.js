/**
 * Standard floating back-to-top:
 * - hidden near the top
 * - appears after scrolling past a threshold
 * - smooth scroll to top on click (instant if reduced motion)
 */
(function () {
  const btn = document.querySelector(".footer-top-btn");
  if (!btn) return;

  const SHOW_AFTER_PX = 320;
  let ticking = false;

  function scrollY() {
    return (
      window.scrollY ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0
    );
  }

  function setVisible(show) {
    btn.classList.toggle("is-visible", show);
    btn.setAttribute("aria-hidden", show ? "false" : "true");
    btn.tabIndex = show ? 0 : -1;
  }

  function update() {
    ticking = false;
    setVisible(scrollY() > SHOW_AFTER_PX);
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function scrollToTop() {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const scroller = document.scrollingElement || document.documentElement;
    scroller.scrollTo({
      top: 0,
      behavior: reduceMotion ? "auto" : "smooth",
    });
  }

  btn.addEventListener("click", (event) => {
    event.preventDefault();
    scrollToTop();
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

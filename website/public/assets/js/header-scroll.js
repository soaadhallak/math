/**
 * Floating header → solid brand bar after scrolling past the header zone.
 */
(function () {
  "use strict";

  var header = document.querySelector(".header");
  if (!header) return;

  var ticking = false;
  var scrolled = false;

  function threshold() {
    // Activate once the page has scrolled past the floating header band.
    return Math.max(header.offsetHeight + 8, 56);
  }

  function apply(next) {
    if (next === scrolled) return;
    scrolled = next;
    header.classList.toggle("is-scrolled", scrolled);
  }

  function update() {
    ticking = false;
    apply(window.scrollY > threshold());
  }

  function onScroll() {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(update);
  }

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
})();

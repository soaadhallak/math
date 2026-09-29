/**
 * Swagger UI: switch to light mode after load by clicking the dark-mode toggle.
 * Injected via Swagger customJs so the docs default to light theme.
 */
(function () {
  function switchToLightMode() {
    var btn = document.querySelector('.dark-mode-toggle button');
    if (btn && document.documentElement.classList.contains('dark-mode')) {
      btn.click();
    }
  }

  function runAfterLoad() {
    switchToLightMode();
    [300, 600, 1200].forEach(function (ms) {
      setTimeout(switchToLightMode, ms);
    });
  }

  window.addEventListener('load', runAfterLoad);
  if (document.readyState === 'complete') runAfterLoad();
})();

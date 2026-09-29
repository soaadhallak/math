/**
 * Facebook Page Plugin inside Latest News phone screen.
 *
 * Prefetch on approach: start loading ~1 viewport before the section enters
 * view so the phone is usually ready on arrival, without taxing first paint.
 * Phone stays invisible (keeps layout space) until the embed is proven stable.
 */
(function () {
  "use strict";

  var PAGE_URL = "https://www.facebook.com/asas.soft.sy";
  var STABILITY_MS = 1600;
  var WATCH_MS = 10000;
  var POLL_MS = 400;
  /* Start fetch ~1.4 screens early so it is ready on arrival. */
  var APPROACH_ROOT_MARGIN = "0px 0px 140% 0px";

  function hidePhone(frame) {
    if (!frame) {
      return;
    }
    frame.classList.add("is-pending");
    frame.classList.remove("is-ready", "is-live", "is-fallback");
    frame.setAttribute("data-fb-mounted", "hidden");

    var host = frame.querySelector("[data-fb-host]");
    if (host) {
      host.hidden = true;
      host.innerHTML = "";
    }
  }

  function showLive(frame) {
    if (!frame) {
      return;
    }
    frame.classList.remove("is-pending", "is-fallback");
    frame.classList.add("is-ready", "is-live");
    frame.setAttribute("data-fb-mounted", "live");

    var host = frame.querySelector("[data-fb-host]");
    if (host) {
      host.hidden = false;
    }
  }

  function measurePlugin(frame) {
    var screen = frame.querySelector(".latest-news__phone-screen");
    var width = screen ? Math.round(screen.clientWidth) : 284;
    var height = screen ? Math.round(screen.clientHeight) : 520;

    width = Math.max(180, Math.min(500, width || 284));
    height = Math.max(70, height || 520);

    return { width: width, height: height };
  }

  function pluginSrc(size) {
    var params =
      "href=" +
      encodeURIComponent(PAGE_URL) +
      "&show_posts=true" +
      "&width=" +
      encodeURIComponent(String(size.width)) +
      "&height=" +
      encodeURIComponent(String(size.height)) +
      "&small_header=true" +
      "&adapt_container_width=true" +
      "&hide_cover=true" +
      "&show_facepile=false";

    return "https://www.facebook.com/plugins/page.php?" + params;
  }

  /**
   * Working Page Plugin content is cross-origin (throws on access).
   * Chrome/Edge error pages after X-Frame-Options deny are readable.
   */
  function iframeLooksBroken(iframe) {
    if (!iframe) {
      return true;
    }

    try {
      var win = iframe.contentWindow;
      if (!win) {
        return true;
      }

      var href = "";
      try {
        href = String((win.location && win.location.href) || "");
      } catch (err) {
        return false;
      }

      if (!href || href === "about:blank") {
        return true;
      }

      if (
        href.indexOf("chrome-error://") === 0 ||
        href.indexOf("chromewebdata") !== -1
      ) {
        return true;
      }

      var doc = win.document;
      if (doc && doc.body) {
        var text = String(doc.body.innerText || doc.body.textContent || "");
        if (/refused to connect|can't open this page|not working/i.test(text)) {
          return true;
        }
      }

      return true;
    } catch (err) {
      return false;
    }
  }

  function createPluginIframe(size) {
    var iframe = document.createElement("iframe");
    iframe.className = "latest-news__fb-iframe";
    iframe.src = pluginSrc(size);
    iframe.title = "Asas Soft on Facebook";
    iframe.width = String(size.width);
    iframe.height = String(size.height);
    iframe.setAttribute("scrolling", "no");
    iframe.setAttribute("frameborder", "0");
    iframe.setAttribute("allowfullscreen", "true");
    iframe.setAttribute(
      "allow",
      "autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share",
    );
    iframe.setAttribute("loading", "eager");
    iframe.style.border = "none";
    iframe.style.overflow = "hidden";
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.maxWidth = "100%";
    iframe.style.display = "block";
    iframe.style.background = "#ffffff";
    return iframe;
  }

  function clearTimers(state) {
    if (!state) {
      return;
    }
    if (state.pollId) {
      window.clearInterval(state.pollId);
      state.pollId = null;
    }
    if (state.stableId) {
      window.clearTimeout(state.stableId);
      state.stableId = null;
    }
    if (state.watchId) {
      window.clearTimeout(state.watchId);
      state.watchId = null;
    }
  }

  function mountPagePlugin(frame) {
    if (
      !frame ||
      frame.getAttribute("data-fb-mounted") === "live" ||
      frame.getAttribute("data-fb-mounted") === "trying"
    ) {
      return;
    }

    var host = frame.querySelector("[data-fb-host]");
    if (!host) {
      hidePhone(frame);
      return;
    }

    frame.setAttribute("data-fb-mounted", "trying");
    frame.classList.add("is-pending");
    frame.classList.remove("is-ready", "is-live", "is-fallback");

    var size = measurePlugin(frame);
    host.hidden = true;
    host.innerHTML = "";

    var iframe = createPluginIframe(size);
    host.appendChild(iframe);

    var state = {
      pollId: null,
      stableId: null,
      watchId: null,
      firstOkAt: 0,
      finished: false,
    };

    function fail() {
      if (
        state.finished &&
        frame.getAttribute("data-fb-mounted") === "hidden"
      ) {
        return;
      }
      state.finished = true;
      clearTimers(state);
      hidePhone(frame);
    }

    function promoteLive() {
      if (state.finished) {
        return;
      }
      if (iframeLooksBroken(iframe)) {
        fail();
        return;
      }
      state.finished = true;
      clearTimers(state);
      showLive(frame);
      watchAfterLive();
    }

    function watchAfterLive() {
      state.finished = false;
      state.pollId = window.setInterval(function () {
        if (iframeLooksBroken(iframe)) {
          fail();
        }
      }, POLL_MS);

      state.watchId = window.setTimeout(function () {
        if (state.pollId) {
          window.clearInterval(state.pollId);
          state.pollId = null;
        }
        state.finished = true;
      }, WATCH_MS);

      iframe.addEventListener("load", function onLateLoad() {
        window.setTimeout(function () {
          if (iframeLooksBroken(iframe)) {
            iframe.removeEventListener("load", onLateLoad);
            fail();
          }
        }, 200);
      });
    }

    function noteHealthy() {
      if (iframeLooksBroken(iframe)) {
        state.firstOkAt = 0;
        if (state.stableId) {
          window.clearTimeout(state.stableId);
          state.stableId = null;
        }
        return;
      }

      if (!state.firstOkAt) {
        state.firstOkAt = Date.now();
        state.stableId = window.setTimeout(promoteLive, STABILITY_MS);
      }
    }

    state.pollId = window.setInterval(function () {
      if (frame.getAttribute("data-fb-mounted") === "live") {
        return;
      }
      if (iframeLooksBroken(iframe)) {
        state.firstOkAt = 0;
        if (state.stableId) {
          window.clearTimeout(state.stableId);
          state.stableId = null;
        }
        return;
      }
      noteHealthy();
    }, POLL_MS);

    iframe.addEventListener("load", function () {
      window.setTimeout(function () {
        if (iframeLooksBroken(iframe)) {
          state.firstOkAt = 0;
          if (state.stableId) {
            window.clearTimeout(state.stableId);
            state.stableId = null;
          }
          return;
        }
        noteHealthy();
      }, 250);
    });

    iframe.addEventListener("error", fail);

    state.watchId = window.setTimeout(function () {
      if (frame.getAttribute("data-fb-mounted") !== "live") {
        fail();
      }
    }, STABILITY_MS + WATCH_MS);
  }

  function observeFrame(frame) {
    hidePhone(frame);

    if (!("IntersectionObserver" in window)) {
      mountPagePlugin(frame);
      return;
    }

    var target =
      document.getElementById("section-news") ||
      frame.closest("section") ||
      frame;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) {
            return;
          }
          observer.disconnect();
          mountPagePlugin(frame);
        });
      },
      {
        threshold: 0,
        rootMargin: APPROACH_ROOT_MARGIN,
      },
    );

    observer.observe(target);
  }

  function remountOnResize() {
    var frame = document.querySelector("[data-fb-frame]");
    if (!frame || frame.getAttribute("data-fb-mounted") !== "live") {
      return;
    }

    var host = frame.querySelector("[data-fb-host]");
    var iframe = host && host.querySelector("iframe");
    if (!host || !iframe) {
      return;
    }

    var size = measurePlugin(frame);
    iframe.width = String(size.width);
    iframe.height = String(size.height);
    iframe.src = pluginSrc(size);
  }

  function init() {
    var frames = document.querySelectorAll("[data-fb-frame]");
    var i;
    for (i = 0; i < frames.length; i += 1) {
      observeFrame(frames[i]);
    }

    var resizeTimer = null;
    window.addEventListener(
      "resize",
      function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(remountOnResize, 250);
      },
      { passive: true },
    );
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import {
  createChipMaterials,
  recolorCpuModel,
  DEFAULT_CHIP_PALETTE,
} from "./cpu-chip-model.js";

const gsap = window.gsap;
const ScrollTrigger = window.ScrollTrigger;

if (!gsap || !ScrollTrigger) {
  console.warn("GSAP ScrollTrigger failed to load — scroll flight disabled.");
} else {
  gsap.registerPlugin(ScrollTrigger);
}

const CONFIG = {
  modelSrc: "/assets/models/cpu.glb",
  modelSrcFallback:
    "https://res.cloudinary.com/ermahqew/image/upload/v1788431452/final-meshopt_ierrd9.glb",
  /** Slightly larger than the chip so corners don't clip; keep video art visible. */
  overlayScale: 0.99,
  minOverlayPx: 72,
  /** Fill most of the hotspot; leave a thin painted rim if it shows. */
  cameraFitMultiplier: 0.98,
  /**
   * Render canvas larger than the logical hotspot so orbiting near the
   * video brain does not clip pins. Visual size is preserved via fit pad.
   */
  orbitBleed: 1.55,
  /**
   * Dead-on isometric. Top-face W/H in the video is 240/130 = 1.846,
   * so elevation is asin(130/240) ≈ 32.8°. No left/right bias:
   * the painted diamond is symmetric around its vertical diagonal.
   */
  cameraDir: { x: 0, y: Math.tan((32.8 * Math.PI) / 180), z: 1 },
  cameraUp: { x: 0, y: 1, z: 0 },
  modelScale: 1,
  modelPosition: { x: 0, y: 0, z: 0 },
  /** Flat on the floor. 45° yaw puts a corner toward the camera. */
  modelRotation: { x: 0, y: Math.PI / 4, z: 0 },
  /**
   * Logo local yaw on the chip face (fixed for the whole flight).
   * Video logo reads along the top-right chip edge (~25° on screen),
   * which is 90° from the texture's default axis. Keep this glued to
   * the package — do not animate it separately from the chip.
   */
  textYaw: -Math.PI / 2,
  /**
   * Section-2 landing: top-down square chip, logo upright (matches reference).
   * Extra +90° yaw absorbs the fixed textYaw so Asas Soft stays upright
   * without spinning the text plane independently mid-flight.
   */
  landingCameraDir: { x: 0, y: 1, z: 0.001 },
  landingCameraUp: { x: 0, y: 0, z: -1 },
  landingModelRotation: { x: 0, y: Math.PI / 2, z: 0 },
  centerOffsetX: -0.02069,
  centerOffsetY: -0.02724,
  glowPulse: false,
  glowBase: 0.22,
  glowAmplitude: 0.055,
  glowSpeed: 0.0022,
  toneMappingExposure: 0.92,
  flightLift: 0.38,
  /** Extra downward dive during mid-flight (px) */
  flightArcPx: 120,
  endScale: 1,
  flightYaw: 0.45,
  /** Landing center as fraction of viewport height */
  endCenterY: 0.46,
  endSizeViewport: 0.26,
};

/**
 * Processor hotspot on hero-background.mp4 (1920×1080 laptop plate).
 * Crop origin (1267, 496). Top-face diamond in crop px:
 *   top (230, 100)  right (350, 165)  bot (230, 230)  left (110, 165)
 */
const MODEL_VIDEO_DESKTOP = {
  width: 1920,
  height: 1080,
  centerX: 0.7797,
  centerY: 0.6167,
  boxX: 0.7078,
  boxY: 0.5407,
  boxW: 0.1438,
  boxH: 0.1519,
};

/**
 * Processor hotspot on hero-mobile-background.mp4 (UV 0–1) — chip only.
 * Phone frame (object-position/zoom) is separate: 53% / 22% / 4 / contain.
 * Chip UV from user calibrate (screen ref 53%/69%/43%). iPad later.
 */
const MODEL_VIDEO_MOBILE = {
  width: 1080,
  height: 1920,
  centerX: 0.53,
  centerY: 0.5915,
  boxX: 0.4757,
  boxY: 0.495,
  boxW: 0.1086,
  boxH: 0.193,
};

/** Phone video framing — NOT the chip UV (composition vs hotspot). */
const MOBILE_VIDEO_FRAME = {
  x: 0.53,
  y: 0.22,
  zoom: "4",
  fit: "contain",
};

const container = document.getElementById("hero-background-video-container");
const overlay = document.getElementById("hero-brain-overlay");
const canvas = document.getElementById("hero-brain-canvas");
const landing = document.getElementById("brain-landing");
const flightStage = document.getElementById("flight-stage");
const sectionHero = document.getElementById("section-hero");
const sectionVision = document.getElementById("section-vision");
const heroMain =
  document.getElementById("hero-main") || sectionHero?.querySelector(".main");
const appRoot = document.getElementById("app");
const heroBg = container;
const visionStageBg = document.getElementById("vision-stage-bg");
const scrollHint = sectionHero?.querySelector(".scroll-hint");
const visionHeading = sectionVision?.querySelector(".vision-heading");
const visionCta = sectionVision?.querySelector(".vision-cta");
const visionCards = sectionVision
  ? Array.from(sectionVision.querySelectorAll(".vision-card"))
  : [];
const visionConnectors = document.getElementById("vision-connectors");
const visionPedestal = sectionVision?.querySelector(".vision-pedestal");

/**
 * Ray from (fromX, fromY) toward ellipse center (cx, cy):
 * return the point on the ellipse perimeter (brain silhouette).
 */
function ellipsePerimeterPoint(cx, cy, rx, ry, fromX, fromY) {
  const vx = fromX - cx;
  const vy = fromY - cy;
  const denom = Math.sqrt((vx * vx) / (rx * rx) + (vy * vy) / (ry * ry)) || 1;
  const t = 1 / denom;
  return { x: cx + vx * t, y: cy + vy * t };
}

function resolveBrainBox(brainBox) {
  if (brainBox) {
    return {
      left: brainBox.x,
      top: brainBox.y,
      width: brainBox.w,
      height: brainBox.h,
    };
  }
  if (!overlay) return null;
  return overlay.getBoundingClientRect();
}

/** Orbit cards around the live brain (desktop). Narrow uses CSS 2×2. */
function updateVisionCardLayout(brainBox) {
  if (!sectionVision || !visionCards.length) return;
  const desktop = !isNarrowViewport();

  if (!desktop) {
    visionCards.forEach((card) => {
      card.style.left = "";
      card.style.top = "";
      card.style.right = "";
      card.style.bottom = "";
    });
    return;
  }

  const root = sectionVision.getBoundingClientRect();
  const brain = resolveBrainBox(brainBox);
  if (!brain || root.width < 8 || brain.width < 8) return;

  const bx = brain.left + brain.width / 2 - root.left;
  const by = brain.top + brain.height / 2 - root.top;
  const silhouetteRx = brain.width * 0.38;
  const linkGap = Math.max(88, Math.min(160, brain.width * 0.28));
  const toInnerEdge = silhouetteRx + linkGap;
  // Keep original orbit spread so cards never stack; floor on short
  // desktop so a smaller landing still separates TL/BL and TR/BR.
  const topLift = Math.max(
    brain.height * 0.42,
    isShortDesktopVision() ? 108 : 0,
  );
  const botDrop = Math.max(
    brain.height * 0.46,
    isShortDesktopVision() ? 118 : 0,
  );

  const slots = {
    "vision-card--tl": { side: "left", cy: by - topLift },
    "vision-card--bl": { side: "left", cy: by + botDrop },
    "vision-card--tr": { side: "right", cy: by - topLift },
    "vision-card--br": { side: "right", cy: by + botDrop },
  };

  visionCards.forEach((card) => {
    const key = [...card.classList].find((c) => slots[c]);
    const slot = key ? slots[key] : null;
    if (!slot) return;

    const cw = card.offsetWidth || 280;
    const ch = card.offsetHeight || 160;
    const left =
      slot.side === "left" ? bx - toInnerEdge - cw : bx + toInnerEdge;
    const top = slot.cy - ch / 2;

    card.style.left = `${left}px`;
    card.style.top = `${top}px`;
    card.style.right = "auto";
    card.style.bottom = "auto";
  });
}

/** Draw card → horizontal elbow → brain-edge lines. */
function updateVisionConnectors(brainBox) {
  if (!visionConnectors || !overlay || !sectionVision) return;
  if (isNarrowViewport()) {
    visionConnectors.innerHTML = "";
    return;
  }

  const root = sectionVision.getBoundingClientRect();
  const brain = resolveBrainBox(brainBox);
  if (!brain || root.width < 8 || brain.width < 8) return;

  const w = root.width;
  const h = root.height;
  visionConnectors.setAttribute("viewBox", `0 0 ${w} ${h}`);
  visionConnectors.setAttribute("width", String(w));
  visionConnectors.setAttribute("height", String(h));

  const bx = brain.left + brain.width / 2 - root.left;
  const by = brain.top + brain.height / 2 - root.top;
  const rx = brain.width * 0.38;
  const ry = brain.height * 0.42;

  const parts = [];

  visionCards.forEach((card) => {
    const side = card.getAttribute("data-connector");
    const cr = card.getBoundingClientRect();
    if (cr.width < 4) return;

    const startX = side === "left" ? cr.right - root.left : cr.left - root.left;
    const startY = cr.top + cr.height / 2 - root.top;

    const gap = Math.abs(bx - startX);
    const elbowDist = Math.min(56, Math.max(28, gap * 0.22));
    const elbowX = side === "left" ? startX + elbowDist : startX - elbowDist;
    const elbowY = startY;

    const tip = ellipsePerimeterPoint(bx, by, rx, ry, elbowX, elbowY);

    parts.push(
      `<path class="connector-line" d="M ${startX.toFixed(1)} ${startY.toFixed(1)} H ${elbowX.toFixed(1)} L ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}" />`,
      `<circle class="connector-dot connector-dot--card" cx="${startX.toFixed(1)}" cy="${startY.toFixed(1)}" r="3.4" />`,
      `<circle class="connector-dot connector-dot--brain" cx="${tip.x.toFixed(1)}" cy="${tip.y.toFixed(1)}" r="3.1" />`,
    );
  });

  visionConnectors.innerHTML = parts.join("");
}

/** Lock holographic pedestal under the live brain overlay. */
function updateVisionPedestal(brainBox) {
  if (!visionPedestal || !overlay || !sectionVision) return;
  if (isNarrowViewport()) {
    visionPedestal.style.opacity = "0";
    visionPedestal.style.left = "";
    visionPedestal.style.top = "";
    visionPedestal.style.width = "";
    visionPedestal.style.height = "";
    visionPedestal.style.transform = "";
    return;
  }

  const root = sectionVision.getBoundingClientRect();
  const brain = resolveBrainBox(brainBox);
  if (!brain || root.width < 8 || brain.width < 8) return;

  const cx = brain.left + brain.width / 2 - root.left;
  // Sit clearly below the top-down chip so rings don't clip the bottom pins.
  const plateY = brain.top + brain.height * 1.14 - root.top;
  const pw = brain.width * 1.4;
  const ph = brain.width * 0.4;

  visionPedestal.style.left = `${cx}px`;
  visionPedestal.style.top = `${plateY}px`;
  visionPedestal.style.width = `${pw}px`;
  visionPedestal.style.height = `${ph}px`;
  visionPedestal.style.transform = "translate(-50%, 0)";
}

/** Cards → pedestal → connectors, locked to the same brain box. */
function updateVisionComposition(brainBox) {
  updateVisionCardLayout(brainBox);
  updateVisionPedestal(brainBox);
  updateVisionConnectors(brainBox);
}

function detectWebGL() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(probe.getContext("webgl2") ?? probe.getContext("webgl"));
  } catch {
    return false;
  }
}

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Layout breakpoint shared with CSS (vision 2×2 / object-position). */
function isNarrowViewport() {
  return window.matchMedia("(max-width: 899px)").matches;
}

/**
 * Chrome DevTools device presets spoof UA (iPhone/Android/…).
 * Resized laptop windows keep the desktop Chrome UA — that is the reliable
 * split. pointer:fine alone is NOT reliable (DevTools often leaves it on).
 */
function isEmulatedMobileUa() {
  return /iPhone|iPod|iPad|Android|Mobile|Nexus|Pixel|Samsung|webOS|BlackBerry/i.test(
    navigator.userAgent,
  );
}

/**
 * iPhone SE DevTools — 375×667 / 667×375 (±1px tolerance for subpixels).
 */
function isIphoneSE() {
  const w = window.innerWidth;
  const h = window.innerHeight;
  const portrait = Math.abs(w - 375) <= 1 && Math.abs(h - 667) <= 1;
  const landscape = Math.abs(w - 667) <= 1 && Math.abs(h - 375) <= 1;
  if (portrait || landscape) return true;
  return (
    window.matchMedia("(width: 375px) and (height: 667px)").matches ||
    window.matchMedia("(width: 667px) and (height: 375px)").matches
  );
}

/**
 * Short-phone vision band (SE class). Matches CSS
 * (max-width: 390px) and (max-height: 680px) — not taller 375-wide phones.
 */
function isShortPhoneVision() {
  return window.matchMedia("(max-width: 390px) and (max-height: 680px)")
    .matches;
}

/** Desktop orbit with a shortened browser window — keep title/CTA clear of chip. */
function isShortDesktopVision() {
  return window.matchMedia("(min-width: 900px) and (max-height: 900px)")
    .matches;
}

/** User-tuned SE video — applied as inline vars so no stylesheet can override. */
/** Debug panels only — ?chipPos=1 / ?heroCrop=1. No effect on normal browsing. */
function isChipPosTuning() {
  try {
    return new URLSearchParams(window.location.search).get("chipPos") === "1";
  } catch {
    return false;
  }
}

function isHeroCropTuning() {
  try {
    return new URLSearchParams(window.location.search).get("heroCrop") === "1";
  } catch {
    return false;
  }
}

/**
 * Lock video object-position/zoom for the active plate.
 * Phone (≤699): MOBILE_VIDEO_FRAME + MODEL_VIDEO_MOBILE chip — DO NOT CHANGE.
 * iPad / desktop plate: MODEL_VIDEO_DESKTOP center; zoom/fit from CSS bands.
 */
function syncHeroFrameToHotspot() {
  if (!heroBg || isHeroCropTuning()) return;
  // Wide fine-pointer desktop: CSS centers at 50/50 — clear inline framing.
  if (isFinePointerDesktop() && window.innerWidth > 1504) {
    heroBg.style.removeProperty("--hero-video-pos-x");
    heroBg.style.removeProperty("--hero-video-pos-y");
    heroBg.style.removeProperty("--hero-video-zoom");
    heroBg.style.removeProperty("--hero-video-fit");
    return;
  }
  if (usesMobileHeroVideo()) {
    // Locked phone frame — identical to shipping mobile calibrate.
    heroBg.style.setProperty(
      "--hero-video-pos-x",
      `${(MOBILE_VIDEO_FRAME.x * 100).toFixed(2)}%`,
    );
    heroBg.style.setProperty(
      "--hero-video-pos-y",
      `${(MOBILE_VIDEO_FRAME.y * 100).toFixed(2)}%`,
    );
    heroBg.style.setProperty("--hero-video-zoom", MOBILE_VIDEO_FRAME.zoom);
    heroBg.style.setProperty("--hero-video-fit", MOBILE_VIDEO_FRAME.fit);
    return;
  }
  const base = MODEL_VIDEO_DESKTOP;
  heroBg.style.setProperty(
    "--hero-video-pos-x",
    `${(base.centerX * 100).toFixed(2)}%`,
  );
  heroBg.style.setProperty(
    "--hero-video-pos-y",
    `${(base.centerY * 100).toFixed(2)}%`,
  );
  // Zoom/fit: stylesheet bands (iPad Mini / Pro / Surface).
  heroBg.style.removeProperty("--hero-video-zoom");
  heroBg.style.removeProperty("--hero-video-fit");
}

/**
 * SE zoom/fit lock only. Chip % no longer used for live placement.
 * Clears stale inline chip vars so they can't fight the UV path.
 */
function syncIphoneSELocks() {
  if (sectionHero && !isChipPosTuning()) {
    sectionHero.style.removeProperty("--chip-mobile-x");
    sectionHero.style.removeProperty("--chip-mobile-y");
    sectionHero.style.removeProperty("--chip-mobile-size");
  }
  syncHeroFrameToHotspot();
}

/**
 * Exact Chrome DevTools sizes that must keep phone/tablet hero behavior
 * even if the host laptop reports pointer:fine (same idea as Nest CSS re-assert).
 */
function isLockedDevicePreset() {
  if (isIphoneSE()) return true;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const exact = [
    [412, 968],
    [968, 412],
    [744, 860],
    [860, 744], // Galaxy Z Fold 6
    [1280, 800], // Nest Hub Max
  ];
  return exact.some(([a, b]) => w === a && h === b);
}

/** Primary input is mouse/trackpad (resized laptop window, not DevTools devices). */
function isFinePointerDesktop() {
  // Device-preset UA → always phone/tablet hero behavior.
  if (isEmulatedMobileUa()) return false;
  if (isIphoneSE()) return false;
  if (window.matchMedia("(any-pointer: coarse)").matches) return false;
  if (isLockedDevicePreset()) return false;
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

/** Tablet / iPad Pro band (900–1366) — same stacking needs as mobile. */
function isIpadProBand() {
  return window.matchMedia("(min-width: 900px) and (max-width: 1366px)")
    .matches;
}

/** Tablet landscape — --chip-tablet-* (touch tablets only, not resized desktop). */
function isTabletLandscape() {
  return (
    isIpadProBand() &&
    window.matchMedia("(orientation: landscape)").matches &&
    !isFinePointerDesktop()
  );
}

/** Temporary AABB while the user is actively tuning ?chipPos=1 (null otherwise). */
let chipPosModelOverride = null;

/**
 * Screen chip % → video-normalized AABB (inverse of getHeroBrainRect zoom math).
 * Only applied when the debug panel sends an explicit user edit — never on load,
 * so ?chipPos=1 opens on the same spot as plain localhost.
 */
function reverseMapScreenChipToModel(
  sx,
  sy,
  sizeFrac,
  containerW,
  containerH,
  modelBase,
) {
  const { focusX, focusY, zoom, fit } = readHeroVideoFrame();
  const Vw = modelBase.width;
  const Vh = modelBase.height;
  const cover = Math.max(containerW / Vw, containerH / Vh);
  const contain = Math.min(containerW / Vw, containerH / Vh);
  const base = fit === "contain" ? contain : cover;
  const scaledW = Vw * base;
  const scaledH = Vh * base;
  const offsetX = (containerW - scaledW) * focusX;
  const offsetY = (containerH - scaledH) * focusY;
  const ux = focusX * containerW + ((sx - focusX) * containerW) / zoom;
  const uy = focusY * containerH + ((sy - focusY) * containerH) / zoom;
  const vx = (ux - offsetX) / scaledW;
  const vy = (uy - offsetY) / scaledH;
  const sizeU = (Math.min(containerW, containerH) * sizeFrac) / zoom;
  const sizeAdj = sizeU / CONFIG.overlayScale;
  const bw = sizeAdj / scaledW;
  const bh = sizeAdj / scaledH;
  return {
    ...modelBase,
    centerX: vx,
    centerY: vy,
    boxX: vx - bw / 2,
    boxY: vy - bh / 2,
    boxW: bw,
    boxH: bh,
  };
}

function setChipPosOverrideFromScreen(xPct, yPct, sizePct) {
  if (isFinePointerDesktop()) {
    chipPosModelOverride = null;
    return;
  }
  if (!(isNarrowViewport() || isTabletLandscape())) {
    chipPosModelOverride = null;
    return;
  }
  const source = container || sectionHero;
  if (!source) {
    chipPosModelOverride = null;
    return;
  }
  const rect = source.getBoundingClientRect();
  if (rect.width < 8 || rect.height < 8) {
    chipPosModelOverride = null;
    return;
  }
  const el = getHeroVideoEl();
  const plate = usesMobileHeroVideo()
    ? MODEL_VIDEO_MOBILE
    : MODEL_VIDEO_DESKTOP;
  const width = el?.videoWidth > 8 ? el.videoWidth : plate.width;
  const height = el?.videoHeight > 8 ? el.videoHeight : plate.height;
  chipPosModelOverride = reverseMapScreenChipToModel(
    xPct / 100,
    yPct / 100,
    sizePct / 100,
    rect.width,
    rect.height,
    { ...plate, width, height },
  );
  try {
    window.__ASAS_CHIP_UV__ = { ...chipPosModelOverride };
  } catch (_) {
    /* ignore */
  }
}

function clearChipPosOverride() {
  chipPosModelOverride = null;
  try {
    window.__ASAS_CHIP_UV__ = null;
  } catch (_) {
    /* ignore */
  }
}

/**
 * Chip placement: always the video AABB path. ?chipPos=1 only overrides the
 * AABB after the user edits — opening the panel does not jump the chip.
 */
function usesCssChipPlacement() {
  return false;
}

/**
 * Reparent + under-hero stacking.
 * Any ≤899 layout (including resized desktop) stacks vision cards in a
 * column — use the mobile hero stack so the fixed hero shell doesn't
 * smash section 2.
 */
function needsHeroAboveChip() {
  if (isIphoneSE()) return true;
  if (isNarrowViewport()) return true;
  if (isFinePointerDesktop()) return false;
  return isIpadProBand();
}

/*
 * Stacking fix: #hero-brain-overlay lives on #app (fixed).
 * #hero-main inside .flight-viewport gets trapped by ancestor transforms,
 * so the WebGL chip painted ABOVE the copy. Reparent hero-main next to the
 * overlay on mobile + iPad Pro. Overlay stays position:fixed.
 */
let heroMainHomeParent = null;
let heroMainHomeNext = null;

function syncHeroMainStacking() {
  if (!heroMain || !appRoot || !overlay) return;

  if (!heroMainHomeParent) {
    heroMainHomeParent = heroMain.parentElement;
    heroMainHomeNext = heroMain.nextSibling;
  }

  if (needsHeroAboveChip()) {
    if (heroMain.parentElement !== appRoot) {
      appRoot.insertBefore(heroMain, overlay.nextSibling);
    }
  } else if (
    heroMainHomeParent &&
    heroMain.parentElement !== heroMainHomeParent
  ) {
    if (
      heroMainHomeNext &&
      heroMainHomeNext.parentElement === heroMainHomeParent
    ) {
      heroMainHomeParent.insertBefore(heroMain, heroMainHomeNext);
    } else {
      heroMainHomeParent.appendChild(heroMain);
    }
  }
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

/** Read focal frame from .hero-bg CSS vars (same source as the video). */
function readHeroVideoFrame() {
  const el = container || heroBg;
  const fallback = {
    focusX: 0.5,
    focusY: 0.5,
    zoom: 1,
    fit: "cover",
  };
  if (!el) return fallback;
  const cs = getComputedStyle(el);
  const pct = (raw, fb) => {
    const n = Number.parseFloat(String(raw).trim());
    return Number.isFinite(n) ? n / 100 : fb;
  };
  const zoomN = (raw, fb) => {
    const n = Number.parseFloat(String(raw).trim());
    return Number.isFinite(n) && n > 0 ? n : fb;
  };
  const fitRaw = String(cs.getPropertyValue("--hero-video-fit") || "")
    .trim()
    .toLowerCase();
  const fit = fitRaw === "contain" ? "contain" : "cover";
  return {
    focusX: pct(cs.getPropertyValue("--hero-video-pos-x"), fallback.focusX),
    focusY: pct(cs.getPropertyValue("--hero-video-pos-y"), fallback.focusY),
    zoom: zoomN(cs.getPropertyValue("--hero-video-zoom"), fallback.zoom),
    fit,
  };
}

/**
 * Prefer the plate actually on screen (app.js src), then fall back to the
 * phone split (≤699). iPads (≥700) use the laptop plate — never MODEL_VIDEO_MOBILE.
 */
function usesMobileHeroVideo() {
  const el = getHeroVideoEl();
  const raw = el?.currentSrc || el?.getAttribute("src") || "";
  let path = raw;
  try {
    path = raw ? new URL(raw, window.location.href).pathname : "";
  } catch (_) {
    /* keep raw */
  }
  if (path.includes("hero-mobile")) return true;
  if (path.includes("hero-background") && !path.includes("hero-mobile")) {
    return false;
  }
  if (isFinePointerDesktop()) return false;
  return window.matchMedia("(max-width: 699px)").matches || isIphoneSE();
}

function getHeroVideoEl() {
  return document.getElementById("hero-background-video");
}

/**
 * Active plate + AABB. Mobile uses the baked processor hotspot so the chip
 * stays locked to a video point when --hero-video-* changes (same idea as
 * desktop ↔ MODEL_VIDEO_DESKTOP). CSS --chip-mobile-* is for ?chipPos=1 only.
 */
function getModelVideo() {
  const el = getHeroVideoEl();
  if (chipPosModelOverride) {
    const width =
      el?.videoWidth > 8 ? el.videoWidth : chipPosModelOverride.width;
    const height =
      el?.videoHeight > 8 ? el.videoHeight : chipPosModelOverride.height;
    return { ...chipPosModelOverride, width, height };
  }

  const base = usesMobileHeroVideo() ? MODEL_VIDEO_MOBILE : MODEL_VIDEO_DESKTOP;
  const width = el?.videoWidth > 8 ? el.videoWidth : base.width;
  const height = el?.videoHeight > 8 ? el.videoHeight : base.height;
  return { ...base, width, height };
}

/**
 * object-fit cover/contain (+ zoom about focus). Synced with
 * --hero-video-* vars on .hero-bg — must match CSS transform-origin math.
 */
function getCoverTransform(containerW, containerH, model = getModelVideo()) {
  const { focusX, focusY, zoom, fit } = readHeroVideoFrame();
  const cover = Math.max(containerW / model.width, containerH / model.height);
  const contain = Math.min(containerW / model.width, containerH / model.height);
  const base = fit === "contain" ? contain : cover;
  const scaledW = model.width * base;
  const scaledH = model.height * base;
  return {
    scale: base,
    zoom,
    focusX,
    focusY,
    fit,
    offsetX: (containerW - scaledW) * focusX,
    offsetY: (containerH - scaledH) * focusY,
    model,
  };
}

/**
 * Hero start: map the active video's processor AABB through the same
 * cover/contain + zoom as the CSS <video> (stable lock to a video point).
 * ?chipPos=1 reverse-maps panel % into the same AABB path (no CSS renderer).
 */
function getHeroBrainRect() {
  const source = container || sectionHero;
  if (!source) return null;

  const rect = source.getBoundingClientRect();
  const { focusX, focusY, zoom } = readHeroVideoFrame();

  const { scale, offsetX, offsetY, model } = getCoverTransform(
    rect.width,
    rect.height,
  );

  const baseW = model.boxW * model.width * scale;
  const baseH = model.boxH * model.height * scale;
  const offX = usesMobileHeroVideo() ? 0 : CONFIG.centerOffsetX;
  const offY = usesMobileHeroVideo() ? 0 : CONFIG.centerOffsetY;
  let baseX = rect.left + (model.boxX + offX) * model.width * scale + offsetX;
  let baseY = rect.top + (model.boxY + offY) * model.height * scale + offsetY;

  // Size from video AABB first — apply minPx AFTER zoom so phone contain+zoom
  // frames are not inflated (pre-zoom AABB is often <72px).
  let w = baseW * CONFIG.overlayScale;
  let h = baseH * CONFIG.overlayScale;
  let x = baseX - (w - baseW) / 2;
  let y = baseY - (h - baseH) / 2;

  // Match CSS: transform: scale(zoom) with transform-origin at focus.
  if (zoom !== 1) {
    const ox = rect.left + focusX * rect.width;
    const oy = rect.top + focusY * rect.height;
    const cx0 = x + w / 2;
    const cy0 = y + h / 2;
    w *= zoom;
    h *= zoom;
    x = ox + (cx0 - ox) * zoom - w / 2;
    y = oy + (cy0 - oy) * zoom - h / 2;
  }

  // Keep the video lock: floor/cap size about the same center — never shift it.
  let cx = x + w / 2;
  let cy = y + h / 2;
  const minPx = CONFIG.minOverlayPx;
  if (w < minPx || h < minPx) {
    const s = Math.max(minPx / w, minPx / h);
    w *= s;
    h *= s;
  }
  const pad = 4;
  const maxW = Math.max(32, rect.width - pad * 2);
  const maxH = Math.max(32, rect.height - pad * 2);
  if (w > maxW || h > maxH) {
    const s = Math.min(maxW / w, maxH / h);
    w *= s;
    h *= s;
  }
  x = cx - w / 2;
  y = cy - h / 2;

  return { x, y, w, h, cx, cy };
}

/** Next-section landing — follow the real #brain-landing box when available. */
function getLandingBrainRect() {
  if (landing) {
    const rect = landing.getBoundingClientRect();
    if (rect.width >= 8 && rect.height >= 8) {
      let w = rect.width;
      let h = rect.height;
      // Hard cap for stacked layout — never trust a stomped/desktop landing size.
      if (isNarrowViewport()) {
        const maxPx = isShortPhoneVision()
          ? 58
          : window.matchMedia("(max-height: 700px)").matches
            ? 80
            : 88;
        w = Math.min(w, maxPx);
        h = Math.min(h, maxPx);
      } else if (isShortDesktopVision()) {
        const maxPx = window.matchMedia("(max-height: 760px)").matches
          ? 168
          : 210;
        w = Math.min(w, maxPx);
        h = Math.min(h, maxPx);
      }
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      return {
        x: cx - w / 2,
        y: cy - h / 2,
        w,
        h,
        cx,
        cy,
      };
    }
  }

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let size = Math.min(
    Math.min(vw, vh) * CONFIG.endSizeViewport,
    vw * 0.55,
    460,
  );
  if (isNarrowViewport()) {
    size = Math.min(
      size,
      isShortPhoneVision()
        ? 58
        : window.matchMedia("(max-height: 700px)").matches
          ? 80
          : 88,
    );
  }
  const cx = vw * 0.5;
  const cy = vh * CONFIG.endCenterY;
  return {
    x: cx - size / 2,
    y: cy - size / 2,
    w: size,
    h: size,
    cx,
    cy,
  };
}

function applyOverlayBox(box) {
  if (!overlay || !box) return;
  overlay.hidden = false;
  overlay.style.left = `${box.x}px`;
  overlay.style.top = `${box.y}px`;
  overlay.style.width = `${box.w}px`;
  overlay.style.height = `${box.h}px`;
}

/** Reset overlay geometry when crossing the mobile/desktop layout mode. */
function resetOverlayLayoutMode() {
  if (!overlay) return;
  overlay.style.left = "";
  overlay.style.top = "";
  overlay.style.width = "";
  overlay.style.height = "";
  overlay.style.zIndex = "";
  overlay.classList.remove("is-under-hero");
}

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function smoothstep(edge0, edge1, x) {
  const t = clamp01((x - edge0) / (edge1 - edge0));
  return t * t * (3 - 2 * t);
}

function applyModelOrientation(model) {
  model.rotation.set(
    CONFIG.modelRotation.x,
    CONFIG.modelRotation.y,
    CONFIG.modelRotation.z,
  );
  model.scale.setScalar(CONFIG.modelScale);
  model.updateWorldMatrix(true, true);

  const box = visibleMeshBox(model);
  if (box.isEmpty()) {
    model.position.set(
      CONFIG.modelPosition.x,
      CONFIG.modelPosition.y,
      CONFIG.modelPosition.z,
    );
    return;
  }

  const center = box.getCenter(new THREE.Vector3());
  model.position.set(
    CONFIG.modelPosition.x - center.x,
    CONFIG.modelPosition.y - box.min.y,
    CONFIG.modelPosition.z - center.z,
  );

  model.traverse((object) => {
    if (object.name.includes("asassoft_text")) {
      object.rotation.z = CONFIG.textYaw;
    }
  });
}

function updateGlowPulse(model, time) {
  if (!CONFIG.glowPulse) return;
  const intensity =
    CONFIG.glowBase +
    Math.sin(time * CONFIG.glowSpeed * 1000) * CONFIG.glowAmplitude;

  model.traverse((object) => {
    if (!object.isMesh) return;
    const materials = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of materials) {
      if (material.userData?.isBrainGlow) {
        material.emissiveIntensity = intensity;
      }
    }
  });
}

function addLights(scene, palette = DEFAULT_CHIP_PALETTE) {
  const p = { ...DEFAULT_CHIP_PALETTE, ...palette };

  const ambient = new THREE.AmbientLight(new THREE.Color(p.ambient), 0.82);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(new THREE.Color(p.key), 1.15);
  key.position.set(-4, 9, 10);
  scene.add(key);

  const fill = new THREE.DirectionalLight(new THREE.Color(p.fill), 0.4);
  fill.position.set(7, 4, -5);
  scene.add(fill);

  const rim = new THREE.DirectionalLight(new THREE.Color(p.rim), 1.25);
  rim.position.set(2, 5, 9);
  scene.add(rim);

  const floor = new THREE.DirectionalLight(new THREE.Color(p.floor), 0.55);
  floor.position.set(0, -6, 3);
  scene.add(floor);

  const accent = new THREE.HemisphereLight(
    new THREE.Color(p.hemiSky),
    new THREE.Color(p.hemiGround),
    0.42,
  );
  scene.add(accent);

  return { ambient, key, fill, rim, floor, accent };
}

function createContactShadow(size = 2.4) {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    const g = ctx.createRadialGradient(128, 128, 8, 128, 128, 120);
    g.addColorStop(0, "rgba(0, 24, 56, 0.45)");
    g.addColorStop(0.45, "rgba(0, 30, 64, 0.16)");
    g.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 256, 256);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.55,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(size, size), material);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = 0.001;
  mesh.renderOrder = -1;
  mesh.name = "chip_contact_shadow";
  return mesh;
}

function visibleMeshBox(root) {
  const box = new THREE.Box3();
  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    if (!object.visible || !object.isMesh || !object.geometry) return;
    if (object.name === "chip_contact_shadow") return;
    const meshBox = new THREE.Box3().setFromObject(object);
    if (!meshBox.isEmpty()) box.union(meshBox);
  });
  return box;
}

function findFitTarget(root) {
  return root;
}

/** Project real mesh vertices (not the loose AABB) into camera view space. */
function projectedMeshBounds(camera, root) {
  const inv = camera.matrixWorldInverse;
  const vertex = new THREE.Vector3();
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let found = false;

  root.updateWorldMatrix(true, true);
  root.traverse((object) => {
    if (!object.visible || !object.isMesh || !object.geometry) return;
    if (object.name === "chip_contact_shadow") return;
    const position = object.geometry.attributes.position;
    if (!position) return;

    const stride = position.count > 12000 ? 3 : position.count > 4000 ? 2 : 1;
    for (let i = 0; i < position.count; i += stride) {
      vertex.fromBufferAttribute(position, i).applyMatrix4(object.matrixWorld);
      vertex.applyMatrix4(inv);
      minX = Math.min(minX, vertex.x);
      maxX = Math.max(maxX, vertex.x);
      minY = Math.min(minY, vertex.y);
      maxY = Math.max(maxY, vertex.y);
      found = true;
    }
  });

  if (!found) return null;
  return { minX, maxX, minY, maxY };
}

function fitCamera(
  camera,
  controls,
  object,
  aspect,
  dirConfig = CONFIG.cameraDir,
  upConfig = CONFIG.cameraUp,
) {
  const box = visibleMeshBox(object);
  if (box.isEmpty()) return 0;

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const dir = new THREE.Vector3(
    dirConfig.x,
    dirConfig.y,
    dirConfig.z,
  ).normalize();
  const up = new THREE.Vector3(upConfig.x, upConfig.y, upConfig.z).normalize();
  const distance = Math.max(size.x, size.y, size.z) * 6;

  camera.up.copy(up);
  camera.position.copy(center).addScaledVector(dir, distance);
  camera.near = 0.05;
  camera.far = Math.max(distance * 4, 50);
  camera.lookAt(center);
  camera.updateMatrixWorld(true);

  const projected = projectedMeshBounds(camera, object);
  if (!projected) return distance;

  const { minX, maxX, minY, maxY } = projected;
  // Zoom out inside the bled canvas so on-screen chip size matches the logical box.
  const orbitBleed = isNarrowViewport() ? 1 : CONFIG.orbitBleed;
  const pad = CONFIG.cameraFitMultiplier * orbitBleed;
  const midX = (minX + maxX) / 2;
  const midY = (minY + maxY) / 2;
  let halfW = ((maxX - minX) / 2) * pad;
  let halfH = ((maxY - minY) / 2) * pad;
  const viewAspect = Math.max(aspect, 0.01);
  // Contain inside the larger frame so corners/pins are not clipped.
  if (halfW / halfH > viewAspect) {
    halfH = halfW / viewAspect;
  } else {
    halfW = halfH * viewAspect;
  }

  camera.left = midX - halfW;
  camera.right = midX + halfW;
  camera.top = midY + halfH;
  camera.bottom = midY - halfH;
  camera.updateProjectionMatrix();

  if (controls) {
    controls.target.copy(center);
    controls.minDistance = distance;
    controls.maxDistance = distance;
    controls.update();
  }

  return distance;
}

/** Expand ortho frustum if orbit would clip; never shrink (avoids zoom jump). */
function expandOrthoIfClipped(camera, object, aspect) {
  if (!camera?.isOrthographicCamera || !object) return;
  camera.updateMatrixWorld(true);
  const projected = projectedMeshBounds(camera, object);
  if (!projected) return;

  const margin = 1.08;
  const needHalfW = ((projected.maxX - projected.minX) / 2) * margin;
  const needHalfH = ((projected.maxY - projected.minY) / 2) * margin;
  const midX = (projected.minX + projected.maxX) / 2;
  const midY = (projected.minY + projected.maxY) / 2;

  let halfW = Math.max((camera.right - camera.left) / 2, needHalfW);
  let halfH = Math.max((camera.top - camera.bottom) / 2, needHalfH);
  const viewAspect = Math.max(aspect, 0.01);
  if (halfW / halfH > viewAspect) halfH = halfW / viewAspect;
  else halfW = halfH * viewAspect;

  camera.left = midX - halfW;
  camera.right = midX + halfW;
  camera.top = midY + halfH;
  camera.bottom = midY - halfH;
  camera.updateProjectionMatrix();
}

function lerpVec3(a, b, t) {
  return new THREE.Vector3(
    lerp(a.x, b.x, t),
    lerp(a.y, b.y, t),
    lerp(a.z, b.z, t),
  );
}

/** Blend hero isometric → section-2 top-down camera + model pose. */
function applyFlightPose(progress, camera, controls, brain, aspect) {
  if (!camera || !brain) return;

  const t = smoothstep(0.12, 0.92, progress);
  const dir = lerpVec3(CONFIG.cameraDir, CONFIG.landingCameraDir, t);
  if (dir.lengthSq() < 1e-8) dir.set(0, 1, 0);
  dir.normalize();

  const up = lerpVec3(CONFIG.cameraUp, CONFIG.landingCameraUp, t);
  if (up.lengthSq() < 1e-8) up.set(0, 0, -1);
  up.normalize();

  brain.rotation.x = lerp(
    CONFIG.modelRotation.x,
    CONFIG.landingModelRotation.x,
    t,
  );
  brain.rotation.y = lerp(
    CONFIG.modelRotation.y,
    CONFIG.landingModelRotation.y,
    t,
  );
  brain.rotation.z = lerp(
    CONFIG.modelRotation.z,
    CONFIG.landingModelRotation.z,
    t,
  );

  // Mid-flight yaw flourish on top of the lerp (fades out as we settle).
  // Text stays parented with fixed local yaw, so it turns with the chip.
  const flourish = Math.sin(progress * Math.PI) * CONFIG.flightYaw * (1 - t);
  brain.rotation.y += flourish;

  if (aspect > 0) {
    fitCamera(camera, controls, findFitTarget(brain), aspect, dir, up);
  }
}

function syncOrthoAspect(camera, aspect) {
  if (!camera?.isOrthographicCamera) return;
  const midX = (camera.left + camera.right) / 2;
  const midY = (camera.top + camera.bottom) / 2;
  const halfW = (camera.right - camera.left) / 2;
  const halfH = halfW / Math.max(aspect, 0.01);
  camera.left = midX - halfW;
  camera.right = midX + halfW;
  camera.top = midY + halfH;
  camera.bottom = midY - halfH;
  camera.updateProjectionMatrix();
}

async function loadModel(palette = DEFAULT_CHIP_PALETTE) {
  if (!CONFIG.modelSrc) return { group: null, materials: null };

  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  let gltf;
  try {
    gltf = await loader.loadAsync(CONFIG.modelSrc);
  } catch (error) {
    if (!CONFIG.modelSrcFallback) throw error;
    console.warn("Local CPU model failed, using fallback:", error);
    gltf = await loader.loadAsync(CONFIG.modelSrcFallback);
  }

  const materials = createChipMaterials(palette);
  recolorCpuModel(gltf.scene, materials);

  const box = new THREE.Box3().setFromObject(gltf.scene);
  const center = box.getCenter(new THREE.Vector3());
  gltf.scene.position.set(-center.x, -center.y, -center.z);

  const group = new THREE.Group();
  group.add(gltf.scene);
  return { group, materials };
}

/**
 * At progress 0: lock to the original video hotspot.
 * Along the scroll: lerp toward the stable landing, with a downward dive arc.
 * Start is sampled once when progress is near 0 and cached so mid-flight
 * scroll does not drag the origin upward.
 */
let cachedStartRect = null;

function setFlightProgress(progress, syncRenderer, brain, camera, controls) {
  const liveStart = getHeroBrainRect();
  const end = getLandingBrainRect();
  if (!liveStart || !end) return null;

  if (progress < 0.02 || !cachedStartRect) {
    cachedStartRect = { ...liveStart };
  }
  const start = cachedStartRect;

  const easeFn =
    gsap?.parseEase?.("power3.inOut") ||
    ((p) => {
      const x = clamp01(p);
      return x * x * (3 - 2 * x);
    });
  const t = easeFn(progress);
  let lift = Math.sin(progress * Math.PI) * CONFIG.flightLift;
  let arc = Math.sin(progress * Math.PI) * CONFIG.flightArcPx;
  let w;
  let h;
  let cx;
  let cy;

  // Stacked cards (≤899): hard-settle onto #brain-landing — no leftover lift.
  if (isNarrowViewport()) {
    lift = 0;
    arc = 0;
    if (progress >= 0.55) {
      w = end.w;
      h = end.h;
      cx = end.cx;
      cy = end.cy;
    } else {
      const settle = smoothstep(0.35, 0.55, progress);
      w = lerp(start.w, end.w, Math.max(t, settle));
      h = lerp(start.h, end.h, Math.max(t, settle));
      cx = lerp(start.cx, end.cx, Math.max(t, settle));
      cy = lerp(start.cy, end.cy, Math.max(t, settle));
    }
  } else {
    w = lerp(start.w, end.w, t) * (1 + lift);
    h = lerp(start.h, end.h, t) * (1 + lift);
    cx = lerp(start.cx, end.cx, t);
    cy = lerp(start.cy, end.cy, t) + arc;
  }

  // Logical box for cards/pedestal. Render box is larger for orbit margin.
  const box = { x: cx - w / 2, y: cy - h / 2, w, h };
  const bleed = isNarrowViewport()
    ? 1
    : isShortDesktopVision()
      ? Math.min(CONFIG.orbitBleed, 1.28)
      : CONFIG.orbitBleed;
  const renderBox = {
    x: cx - (w * bleed) / 2,
    y: cy - (h * bleed) / 2,
    w: w * bleed,
    h: h * bleed,
  };

  applyOverlayBox(renderBox);

  if (overlay) {
    // Mobile: stay under #hero-main while hero copy is visible.
    // Class + z-index only — never change position (keeps 1→2 / 2→3 scroll).
    // Desktop: classic 26 → 28 under cards.
    if (needsHeroAboveChip()) {
      const underHero = progress <= 0.42;
      overlay.classList.toggle("is-under-hero", underHero);
      overlay.style.zIndex = underHero ? "5" : "28";
    } else {
      overlay.classList.remove("is-under-hero");
      overlay.style.zIndex = progress > 0.45 ? "28" : "26";
    }
  }

  if (brain) {
    overlay.style.filter = "none";
    const aspect = renderBox.w / Math.max(renderBox.h, 1);
    applyFlightPose(progress, camera, controls, brain, aspect);
  } else {
    overlay.style.filter = "none";
    overlay.style.pointerEvents = "none";
  }

  const heroOut = smoothstep(0, 0.42, progress);
  const visionIn = smoothstep(0.28, 0.78, progress);
  const bgSwap = smoothstep(0.12, 0.55, progress);

  if (heroMain) {
    heroMain.style.opacity = String(1 - heroOut);
    if (needsHeroAboveChip()) {
      // Skip filter: filtered HTML often loses to WebGL canvas compositing
      heroMain.style.filter = "";
      heroMain.style.transform =
        heroOut < 0.01
          ? ""
          : `translateY(${heroOut * -36}px) scale(${1 - heroOut * 0.04})`;
      heroMain.style.pointerEvents = "none";
      heroMain.style.visibility = heroOut > 0.92 ? "hidden" : "";
    } else {
      heroMain.style.transform = `translateY(${heroOut * -36}px) scale(${1 - heroOut * 0.04})`;
      heroMain.style.filter = `blur(${heroOut * 8}px)`;
      heroMain.style.pointerEvents = heroOut > 0.85 ? "none" : "auto";
      heroMain.style.visibility = "";
    }
  }
  if (heroBg) {
    heroBg.style.opacity = String(1 - bgSwap * 0.92);
    heroBg.style.transform = `scale(${1 + bgSwap * 0.08})`;
    heroBg.style.filter = `blur(${bgSwap * 10}px)`;
  }
  if (visionStageBg) {
    visionStageBg.style.opacity = String(bgSwap);
  }
  if (sectionVision) {
    const active = progress > 0.42;
    sectionVision.style.opacity = String(visionIn);
    sectionVision.style.visibility = visionIn > 0.02 ? "visible" : "hidden";
    sectionVision.classList.toggle("is-active", active);
    sectionVision.setAttribute("aria-hidden", active ? "false" : "true");
  }
  if (scrollHint) {
    scrollHint.style.opacity = String(0.7 * (1 - smoothstep(0, 0.2, progress)));
  }

  const uiIn = smoothstep(0.42, 0.78, progress);
  if (visionHeading) {
    visionHeading.style.opacity = String(uiIn);
    visionHeading.style.transform =
      uiIn >= 0.98 ? "" : `translateY(${(1 - uiIn) * 16}px)`;
  }
  if (visionPedestal) {
    visionPedestal.style.opacity = isNarrowViewport() ? "0" : String(uiIn);
  }
  visionCards.forEach((card, index) => {
    // Stagger so cards feel like they peel out from the chip, one row at a time
    const cardIn = smoothstep(0.45 + index * 0.05, 0.82, progress);
    const desktop = !isNarrowViewport();
    card.style.opacity = String(cardIn);
    card.style.pointerEvents = cardIn > 0.8 ? "auto" : "none";
    if (desktop) {
      card.style.transform = `translateY(${(1 - cardIn) * 18}px) scale(${0.96 + cardIn * 0.04})`;
    } else {
      card.style.left = "";
      card.style.top = "";
      card.style.right = "";
      card.style.bottom = "";
      // Rise up from the chip (above the list) into each row
      card.style.transform =
        cardIn >= 0.98
          ? ""
          : `translateY(${(1 - cardIn) * -18}px) scale(${0.96 + cardIn * 0.04})`;
    }
  });
  if (visionCta) {
    const ctaIn = smoothstep(0.55, 0.88, progress);
    visionCta.style.opacity = String(ctaIn);
    visionCta.style.transform =
      ctaIn >= 0.98 ? "" : `translateY(${(1 - ctaIn) * 12}px)`;
    visionCta.style.pointerEvents = ctaIn > 0.8 ? "auto" : "none";
  }
  // After card transforms: orbit cards + pedestal + lines around brain
  if (uiIn > 0.05) updateVisionComposition(box);
  if (visionConnectors) {
    visionConnectors.style.opacity = isNarrowViewport() ? "0" : String(uiIn);
  }

  if (overlay) {
    const chipTuning = isChipPosTuning();
    // Vision UI is z-index 30; keep chip under it. On narrow, never steal scroll.
    // While ?chipPos=1, keep the chip interactive for dragging.
    if (chipTuning) {
      overlay.style.pointerEvents = "auto";
      overlay.classList.add("is-interactive");
    } else if (isNarrowViewport() && progress > 0.4) {
      overlay.style.pointerEvents = "none";
      overlay.classList.remove("is-interactive", "is-dragging");
    } else if (progress < 0.35 && brain) {
      overlay.style.pointerEvents = "auto";
      overlay.classList.add("is-interactive");
    }
  }

  if (syncRenderer) syncRenderer(renderBox);
  return box;
}

function setupScrollFlight({
  syncRenderer,
  controls,
  reducedMotion,
  brain,
  camera,
}) {
  if (!flightStage || !overlay) return null;

  const visionDwell = document.querySelector(".vision-dwell");

  /** Land ~2/3 through runway: enough motion, less “frozen” sticky hold. */
  const FLIGHT_COMPLETE_AT = 0.68;

  const readProgress = () => {
    const stageTop = flightStage.offsetTop;
    const runnable = Math.max(1, flightStage.offsetHeight - window.innerHeight);
    const scrolled = window.scrollY - stageTop;
    return clamp01(scrolled / runnable);
  };

  const readExitT = () => {
    // Fade near the end of the short dwell into the light section
    const dwell = visionDwell;
    if (dwell) {
      const exitStart =
        dwell.offsetTop + dwell.offsetHeight * 0.35 - window.innerHeight * 0.15;
      return clamp01(
        (window.scrollY - exitStart) / Math.max(1, window.innerHeight * 0.72),
      );
    }
    const exitStart =
      flightStage.offsetTop + flightStage.offsetHeight - window.innerHeight;
    return clamp01(
      (window.scrollY - exitStart) / Math.max(1, window.innerHeight * 0.72),
    );
  };

  const apply = () => {
    const raw = readProgress();
    const progress = reducedMotion
      ? raw > 0.35
        ? 1
        : 0
      : clamp01(raw / FLIGHT_COMPLETE_AT);

    setFlightProgress(progress, syncRenderer, brain, camera, controls);

    const exitT = readExitT();
    const visionSettled = progress > 0.82;

    if (sectionVision) {
      const base = Number(sectionVision.style.opacity) || 0;
      const next = base * (1 - exitT);
      sectionVision.style.opacity = String(next);
      if (exitT > 0.1) {
        sectionVision.style.pointerEvents = "none";
      } else if (visionSettled) {
        // Keep CTA usable while dwelling on section 2
        sectionVision.style.pointerEvents = "";
      }
      if (exitT > 0.92) {
        sectionVision.style.visibility = "hidden";
        sectionVision.setAttribute("aria-hidden", "true");
        sectionVision.classList.remove("is-active");
      } else if (progress > 0.42 && exitT <= 0.92) {
        sectionVision.style.visibility = "visible";
        sectionVision.setAttribute("aria-hidden", "false");
      }
    }
    if (overlay) {
      if (exitT > 0.02) {
        overlay.style.opacity = String(Math.max(0, 1 - exitT));
        overlay.style.pointerEvents = "none";
        overlay.classList.remove("is-interactive", "is-dragging");
        if (exitT > 0.85) {
          overlay.style.visibility = "hidden";
          overlay.setAttribute("aria-hidden", "true");
        } else {
          overlay.style.visibility = "visible";
          overlay.removeAttribute("aria-hidden");
        }
      } else {
        overlay.style.opacity = "";
        overlay.style.visibility = "";
        overlay.removeAttribute("aria-hidden");
      }
    }

    if (controls) {
      const flying = !reducedMotion && progress > 0.03 && progress < 0.97;
      controls.enabled = !flying && exitT < 0.2;
      if (flying) overlay.classList.remove("is-dragging");
    }
  };

  window.addEventListener("scroll", apply, { passive: true });
  window.addEventListener("resize", apply, { passive: true });
  // Debug panels only — immediate re-apply without waiting for debounced resize.
  window.addEventListener("chippos:update", (e) => {
    cachedStartRect = null;
    const d = e?.detail;
    if (
      d &&
      Number.isFinite(d.x) &&
      Number.isFinite(d.y) &&
      Number.isFinite(d.size)
    ) {
      setChipPosOverrideFromScreen(d.x, d.y, d.size);
    } else {
      clearChipPosOverride();
    }
    apply();
  });
  window.addEventListener("herocrop:update", () => {
    cachedStartRect = null;
    syncHeroFrameToHotspot();
    apply();
  });
  // Re-lock chip when the active plate reports intrinsic size (mobile vs laptop).
  const heroVideo = getHeroVideoEl();
  const onVideoMetrics = () => {
    cachedStartRect = null;
    syncHeroFrameToHotspot();
    apply();
  };
  heroVideo?.addEventListener("loadedmetadata", onVideoMetrics);
  heroVideo?.addEventListener("loadeddata", onVideoMetrics);
  apply();

  return { refresh: apply };
}

async function init() {
  if (!container || !overlay) return;

  // Mobile: lift hero copy into the same stacking context as the chip
  syncIphoneSELocks();
  syncHeroMainStacking();

  const reducedMotion = prefersReducedMotion();
  const wantsModel = Boolean(CONFIG.modelSrc);
  let model = null;
  let controls = null;
  let camera = null;
  let syncRenderer = null;
  let isRunning = true;
  let hasFitted = false;
  let resizeTimer = 0;

  const startPalette = DEFAULT_CHIP_PALETTE;

  if (wantsModel && canvas && detectWebGL()) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = CONFIG.toneMappingExposure;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.05, 100);
    addLights(scene, startPalette);

    controls = new OrbitControls(camera, canvas);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = false;
    controls.enableZoom = false;
    controls.rotateSpeed = isNarrowViewport() ? 0.95 : 0.85;
    controls.minPolarAngle = 0.25;
    controls.maxPolarAngle = Math.PI - 0.35;
    controls.touches = { ONE: THREE.TOUCH.ROTATE };

    controls.addEventListener("change", () => {
      if (!model || !overlay) return;
      const rect = overlay.getBoundingClientRect();
      if (rect.width < 8 || rect.height < 8) return;
      expandOrthoIfClipped(
        camera,
        findFitTarget(model),
        rect.width / Math.max(rect.height, 1),
      );
    });

    syncRenderer = (box) => {
      if (!box || box.w < 8 || box.h < 8) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const sharpen = box.w < 520 ? 1.75 : 1.25;
      renderer.setPixelRatio(Math.min(dpr * sharpen, 3));
      renderer.setSize(box.w, box.h, false);
      const aspect = box.w / Math.max(box.h, 1);
      // Camera pose is owned by applyFlightPose during scroll flight.
      if (model && !hasFitted) {
        applyFlightPose(0, camera, controls, model, aspect);
        hasFitted = true;
      } else {
        syncOrthoAspect(camera, aspect);
      }
    };

    try {
      const loaded = await loadModel(startPalette);
      model = loaded.group;
      if (model) {
        applyModelOrientation(model);
        const grounded = visibleMeshBox(model);
        const footprint = grounded.isEmpty()
          ? 2.2
          : Math.max(
              grounded.max.x - grounded.min.x,
              grounded.max.z - grounded.min.z,
            ) * 0.92;
        model.add(createContactShadow(footprint));
        scene.add(model);
        model.updateWorldMatrix(true, true);
      }
    } catch (error) {
      console.warn("3D overlay model failed to load:", error);
      model = null;
    }

    if (model) {
      overlay.classList.add("is-interactive");
      overlay.setAttribute("role", "img");
      overlay.setAttribute(
        "aria-label",
        "Interactive 3D processor. Drag to rotate.",
      );
      overlay.setAttribute("tabindex", "0");

      overlay.addEventListener("pointerdown", (event) => {
        event.stopPropagation();
        if (!controls.enabled) return;
        overlay.classList.add("is-dragging");
      });
      window.addEventListener("pointerup", () => {
        overlay.classList.remove("is-dragging");
      });

      const tick = (time = 0) => {
        if (!isRunning) return;
        requestAnimationFrame(tick);
        controls.update();
        if (!reducedMotion) {
          updateGlowPulse(model, time);
        }
        renderer.render(scene, camera);
      };
      tick();

      document.addEventListener("visibilitychange", () => {
        isRunning = !document.hidden;
        if (isRunning) tick();
      });
    }
  }

  if (!model) {
    overlay.classList.remove("is-interactive", "is-dragging");
    overlay.removeAttribute("tabindex");
    overlay.setAttribute("aria-hidden", "true");
    if (canvas) canvas.hidden = true;
  }

  setupScrollFlight({
    syncRenderer,
    controls,
    reducedMotion,
    brain: model,
    camera,
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      syncIphoneSELocks();
      syncHeroMainStacking();
      cachedStartRect = null;
      if (ScrollTrigger) ScrollTrigger.refresh();
      const stageTop = flightStage?.offsetTop ?? 0;
      const runnable = Math.max(
        1,
        (flightStage?.offsetHeight ?? window.innerHeight) - window.innerHeight,
      );
      const raw = clamp01((window.scrollY - stageTop) / runnable);
      const progress = reducedMotion
        ? raw > 0.5
          ? 1
          : 0
        : clamp01(raw / 0.68);
      setFlightProgress(progress, syncRenderer, model, camera, controls);
      updateVisionComposition();
    }, 80);
  });

  // Desktop ↔ mobile ↔ tablet landscape: clear sticky coords and re-fit
  const layoutMq = window.matchMedia("(max-width: 899px)");
  const ipadProMq = window.matchMedia(
    "(min-width: 900px) and (max-width: 1366px)",
  );
  const fineMq = window.matchMedia("(hover: hover) and (pointer: fine)");
  const coarseAnyMq = window.matchMedia("(any-pointer: coarse)");
  let wasNarrow = layoutMq.matches;
  let wasIpadPro = ipadProMq.matches;
  let wasFineDesktop = isFinePointerDesktop();
  const onLayoutBreakpoint = () => {
    const nowNarrow = layoutMq.matches;
    const nowIpadPro = ipadProMq.matches;
    const nowFineDesktop = isFinePointerDesktop();
    if (
      nowNarrow === wasNarrow &&
      nowIpadPro === wasIpadPro &&
      nowFineDesktop === wasFineDesktop
    ) {
      return;
    }
    wasNarrow = nowNarrow;
    wasIpadPro = nowIpadPro;
    wasFineDesktop = nowFineDesktop;
    syncIphoneSELocks();
    syncHeroMainStacking();
    resetOverlayLayoutMode();
    cachedStartRect = null;
    if (controls) {
      controls.rotateSpeed = nowNarrow && !nowFineDesktop ? 0.95 : 0.85;
    }
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (ScrollTrigger) ScrollTrigger.refresh();
      setFlightProgress(0, syncRenderer, model, camera, controls);
      updateVisionComposition();
    }, 50);
  };
  const bindMq = (mq) => {
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onLayoutBreakpoint);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(onLayoutBreakpoint);
    }
  };
  bindMq(layoutMq);
  bindMq(ipadProMq);
  bindMq(fineMq);
  bindMq(coarseAnyMq);

  requestAnimationFrame(() => {
    if (ScrollTrigger) ScrollTrigger.refresh();
    setFlightProgress(0, syncRenderer, model, camera, controls);
  });
}

init();

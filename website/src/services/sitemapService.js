import { writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "..", "..");
const SITEMAP_PATH = resolve(PROJECT_ROOT, "public", "sitemap.xml");

/** Public Asas Soft marketing routes (not legacy Prime Gate catalog pages). */
const staticUrls = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/about", changefreq: "monthly", priority: "0.8" },
  { path: "/services", changefreq: "weekly", priority: "0.9" },
  { path: "/projects", changefreq: "weekly", priority: "0.8" },
  { path: "/contact", changefreq: "monthly", priority: "0.8" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/linktree", changefreq: "monthly", priority: "0.4" },
];

function escapeXml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeBaseUrl() {
  const raw = process.env.APP_BASE_URL || "";
  return raw.trim().replace(/\/$/, "");
}

function toLastmod(value) {
  if (!value) return new Date().toISOString().slice(0, 10);
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime())
    ? new Date().toISOString().slice(0, 10)
    : date.toISOString().slice(0, 10);
}

function toAbsoluteUrl(baseUrl, maybePath) {
  if (!maybePath) return "";
  const value = String(maybePath).trim();
  if (!value) return "";
  if (value.startsWith("http://") || value.startsWith("https://")) return value;
  const normalizedPath = value.startsWith("/") ? value : `/${value}`;
  return `${baseUrl}${normalizedPath}`;
}

function createUrlNode({
  loc,
  lastmod,
  changefreq = "weekly",
  priority = "0.8",
}) {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${escapeXml(lastmod)}</lastmod>\n    <changefreq>${escapeXml(changefreq)}</changefreq>\n    <priority>${escapeXml(priority)}</priority>\n  </url>`;
}

function addUrl(urlMap, key, payload) {
  if (!key) return;
  const previous = urlMap.get(key);
  if (!previous) {
    urlMap.set(key, payload);
    return;
  }
  const prevDate = new Date(previous.lastmod);
  const nextDate = new Date(payload.lastmod);
  if (nextDate > prevDate) {
    urlMap.set(key, payload);
  }
}

function getLocales() {
  return (process.env.AVAILABLE_LOCALES || "en,ar,tr")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function addLanguageVariants(
  urlMap,
  loc,
  locales,
  { lastmod, changefreq, priority },
) {
  const def = locales.includes("en") ? "en" : locales[0];
  const sep = loc.includes("?") ? "&" : "?";
  for (const locale of locales) {
    if (locale === def) continue;
    const langLoc = `${loc}${sep}lang=${locale}`;
    addUrl(urlMap, langLoc, { loc: langLoc, lastmod, changefreq, priority });
  }
}

export async function generateSitemap() {
  // Prefer public production URL so local APP_BASE_URL never pollutes sitemap.xml
  const publicBase =
    (process.env.SITEMAP_BASE_URL || "").trim().replace(/\/$/, "") ||
    normalizeBaseUrl();
  const baseUrl = publicBase;

  if (!baseUrl) {
    throw new Error(
      "APP_BASE_URL or SITEMAP_BASE_URL is required to generate sitemap.xml",
    );
  }

  if (/localhost|127\.0\.0\.1/i.test(baseUrl)) {
    throw new Error(
      `Refusing to write sitemap with local base URL (${baseUrl}). Set SITEMAP_BASE_URL=https://asassoft.com`,
    );
  }

  const urls = new Map();
  const locales = getLocales();
  const lastmod = toLastmod(new Date());

  for (const entry of staticUrls) {
    const loc = toAbsoluteUrl(baseUrl, entry.path);
    addUrl(urls, loc, {
      loc,
      lastmod,
      changefreq: entry.changefreq,
      priority: entry.priority,
    });
    addLanguageVariants(urls, loc, locales, {
      lastmod,
      changefreq: entry.changefreq,
      priority: entry.priority,
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[...urls.values()].map(createUrlNode).join("\n")}
</urlset>
`;

  await writeFile(SITEMAP_PATH, xml, "utf8");
  return { count: urls.size, outPath: SITEMAP_PATH };
}

let refreshInProgress = false;
let intervalHandle = null;

async function runSitemapRefresh(reason) {
  if (refreshInProgress) return;
  refreshInProgress = true;
  try {
    const result = await generateSitemap();
    console.log(`[sitemap] Generated (${result.count} URLs) (${reason})`);
  } catch (error) {
    console.warn(`[sitemap] Failed to generate (${reason}):`, error.message);
  } finally {
    refreshInProgress = false;
  }
}

export function startSitemapScheduler() {
  if (intervalHandle) return intervalHandle;

  runSitemapRefresh("startup");
  intervalHandle = setInterval(() => {
    runSitemapRefresh("24h schedule");
  }, ONE_DAY_MS);

  if (typeof intervalHandle.unref === "function") {
    intervalHandle.unref();
  }

  return intervalHandle;
}

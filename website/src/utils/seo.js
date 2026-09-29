import { company, seo, baseUrl } from "../config/site.js";

const DEFAULT_LOCALE = "en";

/**
 * Build absolute page URL, appending ?lang= for non-default locales.
 * @param {string} path - site path e.g. "/about" or "/"
 * @param {string} [locale]
 */
export function buildLocalizedUrl(path = "/", locale = DEFAULT_LOCALE) {
  const base = (baseUrl || "").replace(/\/$/, "");
  if (!base) return path || "/";
  const normalized =
    !path || path === "/" ? "/" : path.startsWith("/") ? path : `/${path}`;
  const absolute = normalized === "/" ? `${base}/` : `${base}${normalized}`;
  if (!locale || locale === DEFAULT_LOCALE) return absolute;
  const sep = absolute.includes("?") ? "&" : "?";
  return `${absolute}${sep}lang=${locale}`;
}

/**
 * Generate SEO meta tags.
 * @param {Object} data - title, description, keywords, image, url, type, locale, robots
 * @param {Object} [defaults] - optional request-scoped defaults
 */
export function generateSEOTags(data = {}, defaults = null) {
  const {
    title,
    description,
    keywords,
    image,
    url,
    type = "website",
    locale = DEFAULT_LOCALE,
    robots = "index, follow",
  } = data;

  const seoDefaults = defaults || seo;
  const imagePath = image ?? company.previewImagePath;
  const imageUrl = imagePath
    ? imagePath.startsWith("http")
      ? imagePath
      : baseUrl
        ? `${baseUrl.replace(/\/$/, "")}${imagePath}`
        : imagePath
    : undefined;

  return {
    title: title ?? seoDefaults.defaultTitle,
    description: description ?? seoDefaults.defaultDescription,
    keywords: keywords ?? seoDefaults.defaultKeywords,
    image: imageUrl,
    url: buildLocalizedUrl(url || "/", locale),
    type,
    locale,
    robots,
    imageWidth: 1200,
    imageHeight: 630,
  };
}

function toAbsolute(pathOrUrl) {
  if (!pathOrUrl) return undefined;
  if (pathOrUrl.startsWith("http")) return pathOrUrl;
  return baseUrl ? `${baseUrl}${pathOrUrl}` : pathOrUrl;
}

function collectSameAs() {
  return [
    company.facebookUrl,
    company.instagramUrl,
    company.linkedinUrl,
    company.twitterUrl,
  ].filter((url) => url && url !== "#");
}

/**
 * Generate Organization + WebSite structured data (JSON-LD)
 */
export function generateStructuredData() {
  const base = baseUrl;
  const co = company;
  const logoUrl = toAbsolute(co.logoPath);
  const sameAs = collectSameAs();
  const organization = {
    "@type": "Organization",
    "@id": base ? `${base}/#organization` : undefined,
    name: co.name,
    legalName: co.legalName || co.name,
    url: base,
    ...(co.email && { email: co.email }),
    ...(co.phone && { telephone: co.phone }),
    ...(logoUrl && { logo: logoUrl }),
    ...(co.description && { description: co.description }),
    ...(sameAs.length && { sameAs }),
    address: {
      "@type": "PostalAddress",
      streetAddress: co.addressLine,
      addressLocality: co.city,
      addressRegion: co.region,
      ...(co.postalCode && { postalCode: co.postalCode }),
      addressCountry: co.countryCode,
    },
    contactPoint: {
      "@type": "ContactPoint",
      telephone: co.phone,
      email: co.email,
      contactType: "customer service",
      availableLanguage: ["ar", "en", "tr"],
    },
  };

  const website = {
    "@type": "WebSite",
    "@id": base ? `${base}/#website` : undefined,
    url: base,
    name: co.name,
    description: co.description || seo.defaultDescription,
    publisher: { "@id": base ? `${base}/#organization` : undefined },
    inLanguage: ["en", "ar", "tr"],
  };

  return {
    "@context": "https://schema.org",
    "@graph": [organization, website],
  };
}

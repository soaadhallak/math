/**
 * Company info and SEO config from environment.
 * Import this module after loadEnv is loaded (see src/config/loadEnv.js). No default values.
 */

export const company = {
  name: process.env.COMPANY_NAME,
  legalName: process.env.COMPANY_LEGAL_NAME,
  tagline: process.env.COMPANY_TAGLINE,
  description: process.env.COMPANY_DESCRIPTION,
  keywords: process.env.COMPANY_KEYWORDS,
  phone: process.env.COMPANY_PHONE,
  email: process.env.COMPANY_EMAIL,
  addressLine: process.env.COMPANY_ADDRESS_LINE,
  city: process.env.COMPANY_CITY,
  region: process.env.COMPANY_REGION,
  postalCode: process.env.COMPANY_POSTAL_CODE,
  countryCode: process.env.COMPANY_COUNTRY_CODE,
  countryName: process.env.COMPANY_COUNTRY_NAME,
  locationUrl: process.env.COMPANY_LOCATION_URL,
  mapEmbedUrl: process.env.COMPANY_MAP_EMBED_URL,
  facebookUrl: process.env.COMPANY_FACEBOOK_URL,
  instagramUrl: process.env.COMPANY_INSTAGRAM_URL,
  linkedinUrl: process.env.COMPANY_LINKEDIN_URL,
  twitterUrl: process.env.COMPANY_TWITTER_URL,
  whatsappNumber: process.env.COMPANY_WHATSAPP_NUMBER,
  workingHours: process.env.COMPANY_WORKING_HOURS,
  weeklyOffDays: process.env.COMPANY_WEEKLY_OFF_DAYS,
  logoPath: "/assets/images/brand/logo.png",
  previewImagePath: "/assets/images/social/og-cover.jpg",
};

export const seo = {
  defaultTitle: process.env.SEO_DEFAULT_TITLE,
  defaultDescription: process.env.SEO_DEFAULT_DESCRIPTION,
  defaultKeywords: process.env.SEO_DEFAULT_KEYWORDS,
};

export const baseUrl = process.env.APP_BASE_URL;

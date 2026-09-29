/**
 * Trim string values in an object
 * @param {Object} obj - Object with string values
 * @returns {Object} - Object with trimmed strings
 */
export function trimStrings(obj) {
  const trimmed = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      trimmed[key] = value.trim();
    } else {
      trimmed[key] = value;
    }
  }
  return trimmed;
}

/**
 * Validate integer doesn't exceed 11 digits
 * @param {number} value - Integer value to validate
 * @returns {boolean} - True if valid
 */
export function validateInteger(value) {
  if (value === null || value === undefined) return true;
  const num = Number(value);
  if (!Number.isInteger(num)) return false;
  return Math.abs(num) < 100000000000; // Less than 11 digits
}

import { supportedLocales } from '../../../shared/schemas/commonSchemas.js';

/**
 * Validate locale is exactly 2 characters and in supported list (shared with admin)
 * @param {string} locale - Locale code
 * @returns {boolean} - True if valid
 */
export function validateLocale(locale) {
  return typeof locale === 'string' && locale.length === 2 && supportedLocales.includes(locale);
}

/**
 * Normalize string to slug format: lowercase, spaces to hyphens, only a-z0-9 and hyphens, no leading/trailing hyphens.
 * @param {string} value - Raw string
 * @returns {string} - Normalized slug (may be empty)
 */
export function normalizeSlug(value) {
  if (value == null || typeof value !== 'string') return '';
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
}

/**
 * Normalize string to media key format: lowercase, spaces to hyphens, only a-z0-9 and hyphens (same as slug, max 50 chars).
 * @param {string} value - Raw string
 * @param {number} maxLength - Max length (default 50)
 * @returns {string} - Normalized key
 */
export function normalizeMediaKey(value, maxLength = 50) {
  if (value == null || typeof value !== 'string') return '';
  const key = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/^-+|-+$/g, '');
  return key.length > maxLength ? key.slice(0, maxLength) : key;
}

/**
 * Validate slug format (after normalization): 5-100 chars, only a-z0-9 and hyphens.
 * @param {string} slug - Slug to validate
 * @returns {boolean} - True if valid
 */
export function validateSlug(slug) {
  if (!slug || typeof slug !== 'string') return false;
  if (slug.length < 5 || slug.length > 100) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/**
 * Validate media key format: 1-50 chars, only a-z0-9 and hyphens.
 * @param {string} key - Key to validate
 * @returns {boolean} - True if valid
 */
export function validateMediaKey(key) {
  if (!key || typeof key !== 'string') return false;
  if (key.length < 1 || key.length > 50) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key);
}

/**
 * Validate string length (min/max). Use for required or optional fields.
 * @param {string} value - String to validate (can be null/undefined for optional)
 * @param {number} min - Minimum length (inclusive)
 * @param {number} max - Maximum length (inclusive)
 * @param {boolean} required - If true, null/undefined/empty fails; if false, they pass
 * @returns {boolean} - True if valid
 */
export function validateStringLength(value, min, max, required = true) {
  if (value === null || value === undefined) return !required;
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s.length === 0) return !required;
  return s.length >= min && s.length <= max;
}

/**
 * Validate optional URL (null/undefined/empty passes; otherwise must be valid URL and max length).
 * @param {string} value - URL string
 * @param {number} maxLength - Max length (default 254)
 * @returns {boolean} - True if valid
 */
export function validateOptionalUrl(value, maxLength = 254) {
  if (value === null || value === undefined) return true;
  if (typeof value !== 'string') return false;
  const s = value.trim();
  if (s.length === 0) return true;
  if (s.length > maxLength) return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Throw a validation error (err.name = 'ValidationError') so error handler returns 400.
 * @param {string} message - Error message
 */
export function throwValidationError(message) {
  const err = new Error(message);
  err.name = 'ValidationError';
  throw err;
}

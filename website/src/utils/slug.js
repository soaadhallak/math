import { normalizeSlug } from './validation.js';

/**
 * Generate a URL-friendly slug from a string: lowercase, no spaces (hyphens), only a-z0-9 and hyphens.
 * @param {string} text - The text to convert to a slug
 * @returns {string} - The generated slug (may be empty)
 */
export function generateSlug(text) {
  return normalizeSlug(text || '');
}

/**
 * Generate a unique slug by appending a number if the slug already exists
 * @param {string} text - The text to convert to a slug
 * @param {Function} checkExists - Async function that checks if slug exists (slug) => Promise<boolean>
 * @returns {Promise<string>} - The unique slug
 */
export async function generateUniqueSlug(text, checkExists) {
  let baseSlug = generateSlug(text);
  if (!baseSlug) baseSlug = 'item';
  let slug = baseSlug;
  let counter = 1;

  while (await checkExists(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}

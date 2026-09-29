/**
 * Slug and key normalization/validation. Must match backend (website/src/utils/validation.js).
 * Rules: no spaces (use hyphens), all lowercase, only a-z0-9 and hyphens, no leading/trailing hyphens.
 */

/** Normalize to slug format: lowercase, spaces to hyphens, only a-z0-9 and hyphens. */
export function normalizeSlug(value: string | null | undefined): string {
  if (value == null || typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
}

/** Normalize to media key format (same as slug), optionally capped at maxLength. */
export function normalizeMediaKey(
  value: string | null | undefined,
  maxLength: number = 50
): string {
  if (value == null || typeof value !== "string") return "";
  const key = value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/^-+|-+$/g, "");
  return key.length > maxLength ? key.slice(0, maxLength) : key;
}

/** Slug validation: 5–100 chars, only a-z0-9 and hyphens (no spaces). */
export function validateSlug(slug: string | null | undefined): boolean {
  if (!slug || typeof slug !== "string") return false;
  if (slug.length < 5 || slug.length > 100) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

/** Media key validation: 1–50 chars, only a-z0-9 and hyphens. */
export function validateMediaKey(key: string | null | undefined): boolean {
  if (!key || typeof key !== "string") return false;
  if (key.length < 1 || key.length > 50) return false;
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(key);
}

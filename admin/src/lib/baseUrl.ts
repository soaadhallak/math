/**
 * Base URL for the admin app (e.g. /admin-e2891/ when deployed under a subpath).
 * Use for static assets in public/ so they resolve correctly.
 *
 * Use assetUrl() for any static asset path (images, fonts, etc.) so they work when
 * the app is served from a subpath. Currently used for:
 * - images/logo/* (logo.png, logo-dark.png, logo-icon.svg, auth-logo.png)
 * - images/error/* (404.svg, 404-dark.svg)
 * - images/shape/* (grid-01.svg)
 */
export const baseUrl = import.meta.env.BASE_URL;

/** Build full URL for a path under base (strips leading slash from path). */
export function assetUrl(path: string): string {
  return baseUrl + path.replace(/^\//, "");
}

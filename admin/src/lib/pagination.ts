const STORAGE_KEY = "admin_page_size";

/** Default when nothing is stored (or stored value is invalid) */
export const ADMIN_PAGE_SIZE = 20;

/** Options shown in the "per page" dropdown */
export const PAGE_SIZE_OPTIONS = [5, 10, 20, 50, 100] as const;

function isValidPageSize(n: number): n is (typeof PAGE_SIZE_OPTIONS)[number] {
  return PAGE_SIZE_OPTIONS.includes(n as (typeof PAGE_SIZE_OPTIONS)[number]);
}

/** Get page size from localStorage; falls back to ADMIN_PAGE_SIZE if missing or invalid. */
export function getStoredPageSize(): number {
  if (typeof window === "undefined") return ADMIN_PAGE_SIZE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw == null) return ADMIN_PAGE_SIZE;
    const n = parseInt(raw, 10);
    return isValidPageSize(n) ? n : ADMIN_PAGE_SIZE;
  } catch {
    return ADMIN_PAGE_SIZE;
  }
}

/** Save page size to localStorage (use when user changes the dropdown). */
export function setStoredPageSize(size: number): void {
  if (!isValidPageSize(size)) return;
  try {
    localStorage.setItem(STORAGE_KEY, String(size));
  } catch {
    // ignore
  }
}

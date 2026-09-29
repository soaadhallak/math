import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** Uploads directory (must match middleware/upload.js). */
export const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

/** Public directory (built-in assets, seeds use /assets/...; must match main.js static). */
export const PUBLIC_DIR = path.join(__dirname, '..', '..', 'public');

/**
 * Whether a stored path is a local upload (not an external URL).
 * @param {string} storedPath
 * @returns {boolean}
 */
export function isLocalUploadPath(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return false;
  const trimmed = storedPath.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  return trimmed.startsWith('/uploads/') || trimmed.startsWith('uploads/') || (!trimmed.includes('/') && trimmed.length > 0);
}

/**
 * Whether a stored path points to built-in assets under public (e.g. /assets/images/... from seeds).
 * @param {string} storedPath
 * @returns {boolean}
 */
export function isLocalAssetPath(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return false;
  const trimmed = storedPath.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return false;
  return trimmed.startsWith('/assets/') || trimmed.startsWith('assets/');
}

/**
 * Whether a stored path is a local file we are allowed to delete (uploads or public assets).
 * @param {string} storedPath
 * @returns {boolean}
 */
export function isLocalDeletablePath(storedPath) {
  return isLocalUploadPath(storedPath) || isLocalAssetPath(storedPath);
}

/**
 * Resolve a stored path (e.g. /uploads/foo.jpg) to an absolute path under UPLOADS_DIR.
 * Returns null if path would escape uploads (security).
 * @param {string} storedPath
 * @returns {string|null}
 */
export function resolveUploadPath(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return null;
  const trimmed = storedPath.trim();
  if (!isLocalUploadPath(trimmed)) return null;
  // Normalize: /uploads/foo.jpg or uploads/foo.jpg -> foo.jpg
  const basename = trimmed.replace(/^\/?uploads\/?/, '') || trimmed;
  if (!basename || basename.includes('..')) return null;
  const absolute = path.join(UPLOADS_DIR, basename);
  const normalized = path.normalize(absolute);
  if (!normalized.startsWith(UPLOADS_DIR)) return null;
  return normalized;
}

/**
 * Resolve a stored path (e.g. /assets/images/foo.jpg or assets/images/foo.jpg) to an absolute path under PUBLIC_DIR.
 * Returns null if path would escape public (security).
 * @param {string} storedPath
 * @returns {string|null}
 */
export function resolveAssetPath(storedPath) {
  if (!storedPath || typeof storedPath !== 'string') return null;
  const trimmed = storedPath.trim();
  if (!isLocalAssetPath(trimmed)) return null;
  const relative = trimmed.replace(/^\/?assets\/?/, 'assets/');
  if (relative.includes('..')) return null;
  const absolute = path.join(PUBLIC_DIR, relative);
  const normalized = path.normalize(absolute);
  if (!normalized.startsWith(PUBLIC_DIR)) return null;
  return normalized;
}

/**
 * Resolve a stored path to an absolute path we can delete (uploads or public assets). Returns null if not allowed.
 * @param {string} storedPath
 * @returns {string|null}
 */
function resolveDeletablePath(storedPath) {
  return resolveUploadPath(storedPath) || resolveAssetPath(storedPath);
}

/**
 * Delete a single file from storage if it exists and is a local path (uploads or public/assets).
 * Does not throw; logs and ignores errors (e.g. file already missing).
 * @param {string} storedPath - Path as stored in DB (e.g. /uploads/image.jpg or /assets/images/foo.jpg)
 * @returns {Promise<void>}
 */
export async function deleteFileFromStorage(storedPath) {
  const absolute = resolveDeletablePath(storedPath);
  if (!absolute) return;
  try {
    await fs.unlink(absolute);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error('[fileStorage] Failed to delete file:', absolute, err.message);
    }
  }
}

/**
 * Delete multiple files from storage. Skips empty/external paths.
 * @param {string[]} storedPaths
 * @returns {Promise<void>}
 */
export async function deleteFilesFromStorage(storedPaths) {
  if (!Array.isArray(storedPaths)) return;
  const unique = [...new Set(storedPaths)].filter(Boolean);
  await Promise.all(unique.map((p) => deleteFileFromStorage(p)));
}

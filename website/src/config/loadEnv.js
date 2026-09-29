/**
 * Load env by NODE_ENV:
 * - production → .env, then .env.prod, then .env.production (each overrides previous).
 * - development → .env.dev, then .env.development (each overrides previous).
 * - local → .env.local.
 * In monorepo mode, shared env is loaded from repo root first, then website env
 * overrides it. Import this file first in any entry point.
 */
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const currentFileDir = dirname(fileURLToPath(import.meta.url));
const websiteDir = resolve(currentFileDir, '..', '..');
const repoRootDir = resolve(websiteDir, '..');

/** NODE_ENV → ordered list of env files (all existing are loaded in order; later overrides earlier). */
const envFilesByNodeEnv = {
  production: ['.env', '.env.prod', '.env.production'],
  development: ['.env.dev', '.env.development'],
  local: ['.env.local'],
};

/** When NODE_ENV is unset, use development list so .env (production) is never loaded. */
const fallbackEnvLoadOrder = envFilesByNodeEnv.development;

/**
 * Load all existing env files from baseDir in order; each file overrides the previous.
 * Returns list of loaded file names (for logging).
 */
function loadAllExistingFromDir(baseDir, files, options = {}) {
  const loaded = [];
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const path = resolve(baseDir, file);
    if (existsSync(path)) {
      loadEnv({ path, override: i > 0 || options.override, ...options });
      loaded.push(file);
    }
  }
  return loaded;
}

function getFilesForNodeEnv() {
  if (process.env.NODE_ENV && envFilesByNodeEnv[process.env.NODE_ENV]) {
    return envFilesByNodeEnv[process.env.NODE_ENV];
  }
  return fallbackEnvLoadOrder;
}

const filesForEnv = getFilesForNodeEnv();
const loadedFromRoot = loadAllExistingFromDir(repoRootDir, filesForEnv);
const loadedFromWebsite = loadAllExistingFromDir(websiteDir, filesForEnv, { override: true });

const loadedFiles = [
  ...loadedFromRoot.map((f) => `../${f}`),
  ...loadedFromWebsite,
];
const usedFilesLog = loadedFiles.length > 0 ? loadedFiles.join(' -> ') : '(none found)';

console.log("===============================");
console.log('NODE_ENV:', process.env.NODE_ENV ?? '(not set)');
console.log('Env files:', usedFilesLog);
console.log("===============================");

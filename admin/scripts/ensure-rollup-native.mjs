import { execSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";

const PLATFORM_PACKAGES = {
  "darwin-arm64": "@rollup/rollup-darwin-arm64",
  "darwin-x64": "@rollup/rollup-darwin-x64",
  "linux-x64": "@rollup/rollup-linux-x64-gnu",
  "linux-arm64": "@rollup/rollup-linux-arm64-gnu",
  "win32-x64": "@rollup/rollup-win32-x64-msvc",
  "win32-arm64": "@rollup/rollup-win32-arm64-msvc",
};

const platformKey = `${process.platform}-${process.arch}`;
const NATIVE_PKG = PLATFORM_PACKAGES[platformKey];

if (!NATIVE_PKG) {
  process.exit(0);
}

if (process.env.ENSURE_ROLLUP_NATIVE_RUNNING === "1") {
  process.exit(0);
}

const nativeModulePath = path.resolve(process.cwd(), "node_modules", NATIVE_PKG);
if (existsSync(nativeModulePath)) {
  process.exit(0);
}

let rollupVersion;
try {
  const rollupPkg = await import("rollup/package.json", { with: { type: "json" } });
  rollupVersion = rollupPkg.default.version;
} catch {
  console.warn("[ensure-rollup-native] Could not resolve rollup version. Skipping native package check.");
  process.exit(0);
}

console.log(
  `[ensure-rollup-native] Missing ${NATIVE_PKG}. Installing ${NATIVE_PKG}@${rollupVersion}...`,
);

try {
  // Keep this install isolated so npm does not re-resolve workspace peers.
  execSync(
    `npm install --no-audit --no-fund --no-save --package-lock=false --workspaces=false --legacy-peer-deps ${NATIVE_PKG}@${rollupVersion}`,
    {
    stdio: "inherit",
    env: {
      ...process.env,
      ENSURE_ROLLUP_NATIVE_RUNNING: "1",
    },
    },
  );
  console.log(`[ensure-rollup-native] Installed ${NATIVE_PKG}@${rollupVersion}.`);
} catch (error) {
  console.error(
    `[ensure-rollup-native] Failed to install ${NATIVE_PKG}@${rollupVersion}.`,
  );
  throw error;
}

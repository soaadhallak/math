import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import svgr from "vite-plugin-svgr";

declare const process: {
  cwd: () => string;
};

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const adminDir = process.cwd();
  const repoRootDir = "..";

  // Load shared env from repo root, then admin env overrides.
  const sharedEnv = loadEnv(mode, repoRootDir, "");
  const adminEnv = loadEnv(mode, adminDir, "");
  const env = { ...sharedEnv, ...adminEnv };

  // Ensure merged VITE_* keys are available in admin source code via import.meta.env.*
  const mergedViteDefines = Object.fromEntries(
    Object.entries(env)
      .filter(([key]) => key.startsWith("VITE_"))
      .map(([key, value]) => [`import.meta.env.${key}`, JSON.stringify(value)]),
  );

  const ADMIN_BUILD_FOLDER = env.ADMIN_BUILD_FOLDER || "admin-e2891";

  return {
    define: mergedViteDefines,
    base: `/${ADMIN_BUILD_FOLDER}/`,
    build: {
      outDir: `../website/public/${ADMIN_BUILD_FOLDER}`,
      emptyOutDir: true,
    },
    plugins: [
      react(),
      svgr({
        svgrOptions: {
          icon: true,
          // This will transform your SVG to a React component
          exportType: "named",
          namedExport: "ReactComponent",
        },
      }),
    ],
  };
});

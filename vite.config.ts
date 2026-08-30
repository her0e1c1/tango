import babel from "@rolldown/plugin-babel";
import { execFileSync } from "node:child_process";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { pwaOptions } from "./pwa.config";

const getCommitHash = (): string => {
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  } catch {
    // Source archives and restricted builders may omit Git metadata; the app must remain buildable there.
    return "unknown";
  }
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA(pwaOptions),
  ],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __COMMIT_HASH__: JSON.stringify(getCommitHash()),
  },
  build: {
    outDir: "build",
  },
  server: {
    allowedHosts: ["app.test"],
  },
});

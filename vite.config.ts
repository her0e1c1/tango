import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { pwaOptions } from "./pwaConfig";

// https://vitejs.dev/config/
export default defineConfig({
  root: "public",
  publicDir: ".",
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA(pwaOptions),
  ],
  resolve: {
    alias: {
      "/src": `${import.meta.dirname}/src`,
    },
    tsconfigPaths: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    emptyOutDir: true,
    outDir: "../build",
  },
  server: {
    allowedHosts: ["app.test"],
  },
});

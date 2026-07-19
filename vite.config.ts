import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { pwaOptions } from "./pwaConfig";
import { createReactCompilerPlugin } from "./reactCompiler";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), createReactCompilerPlugin(), VitePWA(pwaOptions)],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    outDir: "build",
  },
  server: {
    allowedHosts: ["app.test"],
  },
});

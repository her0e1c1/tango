import babel from "@rolldown/plugin-babel";
import { defineConfig, type Plugin } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { pwaOptions } from "./pwa.config";

const reactDevTools = (): Plugin => ({
  name: "react-devtools",
  apply: (_, { command, mode }) => command === "serve" && mode === "dev",
  transformIndexHtml: {
    order: "pre",
    handler: () => [
      {
        tag: "script",
        attrs: { src: "http://localhost:8097" },
        injectTo: "head-prepend",
      },
    ],
  },
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    reactDevTools(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    VitePWA(pwaOptions),
  ],
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

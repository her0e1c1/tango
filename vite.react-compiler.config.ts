import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

import { createReactCompilerPlugin } from "./reactCompiler";

export default defineConfig({
  plugins: [react(), createReactCompilerPlugin()],
  resolve: {
    tsconfigPaths: true,
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },
  build: {
    outDir: "build",
  },
});

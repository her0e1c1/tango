import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { createReactCompilerPlugin } from "./reactCompiler";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), createReactCompilerPlugin(), tsconfigPaths()],
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

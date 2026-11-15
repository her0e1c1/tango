import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const fixture = (name: string) => fileURLToPath(new URL(`./${name}.ts`, import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: /^(?:@\/shared\/firebase|\.\.\/firebase)$/u, replacement: fixture("firebase") },
      { find: /^@\/entities\/card$/u, replacement: fixture("card") },
      { find: /^@\/entities\/study-answer$/u, replacement: fixture("study-answer") },
      { find: /^@\/entities\/study-session$/u, replacement: fixture("study-session") },
    ],
  },
  define: {
    __APP_VERSION__: JSON.stringify("integration"),
    __COMMIT_HASH__: JSON.stringify("integration"),
  },
});

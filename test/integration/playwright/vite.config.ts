import { fileURLToPath } from "node:url";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";
import { defineConfig } from "vite";

const fixture = (name: string) => fileURLToPath(new URL(`./${name}.ts`, import.meta.url));

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  plugins: [react(), babel({ presets: [reactCompilerPreset()] })],
  resolve: {
    tsconfigPaths: true,
    alias: [
      { find: /^(?:@\/shared\/firebase|\.\.\/firebase)$/u, replacement: fixture("firebase") },
      { find: /^@\/entities\/card$/u, replacement: fixture("card") },
      { find: /^@\/entities\/deck$/u, replacement: fixture("deck") },
      { find: /^@\/entities\/auth$/u, replacement: fixture("auth") },
      { find: /^@\/shared\/files$/u, replacement: fixture("files") },
      { find: /^@\/entities\/study-answer$/u, replacement: fixture("study-answer") },
      { find: /^@\/entities\/study-session$/u, replacement: fixture("study-session") },
      { find: /^firebase\/auth$/u, replacement: fixture("sdk-auth") },
      { find: /^firebase\/firestore$/u, replacement: fixture("sdk-firestore") },
    ],
  },
  define: {
    __APP_VERSION__: JSON.stringify("1.2.3"),
    __COMMIT_HASH__: JSON.stringify("0123456789abcdef0123456789abcdef01234567"),
  },
});

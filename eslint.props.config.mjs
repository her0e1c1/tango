import { defineConfig } from "eslint/config";
import reactX from "eslint-plugin-react-x";

import base from "./eslint.config.mjs";

// Keep experimental prop diagnostics outside lint:eslint's zero-warning gate.
export default defineConfig(base, {
  files: ["src/**/*.tsx"],
  ignores: ["src/**/*.{spec,test,stories}.tsx"],
  plugins: { "react-x": reactX },
  rules: { "react-x/no-unused-props": "warn" },
});

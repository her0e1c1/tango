import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

/** Loaded by Steiger rather than imported by application code. */
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      "fsd/import-locality": "error",
    },
  },
]);

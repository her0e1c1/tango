import fsd from "@feature-sliced/steiger-plugin";
import { defineConfig } from "steiger";

/** @public Loaded by Steiger rather than imported by application code. */
export default defineConfig([
  ...fsd.configs.recommended,
  {
    rules: {
      "fsd/forbidden-imports": "error",
      "fsd/no-public-api-sidestep": "error",
      "fsd/public-api": "error",
      "fsd/segments-by-purpose": "off",
    },
  },
  {
    files: ["./src/entities/study-progress/**", "./src/features/deck-editor/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
  {
    files: ["./src/features/export/**", "./src/features/settings/**"],
    rules: {
      "fsd/no-segmentless-slices": "off",
    },
  },
]);

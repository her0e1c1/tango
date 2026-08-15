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
    files: ["./src/app/**", "./src/pages/**", "./src/widgets/**", "./src/features/**", "./src/entities/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
  {
    files: ["./src/app/**"],
    rules: {
      "fsd/no-global-store-imports": "off",
    },
  },
  {
    files: ["./src/entities/**", "./src/features/**"],
    rules: {
      "fsd/no-ui-in-business-logic": "off",
    },
  },
  {
    files: ["./src/features/**"],
    rules: {
      "fsd/no-cross-slice-dependency": "off",
    },
  },
]);

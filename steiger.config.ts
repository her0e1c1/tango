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
    files: [
      "./src/entities/study-progress/**",
      "./src/features/deck-list/**",
    ],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
  {
    files: ["./src/features/deck/*/**"],
    rules: {
      "fsd/insignificant-slice": "off",
    },
  },
  {
    files: [
      "./src/features/card-edit/**",
      "./src/features/card-list/**",
      "./src/features/deck-edit/**",
      "./src/features/preferences-edit/**",
      "./src/features/sign-in/**",
      "./src/features/sign-out/**",
      "./src/features/study/**",
      "./src/features/study-session-start/**",
    ],
    rules: {
      // Route-specific features intentionally own their workflows while serving a single route adapter.
      "fsd/insignificant-slice": "off",
    },
  },
  {
    files: ["./src/entities/preferences/**"],
    rules: {
      // Preferences is the domain concept's established name, not a plural collection of entities.
      "fsd/inconsistent-naming": "off",
    },
  },
]);

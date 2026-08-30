import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import { createConfig as createBoundariesConfig } from "eslint-plugin-boundaries/config";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

// Keep ESLint focused on application-owned TypeScript.
// TypeScript and Biome cover repository tooling and tests outside src.
const sourceFiles = ["src/**/*.{ts,tsx}"];
// Tests and stories use fixtures, mocks, and direct wiring, so production-only type and UI policies exclude them.
const nonProductionFiles = ["src/**/*.{spec,test,stories}.{ts,tsx}"];
// Stories share those production exemptions, but only spec and test modules use Vitest and Testing Library semantics.
const vitestFiles = ["src/**/*.{spec,test}.{ts,tsx}"];
// Steiger enforces FSD layer and slice boundaries, but it does not protect presentational UI from same-slice
// model imports. Runtime imports are restricted so Pages and Containers connect state and workflows, then pass
// prepared values through props.
// Type-only imports remain allowed so presentational prop types can refer to model-owned types.
// This gitignore-style directory pattern covers model and its descendants at any relative depth.
const sameSliceModelImports = ["../**/model"];

// Flat config composes every matching block. Shared React and parsing checks come first, followed by narrower policies.
export default defineConfig(
  // Hook correctness and React Compiler compatibility must hold in production, tests, and stories alike.
  {
    files: sourceFiles,
    // React Compiler is enabled in Vite, so this preset checks both Hooks semantics and compiler-incompatible patterns.
    extends: [reactHooks.configs.flat["recommended-latest"]],
    languageOptions: {
      // Parse TS and TSX here so every narrower source config uses the same TypeScript syntax and project information.
      parser: tsParser,
      parserOptions: {
        // Use the same TypeScript project graph as tsc so type-aware rules can reason about resolved types.
        projectService: true,
        // Anchor project discovery to this file so lint results do not depend on the process working directory.
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // React Compiler owns routine memoization, so manual caches would duplicate its work and add dependency lists
      // that can become stale.
      // Match identifiers rather than imports alone so qualified calls such as React.useMemo cannot bypass the policy.
      "no-restricted-syntax": [
        "error",
        {
          selector: "Identifier[name='useCallback']",
          message: "Do not use useCallback; rely on React Compiler memoization.",
        },
        {
          selector: "Identifier[name='useMemo']",
          message: "Do not use useMemo; rely on React Compiler memoization.",
        },
      ],
    },
  },
  // Steiger owns FSD dependency direction and public APIs.
  // This guard only keeps src closed to supported top-level layers.
  createBoundariesConfig({
    files: sourceFiles,
    settings: {
      "boundaries/elements": [
        {
          // One classification is enough because this block checks membership, while Steiger distinguishes the layers.
          type: "source",
          // Recognize only the top-level layers supported by the project's FSD architecture.
          pattern: "src/{app,entities,features,pages,shared,widgets}/**",
          // Require a complete project-relative match so a matching suffix inside an unsupported tree is not accepted.
          partialMatch: false,
        },
      ],
      // Vite's ambient declaration lives at src root and intentionally has no FSD layer ownership.
      "boundaries/ignore": ["src/vite-env.d.ts"],
    },
    rules: {
      // Fail closed when a new source file is placed outside an approved top-level layer.
      "boundaries/no-unknown-files": "error",
    },
  }),
  // Apply type-dependent correctness rules only to shipped code.
  // Tests and stories keep the shared checks without this stricter preset.
  {
    files: sourceFiles,
    ignores: nonProductionFiles,
    plugins: {
      // The selected rule-only preset entry still refers to this plugin namespace, so register it explicitly.
      "@typescript-eslint": tseslint,
    },
    // Select only the preset's final type-aware rules.
    // Parsing is configured above, while Biome owns general syntax and style checks.
    extends: [tseslint.configs["flat/strict-type-checked-only"].at(-1)],
    rules: {
      // Concise callbacks often forward void-returning setters.
      // Allow that form without allowing void in value-producing expressions.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
    },
  },
  // FSD permits Feature-to-Entity dependencies, but Feature UI stays props-driven under this project's stricter policy.
  // State and workflows are connected outside presentational UI and passed in as prepared values and callbacks.
  {
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    ignores: nonProductionFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Cover the Entity layer barrel and every slice public API; prop contracts may still import their types.
              group: ["@/entities", "@/entities/*"],
              allowTypeImports: true,
              message: "Feature UI must receive Entity data through presentational props.",
            },
            {
              // Steiger allows same-slice imports, so this closes the runtime UI-to-model path that it cannot detect.
              group: sameSliceModelImports,
              allowTypeImports: true,
              message: "Feature UI must receive Feature state and workflows through props.",
            },
          ],
        },
      ],
    },
  },
  // Page-first permits state and workflow connections only in files explicitly named Page or Container.
  // These filename exemptions are architecture markers; every other production Page UI module remains props-driven.
  {
    files: ["src/pages/*/ui/**/*.{ts,tsx}"],
    ignores: [
      ...nonProductionFiles,
      "src/pages/*/ui/**/*Page.{ts,tsx}",
      "src/pages/*/ui/**/*Container.{ts,tsx}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // Entity data and actions are prepared by the Page or Container; type-only prop contracts remain safe.
              group: ["@/entities", "@/entities/*"],
              allowTypeImports: true,
              message: "Presentational Page UI must receive Entity data and actions through props.",
            },
            {
              // Restrict hook-shaped exports only so presentational Feature components
              // remain available for composition.
              group: ["@/features", "@/features/*"],
              importNamePattern: "^use[A-Z]",
              allowTypeImports: true,
              message: "Only a Page or Container may connect to a Feature hook.",
            },
            {
              // Route-specific model hooks are connected by the Page or Container, then exposed through UI props.
              group: sameSliceModelImports,
              allowTypeImports: true,
              message: "Presentational Page UI must receive Page state and workflows through props.",
            },
          ],
        },
      ],
    },
  },
  // Co-located tests retain the shared React and source-layout checks, then add test-specific correctness rules.
  // Stories are excluded because they are Storybook render fixtures rather than Vitest suites.
  {
    files: vitestFiles,
    // Testing Library favors user-observable interactions, while Vitest validates suite and assertion usage.
    extends: [testingLibrary.configs["flat/react"], vitest.configs.recommended],
  },
);

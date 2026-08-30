import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import { createConfig as createBoundariesConfig } from "eslint-plugin-boundaries/config";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

const sourceFiles = ["src/**/*.{ts,tsx}"];
const nonProductionFiles = ["src/**/*.{spec,test,stories}.{ts,tsx}"];
const vitestFiles = ["src/**/*.{spec,test}.{ts,tsx}"];

export default defineConfig(
  {
    files: sourceFiles,
    extends: [reactHooks.configs.flat["recommended-latest"]],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // Reserve this identifier so imports and React-qualified calls cannot bypass the compiler policy.
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
  // Steiger owns FSD import rules; boundaries only rejects files outside the supported source layers.
  createBoundariesConfig({
    files: sourceFiles,
    settings: {
      "boundaries/elements": [
        {
          type: "source",
          pattern: "src/{app,entities,features,pages,shared,widgets}/**",
          partialMatch: false,
        },
      ],
      "boundaries/ignore": ["src/vite-env.d.ts"],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
    },
  }),
  {
    files: sourceFiles,
    ignores: nonProductionFiles,
    plugins: {
      "@typescript-eslint": tseslint,
    },
    // Use only the type-aware portion so Biome remains the owner of syntax and style diagnostics.
    extends: [tseslint.configs["flat/strict-type-checked-only"].at(-1)],
    rules: {
      // Shorthand callbacks that intentionally return void are established project style, not ambiguous expressions.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
    },
  },
  {
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    ignores: nonProductionFiles,
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/entities", "@/entities/*"],
              allowTypeImports: true,
              message: "Feature UI must receive Entity data through presentational props.",
            },
            {
              group: ["../hooks/*", "../model/*", "../../hooks/*", "../../model/*"],
              allowTypeImports: true,
              message: "Feature UI must receive Feature state and workflows through props.",
            },
          ],
        },
      ],
    },
  },
  // Only Page and Container names declare UI boundaries that may connect to application or domain state.
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
              group: ["@/entities", "@/entities/*"],
              allowTypeImports: true,
              message: "Presentational Page UI must receive Entity data and actions through props.",
            },
            {
              group: ["@/features", "@/features/*"],
              importNamePattern: "^use[A-Z]",
              allowTypeImports: true,
              message: "Only a Page or Container may connect to a Feature hook.",
            },
            {
              // Gitignore directory patterns cover the directory and its descendants at any relative depth.
              group: ["../**/hooks", "../**/model"],
              allowTypeImports: true,
              message: "Presentational Page UI must receive Page state and workflows through props.",
            },
          ],
        },
      ],
    },
  },
  {
    files: vitestFiles,
    extends: [testingLibrary.configs["flat/react"], vitest.configs.recommended],
  },
);

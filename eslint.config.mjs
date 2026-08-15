import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import eslintReact from "@eslint-react/eslint-plugin";
import {
  createConfig as createBoundariesConfig,
  recommended as boundariesRecommended,
} from "eslint-plugin-boundaries/config";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

const sourceFiles = ["src/**/*.{ts,tsx}"];
const testFiles = ["src/**/*.{spec,test,stories}.{ts,tsx}"];
const vitestFiles = ["src/**/*.{spec,test}.{ts,tsx}"];
const sliceLayers = ["entities", "features", "pages", "widgets"];
const nonSliceLayers = ["app", "shared"];
// Use only the type-aware portion so Biome remains the owner of syntax and style diagnostics.
const strictTypeCheckedRules = tseslint.configs["flat/strict-type-checked-only"].at(-1).rules;

export default [
  {
    files: sourceFiles,
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        projectService: true,
        sourceType: "module",
        tsconfigRootDir: import.meta.dirname,
      },
    },
    settings: {
      "import/resolver": {
        typescript: { project: "./tsconfig.json" },
      },
    },
  },
  {
    ...reactHooks.configs.flat["recommended-latest"],
    files: sourceFiles,
  },
  {
    files: sourceFiles,
    plugins: {
      "@eslint-react": eslintReact,
    },
    rules: {
      // React Compiler owns routine memoization; manual memoization must have an observable reason to remain.
      "@eslint-react/no-unnecessary-use-callback": "error",
      "@eslint-react/no-unnecessary-use-memo": "error",
    },
  },
  createBoundariesConfig({
    ...boundariesRecommended,
    files: sourceFiles,
    settings: {
      ...boundariesRecommended.settings,
      "boundaries/elements": [
        {
          type: "grouped-feature",
          pattern: "src/features/*/*",
          mode: "folder",
          capture: ["group", "slice"],
        },
        ...sliceLayers.map((layer) => ({
          type: layer,
          pattern: `src/${layer}/*`,
          mode: "folder",
          capture: ["slice"],
        })),
        ...nonSliceLayers.map((layer) => ({
          type: layer,
          pattern: `src/${layer}/**/*`,
          mode: "full",
        })),
      ],
      "boundaries/ignore": ["src/vite-env.d.ts"],
      "boundaries/dependency-nodes": [
        "import",
        "export",
        "require",
        "dynamic-import",
      ],
    },
    rules: {
      ...boundariesRecommended.rules,
      "boundaries/dependencies": [
        "error",
        {
          checkInternals: true,
          default: "allow",
          rules: [
            {
              from: { type: sliceLayers },
              disallow: {
                dependency: {
                  relationship: { to: "internal" },
                  source: "@/**",
                },
              },
              message: "Use a relative import within the same slice.",
            },
          ],
        },
      ],
      "boundaries/no-unknown-files": "error",
    },
  }),
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/*", "@/features/*/*/**"],
              message: "Grouped feature slices must be composed in a page or app layer.",
            },
          ],
        },
      ],
    },
  },
  {
    files: sourceFiles,
    ignores: testFiles,
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      ...strictTypeCheckedRules,
      // Shorthand callbacks that intentionally return void are established project style, not ambiguous expressions.
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
      // Biome owns these checks, including promise handling and the Types domain rollout in #1013.
      "@typescript-eslint/await-thenable": "off",
      "@typescript-eslint/no-base-to-string": "off",
      "@typescript-eslint/no-floating-promises": "off",
      "@typescript-eslint/no-misused-promises": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
      "@typescript-eslint/no-unnecessary-template-expression": "off",
      "@typescript-eslint/no-unnecessary-type-conversion": "off",
      "@typescript-eslint/prefer-reduce-type-parameter": "off",
      "@typescript-eslint/require-await": "off",
      "@typescript-eslint/restrict-plus-operands": "off",
      // Primitive template interpolation and polymorphic `this` are project policy, not correctness constraints.
      "@typescript-eslint/prefer-return-this-type": "off",
      "@typescript-eslint/restrict-template-expressions": "off",
      // Keep the unsafe-any boundary introduced by #533 explicit as the preset expands around it.
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/no-unsafe-assignment": "error",
      "@typescript-eslint/no-unsafe-call": "error",
      "@typescript-eslint/no-unsafe-member-access": "error",
      "@typescript-eslint/no-unsafe-return": "error",
      "@typescript-eslint/only-throw-error": "error",
    },
  },
  {
    ...testingLibrary.configs["flat/react"],
    files: vitestFiles,
  },
  {
    ...vitest.configs.recommended,
    files: vitestFiles,
  },
];

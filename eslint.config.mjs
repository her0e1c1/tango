import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import {
  createConfig as createBoundariesConfig,
  recommended as boundariesRecommended,
} from "eslint-plugin-boundaries/config";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";

const sourceFiles = ["src/**/*.{ts,tsx}"];
const testFiles = ["src/**/*.{spec,test,stories}.{ts,tsx}"];
const sliceLayers = ["entities", "features", "pages"];
const nonSliceLayers = ["app", "shared"];

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
  createBoundariesConfig({
    ...boundariesRecommended,
    files: sourceFiles,
    settings: {
      ...boundariesRecommended.settings,
      "boundaries/elements": [
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
    files: sourceFiles,
    ignores: testFiles,
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
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
    files: ["src/**/*.spec.{ts,tsx}"],
  },
];

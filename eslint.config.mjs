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
const lintPolicyFixtureFiles = ["test/lint-policy/fixtures/**/*.{js,jsx}"];

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
      "boundaries/dependency-nodes": [
        "import",
        "export",
        "require",
        "dynamic-import",
      ],
    },
  }),
  createBoundariesConfig({
    files: lintPolicyFixtureFiles,
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: {
      "boundaries/elements": [
        {
          type: "fixture-presentation",
          pattern: "test/lint-policy/fixtures/presentation/**",
        },
        {
          type: "fixture-shared-ui",
          pattern: "test/lint-policy/fixtures/shared-ui/**",
        },
        {
          type: "fixture-prohibited",
          pattern: "test/lint-policy/fixtures/prohibited/**",
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: { type: "fixture-presentation" },
              disallow: { to: { type: "fixture-prohibited" } },
            },
          ],
        },
      ],
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

import * as tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";

const legacyElementPaths = [
  "sample/build",
  "src/action",
  "src/adapters",
  "src/auth",
  "src/domain",
  "src/hooks",
  "src/lib",
  "src/services",
  "src/store",
];
const elementTypes = ["app", "page", "widget", "feature", "entity", "shared", "legacy"];

export default [
  {
    ...reactHooks.configs.flat["recommended-latest"],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "./tsconfig.json",
        },
      },
      "boundaries/elements-single-match": true,
      "boundaries/elements": [
        { type: "app", pattern: "src/app", partialMatch: false },
        { type: "page", pattern: "src/pages/*", partialMatch: false },
        { type: "widget", pattern: "src/widgets/*", partialMatch: false },
        { type: "feature", pattern: "src/features/*", partialMatch: false },
        { type: "entity", pattern: "src/entities/*", partialMatch: false },
        { type: "shared", pattern: "src/shared", partialMatch: false },
        { type: "legacy", pattern: "sample/build", partialMatch: false },
        { type: "legacy", pattern: "src/*", partialMatch: false },
      ],
      "boundaries/files": [
        { category: "shared-root", pattern: ["src/constant.ts", "src/util.ts"] },
        { category: "test", pattern: ["**/*.spec.ts", "**/*.spec.tsx"] },
        { category: "story", pattern: ["**/*.stories.ts", "**/*.stories.tsx"] },
        { category: "tooling", pattern: "src/storybook/**/*.{ts,tsx}" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          checkUnknownLocals: true,
          default: "disallow",
          policies: [
            {
              from: { element: { type: "app" } },
              allow: {
                to: {
                  element: {
                    types: {
                      anyOf: ["page", "widget", "feature", "entity", "shared"],
                    },
                  },
                },
              },
            },
            {
              from: { element: { type: "page" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["widget", "feature", "entity", "shared"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "widget" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["feature", "entity", "shared"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "feature" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["entity", "shared"] },
                  },
                },
              },
            },
            {
              from: { element: { type: "entity" } },
              allow: {
                to: { element: { type: "shared" } },
              },
            },
            {
              from: {
                element: {
                  types: { anyOf: ["app", "page", "widget", "feature", "entity"] },
                },
              },
              allow: {
                to: { element: { type: "legacy", path: legacyElementPaths } },
              },
            },
            {
              from: { element: { type: "legacy" } },
              allow: {
                to: {
                  element: {
                    types: { anyOf: ["legacy", "entity", "shared"] },
                  },
                },
              },
            },
            {
              from: {
                element: {
                  types: { anyOf: ["app", "page", "widget", "feature", "entity", "legacy"] },
                },
              },
              allow: { to: { file: { categories: "shared-root" } } },
            },
            {
              from: { file: { categories: "shared-root" } },
              allow: { to: { file: { categories: "shared-root" } } },
            },
            // Logout cleanup still coordinates the study store until application actions move into FSD layers.
            {
              from: { file: { path: "src/action/event.ts" } },
              allow: { to: { element: { type: "feature", path: "src/features/study" } } },
            },
            {
              from: {
                file: {
                  categories: { anyOf: ["test", "story", "tooling"] },
                },
              },
              allow: { to: { element: { types: { anyOf: elementTypes } } } },
            },
          ],
        },
      ],
    },
  },
];

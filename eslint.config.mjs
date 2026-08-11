import * as tsParser from "@typescript-eslint/parser";
import boundaries from "eslint-plugin-boundaries";
import reactHooks from "eslint-plugin-react-hooks";

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
      "boundaries/elements": [
        { type: "app", pattern: "src/app", partialMatch: false },
        { type: "page", pattern: "src/pages/*", partialMatch: false },
        { type: "widget", pattern: "src/widgets/*", partialMatch: false },
        { type: "feature", pattern: "src/features/*", partialMatch: false },
        { type: "entity", pattern: "src/entities/*", partialMatch: false },
        { type: "shared", pattern: "src/shared", partialMatch: false },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
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
          ],
        },
      ],
    },
  },
];

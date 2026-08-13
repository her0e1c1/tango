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
const boundaryElements = [
  {
    type: "presentation",
    pattern: [
      "src/features/*/components/**/*",
      "src/features/*/ui/components/**/*",
      "src/entities/*/components/**/*",
    ],
    mode: "full",
  },
  {
    type: "shared-ui",
    pattern: "src/shared/ui/**/*",
    mode: "full",
  },
  {
    type: "state",
    pattern: [
      "src/features/*/state/**/*",
      "src/entities/*/model/*Store*",
      "src/entities/*/model/*Provider*",
      "src/shared/config/**/*",
      "src/shared/lib/remote-read/**/*",
    ],
    mode: "full",
  },
  {
    type: "infrastructure",
    pattern: [
      "src/entities/*/api/**/*",
      "src/entities/*/hooks/**/*",
      "src/shared/api/**/*",
      "src/shared/files/**/*",
      "src/shared/firebase/**/*",
      "src/shared/firestore/**/*",
      "src/shared/lib/remoteWrite*",
      "src/shared/lib/realtimeChange*",
    ],
    mode: "full",
  },
  {
    type: "entity-contract",
    pattern: ["src/entities/*/model/**/*", "src/entities/*/@x/**/*", "src/entities/*/index.ts"],
    mode: "full",
  },
  {
    type: "orchestration-model",
    pattern: ["src/features/**/*", "src/pages/**/*"],
    mode: "full",
  },
  {
    type: "shared-lib",
    pattern: "src/shared/**/*",
    mode: "full",
  },
  {
    type: "app",
    pattern: "src/app/**/*",
    mode: "full",
  },
];

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
        typescript: {
          project: "./tsconfig.json",
        },
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
      "boundaries/elements": boundaryElements,
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

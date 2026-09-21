import tseslint from "@typescript-eslint/eslint-plugin";
import * as tsParser from "@typescript-eslint/parser";
import { defineConfig } from "eslint/config";
import { createConfig as createBoundariesConfig } from "eslint-plugin-boundaries/config";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";
import vitest from "@vitest/eslint-plugin";

// lint:tsc uses TypeScript 7 via @typescript/native; this parser and Steiger still need the TypeScript 5 API.
// TypeScript and Biome cover tooling and tests outside src.
const sourceFiles = ["src/**/*.{ts,tsx}"];
const nonProductionFiles = ["src/**/*.{spec,test,stories}.{ts,tsx}"];
const vitestFiles = ["src/**/*.{spec,test}.{ts,tsx}"];
const pageRouteImports = ["react-router", "react-router-dom"].map((name) => ({
  name,
  importNames: ["useParams"],
  message: "Import useParams only in *Page components under src/pages/*/ui/.",
}));

// Steiger permits these dependencies, but presentational UI must receive runtime values through props.
const presentationalImports = [
  {
    group: ["@/entities", "@/entities/*"],
    allowTypeImports: true,
    message: "Presentational UI must receive Entity data and actions through props.",
  },
  {
    // This gitignore-style pattern covers model and its descendants at any relative depth.
    group: ["../**/model"],
    allowTypeImports: true,
    message: "Presentational UI must receive same-slice state and workflows through props.",
  },
];

export default defineConfig(
  // Hooks and React Compiler checks also apply to tests and stories.
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
      // Match identifiers so qualified calls such as React.useMemo cannot bypass the policy.
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
  // Steiger owns dependency direction; this guard rejects unsupported top-level source directories.
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
      // Vite's ambient declaration intentionally lives outside the FSD layers.
      "boundaries/ignore": ["src/vite-env.d.ts"],
    },
    rules: {
      "boundaries/no-unknown-files": "error",
    },
  }),
  // Type-aware correctness rules apply only to shipped code.
  {
    files: sourceFiles,
    ignores: nonProductionFiles,
    plugins: { "@typescript-eslint": tseslint },
    // Use only the preset's rules: parsing is configured above, and Biome owns syntax and style.
    extends: [tseslint.configs["flat/strict-type-checked-only"].at(-1)],
    rules: {
      "@typescript-eslint/no-confusing-void-expression": ["error", { ignoreArrowShorthand: true }],
    },
  },
  {
    files: sourceFiles,
    ignores: ["src/pages/*/ui/**/*Page.{ts,tsx}"],
    rules: {
      "no-restricted-imports": ["error", { paths: pageRouteImports }],
    },
  },
  // Each narrower import rule must retain the route restriction because flat config replaces rule options.
  {
    files: ["src/features/*/ui/**/*.{ts,tsx}"],
    ignores: nonProductionFiles,
    rules: {
      "no-restricted-imports": ["error", { paths: pageRouteImports, patterns: presentationalImports }],
    },
  },
  // Page and Container modules may connect state; other production Page UI stays props-driven.
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
          paths: pageRouteImports,
          patterns: [
            ...presentationalImports,
            {
              // Keep presentational Feature components available for composition.
              group: ["@/features", "@/features/*"],
              importNamePattern: "^use[A-Z]",
              allowTypeImports: true,
              message: "Only a Page or Container may connect to a Feature hook.",
            },
          ],
        },
      ],
    },
  },
  // Stories use the shared checks, not Vitest or Testing Library rules.
  {
    files: vitestFiles,
    extends: [testingLibrary.configs["flat/react"], vitest.configs.recommended],
  },
);

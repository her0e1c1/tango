import * as tsParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import testingLibrary from "eslint-plugin-testing-library";

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
    files: ["src/**/*.spec.{ts,tsx}"],
    ...testingLibrary.configs["flat/react"],
  },
];

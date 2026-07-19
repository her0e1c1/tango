import tsParser from "@typescript-eslint/parser";
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
    plugins: {
      boundaries,
    },
    settings: {
      "import/resolver": {
        typescript: true,
      },
      "boundaries/elements": [
        {
          type: "feature",
          pattern: "src/features/*",
          capture: ["feature"],
        },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          policies: [
            {
              from: {
                element: {
                  type: "feature",
                },
              },
              disallow: {
                element: {
                  type: "feature",
                  captured: {
                    feature: "!{{feature}}",
                  },
                },
              },
              message: "featureから別のfeatureをimportできません。",
            },
          ],
        },
      ],
    },
  },
];

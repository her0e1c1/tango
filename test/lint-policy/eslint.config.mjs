import { createConfig as createBoundariesConfig } from "eslint-plugin-boundaries/config";

import repositoryConfig from "../../eslint.config.mjs";

const fixtureFiles = ["test/lint-policy/fixtures/**/*.js"];

export default [
  ...repositoryConfig,
  createBoundariesConfig({
    files: fixtureFiles,
    settings: {
      "boundaries/elements": [
        {
          type: "presentation",
          pattern: "test/lint-policy/fixtures/*/presentation/**/*.js",
          mode: "full",
        },
        {
          type: "shared-ui",
          pattern: "test/lint-policy/fixtures/*/shared-ui/**/*.js",
          mode: "full",
        },
        {
          type: "prohibited",
          pattern: "test/lint-policy/fixtures/*/prohibited/**/*.js",
          mode: "full",
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
              from: { type: "presentation" },
              disallow: { to: { type: "prohibited" } },
            },
          ],
        },
      ],
    },
  }),
];

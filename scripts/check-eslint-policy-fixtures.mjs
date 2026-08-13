import { relative } from "node:path";

import { ESLint } from "eslint";

import fixtureConfig from "../test/lint-policy/eslint.config.mjs";

const expectedPassPattern = "test/lint-policy/fixtures/pass/**/*.case.js";
const expectedErrorPattern = "test/lint-policy/fixtures/error/**/*.case.js";

const eslint = new ESLint({ overrideConfig: fixtureConfig, overrideConfigFile: true });
const expectedPassResults = await eslint.lintFiles(expectedPassPattern);
const expectedErrorResults = await eslint.lintFiles(expectedErrorPattern);

const unexpectedPassResults = expectedPassResults.filter((result) => result.messages.length > 0);
const unexpectedErrorResults = expectedErrorResults.filter(
  (result) =>
    result.messages.length === 0 ||
    result.messages.some(
      (message) => message.severity !== 2 || message.ruleId?.startsWith("boundaries/") !== true
    )
);

if (unexpectedPassResults.length > 0 || unexpectedErrorResults.length > 0) {
  const formatter = await eslint.loadFormatter("stylish");
  const output = await formatter.format([...unexpectedPassResults, ...unexpectedErrorResults]);
  const expectationFailures = [
    ...unexpectedPassResults.map(
      (result) => `${relative(process.cwd(), result.filePath)}: expected to pass ESLint policy checks`
    ),
    ...unexpectedErrorResults.map(
      (result) => `${relative(process.cwd(), result.filePath)}: expected a boundaries lint error`
    ),
  ];

  console.error(expectationFailures.join("\n"));
  if (output.length > 0) {
    console.error(`\n${output}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `ESLint policy fixtures passed (${expectedPassResults.length} pass, ${expectedErrorResults.length} error).`
  );
}

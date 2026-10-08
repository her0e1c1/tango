import path from "node:path";
import { createRequire } from "node:module";
import process from "node:process";
import * as parser from "@typescript-eslint/parser";
import { ESLint } from "eslint";

const require = createRequire(import.meta.url);
// Madge's extensionless package main is not resolved by Biome; use the same API with an explicit extension.
const madge = require("madge/lib/api.js");

const targets = process.argv.slice(2);
if (targets.length === 0) targets.push("src");

// Zero thresholds expose the tools' measurements without enforcing a new quality gate.
const eslint = new ESLint({
  overrideConfigFile: true,
  allowInlineConfig: false,
  overrideConfig: [
    {
      files: ["**/*.{ts,tsx}"],
      languageOptions: { parser },
      rules: {
        complexity: ["warn", { max: 0, variant: "classic" }],
        "max-depth": ["warn", 0],
      },
    },
  ],
});
const results = await eslint.lintFiles(targets);
const graph = await madge(targets, {
  baseDir: process.cwd(),
  fileExtensions: ["ts", "tsx"],
  tsConfig: "tsconfig.json",
  includeNpm: false,
});

process.stdout.write(
  `${JSON.stringify(
    {
      callTargets: null,
      callTargetsReason: "ESLint and Madge do not resolve function call targets.",
      // Preserve native messages and locations; do not derive metrics by parsing source or diagnostic text.
      measurements: results.map(({ filePath, messages }) => ({
        file: path.relative(process.cwd(), filePath),
        messages,
      })),
      dependencies: Object.entries(graph.obj()).map(([file, dependencies]) => ({
        file,
        count: dependencies.length,
        dependencies,
      })),
      dependencyWarnings: graph.warnings(),
    },
    null,
    2
  )}\n`
);

// Measurement warnings are expected; syntax errors and unusable targets still fail.
if (results.some(({ errorCount, messages }) => errorCount > 0 || messages.some(({ ruleId }) => ruleId === null))) {
  process.exitCode = 1;
}

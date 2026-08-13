import assert from "node:assert/strict";
import { test } from "node:test";

import { ESLint } from "eslint";

const eslint = new ESLint();

test("allows presentation dependencies permitted by the lint policy", async () => {
  const results = await eslint.lintFiles([
    "test/lint-policy/fixtures/presentation/pass-*.jsx",
  ]);

  assert.deepEqual(
    results.flatMap((result) => result.messages),
    [],
  );
});

test("rejects presentation dependencies prohibited by the lint policy", async () => {
  const [result] = await eslint.lintFiles([
    "test/lint-policy/fixtures/presentation/error-*.jsx",
  ]);

  assert.equal(result.errorCount, 1);
  assert.equal(result.messages[0]?.ruleId, "boundaries/dependencies");
});

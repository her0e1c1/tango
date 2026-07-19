import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(path.resolve(process.cwd(), ".github/workflows/test.yml"), "utf8");

describe("Storybook pull request CI", () => {
  it("runs Chromium story tests and preserves failure artifacts", () => {
    expect(workflow).toContain("npx playwright install --with-deps chromium");
    expect(workflow).toContain("npm run test:storybook");
    expect(workflow).toContain("test-results/");
  });
});

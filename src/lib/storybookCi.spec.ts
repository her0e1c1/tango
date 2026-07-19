import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const workflow = readFileSync(path.resolve(process.cwd(), ".github/workflows/test.yml"), "utf8");
const storybookSteps = `      - name: Install Storybook Chromium
        run: npx playwright install --with-deps chromium

      - name: Run Storybook tests
        run: npm run test:storybook`;
const failureArtifactStep = `      - name: Upload Playwright report
        if: \${{ always() }}
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: |
            playwright-report/
            test-results/`;

describe("Storybook pull request CI", () => {
  it("runs Chromium story tests and preserves failure artifacts", () => {
    expect(workflow).toContain(storybookSteps);
    expect(workflow).toContain(failureArtifactStep);
  });
});

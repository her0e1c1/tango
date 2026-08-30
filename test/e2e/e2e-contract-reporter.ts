import { readFileSync } from "node:fs";
import path from "node:path";

import type { FullConfig, FullResult, Reporter, Suite } from "@playwright/test/reporter";

import { requireE2ECaseId, validateE2EContract } from "./yaml-fixture";

const readReadmeCaseIds = (): string[] => {
  const markdown = readFileSync(path.join(process.cwd(), "docs/e2e/README.md"), "utf8");
  return [...markdown.matchAll(/^\| ([A-Z]+-[0-9]{2}) \|/gmu)].map((match) => {
    const caseId = match[1];
    if (caseId === undefined) throw new Error(`Could not parse an E2E case ID from README row: ${match[0]}`);
    return caseId;
  });
};

const validateReadmeIndex = (testTitles: readonly string[]): void => {
  // The fixture contract already proves detailed specifications match tests; this closes the remaining
  // README index gap.
  const testCaseIds = testTitles.map(requireE2ECaseId);
  const indexedCaseIds = readReadmeCaseIds();
  const indexedCounts = new Map<string, number>();
  for (const caseId of indexedCaseIds) {
    indexedCounts.set(caseId, (indexedCounts.get(caseId) ?? 0) + 1);
  }

  const testCaseIdSet = new Set(testCaseIds);
  const indexedCaseIdSet = new Set(indexedCaseIds);
  const missing = [...testCaseIdSet]
    .filter((caseId) => !indexedCaseIdSet.has(caseId))
    .sort((left, right) => left.localeCompare(right));
  const duplicates = [...indexedCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([caseId, count]) => `${caseId} (${String(count)})`)
    .sort((left, right) => left.localeCompare(right));
  const unexpected = [...indexedCaseIdSet]
    .filter((caseId) => !testCaseIdSet.has(caseId))
    .sort((left, right) => left.localeCompare(right));
  const problems = [
    ...(missing.length === 0 ? [] : [`missing README case IDs: ${missing.join(", ")}`]),
    ...(duplicates.length === 0 ? [] : [`duplicate README case IDs: ${duplicates.join(", ")}`]),
    ...(unexpected.length === 0 ? [] : [`unexpected README case IDs: ${unexpected.join(", ")}`]),
  ];
  if (problems.length > 0) throw new Error(`Invalid E2E README index: ${problems.join("; ")}`);
};

class E2EContractReporter implements Reporter {
  private contractStatus: FullResult["status"] = "passed";

  onBegin(_config: FullConfig, suite: Suite) {
    try {
      const testTitles = suite.allTests().map(({ title }) => title);
      validateE2EContract(testTitles);
      validateReadmeIndex(testTitles);
    } catch (error) {
      this.contractStatus = "failed";
      const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
      process.stderr.write(`${message}\n`);
    }
  }

  onEnd(result: FullResult): Promise<{ status: FullResult["status"] }> {
    const status = result.status === "passed" ? this.contractStatus : result.status;
    return Promise.resolve({ status });
  }

  printsToStdio() {
    return true;
  }
}

export default E2EContractReporter;

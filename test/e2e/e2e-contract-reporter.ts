import type { FullConfig, FullResult, Reporter, Suite } from "@playwright/test/reporter";

import { validateE2EContract } from "./yaml-fixture";

class E2EContractReporter implements Reporter {
  private contractStatus: FullResult["status"] = "passed";

  onBegin(_config: FullConfig, suite: Suite) {
    try {
      validateE2EContract(suite.allTests().map(({ title }) => title));
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

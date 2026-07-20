import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "issue-label-guard.yml");
const checkoutAction = "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683";
const setupNodeAction = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020";

function readWorkflow() {
  return parse(readFileSync(workflowPath, "utf8"));
}

function triggersFor(workflow) {
  if (Object.hasOwn(workflow, "on")) {
    return workflow.on;
  }

  expect(Object.hasOwn(workflow, "true")).toBe(true);
  return workflow.true;
}

function expectJobBase(job, group) {
  expect(job).toMatchObject({
    "runs-on": "ubuntu-latest",
    permissions: {
      contents: "read",
      issues: "write",
    },
    concurrency: {
      group,
      "cancel-in-progress": false,
    },
  });
  expect(Object.keys(job.permissions).sort()).toEqual(["contents", "issues"]);
  expect(job.concurrency.group).not.toBe("");
}

function expectSteps(job, name, run, env) {
  expect(job.steps).toEqual([
    { uses: checkoutAction },
    {
      uses: setupNodeAction,
      with: { "node-version": "24.15.0" },
    },
    { name, run, env },
  ]);
}

describe("issue label guard workflow", () => {
  it("reconciles issue events and manual runs with the required least-privilege contract", () => {
    const workflow = readWorkflow();
    const triggers = triggersFor(workflow);

    expect(workflow.name).toBe("Issue label guard");
    expect(Object.keys(triggers).sort()).toEqual(["issues", "workflow_dispatch"]);
    expect(triggers.workflow_dispatch).toBeNull();
    expect(triggers.issues).toEqual({
      types: ["opened", "edited", "reopened", "transferred", "labeled", "unlabeled"],
    });
    expect(workflow.permissions).toEqual({});
    expect(Object.keys(workflow.jobs).sort()).toEqual(["reconcile-all", "reconcile-issue"]);

    const issueJob = workflow.jobs["reconcile-issue"];
    const allJob = workflow.jobs["reconcile-all"];

    expect(issueJob.if).toBe("github.event_name == 'issues'");
    expect(allJob.if).toBe("github.event_name == 'workflow_dispatch'");
    expectJobBase(issueJob, "issue-label-guard-${{ github.repository }}-${{ github.event.issue.number }}");
    expectJobBase(allJob, "issue-label-guard-${{ github.repository }}-all");
    expect(issueJob.concurrency.group).not.toBe(allJob.concurrency.group);

    expectSteps(
      issueJob,
      "Reconcile issue labels",
      'node scripts/reconcile-issue-labels.mjs --repo "$GITHUB_REPOSITORY" --issue "$ISSUE_NUMBER"',
      {
        GH_TOKEN: "${{ github.token }}",
        ISSUE_NUMBER: "${{ github.event.issue.number }}",
      }
    );
    expectSteps(
      allJob,
      "Reconcile all open issues",
      'node scripts/reconcile-issue-labels.mjs --repo "$GITHUB_REPOSITORY" --all-open',
      { GH_TOKEN: "${{ github.token }}" }
    );
  });
});

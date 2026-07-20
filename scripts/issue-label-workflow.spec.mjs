import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

const workflowPath = path.join(process.cwd(), ".github", "workflows", "issue-label-guard.yml");
const checkoutAction = "actions/checkout@11bd71901bbe5b1630ceea73d27597364c9af683";
const setupNodeAction = "actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020";
const workflowKeys = ["jobs", "name", "on", "permissions"];
const jobKeys = ["concurrency", "if", "permissions", "runs-on", "steps"];

function readWorkflow() {
  return parse(readFileSync(workflowPath, "utf8"));
}

function workflowWithTrueTrigger() {
  return parse(readFileSync(workflowPath, "utf8").replace(/^on:/m, "true:"));
}

function alteredWorkflow(mutate) {
  const workflow = readWorkflow();
  mutate(workflow);
  return workflow;
}

function expectExactKeys(value, keys) {
  expect(Object.keys(value).sort()).toEqual(keys);
}

function expectJobBase(job, group) {
  expectExactKeys(job, jobKeys);
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

function expectWorkflowContract(workflow) {
  expectExactKeys(workflow, workflowKeys);
  expect(Object.hasOwn(workflow, "on")).toBe(true);
  expect(Object.hasOwn(workflow, "true")).toBe(false);

  const triggers = workflow.on;

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

  expect(Object.hasOwn(workflow, "env")).toBe(false);
  expect(Object.hasOwn(issueJob, "env")).toBe(false);
  expect(Object.hasOwn(allJob, "env")).toBe(false);
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
  expect(issueJob.steps[2].env.ISSUE_NUMBER).toBe("${{ github.event.issue.number }}");
  expect(allJob.steps.flatMap((step) => Object.keys(step.env ?? {}))).not.toContain("ISSUE_NUMBER");
}

describe("issue label guard workflow", () => {
  it("reconciles issue events and manual runs with the required least-privilege contract", () => {
    expectWorkflowContract(readWorkflow());
  });

  it.each([
    ["a true trigger key", workflowWithTrueTrigger],
    ["a top-level ISSUE_NUMBER environment", () => alteredWorkflow((workflow) => (workflow.env = { ISSUE_NUMBER: "1" }))],
    ["a job-level ISSUE_NUMBER environment", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].env = { ISSUE_NUMBER: "1" }))],
    ["job defaults", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].defaults = { run: { shell: "bash" } }))],
    ["a job container", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].container = "node:24"))],
    ["job services", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].services = { redis: { image: "redis" } }))],
    ["a reusable job", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].uses = "owner/repo/.github/workflows/reusable.yml@main"))],
    ["a job strategy", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].strategy = { matrix: { node: [24] } }))],
    ["a step execution control", () => alteredWorkflow((workflow) => (workflow.jobs["reconcile-issue"].steps[2]["continue-on-error"] = true))],
  ])("rejects %s", (_name, createWorkflow) => {
    expect(() => expectWorkflowContract(createWorkflow())).toThrow();
  });
});

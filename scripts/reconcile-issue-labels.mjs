import { spawn } from "node:child_process";
import { pathToFileURL } from "node:url";
import {
  AREA_LABELS,
  TRIAGE_LABEL,
  TYPE_LABELS,
  evaluateIssuePolicy,
} from "./issue-label-policy.mjs";

export function createGhRunner({ spawnImpl }) {
  return function runGh({ args, input }) {
    return new Promise((resolve, reject) => {
      let child;

      try {
        child = spawnImpl("gh", args, { stdio: ["pipe", "pipe", "pipe"] });
      } catch (error) {
        reject(error);
        return;
      }

      const stdoutChunks = [];
      const stderrChunks = [];

      child.stdout.on("data", (chunk) => stdoutChunks.push(Buffer.from(chunk)));
      child.stderr.on("data", (chunk) => stderrChunks.push(Buffer.from(chunk)));
      child.once("error", reject);
      child.once("close", (code) => {
        const stdout = Buffer.concat(stdoutChunks).toString();
        const stderr = Buffer.concat(stderrChunks).toString();

        if (code === 0) {
          resolve(stdout);
          return;
        }

        const error = new Error(`gh exited with code ${code}: ${stderr}`);
        error.code = code;
        error.stdout = stdout;
        error.stderr = stderr;
        reject(error);
      });

      if (input !== undefined) child.stdin.write(JSON.stringify(input));
      child.stdin.end();
    });
  };
}

export function createGhClient({ runGh }) {
  return {
    async getIssue(repo, issueNumber) {
      const stdout = await runGh({
        args: ["api", "--method", "GET", `repos/${repo}/issues/${issueNumber}`],
      });
      return JSON.parse(stdout);
    },

    async listOpenIssues(repo) {
      const stdout = await runGh({
        args: [
          "api",
          "--method",
          "GET",
          `repos/${repo}/issues?state=open&per_page=100`,
          "--paginate",
          "--slurp",
        ],
      });
      return JSON.parse(stdout).flat();
    },

    async addLabels(repo, issueNumber, labels) {
      await runGh({
        args: ["api", "--method", "POST", `repos/${repo}/issues/${issueNumber}/labels`, "--input", "-"],
        input: { labels },
      });
    },

    async removeTriage(repo, issueNumber) {
      await runGh({
        args: [
          "api",
          "--method",
          "DELETE",
          `repos/${repo}/issues/${issueNumber}/labels/${TRIAGE_LABEL}`,
          "--silent",
        ],
      });
    },
  };
}

function labelNames(issue) {
  return issue.labels.map(({ name }) => name);
}

function isPullRequest(issue) {
  return issue.pull_request !== undefined;
}

export async function reconcileIssue({ repo, issueNumber, client }) {
  const issue = await client.getIssue(repo, issueNumber);

  if (issue.state !== "open") throw new Error(`Issue #${issueNumber} is closed`);
  if (isPullRequest(issue)) throw new Error(`#${issueNumber} is a pull request`);

  const { add, remove } = evaluateIssuePolicy({
    labels: labelNames(issue),
    body: issue.body,
  });

  if (add.length > 0) await client.addLabels(repo, issueNumber, add);

  if (remove.includes(TRIAGE_LABEL)) {
    try {
      await client.removeTriage(repo, issueNumber);
    } catch (deleteError) {
      let current;

      try {
        current = await client.getIssue(repo, issueNumber);
      } catch {
        throw deleteError;
      }

      if (labelNames(current).includes(TRIAGE_LABEL)) throw deleteError;
    }
  }

  return { number: issue.number, add, remove };
}

export async function reconcileAllOpen({ repo, client }) {
  const issues = await client.listOpenIssues(repo);
  const failures = [];
  let processed = 0;
  let skippedPullRequests = 0;

  for (const issue of issues) {
    if (isPullRequest(issue)) {
      skippedPullRequests += 1;
      continue;
    }

    processed += 1;
    try {
      await reconcileIssue({ repo, issueNumber: issue.number, client });
    } catch (error) {
      failures.push({ number: issue.number, error });
    }
  }

  const result = { processed, skippedPullRequests, failures };
  if (failures.length > 0) {
    const error = new AggregateError(
      failures.map((failure) => failure.error),
      `Failed to reconcile ${failures.length} issue(s)`
    );
    error.result = result;
    throw error;
  }

  return result;
}

function auditReasons(issue) {
  const labels = new Set(labelNames(issue));
  const reasons = [];
  const hasType = TYPE_LABELS.some((label) => labels.has(label));
  const hasArea = AREA_LABELS.some((label) => labels.has(label));

  if (!hasType && !labels.has(TRIAGE_LABEL)) reasons.push("missing a type label or needs-triage");
  if (labels.has("bug") && !hasArea) reasons.push("bug requires an area label");
  if (labels.has("enhancement") && !hasArea) reasons.push("enhancement requires an area label");

  return reasons;
}

export async function auditAllOpen({ repo, client }) {
  const issues = await client.listOpenIssues(repo);
  const violations = [];
  let processed = 0;
  let skippedPullRequests = 0;

  for (const issue of issues) {
    if (isPullRequest(issue)) {
      skippedPullRequests += 1;
      continue;
    }

    processed += 1;
    const reasons = auditReasons(issue);
    if (reasons.length > 0) violations.push({ number: issue.number, reasons });
  }

  violations.sort((left, right) => left.number - right.number);
  return { processed, skippedPullRequests, violations };
}

function flagValue(argv, index, flag) {
  const value = argv[index + 1];
  if (value === undefined || value.startsWith("--")) throw new Error(`Missing value for ${flag}`);
  return value;
}

export function parseArgs(argv) {
  let repo;
  const modes = [];

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--repo") {
      if (repo !== undefined) throw new Error("Duplicate --repo");
      repo = flagValue(argv, index, argument);
      index += 1;
      continue;
    }

    if (argument === "--issue") {
      const rawIssueNumber = flagValue(argv, index, argument);
      if (!/^\d+$/.test(rawIssueNumber)) throw new Error("Invalid issue number");
      const issueNumber = Number(rawIssueNumber);
      if (!Number.isSafeInteger(issueNumber) || issueNumber < 1) throw new Error("Invalid issue number");
      modes.push({ mode: "issue", issueNumber });
      index += 1;
      continue;
    }

    if (argument === "--all-open") {
      modes.push({ mode: "all-open" });
      continue;
    }

    if (argument === "--audit") {
      modes.push({ mode: "audit" });
      continue;
    }

    if (argument.startsWith("--")) throw new Error(`Unknown flag: ${argument}`);
    throw new Error(`Unexpected positional argument: ${argument}`);
  }

  if (repo === undefined) throw new Error("Missing --repo");
  if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repo)) throw new Error(`Invalid repository: ${repo}`);
  if (modes.length !== 1) throw new Error("Choose exactly one mode");

  return { repo, ...modes[0] };
}

function write(stream, text) {
  stream.write(text);
}

function printAggregateError(error, stderr) {
  if (error.result === undefined) return false;

  write(
    stderr,
    `Processed ${error.result.processed} issues; skipped ${error.result.skippedPullRequests} pull requests; ` +
      `${error.result.failures.length} failures.\n`
  );
  for (const failure of error.result.failures) {
    write(stderr, `Issue #${failure.number}: ${failure.error.message}\n`);
  }
  return true;
}

export async function main(argv, dependencies = {}) {
  const stdout = dependencies.stdout ?? process.stdout;
  const stderr = dependencies.stderr ?? process.stderr;

  try {
    const options = parseArgs(argv);
    const runGh = dependencies.runGh ?? createGhRunner({ spawnImpl: dependencies.spawnImpl ?? spawn });
    const client = dependencies.client ?? createGhClient({ runGh });

    if (options.mode === "issue") {
      const result = await reconcileIssue({
        repo: options.repo,
        issueNumber: options.issueNumber,
        client,
      });
      write(
        stdout,
        `Issue #${result.number}: add ${result.add.join(", ") || "none"}; ` +
          `remove ${result.remove.join(", ") || "none"}.\n`
      );
      return 0;
    }

    if (options.mode === "all-open") {
      const result = await reconcileAllOpen({ repo: options.repo, client });
      write(
        stdout,
        `Processed ${result.processed} issues; skipped ${result.skippedPullRequests} pull requests; ` +
          `${result.failures.length} failures.\n`
      );
      return 0;
    }

    const result = await auditAllOpen({ repo: options.repo, client });
    write(
      stdout,
      `Audited ${result.processed} issues; skipped ${result.skippedPullRequests} pull requests; ` +
        `found ${result.violations.length} violations.\n`
    );
    for (const violation of result.violations) {
      write(stdout, `Issue #${violation.number}: ${violation.reasons.join("; ")}\n`);
    }
    return result.violations.length > 0 ? 1 : 0;
  } catch (error) {
    if (!printAggregateError(error, stderr)) write(stderr, `${error.message}\n`);
    return 1;
  }
}

const isEntrypoint = process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) process.exitCode = await main(process.argv.slice(2));

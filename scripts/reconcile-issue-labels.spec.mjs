import { EventEmitter } from "node:events";
import { PassThrough } from "node:stream";
import { describe, expect, it, vi } from "vitest";

const modulePath = "./reconcile-issue-labels.mjs";

function issue({ number = 1, state = "open", body = "", labels = [], pullRequest = false } = {}) {
  return {
    number,
    state,
    body,
    labels: labels.map((name) => ({ name })),
    ...(pullRequest ? { pull_request: {} } : {}),
  };
}

function createFakeChild() {
  const child = new EventEmitter();
  child.stdin = {
    write: vi.fn(),
    end: vi.fn(),
  };
  child.stdout = new PassThrough();
  child.stderr = new PassThrough();
  return child;
}

async function loadModule() {
  return import(modulePath);
}

describe("module loading", () => {
  it("is import-safe and exports main without executing it", async () => {
    const imported = await import(`${modulePath}?import-safe=${crypto.randomUUID()}`);

    expect(imported.main).toBeTypeOf("function");
  });
});

describe("createGhRunner", () => {
  it("spawns gh without a shell, writes exact JSON bytes, and collects stdout", async () => {
    const { createGhRunner } = await loadModule();
    const child = createFakeChild();
    const spawnImpl = vi.fn(() => child);
    const runGh = createGhRunner({ spawnImpl });
    const args = ["api", "--method", "POST", "repos/owner/repo/issues/7/labels", "--input", "-"];
    const input = { labels: ["ci", "ui"] };

    const pending = runGh({ args, input });
    child.stdout.write("first");
    child.stdout.write(Buffer.from(" second"));
    child.stderr.end();
    child.stdout.end();
    child.emit("close", 0);

    await expect(pending).resolves.toBe("first second");
    expect(spawnImpl).toHaveBeenCalledExactlyOnceWith("gh", args, {
      stdio: ["pipe", "pipe", "pipe"],
    });
    expect(child.stdin.write).toHaveBeenCalledExactlyOnceWith('{"labels":["ci","ui"]}');
    expect(child.stdin.end).toHaveBeenCalledExactlyOnceWith();
  });

  it("ends stdin without writing when input is absent", async () => {
    const { createGhRunner } = await loadModule();
    const child = createFakeChild();
    const runGh = createGhRunner({ spawnImpl: () => child });

    const pending = runGh({ args: ["api", "--method", "GET", "repos/owner/repo/issues/8"] });
    child.stdout.end();
    child.stderr.end();
    child.emit("close", 0);

    await pending;
    expect(child.stdin.write).not.toHaveBeenCalled();
    expect(child.stdin.end).toHaveBeenCalledExactlyOnceWith();
  });

  it("rejects a nonzero exit with collected stdout and stderr", async () => {
    const { createGhRunner } = await loadModule();
    const child = createFakeChild();
    const runGh = createGhRunner({ spawnImpl: () => child });

    const pending = runGh({ args: ["api", "failure"] });
    child.stdout.end("partial output");
    child.stderr.end("permission denied");
    child.emit("close", 4);

    await expect(pending).rejects.toMatchObject({
      code: 4,
      stdout: "partial output",
      stderr: "permission denied",
    });
  });
});

describe("createGhClient", () => {
  it("uses the exact GET issue call and parses its JSON", async () => {
    const { createGhClient } = await loadModule();
    const expected = issue({ number: 9, labels: ["bug"] });
    const runGh = vi.fn().mockResolvedValue(JSON.stringify(expected));
    const client = createGhClient({ runGh });

    await expect(client.getIssue("owner/repo", 9)).resolves.toEqual(expected);
    expect(runGh).toHaveBeenCalledExactlyOnceWith({
      args: ["api", "--method", "GET", "repos/owner/repo/issues/9"],
    });
  });

  it("lists all pages with exact arguments and flattens beyond 100 issues", async () => {
    const { createGhClient } = await loadModule();
    const firstPage = Array.from({ length: 100 }, (_, index) => issue({ number: index + 1 }));
    const secondPage = [issue({ number: 101 }), issue({ number: 102 })];
    const runGh = vi.fn().mockResolvedValue(JSON.stringify([firstPage, secondPage]));
    const client = createGhClient({ runGh });

    const result = await client.listOpenIssues("owner/repo");

    expect(result).toHaveLength(102);
    expect(result.at(-1).number).toBe(102);
    expect(runGh).toHaveBeenCalledExactlyOnceWith({
      args: [
        "api",
        "--method",
        "GET",
        "repos/owner/repo/issues?state=open&per_page=100",
        "--paginate",
        "--slurp",
      ],
    });
  });
});

describe("reconcileIssue", () => {
  it("refetches, adds deterministic parsed areas, and removes only triage in exact order", async () => {
    const { createGhClient, reconcileIssue } = await loadModule();
    const current = issue({
      number: 12,
      labels: ["enhancement", "needs-triage", "custom"],
      body: "### Change areas\n\ndocs, ci, ui\n\n### Goal\n\nShip it.",
    });
    const runGh = vi
      .fn()
      .mockResolvedValueOnce(JSON.stringify(current))
      .mockResolvedValueOnce(JSON.stringify([{ name: "ci" }, { name: "ui" }, { name: "docs" }]))
      .mockResolvedValueOnce("");
    const client = createGhClient({ runGh });

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 12, client })).resolves.toEqual({
      number: 12,
      add: ["ci", "ui", "docs"],
      remove: ["needs-triage"],
    });
    expect(runGh.mock.calls).toEqual([
      [
        {
          args: ["api", "--method", "GET", "repos/owner/repo/issues/12"],
        },
      ],
      [
        {
          args: ["api", "--method", "POST", "repos/owner/repo/issues/12/labels", "--input", "-"],
          input: { labels: ["ci", "ui", "docs"] },
        },
      ],
      [
        {
          args: [
            "api",
            "--method",
            "DELETE",
            "repos/owner/repo/issues/12/labels/needs-triage",
            "--silent",
          ],
        },
      ],
    ]);
    expect(runGh.mock.calls.flatMap(([call]) => call.args)).not.toContain("PATCH");
  });

  it("rejects a closed issue after refetch and before mutation", async () => {
    const { reconcileIssue } = await loadModule();
    const client = {
      getIssue: vi.fn().mockResolvedValue(issue({ number: 13, state: "closed" })),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 13, client })).rejects.toThrow(
      "Issue #13 is closed"
    );
    expect(client.addLabels).not.toHaveBeenCalled();
    expect(client.removeTriage).not.toHaveBeenCalled();
  });

  it("rejects a pull request after refetch and before mutation", async () => {
    const { reconcileIssue } = await loadModule();
    const client = {
      getIssue: vi.fn().mockResolvedValue(issue({ number: 14, pullRequest: true })),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 14, client })).rejects.toThrow(
      "#14 is a pull request"
    );
    expect(client.addLabels).not.toHaveBeenCalled();
    expect(client.removeTriage).not.toHaveBeenCalled();
  });

  it("is idempotent when rerun after applying parsed Issue Form areas", async () => {
    const { reconcileIssue } = await loadModule();
    const labels = new Set(["bug"]);
    const body = "### Change areas\n\ntest, dev\n\n### Goal\n\nImprove coverage.";
    const client = {
      getIssue: vi.fn(async () => issue({ number: 15, labels: [...labels], body })),
      addLabels: vi.fn(async (_repo, _number, additions) => {
        for (const label of additions) labels.add(label);
      }),
      removeTriage: vi.fn(),
    };

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 15, client })).resolves.toEqual({
      number: 15,
      add: ["test", "dev"],
      remove: [],
    });
    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 15, client })).resolves.toEqual({
      number: 15,
      add: [],
      remove: [],
    });
    expect(client.addLabels).toHaveBeenCalledExactlyOnceWith("owner/repo", 15, ["test", "dev"]);
  });

  it("treats a failed triage DELETE as converged only after a refetch shows it absent", async () => {
    const { reconcileIssue } = await loadModule();
    const deleteError = new Error("gh returned an opaque failure");
    const client = {
      getIssue: vi
        .fn()
        .mockResolvedValueOnce(issue({ number: 16, labels: ["question", "needs-triage"] }))
        .mockResolvedValueOnce(issue({ number: 16, labels: ["question"] })),
      addLabels: vi.fn(),
      removeTriage: vi.fn().mockRejectedValue(deleteError),
    };

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 16, client })).resolves.toEqual({
      number: 16,
      add: [],
      remove: ["needs-triage"],
    });
    expect(client.getIssue.mock.invocationCallOrder[0]).toBeLessThan(client.removeTriage.mock.invocationCallOrder[0]);
    expect(client.removeTriage.mock.invocationCallOrder[0]).toBeLessThan(client.getIssue.mock.invocationCallOrder[1]);
  });

  it("rethrows the original failed DELETE when triage remains after refetch", async () => {
    const { reconcileIssue } = await loadModule();
    const deleteError = new Error("original delete failure");
    const current = issue({ number: 17, labels: ["question", "needs-triage"] });
    const client = {
      getIssue: vi.fn().mockResolvedValue(current),
      addLabels: vi.fn(),
      removeTriage: vi.fn().mockRejectedValue(deleteError),
    };

    await expect(reconcileIssue({ repo: "owner/repo", issueNumber: 17, client })).rejects.toBe(deleteError);
    expect(client.getIssue).toHaveBeenCalledTimes(2);
    expect(client.getIssue.mock.invocationCallOrder[1]).toBeGreaterThan(
      client.removeTriage.mock.invocationCallOrder[0]
    );
  });
});

describe("reconcileAllOpen", () => {
  it("skips pull requests and reconciles every issue", async () => {
    const { reconcileAllOpen } = await loadModule();
    const client = {
      listOpenIssues: vi.fn().mockResolvedValue([
        issue({ number: 20 }),
        issue({ number: 21, pullRequest: true }),
        issue({ number: 22, labels: ["question"] }),
      ]),
      getIssue: vi
        .fn()
        .mockResolvedValueOnce(issue({ number: 20 }))
        .mockResolvedValueOnce(issue({ number: 22, labels: ["question"] })),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    await expect(reconcileAllOpen({ repo: "owner/repo", client })).resolves.toEqual({
      processed: 2,
      skippedPullRequests: 1,
      failures: [],
    });
    expect(client.getIssue.mock.calls).toEqual([
      ["owner/repo", 20],
      ["owner/repo", 22],
    ]);
  });

  it("continues after item failures and throws an aggregate with structured context", async () => {
    const { reconcileAllOpen } = await loadModule();
    const firstError = new Error("first failed");
    const client = {
      listOpenIssues: vi.fn().mockResolvedValue([
        issue({ number: 30 }),
        issue({ number: 31 }),
        issue({ number: 32, pullRequest: true }),
        issue({ number: 33, labels: ["question"] }),
      ]),
      getIssue: vi
        .fn()
        .mockRejectedValueOnce(firstError)
        .mockResolvedValueOnce(issue({ number: 31 }))
        .mockResolvedValueOnce(issue({ number: 33, labels: ["question"] })),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    const caught = await reconcileAllOpen({ repo: "owner/repo", client }).catch((error) => error);

    expect(caught).toBeInstanceOf(AggregateError);
    expect(caught.errors).toEqual([firstError]);
    expect(caught.result).toEqual({
      processed: 3,
      skippedPullRequests: 1,
      failures: [{ number: 30, error: firstError }],
    });
    expect(client.getIssue.mock.calls).toEqual([
      ["owner/repo", 30],
      ["owner/repo", 31],
      ["owner/repo", 33],
    ]);
  });
});

describe("auditAllOpen", () => {
  it("reports strict deterministic violations without mutations or free-text inference", async () => {
    const { auditAllOpen } = await loadModule();
    const client = {
      listOpenIssues: vi.fn().mockResolvedValue([
        issue({ number: 44, labels: ["bug", "needs-triage"] }),
        issue({ number: 41, labels: [], body: "This is probably a UI bug." }),
        issue({ number: 43, labels: ["question"] }),
        issue({ number: 42, labels: ["enhancement", "docs"] }),
        issue({ number: 45, pullRequest: true }),
        issue({ number: 46, labels: ["needs-triage"] }),
        issue({ number: 40, labels: ["docs"] }),
      ]),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    await expect(auditAllOpen({ repo: "owner/repo", client })).resolves.toEqual({
      processed: 6,
      skippedPullRequests: 1,
      violations: [
        { number: 40, reasons: ["missing a type label or needs-triage"] },
        { number: 41, reasons: ["missing a type label or needs-triage"] },
        { number: 44, reasons: ["bug requires an area label"] },
      ],
    });
    expect(client.addLabels).not.toHaveBeenCalled();
    expect(client.removeTriage).not.toHaveBeenCalled();
  });

  it("reports both strict area reasons for an issue with both required types", async () => {
    const { auditAllOpen } = await loadModule();
    const client = {
      listOpenIssues: vi
        .fn()
        .mockResolvedValue([issue({ number: 47, labels: ["bug", "enhancement", "needs-triage"] })]),
    };

    await expect(auditAllOpen({ repo: "owner/repo", client })).resolves.toEqual({
      processed: 1,
      skippedPullRequests: 0,
      violations: [
        {
          number: 47,
          reasons: ["bug requires an area label", "enhancement requires an area label"],
        },
      ],
    });
  });
});

describe("parseArgs", () => {
  it.each([
    [
      ["--repo", "owner/name", "--issue", "123"],
      { repo: "owner/name", mode: "issue", issueNumber: 123 },
    ],
    [["--repo", "owner/name", "--all-open"], { repo: "owner/name", mode: "all-open" }],
    [["--repo", "owner/name", "--audit"], { repo: "owner/name", mode: "audit" }],
  ])("parses a supported mode", async (argv, expected) => {
    const { parseArgs } = await loadModule();

    expect(parseArgs(argv)).toEqual(expected);
  });

  it.each([
    [[], "Missing --repo"],
    [["--repo"], "Missing value for --repo"],
    [["--repo", "owner"], "Invalid repository"],
    [["--repo", "owner/name/extra", "--audit"], "Invalid repository"],
    [["--repo", "owner/name"], "Choose exactly one mode"],
    [["--repo", "owner/name", "--issue"], "Missing value for --issue"],
    [["--repo", "owner/name", "--issue", "0"], "Invalid issue number"],
    [["--repo", "owner/name", "--issue", "1.5"], "Invalid issue number"],
    [["--repo", "owner/name", "--issue", "abc"], "Invalid issue number"],
    [["--repo", "owner/name", "--all-open", "--audit"], "Choose exactly one mode"],
    [["--repo", "owner/name", "--issue", "1", "--all-open"], "Choose exactly one mode"],
    [["--repo", "owner/name", "--audit", "extra"], "Unexpected positional argument"],
    [["--repo", "owner/name", "--unknown"], "Unknown flag"],
    [["--repo", "owner/name", "--audit", "--audit"], "Choose exactly one mode"],
    [["--repo", "owner/name", "--repo", "other/name", "--audit"], "Duplicate --repo"],
  ])("rejects invalid arguments: %j", async (argv, message) => {
    const { parseArgs } = await loadModule();

    expect(() => parseArgs(argv)).toThrow(message);
  });
});

describe("main", () => {
  function outputCapture() {
    return { write: vi.fn() };
  }

  it("prints a deterministic single-issue summary", async () => {
    const { main } = await loadModule();
    const stdout = outputCapture();
    const stderr = outputCapture();
    const client = {
      getIssue: vi.fn().mockResolvedValue(issue({ number: 50 })),
      addLabels: vi.fn(),
      removeTriage: vi.fn(),
    };

    await expect(
      main(["--repo", "owner/name", "--issue", "50"], { client, stdout, stderr })
    ).resolves.toBe(0);
    expect(stdout.write).toHaveBeenCalledExactlyOnceWith(
      "Issue #50: add needs-triage; remove none.\n"
    );
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it("returns nonzero and lists every audit violation", async () => {
    const { main } = await loadModule();
    const stdout = outputCapture();
    const stderr = outputCapture();
    const client = {
      listOpenIssues: vi.fn().mockResolvedValue([
        issue({ number: 51 }),
        issue({ number: 52, labels: ["bug", "needs-triage"] }),
      ]),
    };

    await expect(main(["--repo", "owner/name", "--audit"], { client, stdout, stderr })).resolves.toBe(1);
    expect(stdout.write.mock.calls.map(([text]) => text).join("")).toBe(
      "Audited 2 issues; skipped 0 pull requests; found 2 violations.\n" +
        "Issue #51: missing a type label or needs-triage\n" +
        "Issue #52: bug requires an area label\n"
    );
    expect(stderr.write).not.toHaveBeenCalled();
  });

  it("returns nonzero and prints operational failures", async () => {
    const { main } = await loadModule();
    const stdout = outputCapture();
    const stderr = outputCapture();
    const failure = new Error("GitHub unavailable");
    const client = {
      getIssue: vi.fn().mockRejectedValue(failure),
    };

    await expect(
      main(["--repo", "owner/name", "--issue", "53"], { client, stdout, stderr })
    ).resolves.toBe(1);
    expect(stdout.write).not.toHaveBeenCalled();
    expect(stderr.write).toHaveBeenCalledExactlyOnceWith("GitHub unavailable\n");
  });
});

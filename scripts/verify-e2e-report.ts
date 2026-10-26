import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium, expect, type Browser, type BrowserContext, type Page } from "@playwright/test";
import type { JSONReport, JSONReportSpec, JSONReportSuite } from "@playwright/test/reporter";

const origin = "http://127.0.0.1:9323";
const reportDirectory = process.argv[2] ?? "playwright-report";
const reportFile = process.argv[3] ?? "test-results/e2e-report.json";
const requireTrace = process.env.PLAYWRIGHT_MAIN_TRACE === "true" || process.argv[4] === "--require-trace";
const specs = (suites: JSONReportSuite[]): JSONReportSuite["specs"] =>
  suites.flatMap((suite) => [...suite.specs, ...specs(suite.suites ?? [])]);
const tracePaths = (spec: JSONReportSpec) =>
  spec.tests
    .flatMap((test) => test.results.flatMap((result) => result.attachments))
    .flatMap((attachment) => (attachment.name === "trace" && attachment.path ? [attachment.path] : []));
let stage = "read the generated JSON report";

async function readReport() {
  const report: JSONReport = JSON.parse(await readFile(reportFile, "utf8"));
  const cases = specs(report.suites);
  const total = report.stats.expected + report.stats.unexpected + report.stats.flaky + report.stats.skipped;
  // Both reporters consume this run. Never substitute a retained or synthetic report.
  expect(cases.flatMap((spec) => spec.tests).length).toBe(total);
  expect(total).toBeGreaterThan(0);
  const traced = cases.find((spec) => tracePaths(spec).length > 0);
  const selected = traced ?? cases[0];
  if (!selected) throw new Error("No test to inspect");
  // Successful PR runs intentionally have no traces; main must retain executed attempts.
  expect(requireTrace && total > report.stats.skipped && !traced).toBe(false);
  return { report, total, selected, traced };
}

async function restrictNetwork(context: BrowserContext) {
  const failures = { blocked: 0, http: 0 };
  // The trace viewer needs its service worker. Routing also covers that worker's network requests.
  await context.route("**/*", async (route) => {
    if (new URL(route.request().url()).origin !== origin) {
      failures.blocked += 1;
      await route.abort();
      return;
    }
    // A redirect must not escape the origin without another routing decision.
    await route.fulfill({ response: await route.fetch({ maxRedirects: 0 }) });
  });
  await context.routeWebSocket("**/*", async (socket) => {
    failures.blocked += 1;
    await socket.close();
  });
  context.on("response", (response) => {
    if (response.status() >= 400) failures.http += 1;
  });
  return failures;
}

async function verifyList(page: Page, report: JSONReport, total: number) {
  const counts = {
    All: total - report.stats.skipped,
    Passed: report.stats.expected,
    Failed: report.stats.unexpected,
    Flaky: report.stats.flaky,
    Skipped: report.stats.skipped,
  };
  await Promise.all(
    Object.entries(counts).map(async ([label, count]) => {
      await expect(page.getByRole("link", { name: new RegExp(`^${label}\\s*${count}$`) })).toBeVisible();
    })
  );
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Search tests" })).toBeVisible();
}

async function verifyTraceBytes(page: Page, selected: JSONReportSpec, href: string) {
  const hashes = await Promise.all(
    tracePaths(selected).map(async (path) =>
      createHash("sha256")
        .update(await readFile(path))
        .digest("hex")
    )
  );
  const traces = new URL(href, page.url()).searchParams.getAll("trace");
  expect(traces.length).toBeGreaterThan(0);
  await Promise.all(
    traces.map(async (trace) => {
      expect(new URL(trace).origin).toBe(origin);
      const response = await page.context().request.get(trace, { maxRedirects: 0 });
      expect(response.ok()).toBe(true);
      expect(hashes).toContain(
        createHash("sha256")
          .update(await response.body())
          .digest("hex")
      );
    })
  );
}

async function verifySnapshot(page: Page) {
  await expect(page.locator(".timeline-view")).toBeVisible();
  // Filtering expands grouped test.step actions without depending on the selected error or hook.
  await page.getByRole("searchbox", { name: "Filter actions" }).fill("Navigate");
  await page.locator(".action-title").filter({ hasText: "Navigate" }).first().click();
  const snapshot = page.locator(".snapshot-container iframe.snapshot-visible").contentFrame();
  await expect(snapshot.locator("body")).toBeVisible();
  await expect.poll(() => snapshot.locator("body").evaluate(() => location.pathname)).toContain("/snapshot/");
  await expect(snapshot.locator("body")).not.toHaveText(/Snapshot is not available/);
}

async function verifyTrace(page: Page, selected: JSONReportSpec) {
  stage = "compare the HTML trace attachment with this run's JSON attachment";
  const detailUrl = page.url();
  const run =
    selected.tests[0]?.results.findIndex((result) =>
      result.attachments.some((attachment) => attachment.name === "trace" && attachment.path)
    ) ?? -1;
  expect(run).toBeGreaterThanOrEqual(0);
  if (run > 0) await page.getByRole("tab", { name: new RegExp(`^Retry #${run}\\b`) }).click();
  const link = page.locator('#attachment-trace a[href^="trace/index.html"]').first();
  const href = await link.getAttribute("href");
  if (!href) throw new Error("Missing trace viewer link");
  await verifyTraceBytes(page, selected, href);
  stage = "load the trace timeline and recorded DOM snapshot";
  await link.click();
  await verifySnapshot(page);
  await page.reload();
  await verifySnapshot(page);
  await page.goBack();
  await expect(page).toHaveURL(detailUrl);
}

async function verifyDetail(page: Page, selected: JSONReportSpec, hasTrace: boolean) {
  stage = "open a test detail from the list";
  await page.getByRole("textbox", { name: "Search tests" }).fill(selected.title);
  const entry = page.locator(`a[href*="testId=${selected.id}"]`).first();
  await expect(entry).toBeVisible();
  const listUrl = page.url();
  await entry.click();
  await expect(page.locator(".test-case-column")).toBeVisible();
  if (hasTrace) await verifyTrace(page, selected);
  stage = "reload the detail and return to the list";
  await page.reload();
  await expect(page.locator(".test-case-column")).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(listUrl);
  await expect(page.locator(".test-case-column")).toHaveCount(0);
  await expect(page.getByRole("listitem").first()).toBeVisible();
}

async function verifyReport() {
  const { report, total, selected, traced } = await readReport();
  const server = spawn(
    process.execPath,
    ["node_modules/playwright/cli.js", "show-report", reportDirectory, "--host", "127.0.0.1", "--port", "9323"],
    { stdio: "ignore" }
  );
  let browser: Browser | undefined;
  try {
    stage = "start the loopback report server";
    await expect
      .poll(
        async () =>
          fetch(origin, { redirect: "error" })
            .then((r) => r.ok)
            .catch(() => false),
        { timeout: 15_000 }
      )
      .toBe(true);
    const endpoint = process.env.PW_TEST_CONNECT_WS_ENDPOINT;
    browser = endpoint
      ? await chromium.connect(endpoint, { exposeNetwork: "127.0.0.1:9323", timeout: 15_000 })
      : await chromium.launch();
    const context = await browser.newContext();
    const failures = await restrictNetwork(context);
    const page = await context.newPage();
    stage = "verify external requests are blocked";
    await page.goto(origin);
    expect(
      await page.evaluate(() =>
        fetch("https://report-check.invalid/").then(
          () => false,
          () => true
        )
      )
    ).toBe(true);
    expect(failures.blocked).toBe(1);
    failures.blocked = 0;
    stage = "compare the HTML list with this run's JSON counts";
    await verifyList(page, report, total);
    await verifyDetail(page, selected, Boolean(traced));
    expect(failures.http).toBe(0);
    expect(failures.blocked).toBe(0);
    expect(server.exitCode).toBeNull();
    process.stdout.write(
      `Report browser checks passed: ${total} tests; trace viewing ${traced ? "verified" : "not exercised (no recorded trace)"}.\n`
    );
  } finally {
    try {
      await browser?.close();
    } finally {
      server.kill();
    }
  }
}

// Locator errors can include recorded page text or URLs. Emit no payloads or verification artifacts.
verifyReport().catch(() => {
  process.stderr.write(`Report browser verification failed: ${stage}.\n`);
  process.exitCode = 1;
});

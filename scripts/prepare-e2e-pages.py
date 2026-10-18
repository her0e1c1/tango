"""Validate this run's Playwright report before adding it to the Storybook site."""

import base64
import hashlib
import io
import json
import os
from pathlib import Path
import re
import shutil
import zipfile


artifact = Path("e2e-results")
report = artifact / "playwright-report"
site = Path("storybook-static")
source = json.loads((report / "run.json").read_text())
expected = {"sha": os.environ["GITHUB_SHA"], "run": os.environ["GITHUB_RUN_ID"],
            "attempt": os.environ["GITHUB_RUN_ATTEMPT"]}
if any(source.get(key) != value for key, value in expected.items()):
    raise SystemExit("Report SHA, run, or attempt does not match this build")
if source.get("outcome") not in {"success", "failure"}:
    raise SystemExit("E2E did not finish; refusing to publish an incomplete report")

results = json.loads((artifact / "test-results/report.json").read_text())
if results["errors"] or results["stats"]["skipped"]:
    raise SystemExit("Suite setup errors or skipped tests prevent complete publication")


def tests(suite):
    for spec in suite.get("specs", []):
        yield from spec["tests"]
    for child in suite.get("suites", []):
        yield from tests(child)


cases = [test for suite in results["suites"] for test in tests(suite)]
if not cases or any(not test["results"] for test in cases):
    raise SystemExit("Some tests have no results; refusing incomplete publication")
attempts = [result for test in cases for result in test["results"]]
if not attempts or any(result["status"] not in {"passed", "failed", "timedOut"} for result in attempts):
    raise SystemExit("Missing or interrupted test results prevent publication")
for result in attempts:
    if not any(attachment["name"] == "trace" for attachment in result["attachments"]):
        raise SystemExit("Every main test attempt must include a trace")
    for attachment in result["attachments"]:
        if "path" not in attachment:
            continue
        relative = Path(attachment["path"]).relative_to(Path(results["config"]["configFile"]).parent)
        original = artifact / relative
        contents = original.read_bytes()
        # Match the pinned Playwright HTML reporter; upgrades must recheck attachment/viewer compatibility.
        copied = report / "data" / (hashlib.sha1(contents).hexdigest() + original.suffix)
        if not copied.is_file() or copied.read_bytes() != contents:
            raise SystemExit("An HTML report attachment is missing or incomplete")
        if attachment["name"] == "trace":
            with zipfile.ZipFile(copied) as trace:
                if trace.testzip() is not None or not any(name.endswith(".trace") for name in trace.namelist()):
                    raise SystemExit("A trace is corrupt or missing its events")

for required in [site / "index.html", report / "index.html", report / "trace/index.html",
                 report / "trace/sw.bundle.js"]:
    if not required.is_file() or not required.stat().st_size:
        raise SystemExit(f"Required site asset is missing: {required}")

# Playwright embeds report data in the HTML; ensure it finished writing before publishing.
encoded = re.search(r'<template id="playwrightReportBase64">data:application/zip;base64,([^<]+)</template>',
                    (report / "index.html").read_text())
if encoded is None:
    raise SystemExit("The HTML report is missing its complete embedded data")
with zipfile.ZipFile(io.BytesIO(base64.b64decode(encoded[1], validate=True))) as data:
    if data.testzip() is not None or json.loads(data.read("report.json"))["stats"]["total"] != len(cases):
        raise SystemExit("The HTML report data is corrupt or does not match the test results")

# Public trace contents must be reviewed against the isolated emulator/fixture setup before enabling publication.
# Keep this closed if the required generated-content inspection cannot be completed.
public_content_verified = False
if not public_content_verified:
    raise SystemExit("Public E2E content safety is unverified; E2E report excluded from Pages (issue #1984)")

shutil.copytree(report, site / "e2e")
size = sum(path.stat().st_size for path in site.rglob("*") if path.is_file())
if size >= 1_000_000_000:
    raise SystemExit(f"Combined site is {size} bytes, exceeding the conservative 1 GB Pages limit")
message = (f"Combined site: {size} bytes. Playwright duration: {results['stats']['duration']} ms. "
           f"Source: {source['sha']}; run {source['run']}, attempt {source['attempt']}; "
           f"E2E outcome: {source['outcome']}.\n")
print(message)
with open(os.environ["GITHUB_STEP_SUMMARY"], "a") as summary:
    summary.write(message)

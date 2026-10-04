import { execFileSync } from "node:child_process";
import { appendFileSync, lstatSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { matchesGlob } from "node:path";

function git(...args: string[]) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 16 * 1024 * 1024 });
}

function revision(value: string | undefined) {
  if (!(value && /^[a-f0-9]{40}$/u.test(value))) throw new Error("Pass the exact base and head commit SHAs.");
  git("cat-file", "-e", `${value}^{commit}`);
  return value;
}

function changedFiles(base: string, head: string) {
  const entries = git("diff", "--name-status", "-z", "--find-renames", base, head, "--").split("\0");
  const files: { before: string | undefined; after: string }[] = [];
  while (entries.length > 1) {
    const status = entries.shift();
    const before = entries.shift();
    const after = status?.startsWith("R") ? entries.shift() : before;
    if (!(status && before && after)) throw new Error("Invalid Git change list.");
    if (status !== "D") files.push({ before: status === "A" ? undefined : before, after });
  }
  return files;
}

function inScope(file: string, patterns: string[]) {
  let included = false;
  for (const pattern of patterns) {
    if (pattern.includes(":")) throw new Error("Configured mutation ranges require an explicit intersection.");
    const excluded = pattern.startsWith("!");
    if (matchesGlob(file, excluded ? pattern.slice(1) : pattern)) included = !excluded;
  }
  return included;
}

function changedRanges(base: string, head: string, before: string | undefined, after: string) {
  if (!before) {
    const content = git("show", `${head}:${after}`);
    const lines = content.split("\n").length - Number(content.endsWith("\n"));
    return content ? [`${after}:1-${lines}`] : [];
  }
  // Comparing blobs preserves rename-only skips without confusing quoted Git paths or reused old paths.
  const diff = git(
    "diff",
    "--unified=0",
    "--no-ext-diff",
    "--no-textconv",
    "--no-color",
    `${base}:${before}`,
    `${head}:${after}`
  );
  return [...diff.matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gmu)].flatMap(([, start, count = "1"]) => {
    const length = Number(count);
    return length ? [`${after}:${start}-${Number(start) + length - 1}`] : [];
  });
}

// Never leave a previous local selection runnable after a skip or selection failure.
rmSync("coverage/mutation/stryker-pr.json", { force: true });
rmSync("coverage/mutation/pr-scope.json", { force: true });
const baseSha = revision(process.argv[2]);
const headSha = revision(process.argv[3]);
if (git("rev-parse", "HEAD").trim() !== headSha)
  throw new Error("Check out the exact PR head before selecting mutations.");
const mergeBase = git("merge-base", baseSha, headSha).trim();
const config = JSON.parse(readFileSync("stryker.config.json", "utf8")) as { mutate: string[] };
const mutate = changedFiles(mergeBase, headSha).flatMap(({ before, after }) => {
  if (!inScope(after, config.mutate)) return [];
  // A literal Git path must never expand into a broader Stryker glob or a different range.
  if (/[\n\r\\:*?[\]{}()]/u.test(after)) throw new Error(`Unsupported mutation path: ${JSON.stringify(after)}`);
  const [mode] = git("ls-tree", headSha, "--", after).split(" ");
  if (!(["100644", "100755"].includes(mode ?? "") && lstatSync(after).isFile())) {
    throw new Error(`Mutation targets must be regular files: ${after}`);
  }
  return changedRanges(mergeBase, headSha, before, after);
});

mkdirSync("coverage/mutation", { recursive: true });
writeFileSync(
  "coverage/mutation/pr-scope.json",
  `${JSON.stringify({ base: baseSha, head: headSha, mergeBase, mutate }, null, 2)}\n`
);
if (mutate.length > 0) {
  writeFileSync(
    "coverage/mutation/stryker-pr.json",
    `${JSON.stringify({ ...config, mutate, incremental: false }, null, 2)}\n`
  );
}
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `has-targets=${mutate.length > 0}\n`);
process.stdout.write(
  mutate.length > 0
    ? `PR mutation ranges:\n${mutate.join("\n")}\n`
    : "No added or modified application lines; mutation testing skipped.\n"
);

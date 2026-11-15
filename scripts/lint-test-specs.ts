import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems: string[] = [];
const read = (file: string) => readFileSync(path.resolve(root, file), "utf8");
const files = (directory: string, pattern: RegExp, recursive = true) =>
  readdirSync(path.resolve(root, directory), { encoding: "utf8", recursive })
    .filter((file) => pattern.test(file))
    .map((file) => path.join(directory, file));

function readCases(directory: string) {
  return files(directory, /\.md$/u, false)
    .filter((file) => !["AGENTS.md", "README.md"].includes(path.basename(file)))
    .flatMap((file) => {
      const markdown = read(file);
      const headings = [...markdown.matchAll(/^### ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,})\b.*$/gmu)];
      return headings.map((heading) => ({
        id: heading[1] ?? "",
        file,
        pending: heading[0].includes("[TODO]"),
      }));
    });
}

function labelIds(source: string): Set<string> {
  const prefixes = source.matchAll(/["'`]((?:\[?[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}\]?(?:\s+|(?=["'`])))+)/gu);
  return new Set([...prefixes].flatMap(([, prefix = ""]) => prefix.split(/[\s[\]]+/u)));
}

for (const [directory, testDirectory, pattern] of [
  ["docs/test/e2e", "test/e2e", /\.spec\.tsx?$/u],
  ["docs/test/integration/firestore", "test/integration/firestore", /\.spec\.tsx?$/u],
  ["docs/test/integration/playwright", "test/integration/playwright", /\.spec\.tsx?$/u],
] as const) {
  const source = files(testDirectory, pattern).map(read).join("\n");
  const ids = labelIds(source);

  const cases = readCases(directory);
  const declared = new Set(cases.map(({ id }) => id));
  for (const id of ids) {
    if (
      id.startsWith(
        directory.includes("playwright") ? "PLAYWRIGHT-" : directory.includes("firestore") ? "FIRESTORE-" : ""
      ) &&
      /^[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}$/u.test(id) &&
      !declared.has(id)
    ) {
      problems.push(`${testDirectory}: ${id} has no specification`);
    }
  }

  for (const testCase of cases.filter(({ pending }) => !pending)) {
    if (!ids.has(testCase.id)) problems.push(`${testCase.file}: ${testCase.id} has no matching test label prefix`);
  }
}

// Moving a runtime contract must not leave existing unit or store tests pointing to a retired case.
const declaredIds = new Map<string, string>();
for (const file of files("docs/test", /\.md$/u)) {
  for (const heading of read(file).matchAll(/^### ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,})\b/gmu)) {
    const id = heading[1] ?? "";
    const previous = declaredIds.get(id);
    if (previous) problems.push(`${file}: ${id} is also declared in ${previous}`);
    declaredIds.set(id, file);
  }
}
for (const file of [...files("src", /\.spec\.tsx?$/u), ...files("test/integration", /\.spec\.tsx?$/u, false)]) {
  for (const id of labelIds(read(file))) {
    if (/^[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}$/u.test(id) && !declaredIds.has(id)) {
      problems.push(`${file}: ${id} refers to a retired or missing specification`);
    }
  }
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Specification reference check passed.\n");
}

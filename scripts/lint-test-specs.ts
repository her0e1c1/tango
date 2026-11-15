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

  for (const testCase of readCases(directory).filter(({ pending }) => !pending)) {
    if (!ids.has(testCase.id)) problems.push(`${testCase.file}: ${testCase.id} has no matching test label prefix`);
  }
}

// Preserve the legacy reference guarantee while every new Playwright contract starts pending.
// Legacy labels never satisfy the independent Playwright implementation check above.
const legacyInventory = new Set(
  read("test/integration/storybook/RETIREMENT.md").match(/STORYBOOK-(?:[A-Z]+-)+[0-9]{2,}/gu)
);
const legacySource = files("test/integration/storybook", /\.stories\.tsx?$/u)
  .map(read)
  .join("\n");
const legacyIds = new Set([...labelIds(legacySource)].filter((id) => id.startsWith("STORYBOOK-")));
const componentSource = files("src", /\.stories\.tsx?$/u)
  .map(read)
  .join("\n");
const componentIds = [...labelIds(componentSource)].filter((id) => id.startsWith("STORYBOOK-"));
const playwrightIds = new Set(readCases("docs/test/integration/playwright").map(({ id }) => id));

for (const id of legacyInventory) {
  if (!legacyIds.has(id)) problems.push(`Legacy retirement inventory: ${id} has no matching test label prefix`);
  if (!playwrightIds.has(id.replace("STORYBOOK-", "PLAYWRIGHT-"))) {
    problems.push(`Legacy retirement inventory: ${id} has no Playwright contract`);
  }
}
for (const id of new Set([...legacyIds, ...componentIds])) {
  if (!legacyInventory.has(id)) problems.push(`Legacy Storybook test: ${id} is absent from the retirement inventory`);
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Specification reference check passed.\n");
}

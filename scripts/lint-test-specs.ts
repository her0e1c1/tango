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
      }));
    });
}

for (const [directory, testDirectory, pattern] of [
  ["docs/test/e2e", "test/e2e", /\.spec\.tsx?$/u],
  ["docs/test/integration/firestore", "test/integration/firestore", /\.spec\.tsx?$/u],
  ["docs/test/integration/storybook", "src", /\.stories\.tsx?$/u],
] as const) {
  const source = files(testDirectory, pattern).map(read).join("\n");
  const prefixes = source.matchAll(/["'`]((?:\[?[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}\]?(?:\s+|(?=["'`])))+)/gu);
  const ids = new Set([...prefixes].flatMap(([, prefix = ""]) => prefix.split(/[\s[\]]+/u)));

  for (const testCase of readCases(directory)) {
    if (!ids.has(testCase.id)) problems.push(`${testCase.file}: ${testCase.id} has no matching test label prefix`);
  }
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Specification reference check passed.\n");
}

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
      return headings.map((heading, index) => ({
        id: heading[1] ?? "",
        file,
        body: markdown.slice(heading.index, headings[index + 1]?.index),
      }));
    });
}

for (const [directory, testDirectory] of [
  ["docs/e2e", "test/e2e"],
  ["docs/integration/firestore", "test/integration/firestore"],
] as const) {
  const source = files(testDirectory, /\.spec\.tsx?$/u)
    .map(read)
    .join("\n");
  // Text-only check: accept leading IDs in title strings and scenario tables without evaluating tests.
  const prefixes = source.matchAll(/["'`]((?:[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}(?:\s+|(?=["'`])))+)/gu);
  const ids = new Set([...prefixes].flatMap(([, prefix = ""]) => prefix.trim().split(/\s+/u)));
  for (const { id, file } of readCases(directory)) {
    if (!ids.has(id)) problems.push(`${file}: ${id} has no matching test title prefix`);
  }
}

const stories = new Map(
  files("src", /\.stories\.tsx?$/u).map((file) => [
    file,
    new Set([...read(file).matchAll(/^export\s+const\s+([\w$]+)/gmu)].map(([, name]) => name)),
  ])
);
for (const { id, file, body } of readCases("docs/integration/storybook")) {
  const mapping = /^対応 Story: (.+)$/mu.exec(body)?.[1] ?? "";
  const references = [...mapping.matchAll(/\]\(([^)]+\.stories\.tsx?)\)\s*::\s*`([\w$]+)`/gu)];
  const covered = references.some(([, target = "", name]) =>
    stories.get(path.normalize(path.join(path.dirname(file), target)))?.has(name)
  );
  if (!covered) problems.push(`${file}: ${id} has no matching Story export`);
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("Specification reference check passed.\n");
}

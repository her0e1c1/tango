import { parseSync, traverse } from "@babel/core";
import { execFileSync } from "node:child_process";
import { readFileSync, rmSync, writeFileSync } from "node:fs";

type Location = { start: { line: number; column: number }; end: { line: number; column: number } };

function contains(outer: Location, inner: Location) {
  const startsBefore =
    outer.start.line < inner.start.line ||
    (outer.start.line === inner.start.line && outer.start.column <= inner.start.column);
  const endsAfter =
    outer.end.line > inner.end.line || (outer.end.line === inner.end.line && outer.end.column >= inner.end.column);
  return startsBefore && endsAfter;
}

function syntax(file: string, head: string) {
  const content = readFileSync(file, "utf8");
  const committed = execFileSync("git", ["show", `${head}:${file}`], { encoding: "utf8" });
  if (content !== committed) throw new Error(`Mutation target differs from the selected head: ${file}`);
  const ast = parseSync(content, {
    filename: file,
    configFile: false,
    babelrc: false,
    parserOpts: { plugins: file.endsWith(".tsx") ? ["typescript", "jsx"] : ["typescript"], tokens: true },
  });
  if (!ast) throw new Error(`Cannot parse mutation target: ${file}`);
  const expressions: Location[] = [];
  const boundaries: Location[] = [];
  traverse(ast, {
    enter(path) {
      const location = path.node.loc;
      if (!location) return;
      if (path.isTSType() || path.isImportDeclaration() || path.isDecorator()) {
        boundaries.push(location);
        path.skip();
      } else if (
        path.isFunction() ||
        path.isBlockStatement() ||
        path.isObjectExpression() ||
        path.isArrayExpression() ||
        path.isJSXElement() ||
        path.isJSXFragment()
      ) {
        // Container mutations can erase unrelated statements, properties, or callbacks.
        boundaries.push(location);
      } else if (
        path.isExpression() &&
        !path.isMemberExpression() &&
        !path.node.type.startsWith("TS") &&
        location.start.line < location.end.line
      ) {
        expressions.push(location);
      }
    },
  });
  const tokens = ast.tokens as { type: { label: string } | string; loc: Location }[];
  const codeLines = new Set<number>();
  for (const token of tokens) {
    if (typeof token.type !== "string" && token.type.label !== "eof") {
      const { line: firstLine } = token.loc.start;
      for (let line = firstLine; line <= token.loc.end.line; line += 1) codeLines.add(line);
    }
  }
  return { expressions, boundaries, codeLines };
}

function expand(file: string, changed: Location[], head: string) {
  const { expressions, boundaries, codeLines } = syntax(file, head);
  const ranges = new Set<string>();
  for (const change of changed) {
    const { line: firstLine } = change.start;
    for (let line = firstLine; line <= change.end.line; line += 1) {
      const candidates = expressions.filter(
        (expression) =>
          codeLines.has(line) &&
          expression.start.line <= line &&
          expression.end.line >= line &&
          !boundaries.some((boundary) => contains(expression, boundary))
      );
      // Prefer the innermost expression; never grow again from an already expanded range.
      const innermost = candidates.filter(
        (expression) => !candidates.some((child) => child !== expression && contains(expression, child))
      );
      for (const expression of innermost) {
        if (!changed.some((range) => contains(range, expression)))
          ranges.add(
            `${file}:${expression.start.line}:${expression.start.column}-${expression.end.line}:${expression.end.column}`
          );
      }
    }
  }
  return [...ranges];
}

const scopePath = "coverage/mutation/pr-scope.json";
const configPath = "coverage/mutation/stryker-pr.json";
const scope = JSON.parse(readFileSync(scopePath, "utf8")) as {
  head: string;
  mutate: string[];
  changedLines?: string[];
};
const config = JSON.parse(readFileSync(configPath, "utf8")) as { mutate: string[] };
rmSync(configPath);
if (execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim() !== scope.head) {
  throw new Error("Check out the selected PR head before expanding mutations.");
}
const changedLines = scope.changedLines ?? scope.mutate;
const files = new Map<string, Location[]>();
for (const range of changedLines) {
  const [match] = [...range.matchAll(/^(.*):(\d+)-(\d+)$/gu)];
  if (!match) throw new Error(`Invalid changed-line range: ${range}`);
  const [, file = "", start = "", end = ""] = match;
  const ranges = files.get(file) ?? [];
  ranges.push({
    start: { line: Number(start), column: 0 },
    end: { line: Number(end), column: Number.MAX_SAFE_INTEGER },
  });
  files.set(file, ranges);
}
const expanded = [...files].flatMap(([file, ranges]) => expand(file, ranges, scope.head));
const mutate = [...changedLines, ...expanded];
writeFileSync(scopePath, `${JSON.stringify({ ...scope, changedLines, mutate }, null, 2)}\n`);
writeFileSync(configPath, `${JSON.stringify({ ...config, mutate }, null, 2)}\n`);
process.stdout.write(
  expanded.length > 0 ? `PR expression ranges:\n${expanded.join("\n")}\n` : "No expression range expansion needed.\n"
);

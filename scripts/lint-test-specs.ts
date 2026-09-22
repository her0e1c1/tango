import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems: string[] = [];
const caseIdPattern = /\b[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}\b/gu;
const read = (file: string) => readFileSync(path.resolve(root, file), "utf8");
const files = (directory: string, pattern: RegExp, recursive = true) =>
  readdirSync(path.resolve(root, directory), { encoding: "utf8", recursive })
    .filter((file) => pattern.test(file))
    .map((file) => path.join(directory, file))
    .sort();
const parse = (file: string) => ts.createSourceFile(file, read(file), ts.ScriptTarget.Latest, true);

function withoutFences(markdown: string): string {
  let fence = "";
  return markdown
    .split(/\r?\n/u)
    .map((line) => {
      const marker = /^\s{0,3}(`{3,}|~{3,})/u.exec(line)?.[1] ?? "";
      if (fence) {
        if (marker[0] === fence[0] && marker.length >= fence.length) fence = "";
        return "";
      }
      fence = marker;
      return marker ? "" : line;
    })
    .join("\n");
}

function readCases(directory: string) {
  const seen = new Set<string>();
  return files(directory, /\.md$/u, false)
    .filter((file) => !["AGENTS.md", "README.md"].includes(path.basename(file)))
    .flatMap((file) => {
      const markdown = withoutFences(read(file));
      const headings = [...markdown.matchAll(/^### ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,})\b.*$/gmu)];
      if (!headings.length) problems.push(`${file}: no specification cases found`);
      const ids = new Set(headings.map((heading) => heading[1]));
      for (const [, id] of markdown.matchAll(/^\| ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,}) \|/gmu)) {
        if (!ids.has(id)) problems.push(`${file}: ${id} has no case section`);
      }
      return headings.map((heading, index) => {
        const [, id = ""] = heading;
        if (seen.has(id)) problems.push(`${file}: duplicate specification ID ${id}`);
        seen.add(id);
        return { id, file, body: markdown.slice(heading.index, headings[index + 1]?.index) };
      });
    });
}

function unwrap(node: ts.Node | undefined): ts.Node | undefined {
  if (node && (ts.isAsExpression(node) || ts.isSatisfiesExpression(node) || ts.isParenthesizedExpression(node))) {
    return unwrap(node.expression);
  }
  return node;
}
const isFunction = (node: ts.Node | undefined): node is ts.ArrowFunction | ts.FunctionExpression =>
  node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

function callName(node: ts.Expression): string {
  if (ts.isCallExpression(node)) return callName(node.expression);
  if (ts.isPropertyAccessExpression(node)) return `${callName(node.expression)}.${node.name.text}`;
  return ts.isIdentifier(node) ? node.text : "";
}

function testTitle(node: ts.Node | undefined, bindings: ReadonlyMap<string, string>): string {
  if (!node) return "";
  if (ts.isStringLiteralLike(node)) return node.text;
  if (!ts.isTemplateExpression(node)) return "";
  let title = node.head.text;
  for (const span of node.templateSpans) {
    const value = bindings.get(span.expression.getText());
    if (value === undefined) return node.head.text;
    title += value + span.literal.text;
  }
  return title;
}

function loopBindings(name: string, row: ts.Node): Map<string, string> {
  const result = new Map<string, string>();
  if (ts.isStringLiteralLike(row)) result.set(name, row.text);
  if (ts.isObjectLiteralExpression(row)) {
    for (const property of row.properties) {
      if (ts.isPropertyAssignment(property) && ts.isStringLiteralLike(property.initializer)) {
        result.set(`${name}.${property.name.getText()}`, property.initializer.text);
      }
    }
  }
  return result;
}

function hasSkip(body: ts.ConciseBody): boolean {
  if (!ts.isBlock(body)) return false;
  return body.statements.some((statement) => {
    if (!(ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression))) return false;
    const call = statement.expression;
    return (
      /^(test|it)\.(skip|fixme)$/u.test(callName(call.expression)) &&
      (!call.arguments.length || call.arguments[0]?.kind === ts.SyntaxKind.TrueKeyword)
    );
  });
}

function testIds(file: string): Set<string> {
  const ids = new Set<string>();
  function visit(node: ts.Node, bindings: ReadonlyMap<string, string> = new Map()): void {
    if (ts.isSourceFile(node) || ts.isBlock(node)) {
      for (const statement of node.statements) visit(statement, bindings);
    } else if (ts.isForOfStatement(node) && ts.isVariableDeclarationList(node.initializer)) {
      const [declaration] = node.initializer.declarations;
      const rows = unwrap(node.expression);
      if (declaration && ts.isIdentifier(declaration.name) && rows && ts.isArrayLiteralExpression(rows)) {
        for (const row of rows.elements) {
          if (ts.isSpreadElement(row)) continue;
          visit(node.statement, new Map([...bindings, ...loopBindings(declaration.name.text, row)]));
        }
      }
    } else if (ts.isExpressionStatement(node) && ts.isCallExpression(node.expression)) {
      const call = node.expression;
      const name = callName(call.expression);
      if (!/^(test|it|describe)(\.(describe|only|each|for|concurrent|sequential|fails))*$/u.test(name)) return;
      const callback = call.arguments.find(isFunction);
      if (!callback || hasSkip(callback.body)) return;
      if (ts.isCallExpression(call.expression)) {
        const rows = unwrap(call.expression.arguments[0]);
        if (rows && ts.isArrayLiteralExpression(rows) && rows.elements.length === 0) return;
      }
      if (name.split(".").includes("describe")) {
        visit(callback.body, bindings);
      } else {
        for (const id of testTitle(call.arguments[0], bindings).match(caseIdPattern) ?? []) ids.add(id);
      }
    }
  }
  visit(parse(file));
  return ids;
}

// Resolve only earlier, same-file object spreads; never load imports or evaluate factories.
function properties(
  node: ts.Node | undefined,
  objects: ReadonlyMap<string, Map<string, ts.Expression> | undefined>
): Map<string, ts.Expression> | undefined {
  const object = unwrap(node);
  if (!object || !ts.isObjectLiteralExpression(object)) return;
  const result = new Map<string, ts.Expression>();
  for (const property of object.properties) {
    if (ts.isSpreadAssignment(property)) {
      const inherited = ts.isIdentifier(property.expression) ? objects.get(property.expression.text) : undefined;
      if (!inherited) return;
      for (const [name, value] of inherited) result.set(name, value);
    } else if (ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name)) {
      result.set(property.name.getText().replace(/["']/gu, ""), property.initializer);
    } else {
      return;
    }
  }
  return result;
}

function stringList(node: ts.Node | undefined): (string | undefined)[] {
  if (!node) return [];
  return ts.isArrayLiteralExpression(node)
    ? node.elements.map((element) => (ts.isStringLiteralLike(element) ? element.text : undefined))
    : [undefined];
}

function storyExports(file: string): Set<string> {
  const source = parse(file);
  const variables = source.statements.filter(ts.isVariableStatement);
  const declarations = variables.flatMap((statement) => [...statement.declarationList.declarations]);
  const objects = new Map<string, Map<string, ts.Expression> | undefined>();
  for (const { name, initializer } of declarations) objects.set(name.getText(), properties(initializer, objects));
  const defaultExport = source.statements.find(ts.isExportAssignment)?.expression;
  const meta =
    defaultExport && ts.isIdentifier(defaultExport)
      ? objects.get(defaultExport.text)
      : properties(defaultExport, objects);
  const stories = new Set<string>();
  for (const statement of variables) {
    if (!statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const story = objects.get(declaration.name.getText());
      if (!story || !meta) continue;
      const name = declaration.name.getText();
      const tags = ["test", ...stringList(meta.get("tags")), ...stringList(story.get("tags"))];
      if (tags.includes(undefined) || tags.lastIndexOf("!test") > tags.lastIndexOf("test")) continue;
      if (meta.has("includeStories") && !stringList(meta.get("includeStories")).includes(name)) continue;
      const excluded = stringList(meta.get("excludeStories"));
      if (excluded.some((item) => !item || item === name)) continue;
      if (isFunction(story.get("play"))) stories.add(name);
    }
  }
  return stories;
}

for (const [directory, testDirectory] of [
  ["docs/e2e", "test/e2e"],
  ["docs/integration/firestore", "test/integration/firestore"],
] as const) {
  const tests = new Map(files(testDirectory, /\.spec\.tsx?$/u).map((file) => [file, testIds(file)]));
  const cases = readCases(directory);
  if (!cases.length) problems.push(`${directory}: no specification cases found`);
  for (const spec of cases) {
    const links = [...withoutFences(read(spec.file)).matchAll(/\]\(([^)]+\.spec\.tsx?)\)/gu)].map(([, file = ""]) =>
      path.normalize(path.join(path.dirname(spec.file), file))
    );
    const candidates = links.length ? links : [...tests.keys()];
    if (!candidates.some((file) => tests.get(file)?.has(spec.id))) {
      problems.push(`${spec.file}: ${spec.id} has no active test declaration`);
    }
  }
}

const stories = new Map(files("src", /\.stories\.tsx?$/u).map((file) => [file, storyExports(file)]));
const storyCases = readCases("docs/integration/storybook");
if (!storyCases.length) problems.push("docs/integration/storybook: no specification cases found");
for (const spec of storyCases) {
  const mapping = /^対応 Story: (.+)$/mu.exec(spec.body)?.[1] ?? "";
  const references = [...mapping.matchAll(/\]\(([^)]+\.stories\.tsx?)\)\s*::\s*`([\w$]+)`/gu)];
  if (!references.length) problems.push(`${spec.file}: ${spec.id} has no Story mapping`);
  for (const [, file = "", name = ""] of references) {
    const target = path.normalize(path.join(path.dirname(spec.file), file));
    if (!stories.get(target)?.has(name)) {
      problems.push(`${spec.file}: ${spec.id} -> ${target} :: ${name} needs an explicit play`);
    }
  }
}

if (problems.length) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write("All documented E2E, Firestore, and Storybook cases have test declarations.\n");
}

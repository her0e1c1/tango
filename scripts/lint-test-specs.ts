import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Check declared coverage, not assertion semantics or the result of running a test.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const problems: string[] = [];
const caseIdPattern = /\b[A-Z]+(?:-[A-Z]+)*-[0-9]{2,}\b/gu;

interface SpecCase {
  id: string;
  file: string;
  body: string;
}

function filesIn(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) => {
      const file = path.join(directory, entry.name);
      return entry.isDirectory() ? filesIn(file) : entry.isFile() ? [file] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function withoutFences(markdown: string): string {
  let fence: string | undefined;
  return markdown
    .split(/\r?\n/u)
    .map((line) => {
      const marker = /^\s{0,3}(`{3,}|~{3,})/u.exec(line)?.[1];
      if (fence !== undefined) {
        if (marker !== undefined && marker[0] === fence[0] && marker.length >= fence.length) fence = undefined;
        return "";
      }
      if (marker !== undefined) {
        fence = marker;
        return "";
      }
      return line;
    })
    .join("\n");
}

function readCases(directory: string): SpecCase[] {
  const cases: SpecCase[] = [];
  for (const file of filesIn(path.join(root, directory)).filter((name) => name.endsWith(".md"))) {
    const markdown = withoutFences(readFileSync(file, "utf8"));
    const headings = [...markdown.matchAll(/^#{2,6} ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,})(?:\s|$).*$/gmu)];
    for (const [index, heading] of headings.entries()) {
      const id = heading[1];
      if (id === undefined) continue;
      cases.push({ id, file, body: markdown.slice(heading.index, headings[index + 1]?.index) });
    }
    if (path.basename(file) !== "README.md") {
      const headingIds = new Set(headings.map((heading) => heading[1]));
      for (const row of markdown.matchAll(/^\| ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,}) \|/gmu)) {
        if (!headingIds.has(row[1])) problems.push(`${path.relative(root, file)}: ${row[1]} has no case section`);
      }
    }
  }
  const ids = new Set<string>();
  for (const spec of cases) {
    if (ids.has(spec.id)) problems.push(`${path.relative(root, spec.file)}: duplicate specification ID ${spec.id}`);
    ids.add(spec.id);
  }
  if (cases.length === 0) problems.push(`${directory}: no specification cases found`);
  return cases;
}

const e2eCases = readCases("docs/e2e");
const firestoreCases = readCases("docs/integration/firestore");
const storybookCases = readCases("docs/integration/storybook");
const e2eFiles = filesIn(path.join(root, "test/e2e")).filter((file) => file.endsWith(".spec.ts"));
const firestoreFiles = filesIn(path.join(root, "test/integration/firestore")).filter((file) =>
  /\.spec\.tsx?$/u.test(file)
);
const storyFiles = filesIn(path.join(root, "src")).filter((file) => /\.stories\.tsx?$/u.test(file));
const config = ts.readConfigFile(path.join(root, "tsconfig.json"), ts.sys.readFile);
if (config.error) throw new Error(ts.flattenDiagnosticMessageText(config.error.messageText, "\n"));
const parsedConfig = ts.parseJsonConfigFileContent(config.config, ts.sys, root);
if (parsedConfig.errors.length > 0) {
  throw new Error(
    parsedConfig.errors.map((error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")).join("\n")
  );
}
const program = ts.createProgram([...e2eFiles, ...firestoreFiles, ...storyFiles], parsedConfig.options);
const checker = program.getTypeChecker();

function sourceOf(file: string): ts.SourceFile {
  const source = program.getSourceFile(file);
  if (source === undefined) throw new Error(`Cannot read test source: ${path.relative(root, file)}`);
  const diagnostics = program.getSyntacticDiagnostics(source);
  if (diagnostics.length > 0) {
    const message = diagnostics.map((item) => ts.flattenDiagnosticMessageText(item.messageText, "\n")).join("; ");
    throw new Error(`${path.relative(root, file)}: ${message}`);
  }
  return source;
}

type Bindings = ReadonlyMap<ts.Node, ts.Node>;

function resolveValue(node: ts.Node, seen = new Set<ts.Node>(), bindings: Bindings = new Map()): ts.Node {
  if (seen.has(node)) throw new Error(`Circular declaration in ${node.getSourceFile().fileName}`);
  const next = new Set(seen).add(node);
  const bound = bindings.get(node);
  if (bound !== undefined) return resolveValue(bound, next, bindings);
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node)
  )
    return resolveValue(node.expression, next, bindings);
  if (ts.isVariableDeclaration(node) || ts.isPropertyAssignment(node)) {
    return node.initializer === undefined ? node : resolveValue(node.initializer, next, bindings);
  }
  if (ts.isExportAssignment(node)) return resolveValue(node.expression, next, bindings);
  if (ts.isPropertyAccessExpression(node)) return propertyOf(node.expression, node.name.text, next, bindings) ?? node;
  if (ts.isIdentifier(node) || ts.isShorthandPropertyAssignment(node)) {
    const symbol = ts.isShorthandPropertyAssignment(node)
      ? checker.getShorthandAssignmentValueSymbol(node)
      : checker.getSymbolAtLocation(node);
    const declaration = declarationOf(symbol);
    if (declaration !== undefined && declaration !== node) return resolveValue(declaration, next, bindings);
  }
  return node;
}

function propertyOf(
  node: ts.Node,
  name: string,
  seen = new Set<ts.Node>(),
  bindings: Bindings = new Map()
): ts.Node | undefined {
  const value = resolveValue(node, seen, bindings);
  if (!ts.isObjectLiteralExpression(value)) return undefined;
  for (const property of [...value.properties].reverse()) {
    if (ts.isSpreadAssignment(property)) {
      const spread = resolveValue(property.expression, new Set(seen).add(value), bindings);
      // An unknown spread can override an earlier property; do not invent coverage.
      if (!ts.isObjectLiteralExpression(spread)) return spread;
      const inherited = propertyOf(spread, name, new Set(seen).add(value), bindings);
      if (inherited !== undefined) return inherited;
    } else if (
      property.name !== undefined &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === name
    ) {
      return resolveValue(property, seen, bindings);
    }
  }
  return undefined;
}

function isCallable(node: ts.Node | undefined): boolean {
  if (node === undefined) return false;
  const value = resolveValue(node);
  return (
    ts.isArrowFunction(value) ||
    ts.isFunctionExpression(value) ||
    ((ts.isFunctionDeclaration(value) || ts.isMethodDeclaration(value)) && value.body !== undefined)
  );
}

function declarationOf(symbol: ts.Symbol | undefined): ts.Declaration | undefined {
  const resolved =
    symbol !== undefined && (symbol.flags & ts.SymbolFlags.Alias) !== 0 ? checker.getAliasedSymbol(symbol) : symbol;
  return resolved?.valueDeclaration ?? resolved?.declarations?.[0];
}

function callParts(node: ts.Expression): string[] {
  if (ts.isIdentifier(node)) return [node.text];
  if (ts.isPropertyAccessExpression(node)) return [...callParts(node.expression), node.name.text];
  if (ts.isCallExpression(node)) return callParts(node.expression);
  if (ts.isTaggedTemplateExpression(node)) return callParts(node.tag);
  return [];
}

function hasEmptyRows(expression: ts.Expression): boolean {
  if (!ts.isCallExpression(expression)) return false;
  const argument = expression.arguments[0];
  const rows = argument === undefined ? undefined : resolveValue(argument);
  return (
    (["each", "for"].includes(callParts(expression.expression).at(-1) ?? "") &&
      rows !== undefined &&
      ts.isArrayLiteralExpression(rows) &&
      rows.elements.length === 0) ||
    hasEmptyRows(expression.expression)
  );
}

function skipsUnconditionally(callback: ts.Node | undefined): boolean {
  if (callback === undefined) return false;
  const value = resolveValue(callback);
  if (!(ts.isArrowFunction(value) || ts.isFunctionExpression(value) || ts.isFunctionDeclaration(value))) return false;
  if (value.body === undefined || !ts.isBlock(value.body)) return false;
  return value.body.statements.some((statement) => {
    if (!ts.isExpressionStatement(statement) || !ts.isCallExpression(statement.expression)) return false;
    const call = statement.expression;
    const parts = callParts(call.expression);
    return (
      ["test", "it"].includes(parts[0] ?? "") &&
      ["skip", "fixme"].includes(parts.at(-1) ?? "") &&
      (call.arguments.length === 0 || call.arguments[0]?.kind === ts.SyntaxKind.TrueKeyword)
    );
  });
}

function staticText(node: ts.Node, bindings: Bindings): string | undefined {
  const value = resolveValue(node, new Set(), bindings);
  if (ts.isStringLiteralLike(value) || ts.isNumericLiteral(value)) return value.text;
  if (!ts.isTemplateExpression(value)) return undefined;
  let text = value.head.text;
  for (const span of value.templateSpans) {
    const part = staticText(span.expression, bindings);
    if (part === undefined) return undefined;
    text += part + span.literal.text;
  }
  return text;
}

function testIds(file: string): Set<string> {
  const source = sourceOf(file);
  const names = new Set(["test", "it", "describe"]);
  const suites = new Set(["describe"]);
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    const bindings = statement.importClause?.namedBindings;
    if (bindings === undefined || !ts.isNamedImports(bindings)) continue;
    for (const binding of bindings.elements) {
      const original = binding.propertyName?.text ?? binding.name.text;
      if (["test", "it", "describe"].includes(original)) names.add(binding.name.text);
      if (original === "describe") suites.add(binding.name.text);
    }
  }
  const ids = new Set<string>();
  function visit(node: ts.Node, bindings: Bindings = new Map()): void {
    if (ts.isForOfStatement(node)) {
      if (!ts.isVariableDeclarationList(node.initializer)) return;
      const [declaration] = node.initializer.declarations;
      const rows = resolveValue(node.expression, new Set(), bindings);
      // Expand literal tables without executing test modules or guessing dynamic generators.
      if (declaration !== undefined && ts.isIdentifier(declaration.name) && ts.isArrayLiteralExpression(rows)) {
        for (const row of rows.elements) {
          if (!ts.isSpreadElement(row)) visit(node.statement, new Map(bindings).set(declaration, row));
        }
      }
      return;
    }
    if (ts.isCallExpression(node)) {
      const parts = callParts(node.expression);
      const first = parts[0];
      if (first !== undefined && names.has(first)) {
        // Conditional skips are not statically proven coverage either.
        if (parts.some((part) => ["skip", "todo", "fixme", "skipIf", "runIf"].includes(part))) return;
        const [title, testOrOptions, testOrTimeout] = node.arguments;
        // Vitest accepts a trailing timeout; Playwright accepts details before the callback.
        const callback = isCallable(testOrOptions) ? testOrOptions : testOrTimeout;
        if (!(suites.has(first) || parts.includes("describe")) && isCallable(callback)) {
          if (hasEmptyRows(node.expression) || skipsUnconditionally(callback)) return;
          if (
            parts.slice(1).some((part) => !["each", "for", "only", "concurrent", "sequential", "fails"].includes(part))
          )
            return;
          if (title !== undefined) {
            const value = resolveValue(title, new Set(), bindings);
            const text = staticText(value, bindings) ?? (ts.isTemplateExpression(value) ? value.head.text : "");
            for (const match of text.matchAll(caseIdPattern)) ids.add(match[0]);
          }
          return;
        }
      }
    }
    ts.forEachChild(node, (child) => visit(child, bindings));
  }
  visit(source);
  return ids;
}

function checkTests(cases: SpecCase[], files: string[]): void {
  const byFile = new Map(files.map((file) => [file, testIds(file)]));
  for (const spec of cases) {
    // Firestore specifications declare their owning test file. E2E IDs can span test files.
    const links = [...withoutFences(readFileSync(spec.file, "utf8")).matchAll(/\]\(([^)]+\.spec\.tsx?)\)/gu)].map(
      (match) => path.resolve(path.dirname(spec.file), match[1] ?? "")
    );
    const candidates = links.length > 0 ? links : files;
    if (!candidates.some((file) => byFile.get(file)?.has(spec.id))) {
      problems.push(`${path.relative(root, spec.file)}: ${spec.id} has no active test declaration`);
    }
  }
}

function storyEnabled(story: ts.Node, meta: ts.Node | undefined, name: string): boolean {
  let enabled = true;
  for (const node of [meta, story]) {
    if (node === undefined) continue;
    const tags = propertyOf(node, "tags");
    if (tags === undefined) continue;
    if (!ts.isArrayLiteralExpression(tags)) return false;
    for (const tag of tags.elements) {
      const value = resolveValue(tag);
      if (!ts.isStringLiteralLike(value)) return false;
      if (value.text === "!test") enabled = false;
      if (value.text === "test") enabled = true;
    }
  }
  for (const key of ["includeStories", "excludeStories"]) {
    const filter = meta === undefined ? undefined : propertyOf(meta, key);
    if (filter === undefined) continue;
    if (!ts.isArrayLiteralExpression(filter)) return false;
    const matches = filter.elements.some((item) => {
      const value = resolveValue(item);
      return ts.isStringLiteralLike(value) && value.text === name;
    });
    if (key === "includeStories" ? !matches : matches) enabled = false;
  }
  return enabled;
}

function checkStorybook(): void {
  for (const spec of storybookCases) {
    const mapping = /^対応 Story: (.+)$/mu.exec(spec.body)?.[1] ?? "";
    const references = [...mapping.matchAll(/\]\(([^)]+\.stories\.tsx?)\)\s*::\s*`([\w$]+)`/gu)];
    if (references.length === 0) {
      problems.push(`${path.relative(root, spec.file)}: ${spec.id} has no Story mapping`);
    }
    for (const reference of references) {
      const file = path.resolve(path.dirname(spec.file), reference[1] ?? "");
      const name = reference[2];
      const source = storyFiles.includes(file) ? sourceOf(file) : undefined;
      const module = source === undefined ? undefined : checker.getSymbolAtLocation(source);
      const exports = module === undefined ? [] : checker.getExportsOfModule(module);
      const story = declarationOf(exports.find((symbol) => symbol.name === name));
      const meta = declarationOf(exports.find((symbol) => symbol.name === "default"));
      const play =
        story === undefined
          ? undefined
          : (propertyOf(story, "play") ?? (meta === undefined ? undefined : propertyOf(meta, "play")));
      if (story === undefined || name === undefined || !storyEnabled(story, meta, name) || !isCallable(play)) {
        problems.push(
          `${path.relative(root, spec.file)}: ${spec.id} -> ${path.relative(root, file)} :: ${name} has no resolvable play enabled for testing`
        );
      }
    }
  }
}

checkTests(e2eCases, e2eFiles);
checkTests(firestoreCases, firestoreFiles);
checkStorybook();

// README is an index of specifications, not a second list of individual test executions.
const indexedIds = new Set(
  [
    ...readFileSync(path.join(root, "docs/e2e/README.md"), "utf8").matchAll(/^\| ([A-Z]+(?:-[A-Z]+)*-[0-9]{2,}) \|/gmu),
  ].map((match) => match[1])
);
for (const spec of e2eCases) {
  if (!indexedIds.has(spec.id)) problems.push(`docs/e2e/README.md: missing ${spec.id}`);
}

if (problems.length > 0) {
  process.stderr.write(`${problems.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Specification coverage: E2E ${e2eCases.length}, Firestore ${firestoreCases.length}, Storybook ${storybookCases.length}.\n`
  );
}

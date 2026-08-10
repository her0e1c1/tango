import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

import ts from "typescript";

const SOURCE_LAYERS = ["shared", "entities", "features", "pages", "app"];
const SLICED_LAYERS = new Set(["pages", "features", "entities"]);
const ALLOWED_TOP_LEVEL_ENTRIES = new Set([...SOURCE_LAYERS, "vite-env.d.ts"]);
const FORBIDDEN_DIRECTORY_NAMES = new Set([
  "common",
  "core",
  "helpers",
  "logic",
  "services",
  "state",
  "types",
  "utils",
]);
const SOURCE_EXTENSION = /\.(?:ts|tsx)$/;
const VERIFICATION_FILE = /\.(?:spec|stories)\.(?:ts|tsx)$/;
const PRESENTATION_SEGMENTS = new Set(["commands", "hooks", "mutations", "queries", "store", "subscriptions"]);

const toPosix = (value) => value.split(path.sep).join("/");

const walk = (directory) => {
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(entryPath) : [entryPath];
  });
};

const locationFor = (sourceFile, node) => {
  const start = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
  return { line: start.line + 1, column: start.character + 1 };
};

const importsFrom = (filePath) => {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
  );
  const imports = [];
  const add = (literal) => {
    if (!literal || !ts.isStringLiteralLike(literal)) return;
    imports.push({ specifier: literal.text, ...locationFor(sourceFile, literal) });
  };
  const visit = (node) => {
    if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) add(node.moduleSpecifier);
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length > 0
    ) {
      add(node.arguments[0]);
    }
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return { imports, sourceFile };
};

const sourceAddress = (sourceDirectory, filePath) => {
  const relativePath = toPosix(path.relative(sourceDirectory, filePath));
  const parts = relativePath.split("/");
  const layer = SOURCE_LAYERS.includes(parts[0]) ? parts[0] : undefined;
  const slice = layer && SLICED_LAYERS.has(layer) ? parts[1] : undefined;
  return { layer, slice, parts, relativePath: `src/${relativePath}` };
};

const targetAddress = (sourceDirectory, sourceFilePath, specifier) => {
  let targetPath;
  if (specifier.startsWith("@/")) targetPath = path.join(sourceDirectory, specifier.slice(2));
  else if (specifier.startsWith(".")) targetPath = path.resolve(path.dirname(sourceFilePath), specifier);
  else return undefined;
  return { ...sourceAddress(sourceDirectory, targetPath), targetPath };
};

const isPublicApiImport = (specifier, target) => {
  if (!specifier.startsWith("@/") || !target.layer) return false;
  if (SLICED_LAYERS.has(target.layer)) return target.parts.length === 2;
  if (target.layer === "shared") return fs.existsSync(path.join(target.targetPath, "index.ts"));
  return true;
};

const isSameSlice = (source, target) =>
  source.layer === target.layer && source.slice !== undefined && source.slice === target.slice;

const isPresentationFile = (source) => {
  if (source.layer === "features" && source.parts[2] === "components") return true;
  return source.layer === "pages" && source.parts.at(-1)?.endsWith("View.tsx");
};

const presentationDependencyIsForbidden = (specifier, target) => {
  if (
    ["firebase", "firebase/app", "firebase/auth", "firebase/firestore", "react-router-dom", "zustand"].includes(
      specifier
    )
  ) {
    return true;
  }
  if (target?.layer === "shared" && ["auth", "firebase"].includes(target.parts[1])) return true;
  return target?.parts.some((part) => PRESENTATION_SEGMENTS.has(part)) === true;
};

const errorAt = (source, location, rule, message) => ({
  file: source.relativePath,
  line: location.line,
  column: location.column,
  rule,
  message,
});

export const validateArchitecture = (rootDirectory = process.cwd()) => {
  const sourceDirectory = path.join(rootDirectory, "src");
  const errors = [];
  if (!fs.existsSync(sourceDirectory)) {
    return [{ file: "src", line: 1, column: 1, rule: "source-tree", message: "src directory is missing" }];
  }

  for (const entry of fs.readdirSync(sourceDirectory, { withFileTypes: true })) {
    if (!ALLOWED_TOP_LEVEL_ENTRIES.has(entry.name)) {
      errors.push({
        file: `src/${entry.name}`,
        line: 1,
        column: 1,
        rule: "source-tree",
        message: `top-level source entry must be one of: ${[...ALLOWED_TOP_LEVEL_ENTRIES].join(", ")}`,
      });
    }
  }

  for (const directory of walk(sourceDirectory).map(path.dirname)) {
    const name = path.basename(directory);
    if (!FORBIDDEN_DIRECTORY_NAMES.has(name)) continue;
    errors.push({
      file: toPosix(path.relative(rootDirectory, directory)),
      line: 1,
      column: 1,
      rule: "directory-name",
      message: `catch-all directory name "${name}" is forbidden`,
    });
  }

  for (const layer of SLICED_LAYERS) {
    const layerDirectory = path.join(sourceDirectory, layer);
    if (!fs.existsSync(layerDirectory)) continue;
    if (fs.existsSync(path.join(layerDirectory, "index.ts"))) {
      errors.push({
        file: `src/${layer}/index.ts`,
        line: 1,
        column: 1,
        rule: "public-api",
        message: "global layer barrels are forbidden",
      });
    }
    for (const entry of fs.readdirSync(layerDirectory, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const sliceDirectory = path.join(layerDirectory, entry.name);
      if (!fs.existsSync(path.join(sliceDirectory, "index.ts"))) {
        errors.push({
          file: toPosix(path.relative(rootDirectory, sliceDirectory)),
          line: 1,
          column: 1,
          rule: "public-api",
          message: "slice root must expose an index.ts public API",
        });
      }
      for (const nestedIndex of walk(sliceDirectory).filter(
        (filePath) => path.basename(filePath) === "index.ts" && path.dirname(filePath) !== sliceDirectory
      )) {
        errors.push({
          file: toPosix(path.relative(rootDirectory, nestedIndex)),
          line: 1,
          column: 1,
          rule: "public-api",
          message: "segment barrels are forbidden",
        });
      }
    }
  }

  const sourceFiles = walk(sourceDirectory).filter((filePath) => SOURCE_EXTENSION.test(filePath));
  for (const filePath of sourceFiles) {
    const source = sourceAddress(sourceDirectory, filePath);
    const { imports, sourceFile } = importsFrom(filePath);
    if (path.basename(filePath) === "index.ts") {
      const visit = (node) => {
        if (ts.isExportDeclaration(node) && node.exportClause === undefined) {
          errors.push(errorAt(source, locationFor(sourceFile, node), "public-api", "wildcard exports are forbidden"));
        }
        ts.forEachChild(node, visit);
      };
      visit(sourceFile);
    }
    if (VERIFICATION_FILE.test(filePath)) continue;

    for (const dependency of imports) {
      const target = targetAddress(sourceDirectory, filePath, dependency.specifier);
      if (isPresentationFile(source) && presentationDependencyIsForbidden(dependency.specifier, target)) {
        errors.push(
          errorAt(source, dependency, "presentation-boundary", `presentation cannot import "${dependency.specifier}"`)
        );
      }
      if (!target?.layer || !source.layer) continue;

      if (source.layer === target.layer && !SLICED_LAYERS.has(source.layer)) {
        if (
          source.layer === "shared" &&
          dependency.specifier.startsWith("@/") &&
          !isPublicApiImport(dependency.specifier, target)
        ) {
          errors.push(
            errorAt(
              source,
              dependency,
              "public-api",
              `Shared import "${dependency.specifier}" must use a focused public API`
            )
          );
        }
        continue;
      }

      if (isSameSlice(source, target)) {
        if (dependency.specifier.startsWith("@/")) {
          errors.push(errorAt(source, dependency, "slice-import", "files inside a slice must use relative imports"));
        }
        continue;
      }

      const sourceRank = SOURCE_LAYERS.indexOf(source.layer);
      const targetRank = SOURCE_LAYERS.indexOf(target.layer);
      if (targetRank >= sourceRank) {
        errors.push(
          errorAt(
            source,
            dependency,
            "layer-direction",
            `dependency from ${source.layer} to ${target.layer} must point to a strictly lower layer`
          )
        );
        continue;
      }

      if (!isPublicApiImport(dependency.specifier, target)) {
        errors.push(
          errorAt(
            source,
            dependency,
            "public-api",
            `lower-layer import "${dependency.specifier}" must use its public API`
          )
        );
      }
    }
  }

  return errors
    .filter(
      (error, index, values) =>
        values.findIndex(
          (candidate) =>
            candidate.file === error.file &&
            candidate.line === error.line &&
            candidate.column === error.column &&
            candidate.rule === error.rule &&
            candidate.message === error.message
        ) === index
    )
    .sort(
      (left, right) =>
        left.file.localeCompare(right.file) ||
        left.line - right.line ||
        left.column - right.column ||
        left.rule.localeCompare(right.rule)
    );
};

export const formatArchitectureError = (error) =>
  `${error.file}:${error.line}:${error.column} [${error.rule}] ${error.message}`;

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const errors = validateArchitecture();
  if (errors.length > 0) {
    console.error(errors.map(formatArchitectureError).join("\n"));
    console.error(`Architecture check failed with ${errors.length} violation${errors.length === 1 ? "" : "s"}.`);
    process.exitCode = 1;
  } else {
    console.log("Architecture check passed.");
  }
}

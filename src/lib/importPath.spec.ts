import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const sourceFilePattern = /\.(ts|tsx)$/;
const relativeSourceImportPattern = /\b(?:import|export)\b(?:[\s\S]*?)\bfrom\s+["'](\.{1,2}(?:\/[^"']*)?)["']/g;

function listSourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      return listSourceFiles(fullPath);
    }
    return sourceFilePattern.test(fullPath) ? [fullPath] : [];
  });
}

function resolvesInsideSource(filePath: string, importPath: string): boolean {
  return path.resolve(path.dirname(filePath), importPath).startsWith(`${sourceRoot}${path.sep}`);
}

describe("import paths", () => {
  it("uses @src for source-local imports", () => {
    const relativeImports = listSourceFiles(sourceRoot).flatMap((filePath) => {
      const content = readFileSync(filePath, "utf8");
      return Array.from(content.matchAll(relativeSourceImportPattern))
        .flatMap((match) => (match[1] === undefined ? [] : [match[1]]))
        .filter((importPath) => resolvesInsideSource(filePath, importPath))
        .map((importPath) => `${path.relative(process.cwd(), filePath)} imports ${importPath}`);
    });

    expect(relativeImports).toEqual([]);
  });
});

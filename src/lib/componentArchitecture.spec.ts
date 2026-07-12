import { existsSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");

function sourcePath(relativePath: string): string {
  return path.join(sourceRoot, relativePath);
}

function expectSourcePathsToExist(relativePaths: string[]): void {
  expect(relativePaths.filter((relativePath) => !existsSync(sourcePath(relativePath)))).toEqual([]);
}

function expectSourcePathsNotToExist(relativePaths: string[]): void {
  expect(relativePaths.filter((relativePath) => existsSync(sourcePath(relativePath)))).toEqual([]);
}

describe("component architecture", () => {
  it("places reusable presentation under shared", () => {
    expectSourcePathsToExist([
      "shared/components/Button.tsx",
      "shared/components/Card.tsx",
      "shared/components/Form.tsx",
      "shared/components/Header.tsx",
      "shared/components/Layout.tsx",
      "shared/forms/renameKey.ts",
      "shared/hooks/useActions.ts",
    ]);
    expectSourcePathsNotToExist(["component/Atom", "component/Molecule"]);
  });
});

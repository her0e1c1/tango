import { existsSync, readFileSync } from "node:fs";
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

function readSource(relativePath: string): string {
  return readFileSync(sourcePath(relativePath), "utf8");
}

function staticModuleSpecifiers(source: string): string[] {
  const matches = source.matchAll(
    /(?:^|\n)\s*(?:import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?|export\s+(?:type\s+)?[^;]*?\s+from\s+)["']([^"']+)["']/g
  );
  return Array.from(matches, (match) => match[1]);
}

function isModuleOrSubpath(specifier: string, moduleName: string): boolean {
  return specifier === moduleName || specifier.startsWith(`${moduleName}/`);
}

const deckPageAllowedModules = new Set(["react", "@src/features/deck/containers"]);
const deckPresentationAllowedModules = [
  "react",
  "react-icons",
  "@src/shared/components",
  "@src/features/deck/components",
];

function isAllowedDeckPageModule(specifier: string): boolean {
  return deckPageAllowedModules.has(specifier);
}

function isAllowedDeckPresentationModule(specifier: string): boolean {
  return deckPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
}

function importViolation(relativePath: string, specifier: string): string {
  return `${relativePath}: ${specifier}`;
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

  it("places deck presentation and application behavior under the deck feature", () => {
    const componentPaths = [
      "features/deck/components/DeckCard.tsx",
      "features/deck/components/DeckForm.tsx",
      "features/deck/components/DeckStartForm.tsx",
      "features/deck/components/TagFilter.tsx",
      "features/deck/components/templates/DeckListTemplate.tsx",
      "features/deck/components/templates/DeckFormTemplate.tsx",
    ];
    const containerPaths = [
      "features/deck/containers/DeckListContainer.tsx",
      "features/deck/containers/DeckFormContainer.tsx",
      "features/deck/containers/useDeckActions.ts",
      "features/deck/containers/useDeckFilterState.ts",
      "features/deck/containers/index.ts",
    ];
    const importViolations: string[] = [];

    expectSourcePathsToExist([...componentPaths, ...containerPaths]);
    expectSourcePathsNotToExist([
      "component/Organism/Deck.tsx",
      "component/Organism/DeckForm.tsx",
      "component/Organism/DeckStartForm.tsx",
      "component/Organism/TagFilter.tsx",
      "component/Template/DeckList.tsx",
      "component/Template/DeckForm.tsx",
    ]);

    for (const pagePath of ["page/DeckList.tsx", "page/DeckFormPage.tsx"]) {
      const pageSource = readSource(pagePath);
      const pageModules = staticModuleSpecifiers(pageSource);
      expect(pageModules).toContain("@src/features/deck/containers");
      importViolations.push(
        ...pageModules
          .filter((specifier) => !isAllowedDeckPageModule(specifier))
          .map((specifier) => importViolation(pagePath, specifier))
      );
    }

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(/\b(?:useState|useReducer|useForm|useController|useWatch)\s*\(/);
      expect(componentSource).not.toMatch(/\bReact\.(?:useState|useReducer)\s*\(/);
      importViolations.push(
        ...staticModuleSpecifiers(componentSource)
          .filter((specifier) => !isAllowedDeckPresentationModule(specifier))
          .map((specifier) => importViolation(componentPath, specifier))
      );
    }

    expect(importViolations).toEqual([]);
  });
});

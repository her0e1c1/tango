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
      expect(pageSource).toContain('from "@src/features/deck/containers"');
      expect(pageSource).not.toMatch(
        /from ["'](?:react-redux|react-router-dom|react-hook-form|@src\/(?:action|selector|shared\/hooks|component))["']/
      );
    }

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(/\b(?:useState|useReducer|useForm|useController|useWatch)\s*\(/);
      expect(componentSource).not.toMatch(/\bReact\.(?:useState|useReducer)\s*\(/);
      expect(componentSource).not.toMatch(
        /from ["'](?:react-redux|react-router-dom|react-hook-form|@src\/(?:action|selector|shared\/hooks))["']/
      );
      expect(componentSource).not.toMatch(/from ["']@src\/features\/(?!deck\/)[^"']+\/containers(?:\/[^"']*)?["']/);
    }
  });
});

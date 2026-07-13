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
const cardPageAllowedModules = new Set(["react", "@src/features/card/containers"]);
const cardPresentationAllowedModules = [
  "react",
  "react-icons",
  "classnames",
  "react-swipeable",
  "@src/shared/components",
  "@src/features/card/components",
];
const studyPageAllowedModules = new Set(["react", "@src/features/study/containers"]);
const studyPresentationAllowedModules = [
  "react",
  "react-icons",
  "classnames",
  "@src/shared/components",
  "@src/features/study/components",
];
const importPageAllowedModules = new Set(["react", "@src/features/import/containers"]);
const importPresentationAllowedModules = [
  "react",
  "react-icons",
  "@src/shared/components",
  "@src/features/import/components",
];
const settingsPageAllowedModules = new Set(["react", "@src/features/settings/containers"]);
const settingsPresentationAllowedModules = ["react", "@src/shared/components", "@src/features/settings/components"];

function isAllowedDeckPageModule(specifier: string): boolean {
  return deckPageAllowedModules.has(specifier);
}

function isAllowedDeckPresentationModule(specifier: string): boolean {
  return deckPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
}

function isAllowedCardPageModule(specifier: string): boolean {
  return cardPageAllowedModules.has(specifier);
}

function isAllowedCardPresentationModule(specifier: string): boolean {
  return cardPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
}

function isAllowedStudyPageModule(specifier: string): boolean {
  return studyPageAllowedModules.has(specifier);
}

function isAllowedStudyPresentationModule(specifier: string): boolean {
  return studyPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
}

function isAllowedImportPageModule(specifier: string): boolean {
  return importPageAllowedModules.has(specifier);
}

function isAllowedImportPresentationModule(specifier: string): boolean {
  return importPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
}

function isAllowedSettingsPageModule(specifier: string): boolean {
  return settingsPageAllowedModules.has(specifier);
}

function isAllowedSettingsPresentationModule(specifier: string): boolean {
  return settingsPresentationAllowedModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName));
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

  it("places card presentation and application behavior under the card feature", () => {
    const componentPaths = [
      "features/card/components/Card.tsx",
      "features/card/components/CardForm.tsx",
      "features/card/components/CardOverlay.tsx",
      "features/card/components/FrontText.tsx",
      "features/card/components/BackText.tsx",
      "features/card/components/templates/CardListTemplate.tsx",
      "features/card/components/templates/CardFormTemplate.tsx",
      "features/card/components/templates/CardViewTemplate.tsx",
    ];
    const colocatedPaths = [
      "features/card/components/Card.stories.tsx",
      "features/card/components/CardForm.stories.tsx",
      "features/card/components/CardForm.spec.tsx",
      "features/card/components/CardOverlay.stories.tsx",
      "features/card/components/FrontText.stories.tsx",
      "features/card/components/FrontText.spec.tsx",
      "features/card/components/BackText.stories.tsx",
      "features/card/components/templates/CardListTemplate.stories.tsx",
      "features/card/components/templates/CardListTemplate.spec.tsx",
      "features/card/components/templates/CardFormTemplate.stories.tsx",
    ];
    const containerPaths = [
      "features/card/containers/CardListContainer.tsx",
      "features/card/containers/CardFormContainer.tsx",
      "features/card/containers/CardViewContainer.tsx",
      "features/card/containers/useCardFormState.ts",
      "features/card/containers/index.ts",
    ];
    const pageContainers = [
      ["page/CardList.tsx", "CardListContainer"],
      ["page/CardFormPage.tsx", "CardFormContainer"],
      ["page/CardViewPage.tsx", "CardViewContainer"],
    ] as const;
    const importViolations: string[] = [];

    expectSourcePathsToExist([...componentPaths, ...colocatedPaths, ...containerPaths]);
    expectSourcePathsNotToExist([
      "component/Organism/Card.tsx",
      "component/Organism/Card.stories.tsx",
      "component/Organism/CardForm.tsx",
      "component/Organism/CardForm.stories.tsx",
      "component/Organism/CardForm.spec.tsx",
      "component/Organism/CardOverlay.tsx",
      "component/Organism/CardOverlay.stories.tsx",
      "component/Organism/FrontText.tsx",
      "component/Organism/FrontText.stories.tsx",
      "component/Organism/FrontText.spec.tsx",
      "component/Organism/BackText.tsx",
      "component/Organism/BackText.stories.tsx",
      "component/Template/CardList.tsx",
      "component/Template/CardList.stories.tsx",
      "component/Template/CardForm.tsx",
      "component/Template/CardForm.stories.tsx",
      "component/Template/CardView.tsx",
    ]);

    for (const [pagePath, containerName] of pageContainers) {
      const pageSource = readSource(pagePath);
      const pageModules = staticModuleSpecifiers(pageSource);
      expect(pageModules).toContain("@src/features/card/containers");
      expect(pageSource).toContain(containerName);
      expect(pageSource).not.toMatch(
        /\b(?:useState|useReducer|useMemo|useEffect|useSelector|useParams|useActions|useKey|useForm)\s*\(/
      );
      importViolations.push(
        ...pageModules
          .filter((specifier) => !isAllowedCardPageModule(specifier))
          .map((specifier) => importViolation(pagePath, specifier))
      );
    }

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(/\b(?:useState|useReducer|useForm|useController|useWatch)\s*\(/);
      expect(componentSource).not.toMatch(/\bReact\.(?:useState|useReducer)\s*\(/);
      importViolations.push(
        ...staticModuleSpecifiers(componentSource)
          .filter((specifier) => !isAllowedCardPresentationModule(specifier))
          .map((specifier) => importViolation(componentPath, specifier))
      );
    }

    expect(importViolations, importViolations.join("\n")).toEqual([]);
  });

  it("places study presentation and application behavior under the study feature", () => {
    const componentPaths = [
      "features/study/components/Controller.tsx",
      "features/study/components/SwipeButtonList.tsx",
      "features/study/components/templates/DeckStartTemplate.tsx",
      "features/study/components/templates/DeckSwiperTemplate.tsx",
    ];
    const colocatedPaths = [
      "features/study/components/Controller.spec.tsx",
      "features/study/components/Controller.stories.tsx",
      "features/study/components/SwipeButtonList.stories.tsx",
      "features/study/components/templates/DeckStartTemplate.stories.tsx",
      "features/study/components/templates/DeckSwiperTemplate.stories.tsx",
    ];
    const containerPaths = [
      "features/study/containers/DeckStartContainer.tsx",
      "features/study/containers/DeckSwiperContainer.tsx",
      "features/study/containers/useStudyControllerState.ts",
      "features/study/containers/index.ts",
    ];
    const pageContainers = [
      ["page/DeckStartPage.tsx", "DeckStartPage", "DeckStartContainer"],
      ["page/DeckSwiperPage.tsx", "DeckSwiperPage", "DeckSwiperContainer"],
    ] as const;
    const importViolations: string[] = [];

    expectSourcePathsToExist([...componentPaths, ...colocatedPaths, ...containerPaths]);
    expectSourcePathsNotToExist([
      "component/Organism/Controller.tsx",
      "component/Organism/Controller.spec.tsx",
      "component/Organism/Controller.stories.tsx",
      "component/Organism/SwipeButtonList.tsx",
      "component/Organism/SwipeButtonList.stories.tsx",
      "component/Template/DeckStart.tsx",
      "component/Template/DeckStart.stories.tsx",
      "component/Template/DeckSwiper.tsx",
      "component/Template/DeckSwiper.stories.tsx",
    ]);

    for (const [pagePath, pageName, containerName] of pageContainers) {
      const pageSource = readSource(pagePath);
      const pageModules = staticModuleSpecifiers(pageSource);
      expect(pageModules).toEqual(["react", "@src/features/study/containers"]);
      expect(pageSource).toContain(`export const ${pageName}: React.FC = () => <${containerName} />;`);
      expect(pageSource).not.toMatch(
        /\b(?:useState|useReducer|useMemo|useEffect|useSelector|useDispatch|useParams|useNavigate|useActions|useKey|useForm)\s*\(/
      );
      importViolations.push(
        ...pageModules
          .filter((specifier) => !isAllowedStudyPageModule(specifier))
          .map((specifier) => importViolation(pagePath, specifier))
      );
    }

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(
        /\b(?:React\.)?use(?:State|Reducer|Effect)\s*\(|\b(?:useForm|useController|useWatch|useSelector|useDispatch|useParams|useNavigate|useActions|useKey)\s*\(/
      );
      importViolations.push(
        ...staticModuleSpecifiers(componentSource)
          .filter((specifier) => !isAllowedStudyPresentationModule(specifier))
          .map((specifier) => importViolation(componentPath, specifier))
      );
    }

    expect(importViolations, importViolations.join("\n")).toEqual([]);
  });

  it("places import presentation and application behavior under the import feature", () => {
    const componentPaths = ["features/import/components/templates/DeckImportTemplate.tsx"];
    const colocatedPaths = ["features/import/components/templates/DeckImportTemplate.stories.tsx"];
    const containerPaths = [
      "features/import/containers/DeckImportContainer.tsx",
      "features/import/containers/index.ts",
    ];
    const importViolations: string[] = [];

    expectSourcePathsToExist([...componentPaths, ...colocatedPaths, ...containerPaths]);
    expectSourcePathsNotToExist(["component/Template/DeckImport.tsx", "component/Template/DeckImport.stories.tsx"]);

    const pagePath = "page/DeckImportPage.tsx";
    const pageSource = readSource(pagePath);
    const pageModules = staticModuleSpecifiers(pageSource);
    expect(pageModules).toEqual(["react", "@src/features/import/containers"]);
    expect(pageSource).toContain("export const DeckImportPage: React.FC = () => <DeckImportContainer />;");
    expect(pageSource).not.toMatch(
      /\b(?:useState|useReducer|useMemo|useEffect|useSelector|useDispatch|useParams|useNavigate|useActions|useKey|useForm)\s*\(/
    );
    importViolations.push(
      ...pageModules
        .filter((specifier) => !isAllowedImportPageModule(specifier))
        .map((specifier) => importViolation(pagePath, specifier))
    );

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(
        /\b(?:React\.)?use(?:State|Reducer|Effect)\s*\(|\b(?:useForm|useController|useWatch|useSelector|useDispatch|useParams|useNavigate|useActions|useKey)\s*\(/
      );
      importViolations.push(
        ...staticModuleSpecifiers(componentSource)
          .filter((specifier) => !isAllowedImportPresentationModule(specifier))
          .map((specifier) => importViolation(componentPath, specifier))
      );
    }

    expect(importViolations, importViolations.join("\n")).toEqual([]);
  });

  it("places settings presentation and form state under the settings feature", () => {
    const componentPaths = [
      "features/settings/components/ConfigForm.tsx",
      "features/settings/components/templates/ConfigFormTemplate.tsx",
    ];
    const colocatedPaths = [
      "features/settings/components/ConfigForm.spec.tsx",
      "features/settings/components/ConfigForm.stories.tsx",
      "features/settings/components/templates/ConfigFormTemplate.stories.tsx",
    ];
    const containerPaths = [
      "features/settings/containers/ConfigContainer.tsx",
      "features/settings/containers/useConfigFormState.ts",
      "features/settings/containers/index.ts",
    ];
    const importViolations: string[] = [];

    expectSourcePathsToExist([...componentPaths, ...colocatedPaths, ...containerPaths]);
    expectSourcePathsNotToExist([
      "component/Organism/ConfigForm.tsx",
      "component/Organism/ConfigForm.spec.tsx",
      "component/Organism/ConfigForm.stories.tsx",
      "component/Template/ConfigForm.tsx",
      "component/Template/ConfigForm.stories.tsx",
    ]);

    const pagePath = "page/ConfigPage.tsx";
    const pageSource = readSource(pagePath);
    const pageModules = staticModuleSpecifiers(pageSource);
    expect(pageModules).toEqual(["react", "@src/features/settings/containers"]);
    expect(pageSource).toContain("export const ConfigPage: React.FC = () => <ConfigContainer />;");
    expect(pageSource).not.toMatch(
      /\b(?:useState|useReducer|useMemo|useEffect|useSelector|useDispatch|useParams|useNavigate|useActions|useKey|useForm|useWatch)\s*\(/
    );
    importViolations.push(
      ...pageModules
        .filter((specifier) => !isAllowedSettingsPageModule(specifier))
        .map((specifier) => importViolation(pagePath, specifier))
    );

    for (const componentPath of componentPaths) {
      const componentSource = readSource(componentPath);
      expect(componentSource).not.toMatch(
        /\b(?:React\.)?use(?:State|Reducer|Effect)\s*\(|\b(?:useForm|useController|useWatch|useSelector|useDispatch|useParams|useNavigate|useActions|useKey)\s*\(/
      );
      importViolations.push(
        ...staticModuleSpecifiers(componentSource)
          .filter((specifier) => !isAllowedSettingsPresentationModule(specifier))
          .map((specifier) => importViolation(componentPath, specifier))
      );
    }

    const configContainerSource = readSource("features/settings/containers/ConfigContainer.tsx");
    expect(staticModuleSpecifiers(configContainerSource)).toContain(
      "@src/features/settings/containers/useConfigFormState"
    );
    expect(importViolations, importViolations.join("\n")).toEqual([]);
  });
});

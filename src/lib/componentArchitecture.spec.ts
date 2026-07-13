import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const sourceExtension = /\.tsx?$/;
const testOrStory = /\.(?:spec|stories)\.tsx?$/;
const mutablePresentationHook = /\b(?:React\.)?(?:useState|useReducer|useForm|useController|useWatch)\s*\(/;
const connectorModules = [
  "react-hook-form",
  "react-redux",
  "react-router",
  "react-router-dom",
  "react-use",
  "@src/action",
  "@src/selector",
  "@src/store",
  "@src/shared/hooks",
];

function sourcePath(relativePath: string): string {
  return path.join(sourceRoot, relativePath);
}

function readSource(relativePath: string): string {
  return readFileSync(sourcePath(relativePath), "utf8");
}

function sourceFilesUnder(relativeDirectory: string): string[] {
  const absoluteDirectory = sourcePath(relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      return entry.isDirectory() ? sourceFilesUnder(relativePath) : [relativePath];
    })
    .filter((relativePath) => sourceExtension.test(relativePath))
    .sort();
}

function productionFilesUnder(relativeDirectory: string): string[] {
  return sourceFilesUnder(relativeDirectory).filter((relativePath) => !testOrStory.test(relativePath));
}

function moduleSpecifiers(source: string): string[] {
  const staticMatches = source.matchAll(
    /(?:^|\n)\s*(?:import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?|export\s+(?:type\s+)?[^;]*?\s+from\s+)["']([^"']+)["']/g
  );
  const dynamicMatches = source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g);
  return [...Array.from(staticMatches, (match) => match[1]), ...Array.from(dynamicMatches, (match) => match[1])];
}

interface ModuleReference {
  specifier: string;
  resolvedSpecifier: string;
}

function moduleReferences(relativePath: string): ModuleReference[] {
  return moduleSpecifiers(readSource(relativePath)).map((specifier) => ({
    specifier,
    resolvedSpecifier: specifier.startsWith(".")
      ? `@src/${path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier))}`
      : specifier,
  }));
}

function isModuleOrSubpath(specifier: string, moduleName: string): boolean {
  return specifier === moduleName || specifier.startsWith(`${moduleName}/`);
}

function importViolation(relativePath: string, reference: ModuleReference): string {
  const resolution = reference.resolvedSpecifier === reference.specifier ? "" : ` -> ${reference.resolvedSpecifier}`;
  return `${relativePath}: ${reference.specifier}${resolution}`;
}

function forbiddenConnector(specifier: string): boolean {
  return (
    connectorModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName)) ||
    /^@src\/features\/[^/]+\/containers(?:\/|$)/.test(specifier)
  );
}

function expectStatelessPresentation(relativePath: string): void {
  const source = readSource(relativePath);
  expect(source, relativePath).not.toMatch(mutablePresentationHook);
  expect(
    moduleReferences(relativePath)
      .filter((reference) => forbiddenConnector(reference.resolvedSpecifier))
      .map((reference) => importViolation(relativePath, reference)),
    relativePath
  ).toEqual([]);
}

function isContainerOnlyHook(specifier: string): boolean {
  return (
    isModuleOrSubpath(specifier, "@src/shared/hooks") ||
    /^@src\/features\/[^/]+\/containers\/use[A-Z][^/]*$/.test(specifier)
  );
}

function expectSharedComponentGroup(
  group: "layout" | "forms" | "content" | "feedback",
  componentNames: string[],
  storyNames: string[] = componentNames,
  extraFiles: string[] = []
): void {
  const groupedPaths = [
    ...componentNames.map((name) => `shared/components/${group}/${name}.tsx`),
    ...storyNames.map((name) => `shared/components/${group}/${name}.stories.tsx`),
    ...extraFiles.map((name) => `shared/components/${group}/${name}`),
  ];
  const legacyPaths = groupedPaths.map((groupedPath) => `shared/components/${path.posix.basename(groupedPath)}`);

  expect(groupedPaths.filter((relativePath) => !existsSync(sourcePath(relativePath)))).toEqual([]);
  expect(legacyPaths.filter((relativePath) => existsSync(sourcePath(relativePath)))).toEqual([]);
}

describe("component architecture", () => {
  it("removes the legacy Atomic Design component root", () => {
    expect(existsSync(sourcePath("component"))).toBe(false);
  });

  it("groups shared layout components", () => {
    expectSharedComponentGroup("layout", ["FullScreen", "Header", "Layout", "List", "Main", "Outer"]);
  });

  it("groups shared form components", () => {
    expectSharedComponentGroup("forms", [
      "Button",
      "Form",
      "FormItem",
      "Input",
      "Select",
      "Slider",
      "Switch",
      "Tag",
      "Textarea",
      "Upload",
    ]);
  });

  it("groups shared content components", () => {
    expectSharedComponentGroup(
      "content",
      ["Card", "Code", "Description", "Logo", "Math", "Score", "Section", "Style", "TagList", "Title"],
      ["Card", "Code", "Description", "Logo", "Math", "Score", "Section", "TagList", "Title"],
      ["Code.scss"]
    );
  });

  it("groups shared feedback components", () => {
    expectSharedComponentGroup("feedback", ["Feedback", "Overlay"]);
  });

  it("keeps the exact shared component groups", () => {
    expect(readdirSync(sourcePath("shared/components")).sort()).toEqual(
      ["content", "feedback", "forms", "index.ts", "layout"].sort()
    );
  });

  it("keeps every page as one feature container route entry", () => {
    const pagePaths = productionFilesUnder("page").filter((relativePath) => relativePath.endsWith(".tsx"));
    expect(pagePaths.length).toBeGreaterThan(0);

    for (const pagePath of pagePaths) {
      const source = readSource(pagePath);
      const modules = moduleSpecifiers(source);
      const featureContainerModules = modules.filter((specifier) =>
        /^@src\/features\/[^/]+\/containers$/.test(specifier)
      );
      const renderedContainers = Array.from(
        source.matchAll(/<([A-Z][A-Za-z0-9]*Container)\s*\/>/g),
        (match) => match[1]
      );

      expect(featureContainerModules, pagePath).toHaveLength(1);
      expect(modules, pagePath).toEqual(["react", featureContainerModules[0]]);
      expect(renderedContainers, pagePath).toHaveLength(1);
      expect(source, pagePath).toMatch(
        new RegExp(
          `import\\s*{[^}]*\\b${renderedContainers[0]}\\b[^}]*}\\s*from\\s*["']${featureContainerModules[0]}["']`
        )
      );
      expect(source, pagePath).not.toMatch(
        /\b(?:React\.)?(?:useState|useReducer|useMemo|useEffect|useSelector|useDispatch|useParams|useNavigate|useActions|useKey|useForm|useController|useWatch)\s*\(/
      );
    }
  });

  it("keeps shared presentation independent from features and application connectors", () => {
    const violations: string[] = [];

    for (const sharedPath of productionFilesUnder("shared/components")) {
      expectStatelessPresentation(sharedPath);
      violations.push(
        ...moduleReferences(sharedPath)
          .filter((reference) => reference.resolvedSpecifier.startsWith("@src/features"))
          .map((reference) => importViolation(sharedPath, reference))
      );
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps every feature presentation dependency within shared or the same feature", () => {
    const featureNames = readdirSync(sourcePath("features"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
    const violations: string[] = [];

    for (const featureName of featureNames) {
      for (const componentPath of productionFilesUnder(`features/${featureName}/components`)) {
        expectStatelessPresentation(componentPath);
        violations.push(
          ...moduleReferences(componentPath)
            .filter(
              (reference) =>
                reference.resolvedSpecifier.startsWith("@src/") &&
                !isModuleOrSubpath(reference.resolvedSpecifier, "@src/shared/components") &&
                !isModuleOrSubpath(reference.resolvedSpecifier, `@src/features/${featureName}/components`)
            )
            .map((reference) => importViolation(componentPath, reference))
        );
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("limits container-only hooks to production container modules", () => {
    const violations: string[] = [];

    for (const indexPath of sourceFilesUnder("features").filter((relativePath) =>
      /^features\/[^/]+\/containers\/index\.ts$/.test(relativePath)
    )) {
      violations.push(
        ...moduleReferences(indexPath)
          .filter((reference) => isContainerOnlyHook(reference.resolvedSpecifier))
          .map((reference) => `${indexPath} publicly re-exports ${reference.specifier}`)
      );
    }

    for (const relativePath of productionFilesUnder(".")) {
      if (/^features\/[^/]+\/containers\//.test(relativePath)) continue;

      violations.push(
        ...moduleReferences(relativePath)
          .filter((reference) => isContainerOnlyHook(reference.resolvedSpecifier))
          .map((reference) => importViolation(relativePath, reference))
      );
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

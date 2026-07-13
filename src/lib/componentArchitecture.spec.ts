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

function staticModuleSpecifiers(source: string): string[] {
  const matches = source.matchAll(
    /(?:^|\n)\s*(?:import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?|export\s+(?:type\s+)?[^;]*?\s+from\s+)["']([^"']+)["']/g
  );
  return Array.from(matches, (match) => match[1]);
}

function isModuleOrSubpath(specifier: string, moduleName: string): boolean {
  return specifier === moduleName || specifier.startsWith(`${moduleName}/`);
}

function importViolation(relativePath: string, specifier: string): string {
  return `${relativePath}: ${specifier}`;
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
    staticModuleSpecifiers(source)
      .filter(forbiddenConnector)
      .map((specifier) => importViolation(relativePath, specifier)),
    relativePath
  ).toEqual([]);
}

function isContainerOnlyHook(specifier: string): boolean {
  return (
    isModuleOrSubpath(specifier, "@src/shared/hooks") ||
    /^@src\/features\/[^/]+\/containers\/use[A-Z][^/]*$/.test(specifier)
  );
}

describe("component architecture", () => {
  it("removes the legacy Atomic Design component root", () => {
    expect(existsSync(sourcePath("component"))).toBe(false);
  });

  it("keeps every page as one feature container route entry", () => {
    const pagePaths = productionFilesUnder("page").filter((relativePath) => relativePath.endsWith(".tsx"));
    expect(pagePaths.length).toBeGreaterThan(0);

    for (const pagePath of pagePaths) {
      const source = readSource(pagePath);
      const modules = staticModuleSpecifiers(source);
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
        ...staticModuleSpecifiers(readSource(sharedPath))
          .filter((specifier) => specifier.startsWith("@src/features"))
          .map((specifier) => importViolation(sharedPath, specifier))
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
          ...staticModuleSpecifiers(readSource(componentPath))
            .filter(
              (specifier) =>
                specifier.startsWith("@src/") &&
                !isModuleOrSubpath(specifier, "@src/shared/components") &&
                !isModuleOrSubpath(specifier, `@src/features/${featureName}/components`)
            )
            .map((specifier) => importViolation(componentPath, specifier))
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
        ...staticModuleSpecifiers(readSource(indexPath))
          .filter(isContainerOnlyHook)
          .map((specifier) => `${indexPath} publicly re-exports ${specifier}`)
      );
    }

    for (const relativePath of productionFilesUnder(".")) {
      if (/^features\/[^/]+\/containers\//.test(relativePath)) continue;

      violations.push(
        ...staticModuleSpecifiers(readSource(relativePath))
          .filter(isContainerOnlyHook)
          .map((specifier) => importViolation(relativePath, specifier))
      );
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

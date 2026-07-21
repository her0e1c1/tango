/**
 * @file Verifies the "component architecture" contract with automated examples.
 * The examples make the expected behavior concrete with cases such as "leaves render memoization
 * to React Compiler", "normalizes baseUrl source imports before checking boundaries", "treats
 * application connectors across import styles".
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import path from "node:path";
import * as ts from "typescript";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const sourceExtension = /\.tsx?$/;
const testOrStory = /\.(?:spec|stories)\.tsx?$/;
const mutablePresentationHook = /\b(?:React\.)?(?:useState|useReducer|useForm|useController|useWatch)\s*\(/;
const manualMemoizationHook = /\b(?:React\.)?(?:useMemo|useCallback)\s*\(/g;
const customHookDefinition = /\b(?:const|function)\s+(use[A-Z][A-Za-z0-9]*)\b/g;
const firestoreCompositionModules = new Set([
  "firebase.ts",
  "features/import/hooks/useDeckImport.ts",
  "hooks/useRemoteCollections.ts",
  "store/remoteStore.ts",
]);
const remoteSnapshotCapabilityName = ["apply", "Snapshot"].join("");
const remoteStoreStateName = "RemoteStoreState";
const remoteReadLifecycleActionNames = new Set(["start", "stop", "retryReads"]);
const remoteEntityMapNames = new Set(["decksById", "cardsById"]);
const ownedFirestoreAdapterModules = new Set([
  "@/adapters/firestore/card",
  "@/adapters/firestore/deck",
  "@/adapters/firestore/event",
]);
const connectorModules = [
  "react-hook-form",
  "react-router",
  "react-router-dom",
  "react-use",
  "@/action",
  "@/store",
  "@/hooks",
];

/**
 * Provides the source path test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function sourcePath(relativePath: string): string {
  return path.join(sourceRoot, relativePath);
}

function filesUnder(relativeDirectory: string): string[] {
  const absoluteDirectory = sourcePath(relativeDirectory);
  if (!existsSync(absoluteDirectory)) return [];

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .flatMap((entry) => {
      const relativePath = path.posix.join(relativeDirectory, entry.name);
      return entry.isDirectory() ? filesUnder(relativePath) : [relativePath];
    })
    .sort();
}

/**
 * Reads source needed by the test.
 * File access stays in one helper so assertions work with consistent paths and encoding.
 */
function readSource(relativePath: string): string {
  return readFileSync(sourcePath(relativePath), "utf8");
}

/**
 * Provides the source files under test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function sourceFilesUnder(relativeDirectory: string): string[] {
  return filesUnder(relativeDirectory).filter((relativePath) => sourceExtension.test(relativePath));
}

interface TextSubject {
  relativePath: string;
  source: string;
}

const prohibitedServerStateTokens = [
  { value: ["@tanstack", "react-query"].join("/"), wordEnd: false },
  { value: ["use", "Query", "Client"].join(""), wordEnd: false },
  { value: ["Query", "Client"].join(""), wordEnd: false },
  { value: ["use", "Query"].join(""), wordEnd: true },
  { value: ["use", "Mutation"].join(""), wordEnd: true },
  { value: ["firestore", "Keys"].join(""), wordEnd: false },
  { value: ["Remote", "Cache"].join(""), wordEnd: false },
] as const;

const escapeRegularExpression = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

function serverStateResidualViolations(subjects: TextSubject[]): string[] {
  return subjects.flatMap(({ relativePath, source }) => {
    const match = prohibitedServerStateTokens.find(({ value, wordEnd }) =>
      wordEnd ? new RegExp(`${escapeRegularExpression(value)}\\b`).test(source) : source.includes(value)
    );
    return match == null ? [] : [`${relativePath}: ${match.value}`];
  });
}

/**
 * Provides the production files under test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function productionFilesUnder(relativeDirectory: string): string[] {
  return sourceFilesUnder(relativeDirectory).filter((relativePath) => !testOrStory.test(relativePath));
}

/**
 * Provides the module specifiers test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function moduleSpecifiers(source: string): string[] {
  const staticMatches = source.matchAll(
    /(?:^|\n)\s*(?:import\s+(?:type\s+)?(?:[^;]*?\s+from\s+)?|export\s+(?:type\s+)?[^;]*?\s+from\s+)["']([^"']+)["']/g
  );
  const dynamicMatches = source.matchAll(/\bimport\s*\(\s*["']([^"']+)["']\s*\)/g);
  return [...staticMatches, ...dynamicMatches].flatMap((match) => {
    const specifier = match[1];
    return specifier === undefined ? [] : [specifier];
  });
}

interface ModuleReference {
  specifier: string;
  resolvedSpecifier: string;
}

/**
 * Provides the resolve module specifier test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function resolveModuleSpecifier(relativePath: string, specifier: string): string {
  if (specifier.startsWith(".")) {
    return `@/${path.posix.normalize(path.posix.join(path.posix.dirname(relativePath), specifier))}`;
  }
  if (isModuleOrSubpath(specifier, "src")) {
    return specifier === "src" ? "@/" : `@/${specifier.slice("src/".length)}`;
  }
  return specifier;
}

/**
 * Provides the module references test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function moduleReferences(relativePath: string): ModuleReference[] {
  return moduleReferencesForSource(relativePath, readSource(relativePath));
}

function moduleReferencesForSource(relativePath: string, source: string): ModuleReference[] {
  return moduleSpecifiers(source).map((specifier) => ({
    specifier,
    resolvedSpecifier: resolveModuleSpecifier(relativePath, specifier),
  }));
}

function sourceModuleId(relativePath: string): string {
  return `@/${relativePath.replace(/\.tsx?$/, "").replace(/\/index$/, "")}`;
}

function normalizedSourceSpecifier(specifier: string): string {
  return specifier.replace(/\.tsx?$/, "").replace(/\/index$/, "");
}

function firestoreOwnedAdapterConsumers(subjects: TextSubject[]): string[] {
  const firestoreAdaptersByModule = new Map(
    subjects
      .filter((subject) => subject.relativePath.startsWith("adapters/firestore/"))
      .map((subject) => [sourceModuleId(subject.relativePath), subject] as const)
  );

  const reachesOwnedAdapter = (specifier: string, visitedModules: Set<string>): boolean => {
    const moduleId = normalizedSourceSpecifier(specifier);
    if (ownedFirestoreAdapterModules.has(moduleId)) return true;
    if (visitedModules.has(moduleId)) return false;

    const adapter = firestoreAdaptersByModule.get(moduleId);
    if (adapter == null) return false;

    const nextVisitedModules = new Set(visitedModules).add(moduleId);
    return moduleReferencesForSource(adapter.relativePath, adapter.source).some((reference) =>
      reachesOwnedAdapter(reference.resolvedSpecifier, nextVisitedModules)
    );
  };

  return subjects.flatMap((subject) => {
    if (subject.relativePath.startsWith("adapters/firestore/")) return [];
    const consumesOwnedAdapter = moduleReferencesForSource(subject.relativePath, subject.source).some((reference) =>
      reachesOwnedAdapter(reference.resolvedSpecifier, new Set())
    );
    return consumesOwnedAdapter ? [subject.relativePath] : [];
  });
}

function parseSource({ relativePath, source }: TextSubject): ts.SourceFile {
  const scriptKind = relativePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  return ts.createSourceFile(relativePath, source, ts.ScriptTarget.Latest, true, scriptKind);
}

function staticName(node: ts.Node | undefined): string | undefined {
  if (node === undefined) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  if (ts.isComputedPropertyName(node)) return staticName(node.expression);
  return undefined;
}

function propertyLikeName(node: ts.Node): string | undefined {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (ts.isElementAccessExpression(node)) return staticName(node.argumentExpression);
  if (ts.isBindingElement(node)) return staticName(node.propertyName ?? node.name);
  if (ts.isShorthandPropertyAssignment(node)) return node.name.text;
  if (
    ts.isPropertySignature(node) ||
    ts.isMethodSignature(node) ||
    ts.isPropertyDeclaration(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isPropertyAssignment(node) ||
    ts.isGetAccessorDeclaration(node) ||
    ts.isSetAccessorDeclaration(node)
  ) {
    return staticName(node.name);
  }
  return undefined;
}

function containsSyntax(sourceFile: ts.SourceFile, predicate: (node: ts.Node) => boolean): boolean {
  let matched = false;
  const visit = (node: ts.Node): void => {
    if (matched) return;
    matched = predicate(node);
    if (!matched) ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  return matched;
}

function remoteSnapshotCapabilityViolations(subjects: TextSubject[]): string[] {
  return subjects.flatMap((subject) => {
    const hasCapability = containsSyntax(parseSource(subject), (node) => {
      if (ts.isIdentifier(node) && node.text === remoteSnapshotCapabilityName) return true;
      return propertyLikeName(node) === remoteSnapshotCapabilityName;
    });
    return hasCapability ? [subject.relativePath] : [];
  });
}

function remoteMutationEntityAccessViolations(subject: TextSubject): string[] {
  const sourceFile = parseSource(subject);
  const compilerOptions: ts.CompilerOptions = {
    noLib: true,
    noResolve: true,
    target: ts.ScriptTarget.Latest,
  };
  const compilerHost = ts.createCompilerHost(compilerOptions);
  compilerHost.fileExists = (fileName) => fileName === sourceFile.fileName;
  compilerHost.readFile = (fileName) => (fileName === sourceFile.fileName ? subject.source : undefined);
  compilerHost.getSourceFile = (fileName) => (fileName === sourceFile.fileName ? sourceFile : undefined);
  const program = ts.createProgram([sourceFile.fileName], compilerOptions, compilerHost);
  const checker = program.getTypeChecker();
  const mutationActionNames = new Set<string>();

  const discoverMutationActions = (node: ts.Node): void => {
    if (ts.isInterfaceDeclaration(node) && node.name.text === remoteStoreStateName) {
      node.members.forEach((member) => {
        const name = propertyLikeName(member);
        const isAction =
          ts.isMethodSignature(member) ||
          (ts.isPropertySignature(member) && member.type != null && ts.isFunctionTypeNode(member.type));
        if (name != null && isAction && !remoteReadLifecycleActionNames.has(name)) mutationActionNames.add(name);
      });
    }
    ts.forEachChild(node, discoverMutationActions);
  };
  discoverMutationActions(sourceFile);

  const actionSymbols = new Map<string, Set<ts.Symbol>>();
  const indexActionImplementations = (node: ts.Node): void => {
    let name: ts.Identifier | undefined;
    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name)) name = node.name;
    if (ts.isFunctionDeclaration(node) && node.name != null) name = node.name;
    if (name != null && mutationActionNames.has(name.text)) {
      const symbol = checker.getSymbolAtLocation(name);
      if (symbol != null) {
        const symbols = actionSymbols.get(name.text) ?? new Set<ts.Symbol>();
        symbols.add(symbol);
        actionSymbols.set(name.text, symbols);
      }
    }
    ts.forEachChild(node, indexActionImplementations);
  };
  indexActionImplementations(sourceFile);

  type CallableResolution =
    | { kind: "resolved"; declaration: ts.FunctionLikeDeclaration }
    | { kind: "external" }
    | { kind: "unresolved" };

  const resolvedCallable = (declaration: ts.FunctionLikeDeclaration): CallableResolution => ({
    kind: "resolved",
    declaration,
  });

  const resolveSymbol = (symbol: ts.Symbol, visitedSymbols: Set<ts.Symbol>): CallableResolution => {
    if (visitedSymbols.has(symbol)) return { kind: "unresolved" };
    const nextVisitedSymbols = new Set(visitedSymbols).add(symbol);
    const declarations = (symbol.declarations ?? []).filter(
      (declaration) => declaration.getSourceFile() === sourceFile
    );
    const runtimeDeclarations = declarations.filter(
      (declaration) =>
        (ts.isFunctionDeclaration(declaration) && declaration.body != null) ||
        ts.isVariableDeclaration(declaration) ||
        (ts.isMethodDeclaration(declaration) && declaration.body != null) ||
        ts.isPropertyAssignment(declaration) ||
        ts.isShorthandPropertyAssignment(declaration) ||
        ts.isPropertyDeclaration(declaration) ||
        ts.isBindingElement(declaration)
    );
    if (runtimeDeclarations.length === 0) return { kind: "external" };

    const resolveExpression = (expression: ts.Expression): CallableResolution => {
      if (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) return resolvedCallable(expression);
      if (
        ts.isParenthesizedExpression(expression) ||
        ts.isAsExpression(expression) ||
        ts.isTypeAssertionExpression(expression) ||
        ts.isNonNullExpression(expression) ||
        ts.isSatisfiesExpression(expression)
      ) {
        return resolveExpression(expression.expression);
      }
      if (
        ts.isIdentifier(expression) ||
        ts.isPropertyAccessExpression(expression) ||
        ts.isElementAccessExpression(expression)
      ) {
        const target = checker.getSymbolAtLocation(expression);
        return target == null ? { kind: "external" } : resolveSymbol(target, nextVisitedSymbols);
      }
      return { kind: "unresolved" };
    };

    const resolutions = runtimeDeclarations.map((declaration): CallableResolution => {
      if (ts.isFunctionDeclaration(declaration) || ts.isMethodDeclaration(declaration)) {
        return resolvedCallable(declaration);
      }
      if (ts.isVariableDeclaration(declaration) || ts.isPropertyAssignment(declaration)) {
        return declaration.initializer == null ? { kind: "unresolved" } : resolveExpression(declaration.initializer);
      }
      if (ts.isPropertyDeclaration(declaration)) {
        return declaration.initializer == null ? { kind: "unresolved" } : resolveExpression(declaration.initializer);
      }
      if (ts.isShorthandPropertyAssignment(declaration)) {
        const valueSymbol = checker.getShorthandAssignmentValueSymbol(declaration);
        return valueSymbol == null ? { kind: "unresolved" } : resolveSymbol(valueSymbol, nextVisitedSymbols);
      }
      if (ts.isBindingElement(declaration) && ts.isObjectBindingPattern(declaration.parent)) {
        const variableDeclaration = declaration.parent.parent;
        if (ts.isVariableDeclaration(variableDeclaration) && variableDeclaration.initializer != null) {
          const name = staticName(declaration.propertyName ?? declaration.name);
          const property =
            name == null
              ? undefined
              : checker.getPropertyOfType(checker.getTypeAtLocation(variableDeclaration.initializer), name);
          return property == null ? { kind: "unresolved" } : resolveSymbol(property, nextVisitedSymbols);
        }
      }
      return { kind: "external" };
    });
    if (resolutions.some((resolution) => resolution.kind === "unresolved")) return { kind: "unresolved" };

    const resolvedDeclarations = resolutions.flatMap((resolution) =>
      resolution.kind === "resolved" ? [resolution.declaration] : []
    );
    const uniqueDeclarations = new Set(resolvedDeclarations);
    if (uniqueDeclarations.size === 1 && resolutions.every((resolution) => resolution.kind === "resolved")) {
      const declaration = resolvedDeclarations[0];
      return declaration == null ? { kind: "unresolved" } : resolvedCallable(declaration);
    }
    return uniqueDeclarations.size === 0 ? { kind: "external" } : { kind: "unresolved" };
  };

  const violations: string[] = [];
  mutationActionNames.forEach((actionName) => {
    const referencedMaps = new Set<string>();
    const visitedFunctions = new Set<ts.FunctionLikeDeclaration>();
    const symbols = actionSymbols.get(actionName);
    const actionSymbol = symbols?.size === 1 ? symbols.values().next().value : undefined;
    const actionResolution =
      actionSymbol == null ? ({ kind: "unresolved" } as const) : resolveSymbol(actionSymbol, new Set());
    if (actionResolution.kind !== "resolved") {
      violations.push(`${subject.relativePath}: ${actionName} -> unresolved`);
      return;
    }

    const inspectFunction = (declaration: ts.FunctionLikeDeclaration): void => {
      if (visitedFunctions.has(declaration)) return;
      visitedFunctions.add(declaration);
      const inspectNode = (node: ts.Node): void => {
        if (ts.isIdentifier(node) && remoteEntityMapNames.has(node.text)) referencedMaps.add(node.text);
        if (ts.isCallExpression(node)) {
          const target = checker.getSymbolAtLocation(node.expression);
          if (target != null) {
            const resolution = resolveSymbol(target, new Set());
            if (resolution.kind === "resolved") inspectFunction(resolution.declaration);
            if (resolution.kind === "unresolved") referencedMaps.add("unresolved");
          }
        }
        ts.forEachChild(node, inspectNode);
      };
      inspectNode(declaration);
    };

    inspectFunction(actionResolution.declaration);
    referencedMaps.forEach((name) => {
      violations.push(`${subject.relativePath}: ${actionName} -> ${name}`);
    });
  });
  return violations;
}

/**
 * Evaluates the is module or subpath condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function isModuleOrSubpath(specifier: string, moduleName: string): boolean {
  return specifier === moduleName || specifier.startsWith(`${moduleName}/`);
}

/**
 * Provides the import violation test helper used by this file.
 * Keeping this setup in one function lets each test focus on the behavior it is proving.
 */
function importViolation(relativePath: string, reference: ModuleReference): string {
  const resolution = reference.resolvedSpecifier === reference.specifier ? "" : ` -> ${reference.resolvedSpecifier}`;
  return `${relativePath}: ${reference.specifier}${resolution}`;
}

/**
 * Evaluates the forbidden connector condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function forbiddenConnector(specifier: string): boolean {
  return (
    connectorModules.some((moduleName) => isModuleOrSubpath(specifier, moduleName)) ||
    /^@\/features\/[^/]+\/(?:containers|hooks)(?:\/|$)/.test(specifier)
  );
}

/**
 * Evaluates the is firebase module condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function isFirebaseModule(specifier: string): boolean {
  return isModuleOrSubpath(specifier, "firebase") || isModuleOrSubpath(specifier, "@/firebase");
}

/**
 * Evaluates the is firestore adapter module condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function isFirestoreAdapterModule(specifier: string): boolean {
  return isModuleOrSubpath(specifier, "@/adapters/firestore") || isModuleOrSubpath(specifier, "@/action/firestore");
}

/**
 * Evaluates the can import firestore adapter condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function canImportFirestoreAdapter(relativePath: string, specifier: string): boolean {
  return firestoreCompositionModules.has(relativePath) && isModuleOrSubpath(specifier, "@/adapters/firestore");
}

/**
 * Runs the shared expect stateless presentation assertions for one test subject.
 * Keeping the repeated expectations together lets each test emphasize the scenario being checked.
 */
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

/**
 * Evaluates the is container support hook condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function isContainerSupportHook(specifier: string): boolean {
  return isModuleOrSubpath(specifier, "@/hooks") || /^@\/features\/[^/]+\/hooks\/use[A-Z][^/]*$/.test(specifier);
}

/**
 * Evaluates the can import container support hook condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function canImportContainerSupportHook(relativePath: string): boolean {
  return /^features\/[^/]+\/(?:containers|hooks)\//.test(relativePath);
}

/**
 * Evaluates the forbidden container dependency condition used by this test file.
 * The named predicate makes the architecture or behavior rule explicit in each assertion.
 */
function forbiddenContainerDependency(specifier: string): boolean {
  if (isContainerSupportHook(specifier)) return false;

  return (
    isModuleOrSubpath(specifier, "@/App") ||
    isModuleOrSubpath(specifier, "@/page") ||
    /^@\/features\/[^/]+\/containers(?:\/?$|\/index(?:\.ts)?$|\/[^/]*Container(?:\.tsx?)?$)/.test(specifier)
  );
}

/**
 * Runs the shared expect shared component group assertions for one test subject.
 * Keeping the repeated expectations together lets each test emphasize the scenario being checked.
 */
function expectSharedComponentGroup(
  group: "layout" | "forms" | "content" | "feedback",
  componentNames: string[],
  storyNames: string[] = componentNames,
  extraFiles: string[] = []
): void {
  const groupedPaths = [
    ...componentNames.map((name) => `components/${group}/${name}.tsx`),
    ...storyNames.map((name) => `components/${group}/${name}.stories.tsx`),
    ...extraFiles.map((name) => `components/${group}/${name}`),
  ];
  const legacyPaths = groupedPaths.map((groupedPath) => `components/${path.posix.basename(groupedPath)}`);

  expect(groupedPaths.filter((relativePath) => !existsSync(sourcePath(relativePath)))).toEqual([]);
  expect(legacyPaths.filter((relativePath) => existsSync(sourcePath(relativePath)))).toEqual([]);
}

describe("component architecture", () => {
  it("leaves render memoization to React Compiler", () => {
    const inventory = productionFilesUnder("").flatMap((relativePath) => {
      const count = readSource(relativePath).match(manualMemoizationHook)?.length ?? 0;
      return count === 0 ? [] : [{ relativePath, count }];
    });

    expect(inventory).toEqual([]);
  });

  it("normalizes baseUrl source imports before checking boundaries", () => {
    expect(resolveModuleSpecifier("components/content/Card.tsx", "src/action")).toBe("@/action");
  });

  it("treats application modules as presentation connectors across import styles", () => {
    const presentationPath = "features/deck/components/templates/DeckListTemplate.tsx";
    const applicationImports = ["@/store", "@/hooks", "src/store", "../../../../hooks"];

    for (const specifier of applicationImports) {
      expect(forbiddenConnector(resolveModuleSpecifier(presentationPath, specifier)), specifier).toBe(true);
    }
  });

  it("detects every prohibited server-state token in text subjects", () => {
    const subjects = prohibitedServerStateTokens.map(({ value }, index) => ({
      relativePath: `fixture-${index}`,
      source: `before ${value} after`,
    }));

    expect(serverStateResidualViolations(subjects)).toEqual(
      prohibitedServerStateTokens.map(({ value }, index) => `fixture-${index}: ${value}`)
    );
  });

  it("keeps obsolete server-state tokens out of source and package metadata", () => {
    const subjects = [
      ...filesUnder("").map((relativePath) => ({
        relativePath: `src/${relativePath}`,
        source: readSource(relativePath),
      })),
      ...["package.json", "package-lock.json"].map((relativePath) => ({
        relativePath,
        source: readFileSync(path.resolve(process.cwd(), relativePath), "utf8"),
      })),
    ];

    expect(serverStateResidualViolations(subjects)).toEqual([]);
  });

  it("recognizes Firebase and Firestore adapter dependencies across import styles", () => {
    const presentationPath = "features/deck/components/DeckCard.tsx";

    expect(isFirebaseModule("firebase/firestore")).toBe(true);
    expect(isFirebaseModule("@/firebase")).toBe(true);
    expect(isFirestoreAdapterModule("@/adapters/firestore/event")).toBe(true);
    expect(isFirestoreAdapterModule("@/action/firestore")).toBe(true);
    expect(isFirestoreAdapterModule(resolveModuleSpecifier(presentationPath, "../../../adapters/firestore"))).toBe(
      true
    );
  });

  it("keeps Firestore SDK imports inside the adapter", () => {
    const violations = productionFilesUnder("").flatMap((relativePath) => {
      if (relativePath.startsWith("adapters/firestore/")) return [];
      return moduleReferences(relativePath)
        .filter((reference) => isModuleOrSubpath(reference.specifier, "firebase/firestore"))
        .map((reference) => importViolation(relativePath, reference));
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("detects every RemoteStore snapshot capability reference in fixtures", () => {
    const capability = ["apply", "Snapshot"].join("");
    const subjects = [
      { relativePath: "dotted-call.ts", source: `remote.${capability}(value);` },
      { relativePath: "optional-call.ts", source: `remote?.${capability}?.(value);` },
      { relativePath: "bracket-access.ts", source: `remote["${capability}"](value);` },
      { relativePath: "aliased-reference.ts", source: `const publish = remote.${capability}; publish(value);` },
      { relativePath: "destructured-reference.ts", source: `const { ${capability}: publish } = remote;` },
      { relativePath: "bare-reference.ts", source: `void remote.${capability};` },
    ];

    expect(remoteSnapshotCapabilityViolations(subjects)).toEqual(subjects.map(({ relativePath }) => relativePath));
  });

  it("detects subscription-owned entity map access in mutation action fixtures", () => {
    const subject = {
      relativePath: "remote-store.ts",
      source: `
        interface RemoteStoreState { createCard: () => void; }
        const createCard = () => set((state) => ({ read: { ...state.read, cardsById: {} } }));
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["remote-store.ts: createCard -> cardsById"]);
  });

  it("discovers newly named mutation actions from the RemoteStoreState surface", () => {
    const subject = {
      relativePath: "new-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          archiveCard: () => void;
        }
        const archiveCard = () => void cardsById;
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["new-action.ts: archiveCard -> cardsById"]);
  });

  it("resolves function declaration mutation actions", () => {
    const subject = {
      relativePath: "function-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          createCard: () => void;
        }
        function createCard() { void decksById; }
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["function-action.ts: createCard -> decksById"]);
  });

  it("follows local helpers called transitively by mutation actions", () => {
    const subject = {
      relativePath: "transitive-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          updateCard: () => void;
        }
        const inspectCards = () => void cardsById;
        function prepareUpdate() { inspectCards(); void decksById; }
        const updateCard = () => prepareUpdate();
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual([
      "transitive-action.ts: updateCard -> cardsById",
      "transitive-action.ts: updateCard -> decksById",
    ]);
  });

  it("follows local helper aliases called by mutation actions", () => {
    const subject = {
      relativePath: "aliased-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          updateCard: () => void;
        }
        const inspectCards = () => void cardsById;
        const aliasedHelper = inspectCards;
        const updateCard = () => aliasedHelper();
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["aliased-action.ts: updateCard -> cardsById"]);
  });

  it("follows local object-property helpers called by mutation actions", () => {
    const subject = {
      relativePath: "property-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          updateDeck: () => void;
        }
        const helpers = {
          mutate() { void decksById; },
        };
        const updateDeck = () => helpers.mutate();
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["property-action.ts: updateDeck -> decksById"]);
  });

  it("fails closed when a mutation action has no local function body", () => {
    const subject = {
      relativePath: "unresolved-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          createCard: () => void;
        }
        const store = { createCard: dependencies.createCard };
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual(["unresolved-action.ts: createCard -> unresolved"]);
  });

  it("allows mutation actions to call unrelated dependency properties", () => {
    const subject = {
      relativePath: "dependency-action.ts",
      source: `
        interface RemoteStoreState {
          read: unknown;
          start: () => void;
          stop: () => void;
          retryReads: () => void;
          createCard: () => void;
        }
        const createCard = () => dependencies.createCard();
      `,
    };

    expect(remoteMutationEntityAccessViolations(subject)).toEqual([]);
  });

  it("keeps mutation actions from accessing subscription-owned entity maps", () => {
    const subject = { relativePath: "store/remoteStore.ts", source: readSource("store/remoteStore.ts") };
    const violations = remoteMutationEntityAccessViolations(subject);

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("applies production subscription snapshots only in the Zustand remote store", () => {
    const allowedPath = "store/remoteStore.ts";
    const violations = remoteSnapshotCapabilityViolations(
      productionFilesUnder("").flatMap((relativePath) =>
        relativePath === allowedPath ? [] : [{ relativePath, source: readSource(relativePath) }]
      )
    );

    expect(violations, violations.join("\n")).toEqual([]);
    expect(
      remoteSnapshotCapabilityViolations([{ relativePath: allowedPath, source: readSource(allowedPath) }])
    ).toEqual([allowedPath]);
  });

  it("uses production-oriented names for Firestore adapter modules", () => {
    expect(existsSync(sourcePath("adapters/firestore/mocked.ts"))).toBe(false);
    expect(existsSync(sourcePath("adapters/firestore/documentMetadata.ts"))).toBe(true);
  });

  it("limits concrete Firestore dependencies to composition modules", () => {
    const applicationFiles = productionFilesUnder("").filter(
      (relativePath) => !relativePath.startsWith("adapters/firestore/")
    );
    const violations = applicationFiles.flatMap((relativePath) =>
      moduleReferences(relativePath)
        .filter(
          (reference) =>
            isFirestoreAdapterModule(reference.resolvedSpecifier) &&
            !canImportFirestoreAdapter(relativePath, reference.resolvedSpecifier)
        )
        .map((reference) => importViolation(relativePath, reference))
    );

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps remote subscription and mutation adapters owned by the Zustand store", () => {
    const owners = firestoreOwnedAdapterConsumers(
      productionFilesUnder("").map((relativePath) => ({ relativePath, source: readSource(relativePath) }))
    );

    expect(owners).toEqual(["store/remoteStore.ts"]);
  });

  it("keeps remote subscription and mutation adapters out of the Firestore barrel", () => {
    const violations = moduleReferences("adapters/firestore/index.ts")
      .filter((reference) => ownedFirestoreAdapterModules.has(reference.resolvedSpecifier))
      .map((reference) => importViolation("adapters/firestore/index.ts", reference));

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("prevents composition modules from gaining owned adapters through the Firestore barrel", () => {
    const fixture = {
      relativePath: "firebase.ts",
      source: `
        import { card, deck, event } from "@/adapters/firestore";
        void card.create;
        void deck.create;
        void event.subscribeCardReads;
      `,
    };
    const barrelExportsOwnedAdapters = moduleReferences("adapters/firestore/index.ts").some((reference) =>
      ownedFirestoreAdapterModules.has(reference.resolvedSpecifier)
    );
    const fixtureImportsBarrel = moduleReferencesForSource(fixture.relativePath, fixture.source).some(
      (reference) => reference.resolvedSpecifier === "@/adapters/firestore"
    );

    expect(barrelExportsOwnedAdapters && fixtureImportsBarrel).toBe(false);
  });

  it("detects owned adapters consumed through a nested Firestore barrel", () => {
    const subjects = [
      {
        relativePath: "adapters/firestore/owned/index.ts",
        source: `export * as card from "@/adapters/firestore/card";`,
      },
      {
        relativePath: "firebase.ts",
        source: `import { card } from "@/adapters/firestore/owned"; void card.create;`,
      },
    ];

    expect(firestoreOwnedAdapterConsumers(subjects)).toEqual(["firebase.ts"]);
  });

  it("keeps presentation independent from Firebase and Firestore adapters", () => {
    const presentationFiles = [
      ...productionFilesUnder("components"),
      ...productionFilesUnder("features").filter((relativePath) => relativePath.includes("/components/")),
    ];
    const violations = presentationFiles.flatMap((relativePath) =>
      moduleReferences(relativePath)
        .filter(
          (reference) =>
            isFirebaseModule(reference.resolvedSpecifier) || isFirestoreAdapterModule(reference.resolvedSpecifier)
        )
        .map((reference) => importViolation(relativePath, reference))
    );

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("recognizes container-support hook paths and consumers", () => {
    expect(isContainerSupportHook("@/hooks/useActions")).toBe(true);
    expect(isContainerSupportHook("@/features/deck/hooks/useDeckActions")).toBe(true);
    expect(isContainerSupportHook("@/features/deck/containers/useDeckActions")).toBe(false);
    expect(canImportContainerSupportHook("features/deck/containers/DeckListContainer.tsx")).toBe(true);
    expect(canImportContainerSupportHook("features/study/hooks/useStudyActions.ts")).toBe(true);
    expect(canImportContainerSupportHook("features/study/state/studyStore.ts")).toBe(false);
    expect(canImportContainerSupportHook("features/deck/components/DeckCard.tsx")).toBe(false);
  });

  it("allows feature hooks and components while rejecting route-level dependencies", () => {
    expect(forbiddenContainerDependency("@/features/deck/hooks/useDeckActions")).toBe(false);
    expect(forbiddenContainerDependency("@/features/deck/components/DeckStartForm")).toBe(false);
    expect(forbiddenContainerDependency("@/App")).toBe(true);
    expect(forbiddenContainerDependency("@/page/DeckListPage")).toBe(true);
    expect(forbiddenContainerDependency("@/features/deck/containers")).toBe(true);
    expect(forbiddenContainerDependency("@/features/deck/containers/index.ts")).toBe(true);
    expect(forbiddenContainerDependency("@/features/deck/containers/DeckListContainer")).toBe(true);
    expect(forbiddenContainerDependency("@/features/deck/containers/useDeckContainer")).toBe(true);
  });

  it("removes the legacy Atomic Design component root", () => {
    expect(existsSync(sourcePath("component"))).toBe(false);
  });

  it("removes the legacy selector module", () => {
    const legacySelectorModule = ["@", "selector"].join("/");
    const selectorReferences = productionFilesUnder("").flatMap((relativePath) =>
      moduleReferences(relativePath)
        .filter((reference) => isModuleOrSubpath(reference.resolvedSpecifier, legacySelectorModule))
        .map((reference) => importViolation(relativePath, reference))
    );

    expect(existsSync(sourcePath("selector"))).toBe(false);
    expect(selectorReferences, selectorReferences.join("\n")).toEqual([]);
  });

  it("removes the obsolete query layer and its imports", () => {
    const obsoleteQueryModule = ["@", "query"].join("/");
    const queryReferences = sourceFilesUnder("").flatMap((relativePath) =>
      moduleReferences(relativePath)
        .filter((reference) => isModuleOrSubpath(reference.resolvedSpecifier, obsoleteQueryModule))
        .map((reference) => importViolation(relativePath, reference))
    );

    expect(existsSync(sourcePath("query"))).toBe(false);
    expect(queryReferences, queryReferences.join("\n")).toEqual([]);
  });

  it("limits application stores to configuration and remote data", () => {
    const legacyPackages = ["react-redux", "redux", "redux-persist", "redux-thunk"];
    const legacyImports = productionFilesUnder("").flatMap((relativePath) =>
      moduleReferences(relativePath)
        .filter((reference) => legacyPackages.some((name) => isModuleOrSubpath(reference.specifier, name)))
        .map((reference) => importViolation(relativePath, reference))
    );
    const entityModeField = ["local", "Mode"].join("");
    const entityModeReferences = productionFilesUnder("").filter((relativePath) =>
      readSource(relativePath).includes(entityModeField)
    );
    const packageJson = JSON.parse(readFileSync(path.resolve(process.cwd(), "package.json"), "utf8")) as {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
    };
    const dependencyNames = [
      ...Object.keys(packageJson.dependencies ?? {}),
      ...Object.keys(packageJson.devDependencies ?? {}),
    ];

    expect(legacyImports, legacyImports.join("\n")).toEqual([]);
    expect(entityModeReferences, entityModeReferences.join("\n")).toEqual([]);
    expect(dependencyNames.filter((name) => legacyPackages.includes(name))).toEqual([]);
    expect(sourceFilesUnder("store")).toEqual([
      "store/configSchema.ts",
      "store/configStore.spec.ts",
      "store/configStore.ts",
      "store/remoteMutationLocks.ts",
      "store/remoteSelectors.spec.ts",
      "store/remoteSelectors.ts",
      "store/remoteStore.mutations.spec.ts",
      "store/remoteStore.reads.spec.ts",
      "store/remoteStore.spec.ts",
      "store/remoteStore.ts",
    ]);
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
    expectSharedComponentGroup("feedback", [
      "Feedback",
      "Overlay",
      "RemoteMutationNotice",
      "RemoteReadBoundary",
      "RouteFeedback",
    ]);
  });

  it("keeps the exact shared component groups", () => {
    expect(
      readdirSync(sourcePath("components"))
        .filter((entry) => entry !== ".DS_Store")
        .sort()
    ).toEqual(["content", "feedback", "forms", "index.ts", "layout"].sort());
  });

  it("keeps every page as one feature container route entry", () => {
    const pagePaths = productionFilesUnder("page").filter((relativePath) => relativePath.endsWith(".tsx"));
    expect(pagePaths.length).toBeGreaterThan(0);

    for (const pagePath of pagePaths) {
      const source = readSource(pagePath);
      const modules = moduleSpecifiers(source);
      const featureContainerModules = modules.filter((specifier) => /^@\/features\/[^/]+\/containers$/.test(specifier));
      const renderedContainers = Array.from(
        source.matchAll(/<([A-Z][A-Za-z0-9]*Container)\s*\/>/g),
        (match) => match[1]
      );

      expect(featureContainerModules, pagePath).toHaveLength(1);
      expect(modules, pagePath).toEqual(
        modules.includes("react") ? ["react", featureContainerModules[0]] : [featureContainerModules[0]]
      );
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

    for (const sharedPath of productionFilesUnder("components")) {
      expectStatelessPresentation(sharedPath);
      violations.push(
        ...moduleReferences(sharedPath)
          .filter((reference) => reference.resolvedSpecifier.startsWith("@/features"))
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
                reference.resolvedSpecifier.startsWith("@/") &&
                !isModuleOrSubpath(reference.resolvedSpecifier, "@/components") &&
                !isModuleOrSubpath(reference.resolvedSpecifier, `@/features/${featureName}/components`)
            )
            .map((reference) => importViolation(componentPath, reference))
        );
      }
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("keeps route containers from nesting route-level components", () => {
    const containerPaths = productionFilesUnder("features").filter((relativePath) =>
      /^features\/[^/]+\/containers\/[^/]*Container\.tsx$/.test(relativePath)
    );
    const violations = containerPaths.flatMap((containerPath) =>
      moduleReferences(containerPath)
        .filter((reference) => forbiddenContainerDependency(reference.resolvedSpecifier))
        .map((reference) => importViolation(containerPath, reference))
    );

    expect(containerPaths.length).toBeGreaterThan(0);
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("places dedicated feature hook modules under hooks directories", () => {
    const misplacedHookModules = productionFilesUnder("features").filter(
      (relativePath) =>
        /(?:^|\/)use[A-Z][^/]*\.tsx?$/.test(relativePath) &&
        !/^features\/[^/]+\/hooks\/use[A-Z][^/]*\.tsx?$/.test(relativePath)
    );
    const hookBarrels = sourceFilesUnder("features").filter((relativePath) =>
      /^features\/[^/]+\/hooks\/index\.ts$/.test(relativePath)
    );

    expect(misplacedHookModules).toEqual([]);
    expect(hookBarrels).toEqual([]);
  });

  it("keeps feature custom hook definitions under hooks directories", () => {
    const violations = productionFilesUnder("features").flatMap((relativePath) => {
      if (/^features\/[^/]+\/hooks\//.test(relativePath)) return [];

      return Array.from(
        readSource(relativePath).matchAll(customHookDefinition),
        (match) => `${relativePath}: ${match[1]}`
      );
    });

    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("limits container-support hooks to container support modules", () => {
    const violations: string[] = [];

    for (const indexPath of sourceFilesUnder("features").filter((relativePath) =>
      /^features\/[^/]+\/containers\/index\.ts$/.test(relativePath)
    )) {
      violations.push(
        ...moduleReferences(indexPath)
          .filter((reference) => isContainerSupportHook(reference.resolvedSpecifier))
          .map((reference) => `${indexPath} publicly re-exports ${reference.specifier}`)
      );
    }

    for (const relativePath of productionFilesUnder(".")) {
      if (canImportContainerSupportHook(relativePath)) continue;

      violations.push(
        ...moduleReferences(relativePath)
          .filter((reference) => isContainerSupportHook(reference.resolvedSpecifier))
          .map((reference) => importViolation(relativePath, reference))
      );
    }

    expect(violations, violations.join("\n")).toEqual([]);
  });
});

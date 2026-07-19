# React Compiler Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable React Compiler 1.x exactly once in the application, Vitest, and Storybook pipelines and verify React 19 compiler-runtime output without changing application behavior.

**Architecture:** A root-level factory creates a fresh `@rolldown/plugin-babel` instance with `reactCompilerPreset()` for each environment. Vite keeps its React plugin, Vitest adds the compiler transform for imported application source, and Storybook adds the compiler through `viteFinal` while relying on its framework-provided React integration.

**Tech Stack:** React 19.2.7, Vite 8.1.3, `@vitejs/plugin-react` 6.0.3, `@rolldown/plugin-babel` 0.2.3, Babel 7.29, React Compiler 1.0.0, Vitest 4.1.10, Storybook 10.4.6, TypeScript 5.9.

## Global Constraints

- Use React 19's built-in `react/compiler-runtime`; do not add `react-compiler-runtime`.
- Add no annotation mode, directory filter, suppression, custom panic threshold, or runtime gate.
- Create a fresh compiler plugin instance for each Vite-based environment.
- Do not register a second React plugin in Vitest or Storybook.
- Preserve existing manual `useMemo`, `useCallback`, and `React.memo` usage.
- Keep React Compiler integration removable independently from React 19 and the diagnostic gate.
- Run `make check` and the complete `make ci` before publishing the pull request.
- Record React DevTools `Memo ✨` inspection as a manual pull-request task.

---

### Task 1: Add the official compiler dependencies

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: the optional compiler peer ranges from `@vitejs/plugin-react` 6.0.3.
- Produces: direct development dependencies for the shared compiler factory.

- [ ] **Step 1: Install the compatible stable dependency set**

Run:

```bash
npm install --save-dev @rolldown/plugin-babel@^0.2.3 @babel/core@^7.29.0 @types/babel__core@^7.20.5 babel-plugin-react-compiler@^1.0.0
```

Expected: the four packages appear in `devDependencies`; npm updates the lockfile without adding `react-compiler-runtime`.

- [ ] **Step 2: Verify the direct dependency and peer graph**

Run:

```bash
npm ls @rolldown/plugin-babel @babel/core @types/babel__core babel-plugin-react-compiler react-compiler-runtime
```

Expected: the first four packages resolve without `invalid` peer markers and `react-compiler-runtime` is absent.

- [ ] **Step 3: Commit the dependency boundary**

```bash
git add package.json package-lock.json
git commit -m "Add React Compiler build dependencies"
```

### Task 2: Drive the shared compiler wiring with a focused test

**Files:**
- Create: `reactCompiler.spec.ts`
- Create: `reactCompiler.ts`
- Modify: `vite.config.ts`
- Modify: `vitest.config.ts`
- Modify: `.storybook/main.ts`

**Interfaces:**
- Produces: `createReactCompilerPlugin(): Promise<Plugin>`, which returns a fresh Babel plugin configured with `reactCompilerPreset()`.
- Consumes: the factory from Vite, Vitest, and Storybook configuration.

- [ ] **Step 1: Write the failing configuration test**

Create `reactCompiler.spec.ts`. Hoist a mock of the shared factory that returns a uniquely identifiable plugin promise for every call, then resolve nested plugin arrays before checking them:

```ts
import { describe, expect, it, vi } from "vitest";
import storybookConfig from "./.storybook/main";
import viteConfig from "./vite.config";
import vitestConfig from "./vitest.config";

const reactCompilerMock = vi.hoisted(() => {
  const compilerPluginName = "react-compiler-test-sentinel";
  let instance = 0;

  return {
    compilerPluginName,
    createReactCompilerPlugin: vi.fn(async () => ({
      name: compilerPluginName,
      instance: ++instance,
    })),
  };
});

vi.mock("./reactCompiler", () => ({
  createReactCompilerPlugin: reactCompilerMock.createReactCompilerPlugin,
}));

const { compilerPluginName, createReactCompilerPlugin } = reactCompilerMock;

const collectPlugins = async (
  values: readonly unknown[] | undefined,
): Promise<object[]> => {
  const plugins: object[] = [];
  const collect = async (value: unknown): Promise<void> => {
    const resolved = await value;

    if (Array.isArray(resolved)) {
      await Promise.all(resolved.map(collect));
    } else if (typeof resolved === "object" && resolved !== null) {
      plugins.push(resolved);
    }
  };
  await Promise.all(values?.map(collect) ?? []);
  return plugins;
};

const compilerPlugins = async (values: readonly unknown[] | undefined) =>
  (await collectPlugins(values)).filter(
    (plugin) => "name" in plugin && plugin.name === compilerPluginName,
  );

const storybookInput = { plugins: [] };
const storybookViteConfig = await storybookConfig.viteFinal?.(
  storybookInput,
  { configType: "PRODUCTION" } as never,
);

describe("React Compiler Vite integration", () => {
  it("calls the shared factory once for every environment", () => {
    expect(createReactCompilerPlugin).toHaveBeenCalledTimes(3);
  });

  it("adds one compiler plugin to the application", async () => {
    expect(await compilerPlugins(viteConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Vitest", async () => {
    expect(await compilerPlugins(vitestConfig.plugins)).toHaveLength(1);
  });

  it("adds one compiler plugin to Storybook", async () => {
    expect(storybookConfig.viteFinal).toBeTypeOf("function");
    expect(storybookViteConfig).not.toBe(storybookInput);
    expect(await compilerPlugins(storybookViteConfig?.plugins)).toHaveLength(1);
  });

  it("creates independent plugin instances for every environment", async () => {
    const instances = [
      ...(await compilerPlugins(viteConfig.plugins)),
      ...(await compilerPlugins(vitestConfig.plugins)),
      ...(await compilerPlugins(storybookViteConfig?.plugins)),
    ];

    expect(instances).toHaveLength(3);
    expect(new Set(instances).size).toBe(3);
  });
});
```

- [ ] **Step 2: Verify RED**

Run:

```bash
npx vitest run reactCompiler.spec.ts
```

Expected: five assertion failures because the factory is never called and none of the configurations expose a sentinel plugin or Storybook `viteFinal` hook.

- [ ] **Step 3: Implement the minimal shared factory**

Create `reactCompiler.ts`:

```ts
import babel from "@rolldown/plugin-babel";
import { reactCompilerPreset } from "@vitejs/plugin-react";
import type { Plugin } from "vite";

export const createReactCompilerPlugin = (): Promise<Plugin> =>
  babel({
    presets: [reactCompilerPreset()],
  });
```

Do not pass compiler options or mutate the preset filter.

- [ ] **Step 4: Wire the application and Vitest**

Import the factory into both root configurations. Use these plugin orders:

```ts
plugins: [react(), createReactCompilerPlugin()]
resolve: { tsconfigPaths: true }
```

```ts
plugins: [createReactCompilerPlugin()]
resolve: { tsconfigPaths: true }
```

The Babel compiler runs before non-Babel application transforms, and each configuration receives its own plugin instance.

- [ ] **Step 5: Wire Storybook through `viteFinal`**

Add `mergeConfig` and the factory to `.storybook/main.ts`, then add:

```ts
viteFinal: async (viteConfig) =>
  mergeConfig(viteConfig, {
    plugins: [createReactCompilerPlugin()],
  }),
```

Do not add `react()` because `@storybook/react-vite` already supplies the React integration.

- [ ] **Step 6: Verify GREEN**

Run:

```bash
npx vitest run reactCompiler.spec.ts
```

Expected: PASS with one compiler plugin in each environment and distinct factory instances.

- [ ] **Step 7: Commit shared wiring and its test**

```bash
git add reactCompiler.ts reactCompiler.spec.ts vite.config.ts vitest.config.ts .storybook/main.ts
git commit -m "Apply React Compiler across Vite environments"
```

### Task 3: Verify real compiler transformation and production output

**Files:**
- Create: `scripts/verify-react-compiler.mjs`
- Modify: `package.json`

**Interfaces:**
- Consumes: unminified Vite production output and its source maps from the configured compiler pipeline.
- Produces: `npm run verify:react-compiler`, which fails unless React 19 compiler-runtime code is present in the production build.

- [ ] **Step 1: Write a failing output verifier**

Create `scripts/verify-react-compiler.mjs`:

```js
import { glob, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const buildDirectory = resolve(process.argv[2] ?? "build");
const mapFiles = [];
for await (const path of glob(join(buildDirectory, "assets", "*.js.map"))) {
  mapFiles.push(path);
}

let runtimeSource;
for (const path of mapFiles) {
  const sourceMap = JSON.parse(await readFile(path, "utf8"));
  runtimeSource = sourceMap.sources.find((source) =>
    source.includes("react-compiler-runtime"),
  );
  if (runtimeSource) break;
}

if (!runtimeSource) {
  throw new Error("React Compiler runtime was not found in production source maps");
}

const cacheCall = /const \$ = (?:[\w$]+\.)?c\(\d+\);/;
let compiledAsset;
for await (const path of glob(join(buildDirectory, "assets", "*.js"))) {
  if (cacheCall.test(await readFile(path, "utf8"))) {
    compiledAsset = path;
    break;
  }
}

if (!compiledAsset) {
  throw new Error("React Compiler cache calls were not found in production JavaScript");
}

console.log(`React Compiler runtime: ${runtimeSource}`);
console.log(`React Compiler output: ${compiledAsset}`);
```

The optional positional argument allows the RED step to inspect an uncompiled build outside the worktree.

- [ ] **Step 2: Verify RED against an uncompiled main build**

Create a fresh uncompiled build in the original `main` checkout, then inspect it with the worktree verifier:

```bash
cd /Users/studio2022/workspace/tango
npx vite build --minify=false --sourcemap
cd /Users/studio2022/workspace/tango/.worktrees/codex-react-compiler
node scripts/verify-react-compiler.mjs /Users/studio2022/workspace/tango/build
```

Expected: FAIL with `React Compiler runtime was not found in production source maps`.

- [ ] **Step 3: Add the repeatable verification command**

Add to `package.json`:

```json
"verify:react-compiler": "vite build --minify=false --sourcemap && node scripts/verify-react-compiler.mjs"
```

- [ ] **Step 4: Verify GREEN and refine only the evidence matcher if needed**

Run:

```bash
npm run verify:react-compiler
```

Expected: PASS, naming a `react-compiler-runtime` source-map entry and the generated JavaScript asset containing `const $ = …c(<cache-size>);` calls.

- [ ] **Step 5: Commit production verification**

```bash
git add package.json scripts/verify-react-compiler.mjs
git commit -m "Verify React Compiler production output"
```

### Task 4: Document compiler operation and rollback

**Files:**
- Modify: `docs/summary/testing.md`

**Interfaces:**
- Consumes: the implemented factory, verification script, CI policy, and exception policy.
- Produces: maintained operator guidance for future dependency and configuration changes.

- [ ] **Step 1: Update the command table**

Add `npm run verify:react-compiler` with a description that it performs an unminified source-map build and verifies React 19 compiler-runtime output.

- [ ] **Step 2: Add the React Compiler build policy**

Document all of the following in `docs/summary/testing.md`:

- `reactCompiler.ts` is the single source of compiler configuration.
- Vite, Vitest, and Storybook each call the factory once.
- React 19's default target uses `react/compiler-runtime`; `react-compiler-runtime` is prohibited.
- annotation mode, filters, suppressions, custom panic thresholds, and runtime gating require a confirmed blocker and tracking issue.
- rollback removes the shared plugin integration while preserving React 19 and ESLint diagnostics.
- React DevTools `Memo ✨` inspection remains manual for representative deck-list and study components.

- [ ] **Step 3: Verify the documentation diff**

Run:

```bash
git diff --check
git diff -- docs/summary/testing.md
```

Expected: no whitespace errors and no unrelated testing-policy changes.

- [ ] **Step 4: Commit the maintained documentation**

```bash
git add docs/summary/testing.md
git commit -m "Document React Compiler verification and rollback"
```

### Task 5: Verify the full integration and prepare PR evidence

**Files:**
- Verify all files changed since `origin/main`.

**Interfaces:**
- Consumes: dependency, configuration, verification, test, and documentation changes.
- Produces: fresh evidence for Issue #267 and its pull request.

- [ ] **Step 1: Verify dependency and exception policy**

Run:

```bash
npm ls @rolldown/plugin-babel @babel/core @types/babel__core babel-plugin-react-compiler react react-dom
rg -n 'use no memo|compilationMode|panicThreshold|react-compiler-runtime' --glob '!package-lock.json' .
```

Expected: dependencies are valid; policy terms appear only in design/operational documentation, and no source or configuration exception exists.

- [ ] **Step 2: Run focused compiler verification**

Run:

```bash
npx vitest run reactCompiler.spec.ts
npm run lint:react
npm run verify:react-compiler
```

Expected: the configuration test, zero-warning diagnostics, and production-output verifier pass.

- [ ] **Step 3: Run the required lightweight gate**

Run:

```bash
make check
```

Expected: sample build, formatting, TypeScript, React diagnostics, Biome, and unit tests pass.

- [ ] **Step 4: Run the complete CI gate and capture build evidence**

Run:

```bash
/usr/bin/time -p make ci
du -sk build storybook-static
find build/assets -type f -maxdepth 1 -print0 | xargs -0 wc -c
```

Expected: application build, Storybook build, unit tests, Firestore tests, sample tests, and Playwright E2E all pass. Record elapsed time and output sizes in the PR body; performance improvement is not required, but investigate any major regression.

- [ ] **Step 5: Review final scope and request code review**

Run:

```bash
git status --short --branch
git diff origin/main...HEAD --check
git diff origin/main...HEAD --stat
git log origin/main..HEAD --oneline
```

Expected: only Issue #267 dependencies, compiler integration, focused verification, design, and maintained testing documentation are present. Request a code review against `origin/main` and resolve all Critical or Important findings.

- [ ] **Step 6: Publish the pull request**

Push `codex/react-compiler` and create a pull request targeting `main` with an English title and body. Include `Closes #267`, automated test evidence, build duration and output sizes, and an unchecked manual item for React DevTools `Memo ✨` verification on deck-list and study components.

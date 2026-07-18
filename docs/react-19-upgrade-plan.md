# React 19 Upgrade Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade the Tango web application to React 19.2.7 and compatible React 19 type definitions without enabling React Compiler or changing runtime behavior.

**Architecture:** Update the React runtime and type packages as one dependency unit, then use the React 19 TypeScript diagnostics as the failing migration check. Preserve existing ref state semantics by supplying explicit `undefined` initial values, retain the current `createRoot`/`StrictMode` entrypoint, and validate the complete client application and Storybook dependency graph.

**Tech Stack:** React 19.2.7, React DOM 19.2.7, TypeScript 5.9, Vitest, Testing Library, Vite, Storybook, Playwright, npm 12.

## Global Constraints

- Keep `react` and `react-dom` on the identical `^19.2.7` range.
- Use `@types/react` `^19.2.17` and `@types/react-dom` `^19.2.3`.
- Do not enable React Compiler or adopt new React 19 application APIs.
- Preserve the modern JSX transform, `react-dom/client`, `createRoot`, and `StrictMode`.
- Add no `any`, blanket cast, lint suppression, or unrelated refactor.
- Future workspaces, including Issue #211, must use the same React major as the web application.
- Run `make check` before finishing and `make ci` for the Issue #266 completion criteria.

---

### Task 1: Upgrade the React dependency quartet

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Consumes: npm registry releases `react@19.2.7`, `react-dom@19.2.7`, `@types/react@19.2.17`, and `@types/react-dom@19.2.3`.
- Produces: one React 19 runtime and type dependency graph for all application, test, and Storybook consumers.

- [ ] **Step 1: Install the coordinated React 19 releases**

Run:

```bash
npm install react@^19.2.7 react-dom@^19.2.7 --save
npm install @types/react@^19.2.17 @types/react-dom@^19.2.3 --save-dev
```

Expected: `package.json` contains the four exact caret ranges from Global Constraints and npm updates `package-lock.json`.

- [ ] **Step 2: Run the React 19 TypeScript migration check and verify RED**

Run:

```bash
npm run lint:tsc
```

Expected: FAIL with React 19 `useRef` diagnostics requiring an initial argument in `useCardMutations.ts`, `useDeckMutations.ts`, `useDeckImport.ts`, and `DeckSwiperContainer.tsx`. If diagnostics identify a different compatibility surface, stop and update this plan before changing production code.

- [ ] **Step 3: Inspect the dependency graph**

Run:

```bash
npm ls react react-dom @types/react @types/react-dom
```

Expected: one React 19 major, no React 18 package, and no `invalid` peer dependency. Record any duplicate package path before continuing.

- [ ] **Step 4: Commit the dependency upgrade**

```bash
git add package.json package-lock.json
git commit -m "Upgrade the React dependency quartet to React 19"
```

### Task 2: Resolve React 19 ref type diagnostics

**Files:**
- Modify: `src/features/card/hooks/useCardMutations.ts`
- Modify: `src/features/deck/hooks/useDeckMutations.ts`
- Modify: `src/features/import/hooks/useDeckImport.ts`
- Modify: `src/features/study/containers/DeckSwiperContainer.tsx`
- Test: `src/features/card/hooks/useCardMutations.spec.tsx`
- Test: `src/features/import/hooks/useDeckImport.spec.tsx`
- Test: `src/features/study/containers/DeckSwiperContainer.spec.tsx`

**Interfaces:**
- Consumes: React 19 `useRef<T>(initialValue)` overloads and existing retry/navigation behavior.
- Produces: mutable refs whose initial `undefined` state and later stored values match React 18 runtime semantics.

- [ ] **Step 1: Run focused behavior tests before the type-only fixes**

Run:

```bash
npx vitest run src/features/card/hooks/useCardMutations.spec.tsx src/features/import/hooks/useDeckImport.spec.tsx src/features/study/containers/DeckSwiperContainer.spec.tsx
```

Expected: PASS, demonstrating that card mutation state, import concurrency guards, and the `StrictMode` navigation guard still behave under the upgraded React runtime even though TypeScript rejects the no-argument refs.

- [ ] **Step 2: Supply the explicit initial values**

Apply only these semantic-equivalent changes:

```ts
const lastFailed = useRef<CardMutationVariables | undefined>(undefined);
```

```ts
const lastFailed = useRef<Variables | undefined>(undefined);
```

```ts
const lastRequest = useRef<ImportRequest | undefined>(undefined);
```

```ts
const exitingDeck = React.useRef<DeckId | undefined>(undefined);
```

Do not change `runningRef`, `mutationTokenRef`, or DOM refs because they already have explicit initial values.

- [ ] **Step 3: Verify the React 19 type migration is GREEN**

Run:

```bash
npm run lint:tsc
```

Expected: PASS with zero React 19 type errors or deprecated React type diagnostics.

- [ ] **Step 4: Re-run the focused behavior tests**

Run:

```bash
npx vitest run src/features/card/hooks/useCardMutations.spec.tsx src/features/import/hooks/useDeckImport.spec.tsx src/features/study/containers/DeckSwiperContainer.spec.tsx
```

Expected: PASS with no React warning or error output.

- [ ] **Step 5: Confirm no remaining migration patterns**

Run:

```bash
rg -n 'useRef<[^>]+>\(\)|ReactDOM\.render|ReactDOM\.hydrate|findDOMNode|LegacyRef|JSX\.' src
```

Expected: no matches. `src/main.tsx` continues importing `react-dom/client` and calling `createRoot`.

- [ ] **Step 6: Commit the React 19 type compatibility fixes**

```bash
git add src/features/card/hooks/useCardMutations.ts src/features/deck/hooks/useDeckMutations.ts src/features/import/hooks/useDeckImport.ts src/features/study/containers/DeckSwiperContainer.tsx
git commit -m "Resolve React 19 ref type diagnostics"
```

### Task 3: Record the coordinated React major policy

**Files:**
- Modify: `docs/summary/testing.md`

**Interfaces:**
- Consumes: the package quartet policy and Issue #211 workspace constraint.
- Produces: a maintained dependency policy next to the repository's TypeScript and React diagnostic policy.

- [ ] **Step 1: Add the dependency policy**

Insert this section before `## TypeScript Coverage And Policy`:

```markdown
## React Dependency Policy

`react` と `react-dom` は同じ version range、`@types/react` と `@types/react-dom` は対応する同じ React major として協調更新します。`npm ls react react-dom @types/react @types/react-dom` で duplicate major と invalid peer dependency がないことを確認します。Issue #211 などで workspace を追加するときも web application と同じ React major を使用し、React runtime を workspace ごとに独立更新しません。
```

- [ ] **Step 2: Verify documentation formatting and diff**

Run:

```bash
git diff --check
git diff -- docs/summary/testing.md
```

Expected: no whitespace errors; the diff contains only the coordinated React major policy.

- [ ] **Step 3: Commit the policy**

```bash
git add docs/summary/testing.md
git commit -m "Document the coordinated React major policy"
```

### Task 4: Verify the complete React 19 upgrade

**Files:**
- Verify all files changed since `origin/main`.

**Interfaces:**
- Consumes: the React 19 dependency graph, ref fixes, and dependency policy.
- Produces: evidence that Issue #266 completion criteria pass before publishing the draft pull request.

- [ ] **Step 1: Re-verify dependency resolution**

Run:

```bash
npm ls react react-dom @types/react @types/react-dom
```

Expected: React and React DOM resolve to 19.2.7, type definitions resolve to React 19, React 18 is absent, and npm reports no invalid peer dependencies.

- [ ] **Step 2: Run the required lightweight gate**

Run:

```bash
make check
```

Expected: sample build, formatting, TypeScript, React Hooks diagnostics, Biome, and all unit tests pass.

- [ ] **Step 3: Run app and Storybook builds plus all CI suites**

Run:

```bash
make ci
```

Expected: Vite application build, Storybook static build, unit tests, Firestore tests, sample tests, and Playwright E2E tests all pass with no React browser warning or error.

- [ ] **Step 4: Review the final scope**

Run:

```bash
git status -sb
git diff origin/main...HEAD --stat
git log origin/main..HEAD --oneline
```

Expected: only the React 19 upgrade, its compatibility fixes, tests/design documentation, and dependency policy are present. React Compiler configuration is unchanged.

- [ ] **Step 5: Publish the draft pull request**

Push `codex/react-19`, then create a draft pull request targeting `main` with an English title and body. The body must summarize dependency, compatibility, documentation, and validation changes and include `Closes #266`.

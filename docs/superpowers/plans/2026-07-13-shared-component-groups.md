# Shared Component Groups Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize the flat `src/shared/components` directory into the approved `layout`, `forms`, `content`, and `feedback` responsibility groups without changing component behavior or the root barrel public API.

**Architecture:** Keep `@src/shared/components` as the only supported public API and update existing deep imports to grouped leaf paths. Move production components, stories, and `Code.scss` together, retain one root barrel, and extend the recursive architecture test so root-level files and unexpected groups cannot return.

**Tech Stack:** React 18, TypeScript 5, Vitest, Storybook, ESLint, Prettier, Vite, Docker Compose

---

## File map

- `src/shared/components/index.ts`: the single public barrel; continues exporting 28 component symbols and `HeaderProps`, `LayoutProps`, `Option`.
- `src/shared/components/layout`: `FullScreen`, `Header`, `Layout`, `List`, `Main`, `Outer` and their stories.
- `src/shared/components/forms`: `Button`, `Form`, `FormItem`, `Input`, `Select`, `Slider`, `Switch`, `Tag`, `Textarea`, `Upload` and their stories.
- `src/shared/components/content`: `Card`, `Code`, `Description`, `Logo`, `Math`, `Score`, `Section`, `Style`, `TagList`, `Title`, their stories, and `Code.scss`.
- `src/shared/components/feedback`: `Feedback`, `Overlay` and their stories.
- `src/lib/componentArchitecture.spec.ts`: placement and dependency guard.
- `src/lib/sharedComponentPublicApi.spec.ts`: root barrel compatibility characterization.
- `docs/architecture.md`, `docs/summary/module-map.md`: current responsibility-group documentation.

`src/shared/forms/renameKey.ts` is a non-presentation React Hook Form adapter and remains unchanged.

## Test command convention

Focused commands use the repository Docker toolchain:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- <paths>
```

Final verification uses the repository-required `make ci`.

Before Task 1, commit this reviewed plan so it is part of PR #200:

```bash
git add docs/superpowers/plans/2026-07-13-shared-component-groups.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: plan shared component grouping"
```

### Task 1: Characterize the public API and move layout components

**Files:**
- Create: `src/lib/sharedComponentPublicApi.spec.ts`
- Modify: `src/lib/componentArchitecture.spec.ts`
- Move: `src/shared/components/{FullScreen,Header,Layout,List,Main,Outer}.{tsx,stories.tsx}` to `src/shared/components/layout/`
- Modify: `src/shared/components/index.ts`
- Modify: `src/shared/components/layout/{Header,Layout,List}.{tsx,stories.tsx}`
- Modify: every feature template importing `@src/shared/components/Layout`

- [ ] **Step 1: Add the root-barrel characterization test**

Create `src/lib/sharedComponentPublicApi.spec.ts` importing the root barrel and its named types:

```ts
import { describe, expect, it } from "vitest";
import * as Shared from "@src/shared/components";
import type { HeaderProps, LayoutProps, Option } from "@src/shared/components";

const components = {
  Button: Shared.Button,
  Card: Shared.Card,
  Code: Shared.Code,
  Description: Shared.Description,
  Feedback: Shared.Feedback,
  Form: Shared.Form,
  FormItem: Shared.FormItem,
  FullScreen: Shared.FullScreen,
  Header: Shared.Header,
  Input: Shared.Input,
  Layout: Shared.Layout,
  List: Shared.List,
  Logo: Shared.Logo,
  Main: Shared.Main,
  Math: Shared.Math,
  Outer: Shared.Outer,
  Overlay: Shared.Overlay,
  Score: Shared.Score,
  Section: Shared.Section,
  Select: Shared.Select,
  Slider: Shared.Slider,
  Style: Shared.Style,
  Switch: Shared.Switch,
  Tag: Shared.Tag,
  TagList: Shared.TagList,
  Textarea: Shared.Textarea,
  Title: Shared.Title,
  Upload: Shared.Upload,
};

describe("shared component public API", () => {
  it("exports every component and named prop type from the root barrel", () => {
    const acceptsTypes = (_header: HeaderProps, _layout: LayoutProps, _option: Option) => undefined;
    acceptsTypes({}, {}, { label: "label", value: "value" });
    expect(Object.values(components).every((component) => typeof component === "function")).toBe(true);
  });
});
```

- [ ] **Step 2: Run the characterization test**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/sharedComponentPublicApi.spec.ts
```

Expected: PASS before the move. This is a compatibility characterization, not the RED placement test.

- [ ] **Step 3: Add the shared-group helper and failing layout placement test**

Add this helper and test to `src/lib/componentArchitecture.spec.ts`:

```ts
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

it("groups shared layout components", () => {
  expectSharedComponentGroup("layout", ["FullScreen", "Header", "Layout", "List", "Main", "Outer"]);
});
```

- [ ] **Step 4: Run the layout test and verify RED**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "groups shared layout components"
```

Expected: FAIL because `shared/components/layout` does not exist.

- [ ] **Step 5: Move layout files and update imports**

Use `git mv` for each component and story. Update:

- root barrel exports to `@src/shared/components/layout/<Name>`
- `Layout.tsx` imports of `FullScreen`, `Header`, `Main`, and `Outer`
- layout story self-imports
- `List.stories.tsx` imports after its move while leaving `Card` at its current leaf until Task 3
- all nine feature/template deep imports of `Layout` to `@src/shared/components/layout/Layout`

Do not change imports already using the root barrel.

- [ ] **Step 6: Verify layout GREEN**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts src/lib/importPath.spec.ts
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: all focused tests PASS and lint exits 0.

- [ ] **Step 7: Commit layout**

```bash
git add src/shared/components/layout src/shared/components/index.ts \
  src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts \
  src/features/card/components/templates/CardFormTemplate.tsx \
  src/features/card/components/templates/CardListTemplate.tsx \
  src/features/card/components/templates/CardViewTemplate.tsx \
  src/features/deck/components/templates/DeckFormTemplate.tsx \
  src/features/deck/components/templates/DeckListTemplate.tsx \
  src/features/import/components/templates/DeckImportTemplate.tsx \
  src/features/settings/components/templates/ConfigFormTemplate.tsx \
  src/features/study/components/templates/DeckStartTemplate.tsx \
  src/features/study/components/templates/DeckSwiperTemplate.tsx
git diff --cached --check
git diff --cached --name-only
git commit -m "refactor: group shared layout components"
```

### Task 2: Move form controls

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`
- Move: `src/shared/components/{Button,Form,FormItem,Input,Select,Slider,Switch,Tag,Textarea,Upload}.{tsx,stories.tsx}` to `src/shared/components/forms/`
- Modify: `src/shared/components/index.ts`
- Modify: `src/shared/components/forms/*`
- Modify: all consumers importing `@src/shared/components/Select` or another moved leaf

- [ ] **Step 1: Add the failing forms placement test**

Add this test using the helper from Task 1:

```ts
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
```

`Tag` belongs here because its native checkbox and `checked`/`onChange` API make it a form control.

- [ ] **Step 2: Run the forms test and verify RED**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "groups shared form components"
```

Expected: FAIL with the missing `shared/components/forms/*` paths.

- [ ] **Step 3: Move form files and update imports**

Use `git mv`, then update:

- root barrel exports
- form story self-imports and cross-form imports
- `FormItem.tsx` leaf imports, keeping `Description` at its current path until Task 3
- `src/shared/components/TagList.stories.tsx` to import `Tag` from `@src/shared/components/forms/Tag`
- these four `Option` consumers to import `@src/shared/components/forms/Select`:
  - `src/features/card/components/CardForm.stories.tsx`
  - `src/features/card/components/CardForm.tsx`
  - `src/features/card/containers/useCardFormState.ts`
  - `src/shared/storybook/fixture.ts`

Keep `src/shared/forms/renameKey.ts` in place.

- [ ] **Step 4: Verify forms GREEN**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts src/lib/importPath.spec.ts
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit forms**

```bash
git add src/shared/components/forms src/shared/components/index.ts \
  src/shared/components/TagList.stories.tsx \
  src/features/card/components/CardForm.stories.tsx \
  src/features/card/components/CardForm.tsx \
  src/features/card/containers/useCardFormState.ts \
  src/shared/storybook/fixture.ts src/lib/componentArchitecture.spec.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "refactor: group shared form components"
```

### Task 3: Move content presentation

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`
- Move: `src/shared/components/{Card,Code,Description,Logo,Math,Score,Section,Style,TagList,Title}.{tsx,stories.tsx}` as present to `src/shared/components/content/`
- Move: `src/shared/components/Code.scss` to `src/shared/components/content/Code.scss`
- Modify: `src/shared/components/index.ts`
- Modify: grouped shared components with content leaf imports

- [ ] **Step 1: Add the failing content placement test**

Add:

```ts
it("groups shared content components", () => {
  expectSharedComponentGroup(
    "content",
    ["Card", "Code", "Description", "Logo", "Math", "Score", "Section", "Style", "TagList", "Title"],
    ["Card", "Code", "Description", "Logo", "Math", "Score", "Section", "TagList", "Title"],
    ["Code.scss"]
  );
});
```

`Style.tsx` intentionally has no story.

- [ ] **Step 2: Run the content test and verify RED**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "groups shared content components"
```

Expected: FAIL with missing content paths.

- [ ] **Step 3: Move content files and update imports**

Use `git mv`, then update:

- root barrel exports
- story self-imports
- `Header.tsx` import of `Logo`
- `FormItem.tsx` import of `Description`
- `Code.tsx` and `Math.tsx` imports of `Style`
- `List.stories.tsx` import of `Card` to the content leaf

Keep `Code.tsx` importing `./Code.scss` after both files move together.

- [ ] **Step 4: Verify content GREEN**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts src/lib/importPath.spec.ts
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit content**

```bash
git add src/shared/components/content src/shared/components/index.ts \
  src/shared/components/layout/Header.tsx src/shared/components/layout/List.stories.tsx \
  src/shared/components/forms/FormItem.tsx src/lib/componentArchitecture.spec.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "refactor: group shared content components"
```

### Task 4: Move feedback components

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`
- Move: `src/shared/components/{Feedback,Overlay}.{tsx,stories.tsx}` to `src/shared/components/feedback/`
- Modify: `src/shared/components/index.ts`

- [ ] **Step 1: Add the failing feedback placement test**

Add:

```ts
it("groups shared feedback components", () => {
  expectSharedComponentGroup("feedback", ["Feedback", "Overlay"]);
});
```

- [ ] **Step 2: Run the feedback test and verify RED**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "groups shared feedback components"
```

Expected: FAIL with four missing feedback paths.

- [ ] **Step 3: Move files and update imports**

Move both components/stories, update their self-imports, and update root barrel exports. Root-barrel consumers require no change.

- [ ] **Step 4: Verify feedback GREEN**

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts src/lib/importPath.spec.ts
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: PASS / exit 0.

- [ ] **Step 5: Commit feedback**

```bash
git add src/shared/components/feedback src/shared/components/index.ts src/lib/componentArchitecture.spec.ts
git diff --cached --check
git diff --cached --name-only
git commit -m "refactor: group shared feedback components"
```

### Task 5: Enforce the final root shape and update documentation

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`
- Modify: `docs/architecture.md`
- Modify: `docs/summary/module-map.md`

- [ ] **Step 1: Create an uncommitted unexpected-group fixture**

Temporarily create `src/shared/components/misc/ArchitectureViolation.tsx` with a trivial exported component. Do not stage or commit it.

- [ ] **Step 2: Add the exact root-entry guard and verify RED**

Add a test that reads `shared/components` with `readdirSync` and expects exactly:

```ts
it("keeps the exact shared component groups", () => {
  expect(readdirSync(sourcePath("shared/components")).sort()).toEqual(
    ["content", "feedback", "forms", "index.ts", "layout"].sort()
  );
});
```

The group-specific tests already ensure production files, stories, and `Code.scss` are within the four approved directories.

Run:

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "keeps the exact shared component groups"
```

Expected: FAIL listing `misc` as the unexpected immediate entry.

- [ ] **Step 3: Remove the fixture and verify GREEN**

Remove `src/shared/components/misc/ArchitectureViolation.tsx` and its empty directory, rerun the exact command, and expect PASS.

- [ ] **Step 4: Check for obsolete deep imports**

Run:

```bash
rg -n '@src/shared/components/[A-Z]' src
```

Expected: no old ungrouped deep imports. The root barrel and grouped leaf paths remain.

- [ ] **Step 5: Update current architecture docs**

Document the four groups in `docs/architecture.md` and expand the `src/shared/components` row in `docs/summary/module-map.md`. Keep the migration design/plan history unchanged; the new approved shared-group spec is the source for this follow-up.

- [ ] **Step 6: Run final focused checks**

```bash
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/sharedComponentPublicApi.spec.ts src/lib/importPath.spec.ts
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run fmt:check
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: all commands exit 0.

- [ ] **Step 7: Commit guard and docs**

```bash
git add src/lib/componentArchitecture.spec.ts docs/architecture.md docs/summary/module-map.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: document shared component groups"
```

### Task 6: Full verification, review, and PR update

**Files:** all changes relative to the pre-follow-up commit `d688090`

- [ ] **Step 1: Run repository checks and builds**

```bash
make check
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run build
docker compose -f .devcontainer/compose.yaml run --rm --remove-orphans --entrypoint npm dev run build:storybook
```

Expected: all commands exit 0.

- [ ] **Step 2: Run an independent final review**

Review the shared grouping diff against this plan and `docs/superpowers/specs/2026-07-13-shared-component-groups-design.md`. Fix all Critical/Important findings and rerun affected checks.

- [ ] **Step 3: Run mandatory full CI**

```bash
make ci
```

Expected: app/Storybook/sample builds, format, TypeScript/ESLint, unit/Firestore/sample tests, and Playwright E2E all exit 0.

- [ ] **Step 4: Verify publication state**

```bash
git status --short --branch
git diff --check origin/main...HEAD
git log --oneline origin/codex/feature-based-components..HEAD
```

Expected: clean worktree, clean diff check, and only the approved follow-up commits ahead of the remote feature branch.

- [ ] **Step 5: Push and confirm draft PR #200**

```bash
git push origin codex/feature-based-components
```

Confirm PR #200 still targets `main`, remains draft, and points at the new HEAD. Do not create a second PR.

Because the local `gh` token is not authenticated in this workspace, use the connected GitHub App `github_get_pr_info` with:

```json
{
  "repository_full_name": "her0e1c1/tango",
  "pr_number": 200
}
```

Compare the result with `git rev-parse HEAD`. Expected fields:

- `base`: `main`
- `head`: `codex/feature-based-components`
- `head_sha`: the exact local `HEAD`
- `draft`: `true`
- `state`: `open`

# Storybook Vitest and Interaction Tests Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every Storybook story a Playwright Chromium smoke test and add representative browser interaction assertions for Issue #339.

**Architecture:** Keep shared Vite plugins at the root and define isolated `unit` and `storybook` projects in `vitest.config.ts`. Storybook's Vitest plugin turns every story into a browser test; focused `play` functions use controlled story wrappers and `fn()` spies to prove user-visible state changes and callback payloads.

**Tech Stack:** Storybook 10.4.6, Vitest 4.1.10, Playwright Chromium 1.61.1, React 19, TypeScript 5.9, GitHub Actions

## Global Constraints

- Work only in `.worktrees/codex/storybook-vitest-interactions` on branch `codex/storybook-vitest-interactions`, based on current `origin/main`.
- Do not commit files ignored by `.gitignore`.
- Write comments, commit messages, PR title, and PR description in English.
- Preserve application behavior, existing jsdom unit-test scope, Firestore-test scope, and coverage thresholds.
- Replace no-op callbacks only where the new interaction stories observe them.
- Use accessible queries and await every browser interaction.
- Run all 279 stories through Playwright Chromium.
- Before publishing, run `npm run test:storybook`, `npm run build:storybook`, and `make check`.
- The pull request must include `Closes #339`.

---

### Task 1: Storybook Vitest Browser Project

**Files:**
- Create: `.storybook/vitest.setup.ts`
- Create: `storybookVitest.spec.ts`
- Modify: `.storybook/main.ts`
- Modify: `vitest.config.ts`
- Modify: `package.json`
- Modify: `package-lock.json`

**Interfaces:**
- Produces: a Vitest project named `storybook` using `playwright({})` with one Chromium instance.
- Produces: a Vitest project named `unit` containing the existing jsdom and coverage settings.
- Produces: `npm run test:storybook`, which runs `vitest run --project=storybook`.

- [ ] **Step 1: Write the failing configuration contract**

Create `storybookVitest.spec.ts` so it imports `.storybook/main.ts` and `vitest.config.ts`, reads `package.json`, and requires the addon, both named projects, Chromium, failure screenshots, and the dedicated script:

```ts
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import storybookConfig from "./.storybook/main";
import vitestConfig from "./vitest.config";

const packageJson = JSON.parse(readFileSync(path.resolve("package.json"), "utf8"));
const projects = vitestConfig.test?.projects ?? [];
const projectNamed = (name: string) =>
  projects.find((project) => typeof project === "object" && project !== null && project.test?.name === name);

describe("Storybook Vitest integration", () => {
  it("registers the addon and a dedicated command", () => {
    expect(storybookConfig.addons).toContain("@storybook/addon-vitest");
    expect(packageJson.scripts["test:storybook"]).toBe("vitest run --project=storybook");
  });

  it("keeps unit and Chromium Storybook tests isolated", () => {
    expect(projectNamed("unit")?.test?.environment).toBe("jsdom");
    expect(projectNamed("storybook")?.test?.browser).toMatchObject({
      enabled: true,
      headless: true,
      screenshotFailures: true,
      screenshotDirectory: "test-results/storybook",
      instances: [{ browser: "chromium" }],
    });
  });
});
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run:

```bash
npx vitest run storybookVitest.spec.ts --no-file-parallelism
```

Expected: FAIL because the addon, projects, and npm script do not exist.

- [ ] **Step 3: Install version-aligned test dependencies**

Run:

```bash
npm install --save-dev @storybook/addon-vitest@10.4.6 @vitest/browser-playwright@4.1.10
```

Expected: `package.json` and `package-lock.json` add only the Storybook Vitest addon, Vitest Playwright provider, and their transitive dependencies.

- [ ] **Step 4: Configure Storybook and preview annotations**

Append `"@storybook/addon-vitest"` to `.storybook/main.ts` `addons`. Create `.storybook/vitest.setup.ts`:

```ts
import { setProjectAnnotations } from "@storybook/react-vite";
import * as previewAnnotations from "./preview";

setProjectAnnotations([previewAnnotations]);
```

- [ ] **Step 5: Split Vitest into named projects**

Retain the existing root `plugins` and `define`. Move the current `globals`, `environment`, and complete `coverage` object into a project with `extends: true` and `test.name: "unit"`. Add this Storybook project:

```ts
{
  extends: true,
  plugins: [
    storybookTest({
      configDir: path.join(dirname, ".storybook"),
      storybookScript: "npm run storybook -- --no-open",
    }),
  ],
  test: {
    name: "storybook",
    browser: {
      enabled: true,
      provider: playwright({}),
      headless: true,
      instances: [{ browser: "chromium" }],
      screenshotFailures: true,
      screenshotDirectory: "test-results/storybook",
    },
    setupFiles: ["./.storybook/vitest.setup.ts"],
  },
}
```

Import `path`, `fileURLToPath`, `storybookTest`, and `playwright`; derive `dirname` from `import.meta.url`.

- [ ] **Step 6: Preserve existing command scopes**

Add `--project=unit` to `test`, `test:coverage`, `test:unit`, and `test:firestore`. Add:

```json
"test:storybook": "vitest run --project=storybook"
```

- [ ] **Step 7: Run focused and regression tests and confirm GREEN**

Run:

```bash
npm run test:unit -- storybookVitest.spec.ts reactCompiler.spec.ts
npm run test:unit
```

Expected: the focused config tests pass, followed by 98 passing unit-test files and 573 tests.

- [ ] **Step 8: Install local Chromium and prove all story smoke tests run**

Run:

```bash
npx playwright install chromium
npm run test:storybook
```

Expected: 52 story files and 279 story tests pass in the `storybook (chromium)` project.

- [ ] **Step 9: Commit the browser project**

```bash
git add .storybook/main.ts .storybook/vitest.setup.ts package.json package-lock.json vitest.config.ts storybookVitest.spec.ts
git commit -m "Add Storybook Vitest browser project"
```

---

### Task 2: Form and Retry Interactions

**Files:**
- Modify: `src/features/deck/components/DeckForm.stories.tsx`
- Modify: `src/components/feedback/RemoteReadBoundary.stories.tsx`

**Interfaces:**
- Produces: `DeckForm.Interaction`, a controlled form story whose spies are available through `play` context `args`.
- Produces: `RemoteReadBoundary.InitialError.play`, which proves Retry invokes `onRetry`.

- [ ] **Step 1: Add failing play assertions**

Import `expect` from `storybook/test`. Add a `DeckForm` interaction story that clears and types into `Name`, clicks `Save changes`, and expects `args.fields.name.onChange` and `args.onSubmit` to have been called. Add this play function to `InitialError`:

```ts
play: async ({ args, canvas, userEvent }) => {
  await userEvent.click(canvas.getByRole("button", { name: "Retry" }));
  await expect(args.onRetry).toHaveBeenCalledOnce();
},
```

- [ ] **Step 2: Run both story files and confirm RED**

```bash
npm run test:storybook -- src/features/deck/components/DeckForm.stories.tsx src/components/feedback/RemoteReadBoundary.stories.tsx
```

Expected: FAIL because the asserted callbacks are ordinary no-op functions.

- [ ] **Step 3: Make the form story controlled and observable**

Import React and `{ expect, fn }` from `storybook/test`. Add `InteractiveDeckForm`, which owns the name value, delegates each change to `args.fields.name.onChange`, and passes the updated value back to `DeckForm`. Define interaction args with:

```ts
fields: {
  ...fieldsFor(fixture.deck.default),
  name: { value: fixture.deck.default.name, onChange: fn() },
},
onSubmit: fn((event?: React.FormEvent<HTMLFormElement>) => event?.preventDefault()),
```

After typing `Interaction deck`, assert the textbox value, the last change event's target value, and one submit call.

- [ ] **Step 4: Make Retry observable**

Set `InitialError.args.onRetry` to `fn()` and retain the play assertion from Step 1. Do not replace callbacks in stories that have no assertions.

- [ ] **Step 5: Run the story files and confirm GREEN**

Run the Step 2 command. Expected: both story files pass in Chromium, including their new play functions.

- [ ] **Step 6: Commit form and retry interactions**

```bash
git add src/features/deck/components/DeckForm.stories.tsx src/components/feedback/RemoteReadBoundary.stories.tsx
git commit -m "Test Storybook form and retry interactions"
```

---

### Task 3: Overlay, Tag, Switch, and Slider Interactions

**Files:**
- Modify: `src/features/card/components/templates/CardListTemplate.stories.tsx`
- Modify: `src/features/deck/components/DeckStartForm.stories.tsx`

**Interfaces:**
- Produces: stateful `CardView` and `RemovableSelectedTags` stories that call spies and update visible state.
- Produces: `DeckStartForm.Interaction`, which controls maximum-score enablement, slider value, and selected tags while forwarding events to `fn()` spies.

- [ ] **Step 1: Add failing CardList play assertions**

For `CardView`, click the button named `Close card`, assert `args.overlay.onClose` was called, and assert the overlay text disappears. For `RemovableSelectedTags`, click `Remove TypeScript filter`, assert `args.onRemoveTag` received `"TypeScript"`, and assert the remove button disappears.

- [ ] **Step 2: Run CardList stories and confirm RED**

```bash
npm run test:storybook -- src/features/card/components/templates/CardListTemplate.stories.tsx
```

Expected: FAIL because the existing wrappers do not expose spies and CardView does not remove the overlay.

- [ ] **Step 3: Add controlled CardList wrappers**

Import `{ expect, fn }` from `storybook/test`. Change `RemovableSelectedTagsExample` to accept and invoke `onRemoveTag` before updating local state. Add a `ClosableCardViewExample` that owns the overlay, invokes the supplied `onClose`, and sets the overlay to `undefined`. Pass story `args` through both render functions and use `fn()` for only `onRemoveTag` and `overlay.onClose`.

- [ ] **Step 4: Run CardList stories and confirm GREEN**

Run the Step 2 command. Expected: all CardList stories pass, and both interactions prove callback plus visible-state behavior.

- [ ] **Step 5: Add a failing DeckStartForm play function**

Create `Interaction` with `fn()` callbacks for the maximum switch, maximum slider, and `onClickTag`. In `play`:

```ts
const maxSwitch = canvas.getByRole("checkbox", { name: "Enable maximum score" });
await userEvent.click(maxSwitch);
await expect(args.scoreMaxSwitchProps.onChange).toHaveBeenCalled();
await expect(canvas.getByText("−1 and above")).toBeVisible();

await userEvent.click(maxSwitch);
const maxSlider = canvas.getByRole("slider", { name: "Maximum score value" });
maxSlider.focus();
await userEvent.keyboard("{ArrowRight}");
await expect(args.scoreMaxSliderProps.onChange).toHaveBeenCalled();
await expect(canvas.getByText("Current limit: 2")).toBeVisible();

await userEvent.click(canvas.getByRole("checkbox", { name: "tag 1" }));
await expect(args.tagFilterProps.onClickTag).toHaveBeenCalledWith(["tag 1"]);
await expect(canvas.getByRole("checkbox", { name: "tag 1" })).toBeChecked();
```

- [ ] **Step 6: Run DeckStartForm stories and confirm RED**

```bash
npm run test:storybook -- src/features/deck/components/DeckStartForm.stories.tsx
```

Expected: FAIL because controlled props do not update visible state.

- [ ] **Step 7: Add the controlled DeckStartForm wrapper**

Create a wrapper that owns `scoreMax`, maximum enabled state, and `selectedTags`. Its switch, slider, and tag handlers update local state first and then call the original callbacks. Keep minimum-score props unchanged. Render `Interaction` through the wrapper so the badge, description, slider, and tag checkbox reflect each browser event.

- [ ] **Step 8: Run all Task 3 stories and confirm GREEN**

```bash
npm run test:storybook -- src/features/card/components/templates/CardListTemplate.stories.tsx src/features/deck/components/DeckStartForm.stories.tsx
```

Expected: every story and all overlay, removal, selection, switch, and slider assertions pass.

- [ ] **Step 9: Commit the remaining interactions**

```bash
git add src/features/card/components/templates/CardListTemplate.stories.tsx src/features/deck/components/DeckStartForm.stories.tsx
git commit -m "Test Storybook filter control interactions"
```

---

### Task 4: Pull Request CI and Failure Artifacts

**Files:**
- Create: `src/lib/storybookCi.spec.ts`
- Modify: `.github/workflows/test.yml`

**Interfaces:**
- Produces: pull request steps that install Playwright Chromium and run `npm run test:storybook`.
- Consumes: Task 1 failure screenshots under `test-results/storybook`, already covered by the workflow's `test-results/` artifact path.

- [ ] **Step 1: Write the failing workflow contract**

Read `.github/workflows/test.yml` and assert it contains named steps with these commands:

```ts
expect(workflow).toContain("npx playwright install --with-deps chromium");
expect(workflow).toContain("npm run test:storybook");
expect(workflow).toContain("test-results/");
```

- [ ] **Step 2: Run the test and confirm RED**

```bash
npm run test:unit -- src/lib/storybookCi.spec.ts
```

Expected: FAIL because the install and Storybook test commands are absent.

- [ ] **Step 3: Add explicit Storybook browser steps**

Immediately after `mise run ci`, add:

```yaml
      - name: Install Storybook Chromium
        run: npx playwright install --with-deps chromium

      - name: Run Storybook tests
        run: npm run test:storybook
```

Keep the existing `if: ${{ always() }}` Playwright artifact upload and `test-results/` path so screenshots remain available after a failed Storybook step.

- [ ] **Step 4: Run the workflow contract and confirm GREEN**

Run the Step 2 command. Expected: PASS.

- [ ] **Step 5: Commit CI integration**

```bash
git add .github/workflows/test.yml src/lib/storybookCi.spec.ts
git commit -m "Run Storybook browser tests in CI"
```

---

### Task 5: Full Verification and Pull Request

**Files:**
- Verify: all files changed since `origin/main`

- [ ] **Step 1: Verify Storybook configuration and all browser tests**

```bash
npm run test:unit -- storybookVitest.spec.ts src/lib/storybookCi.spec.ts reactCompiler.spec.ts
npm run test:storybook
```

Expected: configuration tests pass and all 52 story files / 279 stories pass in Chromium.

- [ ] **Step 2: Verify Storybook build and repository gate**

```bash
npm run build:storybook
make check
```

Expected: Storybook build succeeds and `make check` exits 0.

- [ ] **Step 3: Review scope and diff quality**

```bash
git diff --check origin/main...HEAD
git status --short
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

Expected: no whitespace errors, no uncommitted changes, only Issue #339 files, and English commits.

- [ ] **Step 4: Push and create the pull request**

Push `codex/storybook-vitest-interactions`, then create a ready pull request titled `Add Storybook browser interaction tests`. The body must summarize browser smoke coverage, representative interactions, CI failure reporting, and the verified commands, and end with `Closes #339`.

# Feature-based Component Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reorganize Tango's UI into feature-based stateless components/templates and stateful containers while preserving every route and user-visible behavior.

**Architecture:** Keep `src/page` as thin route entries and enforce `App -> Page -> Container -> Template -> Component`. Move reusable presentation into `src/shared`, group domain UI under `src/features/{deck,card,study,import,settings}`, and allow Redux/router/form/UI state only in containers or their container-only hooks.

**Tech Stack:** React 18, TypeScript 5, Redux, React Router, React Hook Form, Vitest, Testing Library, Storybook, Vite, Playwright

---

## File map and naming rules

- `src/shared/components`: old Atom, reusable Molecule, Header, Layout, and their stories.
- `src/shared/forms/renameKey.ts`: React Hook Form registration adapter used by container hooks.
- `src/shared/hooks/useActions.ts`: container-only navigation/action hook; pages and presentation files must not import it.
- `src/shared/storybook`: Decorator, fixtures, and viewport helpers.
- `src/features/<feature>/components`: stateless feature presentation.
- `src/features/<feature>/components/templates/*Template.tsx`: stateless page composition.
- `src/features/<feature>/containers/*Container.tsx`: route/store/router/state connection.
- `src/features/<feature>/containers/use*.ts`: reusable stateful logic called only by containers.
- `src/page`: existing exports remain, but every page renders exactly one container.
- Internal modules use direct `@src/...` leaf imports. Barrels are only public entry points and are never imported from inside their own package.
- Stories stay beside components/templates. Stateful containers do not get Storybook stories.

## Test command convention

The worktree uses the repository Docker toolchain. Focused commands use:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- <vitest args>
```

Final verification uses the user-required `make ci`.

### Task 1: Add the architecture harness and move shared presentation

**Files:**
- Create: `src/lib/componentArchitecture.spec.ts`
- Create: `src/shared/components/index.ts`
- Create: `src/shared/hooks/useActions.ts`
- Move: `src/component/Atom/*.{ts,tsx,scss}` except `index.tsx` to `src/shared/components/`
- Move: `src/component/Molecule/*.{ts,tsx}` except `index.tsx` to `src/shared/components/`
- Move: `src/component/Organism/{Header,Layout}.{tsx,stories.tsx}` to `src/shared/components/`
- Move: `src/component/Organism/form.ts` to `src/shared/forms/renameKey.ts`
- Move: `src/component/{Decorator.tsx,fixture.ts,storybookViewports.ts}` to `src/shared/storybook/`
- Move: `src/page/hooks.ts` to `src/shared/hooks/useActions.ts`
- Modify: every source/story/spec importing the moved modules
- Delete: `src/component/Atom/index.tsx`, `src/component/Molecule/index.tsx`
- Modify: `src/component/Organism/index.tsx`

- [ ] **Step 1: Write the failing shared architecture test**

Create reusable filesystem/import helpers and the first placement test:

```ts
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const sourceRoot = path.resolve(process.cwd(), "src");
const productionPattern = /\.(ts|tsx)$/;

function listFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((entry) => {
    const fullPath = path.join(dir, entry);
    return statSync(fullPath).isDirectory() ? listFiles(fullPath) : productionPattern.test(fullPath) ? [fullPath] : [];
  });
}

function relative(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

describe("component architecture", () => {
  it("places reusable presentation under shared", () => {
    const required = [
      "src/shared/components/Button.tsx",
      "src/shared/components/Card.tsx",
      "src/shared/components/Form.tsx",
      "src/shared/components/Header.tsx",
      "src/shared/components/Layout.tsx",
      "src/shared/forms/renameKey.ts",
      "src/shared/hooks/useActions.ts",
    ];
    expect(required.filter((file) => !existsSync(file))).toEqual([]);
    expect(existsSync("src/component/Atom")).toBe(false);
    expect(existsSync("src/component/Molecule")).toBe(false);
  });
});
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts -t "places reusable presentation"
```

Expected: FAIL because `src/shared/components` does not exist and the Atomic Design directories still exist.

- [ ] **Step 3: Move shared files mechanically**

Use `git mv` for the listed production files, specs, SCSS, and stories. Do not move either old `index.tsx`; replace them with one explicit `src/shared/components/index.ts`. Keep `Code.scss` beside `Code.tsx`.

- [ ] **Step 4: Remove shared barrel cycles**

Change shared-internal imports to leaf aliases, for example:

```ts
import { Style } from "@src/shared/components/Style";
import { Description } from "@src/shared/components/Description";
import { Header } from "@src/shared/components/Header";
```

External feature/legacy consumers may temporarily use `@src/shared/components` until their feature task moves them.

- [ ] **Step 5: Move container support and Storybook support**

Move `src/page/hooks.ts` to `src/shared/hooks/useActions.ts` and update current page imports as a temporary migration state. Move Storybook helpers to `src/shared/storybook` and update all story imports and shared story titles to `Shared/<Component>`.

- [ ] **Step 6: Run shared RED→GREEN and compatibility checks**

Run the focused architecture test, then:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/lib/importPath.spec.ts
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: architecture/import tests PASS and TypeScript/ESLint exit 0.

- [ ] **Step 7: Commit the shared foundation**

```bash
git add src/component src/shared src/page src/lib/componentArchitecture.spec.ts
git commit -m "refactor: move shared presentation components"
```

### Task 2: Build the deck feature and its containers

**Files:**
- Move/create: `src/features/deck/components/{DeckCard,DeckForm,DeckStartForm,TagFilter}.*`
- Move/create: `src/features/deck/components/templates/{DeckListTemplate,DeckFormTemplate}.*`
- Create: `src/features/deck/containers/{DeckListContainer,DeckFormContainer,useDeckActions,useDeckFilterState}.ts(x)`
- Create: `src/features/deck/containers/index.ts`
- Modify: `src/page/{DeckList,DeckFormPage}.tsx`
- Modify: `src/shared/hooks/useActions.ts`
- Modify: `src/vite-env.d.ts`
- Modify: `src/lib/componentArchitecture.spec.ts`
- Move/update: deck stories and `DeckForm.spec.tsx`, `DeckStartForm.spec.tsx`

- [ ] **Step 1: Extend the architecture test for deck and verify RED**

Add a test requiring the listed deck component/template/container files, requiring `DeckListPage` and `DeckFormPage` to import only `@src/features/deck/containers`, and rejecting these patterns from deck presentation files:

```ts
const statefulPresentationPattern = /\b(?:React\.)?use(?:State|Reducer)\s*\(|\b(?:useForm|useController|useWatch)\s*\(/;
const connectorImportPattern = /from\s+["'](?:react-redux|react-router-dom|react-hook-form|@src\/(?:action|selector|shared\/hooks)|@src\/features\/[^/]+\/containers)/;
```

Run the focused test and expect missing paths/legacy page imports to fail.

- [ ] **Step 2: Move deck presentation and rename templates**

- `Organism/Deck.tsx` becomes `DeckCard.tsx` while retaining export `DeckCard`.
- `Organism/DeckForm.tsx`, `DeckStartForm.tsx`, `TagFilter.tsx` move under deck components.
- `Template/DeckList.tsx` and `DeckForm.tsx` become `DeckListTemplate.tsx` and `DeckFormTemplate.tsx`, with matching export names.
- Move corresponding specs/stories and update titles to `Deck/...`.

- [ ] **Step 3: Extract DeckForm state into the route container**

`DeckForm` becomes props-driven. Define its field props beside the component using `React.ComponentProps<typeof Input|Switch|Select>`; it must not call React Hook Form. `DeckFormContainer` owns route params, selectors/actions, `useForm`, submit handling, and renders:

```tsx
return <DeckFormTemplate layout={layoutProps} deckForm={deckFormProps} />;
```

Adapt the old `DeckForm.spec.tsx` into a harness that uses the container hook/form wiring and verifies the existing submit behavior before and after the extraction.

- [ ] **Step 4: Extract reusable deck filter state**

Move `useDeckActions` out of the shared hook. Create `useDeckFilterState` to own React Hook Form, score toggle state, tag selection, watch/auto-submit, and expose only values/callback/input props consumed by stateless `DeckStartForm` and `TagFilter`.

Do not create or nest a `DeckFilterContainer` component. Card and Study route containers will call `useDeckFilterState` directly.

Adapt/unskip the DeckStartForm and TagFilter coverage to verify that changing a score or tag produces the same auto-submitted Deck value as before the extraction.

- [ ] **Step 5: Create DeckListContainer and thin pages**

Move selector/action/keyboard logic from `DeckListPage` into `DeckListContainer`. Replace both pages with one-line render adapters:

```tsx
export const DeckListPage: React.FC = () => <DeckListContainer />;
export const DeckFormPage: React.FC = () => <DeckFormContainer />;
```

- [ ] **Step 6: Verify deck GREEN**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/features/deck
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: deck architecture and migrated behavior tests PASS; lint exits 0.

- [ ] **Step 7: Commit deck**

```bash
git add src/features/deck src/page/DeckList.tsx src/page/DeckFormPage.tsx src/shared/hooks src/component src/vite-env.d.ts src/lib/componentArchitecture.spec.ts
git commit -m "refactor: organize deck presentation by feature"
```

### Task 3: Build the card feature and move card UI state

**Files:**
- Move/create: `src/features/card/components/{Card,CardForm,CardOverlay,FrontText,BackText}.*`
- Move/create: `src/features/card/components/templates/{CardListTemplate,CardFormTemplate,CardViewTemplate}.*`
- Create: `src/features/card/containers/{CardListContainer,CardFormContainer,CardViewContainer,useCardFormState}.ts(x)`
- Create: `src/features/card/containers/index.ts`
- Modify: `src/page/{CardList,CardFormPage,CardViewPage}.tsx`
- Modify: `src/vite-env.d.ts`, `src/lib/componentArchitecture.spec.ts`
- Move/update: card stories/specs

- [ ] **Step 1: Add card architecture expectations and verify RED**

Require the listed paths, thin card pages, no state/form connector hooks in card presentation, and no card presentation import from another feature. Run only the new card architecture test and observe failure.

- [ ] **Step 2: Move card components/templates**

Move and rename the files listed above. `CardFormTemplate`, `CardListTemplate`, and `CardViewTemplate` replace old Template export names. Keep `useSwipeable` in `Card`/`FrontText` only as a render interaction adapter; those components must still receive all domain state and mutations as props.

- [ ] **Step 3: Extract CardForm state**

Create `useCardFormState` using React Hook Form. Make `CardForm` accept registered field props, submit callback, and submission state. Adapt the existing CardForm tests so the same typing/tag/submit behavior is observed through a test harness using the hook plus stateless component.

- [ ] **Step 4: Extract CardList overlay and cross-feature composition**

`CardListContainer` owns `showCard`, calls deck's `useDeckFilterState`, and supplies a filter render slot to `CardListTemplate`. `CardListTemplate` may import only card/shared presentation; it receives the deck filter node/props from the container and exposes select/close callbacks.

Add a focused regression test that opens the back-text overlay by selecting a card and closes it through the overlay callback.

- [ ] **Step 5: Create route containers and thin pages**

Move selectors, router params, keyboard shortcuts, category calculation, and actions into the three card containers. Each page renders exactly its matching container.

- [ ] **Step 6: Verify card GREEN**

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/features/card
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: card architecture and behavior tests PASS; lint exits 0.

- [ ] **Step 7: Commit card**

```bash
git add src/features/card src/page/CardList.tsx src/page/CardFormPage.tsx src/page/CardViewPage.tsx src/component src/vite-env.d.ts src/lib/componentArchitecture.spec.ts
git commit -m "refactor: organize card presentation by feature"
```

### Task 4: Build the study feature and move timer/navigation state

**Files:**
- Move/create: `src/features/study/components/{Controller,SwipeButtonList}.*`
- Move/create: `src/features/study/components/templates/{DeckStartTemplate,DeckSwiperTemplate}.*`
- Create: `src/features/study/containers/{DeckStartContainer,DeckSwiperContainer,useStudyControllerState}.ts(x)`
- Create: `src/features/study/containers/index.ts`
- Modify: `src/page/{DeckStartPage,DeckSwiperPage}.tsx`
- Modify: `src/vite-env.d.ts`, `src/lib/componentArchitecture.spec.ts`
- Move/update: study stories/specs

- [ ] **Step 1: Add study architecture expectations and verify RED**

Require study paths and thin pages, and reject mutable state/connectors from study presentation. Run the new test and confirm failure.

- [ ] **Step 2: Move and rename study presentation**

Move Controller and SwipeButtonList. Rename old `DeckStart`/`DeckSwiper` templates and exports with `Template` suffix. Update stories to `Study/...` and keep their viewport configuration.

- [ ] **Step 3: Extract Controller state with a regression test**

Create `useStudyControllerState` to own local `autoPlay` and timer behavior. Keep the current initial-value semantics: `autoPlay` initializes from the incoming config and is not silently resynchronized on every prop change. Make `Controller` accept `autoPlay`, `onToggleAutoPlay`, and `onChange` as props.

Unskip/adapt Controller tests to verify play/pause toggling and timed index advancement through a hook/component harness using fake timers.

- [ ] **Step 4: Create route containers and thin pages**

`DeckStartContainer` calls deck's `useDeckFilterState` and passes stateless filter presentation into `DeckStartTemplate`. `DeckSwiperContainer` owns selectors, route validation, keyboard shortcuts, invalid-study redirect, browser-back guard, controller hook, and swipe callbacks. Pages render only these containers.

- [ ] **Step 5: Verify study GREEN**

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/features/study
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: study tests PASS, including the formerly skipped Controller behavior; lint exits 0.

- [ ] **Step 6: Commit study**

```bash
git add src/features/study src/page/DeckStartPage.tsx src/page/DeckSwiperPage.tsx src/component src/vite-env.d.ts src/lib/componentArchitecture.spec.ts
git commit -m "refactor: organize study presentation by feature"
```

### Task 5: Build the import feature

**Files:**
- Move/create: `src/features/import/components/templates/DeckImportTemplate.*`
- Create: `src/features/import/containers/{DeckImportContainer,index}.ts(x)`
- Modify: `src/page/DeckImportPage.tsx`
- Modify: `src/lib/componentArchitecture.spec.ts`

- [ ] **Step 1: Add import architecture expectations and verify RED**

Require the template/container paths and thin page; run the focused architecture test and confirm failure.

- [ ] **Step 2: Move the template and create the container**

Rename the old DeckImport Template export to `DeckImportTemplate`. Move action hook, selector, and keyboard shortcut calls from the page to `DeckImportContainer`. Keep the existing `onDonloadSample` prop spelling only if needed for compatibility inside the move; otherwise correct it consistently within this feature without changing displayed behavior.

- [ ] **Step 3: Thin the page and verify GREEN**

Run the import architecture test and `lint:check`; both must exit 0.

- [ ] **Step 4: Commit import**

```bash
git add src/features/import src/page/DeckImportPage.tsx src/component src/lib/componentArchitecture.spec.ts
git commit -m "refactor: organize import presentation by feature"
```

### Task 6: Build the settings feature and extract form state

**Files:**
- Move/create: `src/features/settings/components/ConfigForm.*`
- Move/create: `src/features/settings/components/templates/ConfigFormTemplate.*`
- Create: `src/features/settings/containers/{ConfigContainer,useConfigFormState,index}.ts(x)`
- Modify: `src/page/ConfigPage.tsx`
- Modify: `src/vite-env.d.ts`, `src/lib/componentArchitecture.spec.ts`
- Move/update: ConfigForm stories/specs

- [ ] **Step 1: Add settings architecture expectations and verify RED**

Require the settings paths and thin page; reject React Hook Form/state connectors in settings presentation. Run and confirm failure.

- [ ] **Step 2: Extract ConfigForm state**

Move React Hook Form watch/register/submit/darkMode synchronization into `useConfigFormState`. Make `ConfigForm` accept current values, registered field props, auth callbacks, and metadata entirely through props. Adapt existing tests to a hook/component harness and preserve auto-submit behavior.

- [ ] **Step 3: Move template, create route container, and thin page**

`ConfigContainer` owns selector/action/keyboard state and renders `ConfigFormTemplate`. Rename the old template export with `Template` suffix. `ConfigPage` renders only `ConfigContainer`.

- [ ] **Step 4: Verify settings GREEN**

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/componentArchitecture.spec.ts src/features/settings
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run lint:check
```

Expected: settings architecture and behavior tests PASS; lint exits 0.

- [ ] **Step 5: Commit settings**

```bash
git add src/features/settings src/page/ConfigPage.tsx src/component src/vite-env.d.ts src/lib/componentArchitecture.spec.ts
git commit -m "refactor: organize settings presentation by feature"
```

### Task 7: Enforce final boundaries, remove legacy UI, and update docs

**Files:**
- Modify: `src/lib/componentArchitecture.spec.ts`
- Delete: remaining `src/component/**`, including old Organism/Template barrels
- Delete: `src/page/hooks.ts` if any migration copy remains
- Modify: `src/page/index.ts`, `src/vite-env.d.ts`
- Modify: `docs/architecture.md`
- Modify: `docs/summary/module-map.md`
- Modify: any other docs found by `rg 'src/component|Template / Organism / Molecule / Atom' docs`

- [ ] **Step 1: Add final dependency tests and verify RED if violations remain**

Add checks that:

- `src/component` does not exist.
- every production Page has no application hooks and imports one feature container public API.
- shared presentation has no `@src/features` import.
- feature component/template files import presentation only from their own feature or shared.
- component/template files do not contain mutable state/form hooks or connector imports.
- container-only hooks are imported only by files under `containers`.

Run the complete architecture spec. If it passes immediately, deliberately add one forbidden import to a temporary presentation file, verify the test fails for that exact violation, revert the temporary line, and rerun to prove GREEN.

- [ ] **Step 2: Remove legacy barrels and obsolete ambient UI props**

Delete empty legacy directories/barrels. Remove only ambient UI prop types replaced by colocated exported props; retain all domain/store types in `src/vite-env.d.ts`.

- [ ] **Step 3: Update architecture documentation**

Document `App -> Page -> Container -> Template -> Component`, the feature/shared map, state ownership, and Storybook/test discovery. Do not modify stale unrelated product claims unless the moved paths make them incorrect.

- [ ] **Step 4: Run repository checks**

```bash
make check
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run build
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run build:storybook
```

Expected: all commands exit 0.

- [ ] **Step 5: Commit final cleanup/docs**

```bash
git add src docs
git commit -m "docs: describe feature-based component architecture"
```

### Task 8: Final verification, review, and publication

**Files:** all changes relative to `origin/main`

- [ ] **Step 1: Review scope and repository state**

```bash
git status --short --branch
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git diff --name-status origin/main...HEAD
```

Confirm actions/selectors/store/firestore were not moved and no unrelated files are included.

- [ ] **Step 2: Run independent code review**

Dispatch a focused reviewer with the spec, this plan, `origin/main` base SHA, and `HEAD`. Fix all Critical/Important findings and rerun affected tests.

- [ ] **Step 3: Run the mandatory full CI**

```bash
make ci
```

Expected: app/Storybook/sample builds, formatting, TypeScript/ESLint, unit/Firestore/sample tests, and Playwright E2E all exit 0.

- [ ] **Step 4: Verify clean publication state**

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --check origin/main...HEAD
```

- [ ] **Step 5: Push and create one PR**

Push `codex/feature-based-components` to `origin`, then create one PR against `main` with `## Summary` and `## Testing`, explicitly listing `make ci`.

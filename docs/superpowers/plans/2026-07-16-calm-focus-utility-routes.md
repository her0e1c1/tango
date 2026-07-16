# Calm Focus Utility Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Deck/Card editing, CSV Import, and Settings one Calm Focus form and section hierarchy without changing their existing state or behavior.

**Architecture:** Keep containers and presentation props unchanged. Apply existing shared form/content primitives and semantic utilities inside the four feature components and three route templates, then protect behavior with focused React Testing Library specs and protect presentation ownership with the Calm Focus source contract.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 4 semantic utilities, Vitest, React Testing Library, Storybook 10, Docker Compose via Make.

---

## File Map

- `src/lib/calmFocusVisualContract.spec.ts`: add all seven utility-route presentation files to Calm Focus ownership and assert route-level surface treatment.
- `src/features/deck/components/DeckForm.tsx`: group editable fields, unavailable controls, metadata, and primary action.
- `src/features/deck/components/templates/DeckFormTemplate.tsx`: provide the Deck editor page title and bounded route surface.
- `src/features/card/components/CardForm.tsx`: group editable fields, tags, metadata, and primary action.
- `src/features/card/components/templates/CardFormTemplate.tsx`: provide the Card editor page title and bounded route surface.
- `src/features/import/components/templates/DeckImportTemplate.tsx`: unify upload, format guidance, sample action, and code sample.
- `src/features/settings/components/ConfigForm.tsx`: group account, layout, study, autoplay, and metadata while preserving auto-save controls.
- `src/features/settings/components/templates/ConfigFormTemplate.tsx`: provide the Settings page title and bounded route surface.
- Matching `*.stories.tsx` files: add long-content, disabled/pending, light/dark, logged-in/out, and mobile review states.
- New colocated `*.spec.tsx` files: verify presentation hierarchy and unchanged callbacks/values.

### Task 1: Establish the Utility-Route Visual Contract

**Files:**
- Modify: `src/lib/calmFocusVisualContract.spec.ts`

- [ ] **Step 1: Write the failing ownership assertion**

Add these paths to `ownedPresentationFiles`:

```ts
"features/deck/components/DeckForm.tsx",
"features/deck/components/templates/DeckFormTemplate.tsx",
"features/card/components/CardForm.tsx",
"features/card/components/templates/CardFormTemplate.tsx",
"features/import/components/templates/DeckImportTemplate.tsx",
"features/settings/components/ConfigForm.tsx",
"features/settings/components/templates/ConfigFormTemplate.tsx",
```

Add an assertion that reads each template and expects a semantic surface utility such as `bg-surface` or `bg-surface-elevated`.

- [ ] **Step 2: Run the contract and verify RED**

Run:

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run test:unit -- src/lib/calmFocusVisualContract.spec.ts
```

Expected: FAIL because the current Import template still contains `dark:shadow-gray-100` and the route templates do not yet provide semantic surfaces.

- [ ] **Step 3: Commit the failing contract with the first feature tests rather than alone**

Do not modify production code in this task.

### Task 2: Modernize Deck Editing

**Files:**
- Create: `src/features/deck/components/DeckForm.spec.tsx`
- Create: `src/features/deck/components/templates/DeckFormTemplate.spec.tsx`
- Modify: `src/features/deck/components/DeckForm.tsx`
- Modify: `src/features/deck/components/templates/DeckFormTemplate.tsx`
- Modify: `src/features/deck/components/DeckForm.stories.tsx`
- Modify: `src/features/deck/components/templates/DeckFormTemplate.stories.tsx`
- Test: `src/features/deck/containers/DeckFormContainer.spec.tsx`

- [ ] **Step 1: Write the DeckForm failing tests**

Render a complete deck and real shared controls. Assert:

```ts
expect(screen.getByRole("heading", { name: "Deck details" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Availability" })).toBeVisible();
expect(screen.getByRole("heading", { name: "Metadata" })).toBeVisible();
expect(screen.getByText(/not available yet/i)).toBeVisible();
expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
```

Also submit once with `isSubmitting={false}` and verify `onSubmit`, and verify name, URL, convert, category, Public, Local Mode, id, created, and updated values remain rendered. Query Public and Local Mode inputs and assert both are disabled.

- [ ] **Step 2: Write the DeckFormTemplate failing test**

Render `feedbackSlot` and `deckForm`. Assert the page heading `Edit deck`, feedback, and form appear in order inside a bounded semantic surface (`max-w-*`, `bg-surface`, `rounded-surface`, `border-border`).

- [ ] **Step 3: Verify both Deck specs are RED separately**

Run each new spec with `npm run test:unit -- <path>` through the dev container. Expected: FAIL on the missing headings and route surface.

- [ ] **Step 4: Implement the minimal Deck presentation**

Use semantic markup similar to:

```tsx
<Form onSubmit={...}>
  <section aria-labelledby="deck-details-heading">
    <h2 id="deck-details-heading" className="... text-ink">Deck details</h2>
    {/* existing editable FormItems */}
  </section>
  <section aria-labelledby="deck-availability-heading" className="... bg-surface-muted ...">
    <h2 id="deck-availability-heading">Availability</h2>
    {/* disabled Public and Local Mode controls plus explicit unavailable help */}
  </section>
  <section aria-labelledby="deck-metadata-heading">
    <h2 id="deck-metadata-heading">Metadata</h2>
    {/* existing id and timestamps */}
  </section>
  <Button primary type="submit" disabled={props.isSubmitting}>Save</Button>
</Form>
```

In the template, render `Edit deck` as the single page heading and wrap feedback/form in `mx-auto w-full max-w-reading rounded-surface border border-border bg-surface p-4 md:p-6`.

- [ ] **Step 5: Verify Deck GREEN**

Run both new specs, `src/features/deck/containers/DeckFormContainer.spec.tsx`, and `src/lib/calmFocusVisualContract.spec.ts` together. Expected: PASS.

- [ ] **Step 6: Extend Deck stories**

Add create/edit-like long values, submitting/disabled, dark theme, and iPhone fixtures using existing Storybook viewport and theme parameters.

- [ ] **Step 7: Commit Deck work**

```bash
git add src/lib/calmFocusVisualContract.spec.ts src/features/deck/components
git commit -m "feat: modernize deck editing"
```

### Task 3: Modernize Card Editing

**Files:**
- Create: `src/features/card/components/CardForm.spec.tsx`
- Create: `src/features/card/components/templates/CardFormTemplate.spec.tsx`
- Modify: `src/features/card/components/CardForm.tsx`
- Modify: `src/features/card/components/templates/CardFormTemplate.tsx`
- Modify: `src/features/card/components/CardForm.stories.tsx`
- Modify: `src/features/card/components/templates/CardFormTemplate.stories.tsx`
- Test: `src/features/card/containers/CardFormContainer.spec.tsx`

- [ ] **Step 1: Write failing Card component/template tests**

Assert `Card content`, `Tags`, and `Metadata` section headings; existing text/tag values; id, unique key, created and last-seen metadata; submit callback; submitting state; feedback composition; `Edit card` page heading; and the same bounded semantic template surface used by Deck.

- [ ] **Step 2: Verify Card RED separately**

Run each new spec individually. Expected: FAIL on missing section/page headings and surface classes.

- [ ] **Step 3: Implement minimal Card presentation**

Keep all current props and inputs. Group front/back text, tags, and metadata in semantic sections; retain the sole Save action; and use the same template measure/surface contract as Deck.

- [ ] **Step 4: Verify Card GREEN**

Run both new specs, `src/features/card/containers/CardFormContainer.spec.tsx`, and `src/lib/calmFocusVisualContract.spec.ts`. Expected: PASS.

- [ ] **Step 5: Extend Card stories and commit**

Add long text/tags, submitting, dark, and mobile states, then commit:

```bash
git add src/lib/calmFocusVisualContract.spec.ts src/features/card/components
git commit -m "feat: modernize card editing"
```

### Task 4: Modernize CSV Import Presentation

**Files:**
- Create: `src/features/import/components/templates/DeckImportTemplate.spec.tsx`
- Modify: `src/features/import/components/templates/DeckImportTemplate.tsx`
- Modify: `src/features/import/components/templates/DeckImportTemplate.stories.tsx`
- Test: `src/features/import/containers/DeckImportContainer.spec.tsx`

- [ ] **Step 1: Write the failing Import template test**

Render callbacks and sample text. Assert one `Import decks` page heading; `Choose a CSV file`, `CSV format`, and `Sample` section headings; upload callback with a real `File`; accessible sample-download callback; visible explanation and code sample; pending upload disabled state; feedback placement; and semantic overflow surface classes.

- [ ] **Step 2: Verify Import RED**

Run the new spec alone. Expected: FAIL on the new hierarchy and semantic surface assertions.

- [ ] **Step 3: Implement minimal Import presentation**

Replace repeated `Title` blocks and the raw shadow color with one bounded semantic surface containing three sections. Use the shared `Button` for the sample download while preserving its accessible name and callback, shared `Upload`, `Description`, and `Code`; use `overflow-x-auto` for the sample.

- [ ] **Step 4: Verify Import GREEN**

Run the new template spec, container spec, accessibility spec, and visual contract. Expected: PASS.

- [ ] **Step 5: Extend Import stories and commit**

Add default/no-file, pending, long sample, dark, and iPhone states, then commit:

```bash
git add src/lib/calmFocusVisualContract.spec.ts src/features/import/components
git commit -m "feat: modernize import presentation"
```

### Task 5: Modernize Settings Presentation

**Files:**
- Create: `src/features/settings/components/ConfigForm.spec.tsx`
- Create: `src/features/settings/components/templates/ConfigFormTemplate.spec.tsx`
- Modify: `src/features/settings/components/ConfigForm.tsx`
- Modify: `src/features/settings/components/templates/ConfigFormTemplate.tsx`
- Modify: `src/features/settings/components/ConfigForm.stories.tsx`
- Modify: `src/features/settings/components/templates/ConfigFormTemplate.stories.tsx`
- Test: `src/features/settings/containers/ConfigContainer.spec.tsx`
- Test: `src/features/settings/hooks/useConfigFormState.spec.tsx`

- [ ] **Step 1: Write failing ConfigForm tests**

Assert `Account`, `Layout`, `Study`, `Autoplay`, and `Metadata` section headings; logged-out Login and logged-in Logout callbacks; all eight switch fields; both slider values; token input; version and user id; and existing labels. Trigger representative switch, slider, and token input callbacks to prove presentation forwarding remains intact.

- [ ] **Step 2: Write the failing ConfigFormTemplate test**

Assert one `Settings` page heading, retained form composition, and the same bounded semantic surface contract as the other utility routes.

- [ ] **Step 3: Verify Settings RED separately**

Run each new spec individually. Expected: FAIL on missing grouping/page heading/surface assertions.

- [ ] **Step 4: Implement minimal Settings presentation**

Keep `<Form div>` and every existing field prop. Rename only the misspelled visible `Show Heaer` label to `Show Header`; visually group the existing controls under Account, Layout, Study, Autoplay, and Metadata. Move the page-level Settings heading to the template so the form uses section-level headings only.

- [ ] **Step 5: Verify Settings GREEN**

Run both new specs, Config container and hook specs, and the visual contract. Expected: PASS and unchanged auto-save tests.

- [ ] **Step 6: Extend Settings stories and commit**

Add logged-in/out, long identity/token/metadata, dark, and iPhone states, then commit:

```bash
git add src/lib/calmFocusVisualContract.spec.ts src/features/settings/components
git commit -m "feat: modernize settings presentation"
```

### Task 6: Regression Verification and Publication Readiness

**Files:**
- Verify only; modify tests only if a genuine regression is found.

- [ ] **Step 1: Run focused feature and architecture tests**

Run all new specs, four relevant container specs, `src/features/settings/hooks/useConfigFormState.spec.tsx`, `src/lib/calmFocusVisualContract.spec.ts`, `src/lib/componentArchitecture.spec.ts`, and `src/lib/interactionAccessibility.spec.tsx`. Expected: PASS.

- [ ] **Step 2: Run Storybook build**

```bash
COMPOSE_FILE=.devcontainer/compose.yaml docker compose run --rm --remove-orphans --entrypoint npm dev run build:storybook
```

Expected: exit 0.

- [ ] **Step 3: Run repository checks**

```bash
direnv exec . make check
direnv exec . make build
direnv exec . make e2e
```

Expected: each command exits 0.

- [ ] **Step 4: Audit the final diff and issue checklist**

Confirm no container state ownership, handler, schema, persistence, auth, sync, Import workflow, or navigation behavior changed. Confirm every owned presentation file uses semantic colors and each story set covers desktop/mobile and light/dark review.

- [ ] **Step 5: Prepare the PR**

Use an English title and body, include `Closes #218`, summarize the three UI groups, and list the exact verification commands and results.

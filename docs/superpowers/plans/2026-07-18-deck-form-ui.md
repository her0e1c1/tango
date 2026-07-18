# Deck Form UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat deck edit form with a modern, sectioned settings page that hides unavailable publishing controls and returns predictably to the deck list after save or cancel.

**Architecture:** Keep `DeckFormTemplate` responsible for page context, `DeckForm` responsible for semantic controls, `DeckFormContainer` responsible for form bindings, and `useDeckActions` responsible for mutation-driven navigation. Reuse the existing Calm Focus tokens and shared form controls without adding a new shared abstraction.

**Tech Stack:** React 19, TypeScript, React Router, react-hook-form, Tailwind CSS 4, Vitest, Testing Library, Storybook

## Global Constraints

- Do not enable deck publishing or render the unavailable Public control.
- Do not add validation, persistence changes, dependencies, tabs, sidebars, or a multi-step flow.
- Use existing Calm Focus tokens for light mode, dark mode, focus, spacing, and touch targets.
- Save success, Cancel, and the page back action navigate to `/` with `{ replace: true }`.
- Mutation failure keeps the form mounted and does not navigate.
- Run `make check` before completion.

## File responsibilities

- `src/features/deck/hooks/useDeckActions.ts`: update mutation and success-only list navigation.
- `src/features/deck/hooks/useDeckActions.spec.tsx`: action-level mutation and navigation contract.
- `src/features/deck/components/DeckForm.tsx`: semantic sections, fields, metadata disclosure, and form actions.
- `src/features/deck/components/DeckForm.spec.tsx`: presentation, callback, accessibility, and submission-state contract.
- `src/features/deck/components/templates/DeckFormTemplate.tsx`: page heading, deck context, back action, feedback, and bounded surface.
- `src/features/deck/components/templates/DeckFormTemplate.spec.tsx`: page composition and back-action contract.
- `src/features/deck/containers/DeckFormContainer.tsx`: form bindings and action wiring.
- `src/features/deck/containers/DeckFormContainer.spec.tsx`: submit/cancel integration contract.
- `src/features/deck/components/DeckForm.stories.tsx`: component states and responsive review fixtures.
- `src/features/deck/components/templates/DeckFormTemplate.stories.tsx`: full-page light, dark, long-value, submitting, and mobile review fixtures.

---

### Task 1: Make update navigation explicit and success-only

**Files:**
- Create: `src/features/deck/hooks/useDeckActions.spec.tsx`
- Modify: `src/features/deck/hooks/useDeckActions.ts`

**Interfaces:**
- Consumes: `useDeckMutations().update(deck: Deck): Promise<void>` and `useNavigate()`.
- Produces: `updateAndGoToList(deck: Deck): Promise<void>` and `goToList(): void` on the `useDeckActions` return value.

- [ ] **Step 1: Write the failing hook tests**

Create a test harness with hoisted `update`, `navigate`, and remote collection mocks. Render the hook with `renderHook` and assert the exact contracts:

```tsx
it("navigates to the deck list after a successful update", async () => {
  mocks.update.mockResolvedValue(undefined);
  const { result } = renderHook(() => useDeckActions("deck-id"));

  await act(() => result.current.updateAndGoToList(deck));

  expect(mocks.update).toHaveBeenCalledExactlyOnceWith(deck);
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
});

it("keeps the editor open when the update fails", async () => {
  mocks.update.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() => useDeckActions("deck-id"));

  await act(() => result.current.updateAndGoToList(deck));

  expect(mocks.navigate).not.toHaveBeenCalled();
});

it("goes directly to the deck list without updating", () => {
  const { result } = renderHook(() => useDeckActions("deck-id"));

  act(() => result.current.goToList());

  expect(mocks.update).not.toHaveBeenCalled();
  expect(mocks.navigate).toHaveBeenCalledExactlyOnceWith("/", { replace: true });
});
```

- [ ] **Step 2: Run the hook tests to verify failure**

Run: `npm run test:unit -- src/features/deck/hooks/useDeckActions.spec.tsx`

Expected: FAIL because `updateAndGoToList` and `goToList` do not exist.

- [ ] **Step 3: Implement the minimal navigation contract**

Replace `updateAndBack` and add the direct action:

```ts
updateAndGoToList: async (deck: Deck) => {
  try {
    await mutations.update(deck);
    void navigate("/", { replace: true });
  } catch {
    // The mutation notice owns error feedback and retry.
  }
},
goToList: () => void navigate("/", { replace: true }),
```

Keep `update`, `remove`, `pending`, `error`, and `retry` unchanged.

- [ ] **Step 4: Run the hook tests to verify success**

Run: `npm run test:unit -- src/features/deck/hooks/useDeckActions.spec.tsx`

Expected: PASS with 3 tests.

- [ ] **Step 5: Commit the action contract**

```bash
git add src/features/deck/hooks/useDeckActions.ts src/features/deck/hooks/useDeckActions.spec.tsx
git commit -m "Make deck edit navigation explicit"
```

### Task 2: Redesign the semantic deck form

**Files:**
- Modify: `src/features/deck/components/DeckForm.spec.tsx`
- Modify: `src/features/deck/components/DeckForm.tsx`

**Interfaces:**
- Consumes: existing shared `Form`, `FormItem`, `Input`, `Select`, `Switch`, and `Button` components.
- Produces: `DeckFormFields` containing only `name`, `category`, `url`, and `convertToBr`; `DeckFormProps.onCancel?: () => void`.

- [ ] **Step 1: Rewrite presentation tests for the approved UI**

Remove `isPublic` from the fixture fields and replace the old availability assertions with these contracts:

```tsx
expect(view.getByRole("heading", { level: 2, name: "Basic information" })).toBeVisible();
expect(view.getByRole("heading", { level: 2, name: "Import & formatting" })).toBeVisible();
expect(view.getByText("Deck information")).toBeVisible();
expect(view.queryByText("Public")).not.toBeInTheDocument();
expect(view.container.querySelector("input[name='isPublic']")).not.toBeInTheDocument();
```

Update the unique-heading test to expect four `section[aria-labelledby]` elements across two instances. Add action-state tests:

```tsx
it("submits or cancels from the action row", async () => {
  const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
  const onCancel = vi.fn();
  const view = render(<DeckForm {...createProps({ onSubmit, onCancel })} />);

  await userEvent.click(view.getByRole("button", { name: "Cancel" }));
  expect(onCancel).toHaveBeenCalledOnce();
  expect(onSubmit).not.toHaveBeenCalled();

  await userEvent.click(view.getByRole("button", { name: "Save changes" }));
  expect(onSubmit).toHaveBeenCalledOnce();
});

it("shows a disabled saving action while submitting", () => {
  const view = render(<DeckForm {...createProps({ isSubmitting: true })} />);
  expect(view.getByRole("button", { name: "Saving…" })).toBeDisabled();
  expect(view.getByRole("button", { name: "Cancel" })).toBeEnabled();
});
```

- [ ] **Step 2: Run the component tests to verify failure**

Run: `npm run test:unit -- src/features/deck/components/DeckForm.spec.tsx`

Expected: FAIL on new headings, missing Cancel, visible Public, and Saving… label.

- [ ] **Step 3: Implement the sectioned form**

Use two semantic editable sections and a native disclosure:

```tsx
<section aria-labelledby={basicHeadingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
  <div>
    <h2 id={basicHeadingId} className="text-title font-semibold text-ink">Basic information</h2>
    <p className="mt-1 text-caption text-ink-muted">Name and organize this deck.</p>
  </div>
  <FormItem col label="Name"><Input {...props.fields.name} /></FormItem>
  <FormItem col label="Category"><Select empty {...props.fields.category} /></FormItem>
</section>

<section aria-labelledby={importHeadingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5">
  <div>
    <h2 id={importHeadingId} className="text-title font-semibold text-ink">Import &amp; formatting</h2>
    <p className="mt-1 text-caption text-ink-muted">Control the source and how imported text is displayed.</p>
  </div>
  <FormItem col label="Source URL"><Input {...props.fields.url} /></FormItem>
  <FormItem label="Convert line breaks" help="Convert two line breaks to one <br />."><Switch {...props.fields.convertToBr} /></FormItem>
</section>
```

Render Deck information after the editable sections:

```tsx
<details className="group rounded-surface border border-border bg-surface-muted p-4">
  <summary className="min-h-touch cursor-pointer font-semibold text-ink">Deck information</summary>
  <dl className="mt-4 grid gap-3 text-caption">
    <div className="min-w-0"><dt className="font-medium text-ink-muted">ID</dt><dd className="break-all text-ink">{props.deck.id}</dd></div>
    {Boolean(props.deck.createdAt) && (
      <div><dt className="font-medium text-ink-muted">Created</dt><dd className="text-ink">{new Date(props.deck.createdAt).toLocaleDateString()}</dd></div>
    )}
    {Boolean(props.deck.updatedAt) && (
      <div><dt className="font-medium text-ink-muted">Updated</dt><dd className="text-ink">{new Date(props.deck.updatedAt).toLocaleDateString()}</dd></div>
    )}
  </dl>
</details>
```

Finish with a wrapping action row. Use `type="button"`, `variant="quiet"`, and `onCancel` for Cancel. Use `type="submit"`, `variant="primary"`, and `disabled={isSubmitting}` for Save changes; render `Saving…` when submitting. Do not render an Availability section or any `isPublic` field.

- [ ] **Step 4: Run the component tests to verify success**

Run: `npm run test:unit -- src/features/deck/components/DeckForm.spec.tsx`

Expected: PASS for field callbacks, semantic sections, metadata, actions, and submission state.

- [ ] **Step 5: Commit the form redesign**

```bash
git add src/features/deck/components/DeckForm.tsx src/features/deck/components/DeckForm.spec.tsx
git commit -m "Redesign deck settings form"
```

### Task 3: Modernize the page template

**Files:**
- Modify: `src/features/deck/components/templates/DeckFormTemplate.spec.tsx`
- Modify: `src/features/deck/components/templates/DeckFormTemplate.tsx`

**Interfaces:**
- Consumes: `DeckFormProps.deck.name`, `DeckFormProps.onCancel`, existing `Layout`, and `feedbackSlot`.
- Produces: a page-level Back to decks button that calls the same cancellation callback passed to `DeckForm`.

- [ ] **Step 1: Write the failing page-composition test**

Define `const onCancel = vi.fn()`, pass it as `deckForm.onCancel`, remove `isPublic` from fields, set the deck name to `Deck name`, and assert:

```tsx
expect(view.getByText("DECK SETTINGS")).toBeVisible();
expect(view.getByRole("heading", { level: 1, name: "Deck name" })).toBeVisible();
expect(view.getByRole("button", { name: "Back to decks" })).toBeVisible();
expect(view.getByRole("status").compareDocumentPosition(view.container.querySelector("form") as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
await userEvent.click(view.getByRole("button", { name: "Back to decks" }));
expect(onCancel).toHaveBeenCalledOnce();
```

Also assert the page surface still contains `mx-auto`, `w-full`, `max-w-reading`, responsive padding, semantic border/background, and `overflow-hidden` for long content.

- [ ] **Step 2: Run the template test to verify failure**

Run: `npm run test:unit -- src/features/deck/components/templates/DeckFormTemplate.spec.tsx`

Expected: FAIL because the new page context and Back to decks action are absent.

- [ ] **Step 3: Implement the page context**

Render a small quiet Back to decks button before the surface heading and derive the title from `props.deckForm?.deck.name`. Use this structure inside the bounded surface:

```tsx
<button type="button" className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted hover:bg-surface-muted" onClick={props.deckForm?.onCancel}>
  <AiOutlineArrowLeft aria-hidden="true" />
  Back to decks
</button>
<p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Deck settings</p>
<h1 className="mt-1 break-words text-display font-bold text-ink">{props.deckForm?.deck.name ?? "Deck settings"}</h1>
<p className="mt-2 text-body text-ink-muted">Manage this deck’s information, import source, and formatting.</p>
```

Place feedback and `DeckForm` below a responsive header gap. Keep the template free of navigation hooks and mutation logic.

- [ ] **Step 4: Run the template test to verify success**

Run: `npm run test:unit -- src/features/deck/components/templates/DeckFormTemplate.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the template redesign**

```bash
git add src/features/deck/components/templates/DeckFormTemplate.tsx src/features/deck/components/templates/DeckFormTemplate.spec.tsx
git commit -m "Modernize deck settings page"
```

### Task 4: Wire container actions and update visual fixtures

**Files:**
- Modify: `src/features/deck/containers/DeckFormContainer.spec.tsx`
- Modify: `src/features/deck/containers/DeckFormContainer.tsx`
- Modify: `src/features/deck/components/DeckForm.stories.tsx`
- Modify: `src/features/deck/components/templates/DeckFormTemplate.stories.tsx`

**Interfaces:**
- Consumes: `useDeckActions().updateAndGoToList` and `useDeckActions().goToList` from Task 1; `DeckFormProps.onCancel` from Task 2.
- Produces: complete edit-page behavior and reviewable Storybook states.

- [ ] **Step 1: Update the failing container integration tests**

Rename the action mock and add `goToList`:

```tsx
const mocks = vi.hoisted(() => ({
  params: { id: "deck-id" as string | undefined },
  config: { darkMode: false } as ConfigState,
  deck: null as Deck | null,
  updateAndGoToList: vi.fn(),
  goToList: vi.fn(),
}));
```

Keep all four edited-field submission tests, update expectations to `updateAndGoToList`, and add:

```tsx
it("cancels without submitting", async () => {
  const view = render(<DeckFormContainer />);
  await userEvent.click(view.getByRole("button", { name: "Cancel" }));
  expect(mocks.goToList).toHaveBeenCalledOnce();
  expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
});

it("does not render the unavailable public setting", () => {
  const view = render(<DeckFormContainer />);
  expect(view.container.querySelector("input[name='isPublic']")).not.toBeInTheDocument();
});
```

- [ ] **Step 2: Run the container test to verify failure**

Run: `npm run test:unit -- src/features/deck/containers/DeckFormContainer.spec.tsx`

Expected: FAIL because the container still exposes `isPublic`, calls `updateAndBack`, and does not wire Cancel.

- [ ] **Step 3: Wire the approved actions**

In `DeckFormContainer.tsx`:

```tsx
fields: {
  name: renameKey(register("name")),
  category: { ...renameKey(register("category")), options: categoryOptions },
  url: renameKey(register("url")),
  convertToBr: renameKey(register("convertToBr")),
},
isSubmitting: formState.isSubmitting,
onCancel: deckActions.goToList,
onSubmit: handleSubmit((data) => deckActions.updateAndGoToList(data)),
```

Do not register or pass `isPublic` as a visible field. The submitted Deck value still preserves the default `isPublic` property through `react-hook-form` default values.

- [ ] **Step 4: Update Storybook fixtures**

Remove `isPublic` from both `fieldsFor` helpers. Add `onCancel: () => undefined` to default args so both Back to decks and Cancel are active in stories. Keep Default, LongValues, Submitting, DarkReview, and iPhone review stories; do not add duplicate stories.

- [ ] **Step 5: Run focused deck-form tests**

Run:

```bash
npm run test:unit -- \
  src/features/deck/hooks/useDeckActions.spec.tsx \
  src/features/deck/components/DeckForm.spec.tsx \
  src/features/deck/components/templates/DeckFormTemplate.spec.tsx \
  src/features/deck/containers/DeckFormContainer.spec.tsx
```

Expected: all selected test files pass.

- [ ] **Step 6: Run repository verification**

Run: `make check`

Expected: sample build, formatting checks, lint checks, and all unit tests pass.

- [ ] **Step 7: Commit the integration**

```bash
git add \
  src/features/deck/containers/DeckFormContainer.tsx \
  src/features/deck/containers/DeckFormContainer.spec.tsx \
  src/features/deck/components/DeckForm.stories.tsx \
  src/features/deck/components/templates/DeckFormTemplate.stories.tsx
git commit -m "Wire modern deck settings flow"
```

### Task 5: Final review and publication

**Files:**
- Review: all files changed from `origin/main`

**Interfaces:**
- Consumes: completed implementation and passing verification from Tasks 1–4.
- Produces: an English commit history, pushed branch, and English GitHub pull request.

- [ ] **Step 1: Review the complete patch**

Run:

```bash
git status --short
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git log --oneline origin/main..HEAD
```

Expected: clean worktree, no whitespace errors, and only the design, plan, DeckForm UI, action, container, tests, and stories are changed.

- [ ] **Step 2: Push the feature branch**

Run: `git push -u origin codex/modernize-deck-form-template`

Expected: the remote branch is created and tracking is configured.

- [ ] **Step 3: Create the pull request**

Use title `Modernize the deck settings form` and an English description that summarizes the sectioned settings UI, hidden unavailable Public control, explicit save/cancel navigation, and test coverage. Create the PR as ready for review, not draft.

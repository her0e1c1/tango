# Card Form Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a focused, accessible single-column card editor that matches Tango's Calm Focus design and preserves existing card persistence behavior.

**Architecture:** Keep server-state and navigation responsibilities in `CardFormContainer`, page-level framing in `CardFormTemplate`, and semantic fields and actions in `CardForm`. Add only an optional cancel callback; do not change the card model, routing, or mutation interfaces.

**Tech Stack:** React 19, TypeScript, Tailwind CSS 4, React Router, Vitest, Testing Library

## Global Constraints

- Keep all interface copy in English.
- Keep the editor single-column at every viewport size.
- Do not add card preview, autosave, unsaved-change prompts, new visual tokens, or Firestore changes.
- Use shared form and layout primitives.
- Preserve remote read and mutation retry behavior.
- Run `make check` before finishing.

---

### Task 1: Modernize the card form

**Files:**
- Modify: `src/features/card/components/CardForm.spec.tsx`
- Modify: `src/features/card/components/CardForm.tsx`

**Interfaces:**
- Consumes: existing `Card`, `Form`, `FormItem`, `Tag`, `TagList`, and `Textarea` interfaces.
- Produces: `CardFormProps.onCancel?: () => void` and the existing `onSubmit` interface.

- [ ] **Step 1: Write failing form presentation and interaction tests**

Replace the existing presentation assertions with tests that require Front, Back, and Tags sections, a collapsed `Card information` disclosure, localized dates, separate Cancel and Save actions, and pending copy:

```tsx
expect(view.getByRole("heading", { level: 2, name: "Front" })).toBeVisible();
expect(view.getByText("The prompt shown during study.")).toBeVisible();
expect(view.getByRole("heading", { level: 2, name: "Back" })).toBeVisible();
expect(view.getByText("The answer revealed after the prompt.")).toBeVisible();
expect(view.getByRole("heading", { level: 2, name: "Tags" })).toBeVisible();
expect(view.getByText("Organize this card for filtering and study sessions.")).toBeVisible();

const disclosure = view.getByText("Card information").closest("details");
expect(disclosure).not.toHaveAttribute("open");
expect(view.getByText(new Date(createdAt).toLocaleDateString())).toBeInTheDocument();

const onCancel = vi.fn();
const onSubmit = vi.fn((event?: React.FormEvent) => event?.preventDefault());
const actions = render(<CardForm {...createProps({ isSubmitting: false, onCancel, onSubmit })} />);
await userEvent.click(actions.getByRole("button", { name: "Cancel" }));
expect(onCancel).toHaveBeenCalledOnce();
expect(onSubmit).not.toHaveBeenCalled();
await userEvent.click(actions.getByRole("button", { name: "Save changes" }));
expect(onSubmit).toHaveBeenCalledOnce();

const pending = render(<CardForm {...createProps({ isSubmitting: true })} />);
expect(pending.getByRole("button", { name: "Saving…" })).toBeDisabled();
```

Update the unique heading test to expect six semantic sections across two form instances: Front, Back, and Tags per instance.

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
npm test -- src/features/card/components/CardForm.spec.tsx
```

Expected: FAIL because the current form exposes `Card content`, `Metadata`, and `Save`, and has no Cancel callback.

- [ ] **Step 3: Implement the modernized form**

Add `onCancel?: () => void` to `CardFormProps`. Replace the combined content section with focused sections using this presentation pattern:

```tsx
<section
  aria-labelledby={frontHeadingId}
  className="space-y-4 rounded-surface border border-border bg-surface p-4 md:p-5"
>
  <div>
    <h2 id={frontHeadingId} className="text-title font-semibold text-ink">Front</h2>
    <p className="mt-1 text-caption text-ink-muted">The prompt shown during study.</p>
  </div>
  <FormItem col label="Front text">
    <Textarea rows={8} {...props.fields.frontText} />
  </FormItem>
</section>
```

Use the same structure for Back with `The answer revealed after the prompt.` and `Back text`. Render Tags in a matching surface with `Organize this card for filtering and study sessions.`

Replace Metadata with a native disclosure:

```tsx
<details className="rounded-surface border border-border bg-surface-muted p-4">
  <summary className="flex min-h-touch cursor-pointer items-center font-semibold text-ink">
    Card information
  </summary>
  <dl className="mt-4 grid gap-3 text-caption">
    <div className="min-w-0">
      <dt className="font-medium text-ink-muted">Unique key</dt>
      <dd className="break-all text-ink">{props.card.uniqueKey ?? ""}</dd>
    </div>
    <div className="min-w-0">
      <dt className="font-medium text-ink-muted">ID</dt>
      <dd className="break-all text-ink">{props.card.id}</dd>
    </div>
    {Boolean(props.card.createdAt) && (
      <div><dt className="font-medium text-ink-muted">Created</dt><dd className="text-ink">{new Date(props.card.createdAt).toLocaleDateString()}</dd></div>
    )}
    {props.card.lastSeenAt != null && (
      <div><dt className="font-medium text-ink-muted">Last seen</dt><dd className="text-ink">{new Date(props.card.lastSeenAt).toLocaleDateString()}</dd></div>
    )}
  </dl>
</details>
```

Finish with the shared footer pattern:

```tsx
<div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
  <Button
    variant="quiet"
    type="button"
    {...(props.onCancel !== undefined ? { onClick: props.onCancel } : {})}
  >
    Cancel
  </Button>
  <Button
    variant="primary"
    type="submit"
    {...(props.isSubmitting !== undefined ? { disabled: props.isSubmitting } : {})}
  >
    {props.isSubmitting ? "Saving…" : "Save changes"}
  </Button>
</div>
```

- [ ] **Step 4: Run the focused test and confirm success**

Run:

```bash
npm test -- src/features/card/components/CardForm.spec.tsx
```

Expected: all `CardForm` tests PASS.

- [ ] **Step 5: Commit the form change**

```bash
git add src/features/card/components/CardForm.tsx src/features/card/components/CardForm.spec.tsx
git commit -m "Modernize the card editing form"
```

---

### Task 2: Modernize the card editor page frame

**Files:**
- Modify: `src/features/card/components/templates/CardFormTemplate.spec.tsx`
- Modify: `src/features/card/components/templates/CardFormTemplate.tsx`

**Interfaces:**
- Consumes: `CardFormProps.onCancel?: () => void` from Task 1 and existing `LayoutProps`.
- Produces: page-level `Back to cards` action using the same cancel callback.

- [ ] **Step 1: Write a failing template test**

Render the template with `onCancel` and assert the updated hierarchy and behavior:

```tsx
const onCancel = vi.fn();
const view = render(<CardFormTemplate cardForm={{ ...cardFormProps, onCancel }} />);
expect(view.getByText("Card editor")).toBeVisible();
expect(view.getByRole("heading", { level: 1, name: "Edit card" })).toBeVisible();
expect(view.getByText("Update the prompt, answer, and organization for this card.")).toBeVisible();
await userEvent.click(view.getByRole("button", { name: "Back to cards" }));
expect(onCancel).toHaveBeenCalledOnce();
```

Keep the existing bounded-surface and feedback-before-form assertions.

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
npm test -- src/features/card/components/templates/CardFormTemplate.spec.tsx
```

Expected: FAIL because the current template has no back action, eyebrow, or description.

- [ ] **Step 3: Implement the page header**

Import `AiOutlineArrowLeft`. Replace the lone heading with:

```tsx
<header className="mb-section-gap">
  {props.cardForm?.onCancel != null && (
    <button
      type="button"
      className="mb-4 inline-flex min-h-touch items-center gap-2 rounded-control px-2 text-caption font-semibold text-ink-muted transition-colors duration-fast ease-calm hover:bg-surface-muted"
      onClick={props.cardForm.onCancel}
    >
      <AiOutlineArrowLeft aria-hidden="true" />
      Back to cards
    </button>
  )}
  <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Card editor</p>
  <h1 className="mt-1 break-words text-display font-bold text-ink">Edit card</h1>
  <p className="mt-2 text-body text-ink-muted">
    Update the prompt, answer, and organization for this card.
  </p>
</header>
```

Keep feedback immediately before `CardForm` inside the existing bounded surface.

- [ ] **Step 4: Run the focused test and confirm success**

Run:

```bash
npm test -- src/features/card/components/templates/CardFormTemplate.spec.tsx
```

Expected: all `CardFormTemplate` tests PASS.

- [ ] **Step 5: Commit the template change**

```bash
git add src/features/card/components/templates/CardFormTemplate.tsx src/features/card/components/templates/CardFormTemplate.spec.tsx
git commit -m "Refine the card editor page header"
```

---

### Task 3: Wire cancel navigation and verify the feature

**Files:**
- Modify: `src/features/card/containers/CardFormContainer.spec.tsx`
- Modify: `src/features/card/containers/CardFormContainer.tsx`
- Verify: all files changed by Tasks 1-3

**Interfaces:**
- Consumes: `CardFormProps.onCancel?: () => void` and React Router's `navigate(-1)`.
- Produces: cancel and back controls that return to the previous history entry without invoking `cardUpdate`.

- [ ] **Step 1: Write a failing cancel-navigation test**

Add:

```tsx
it("returns to the previous page without saving when cancelled", async () => {
  const view = render(<CardFormContainer />);

  await userEvent.click(view.getByRole("button", { name: "Cancel" }));

  expect(mocks.cardUpdate).not.toHaveBeenCalled();
  expect(mocks.navigate).toHaveBeenCalledWith(-1);
});
```

- [ ] **Step 2: Run the focused test and confirm failure**

Run:

```bash
npm test -- src/features/card/containers/CardFormContainer.spec.tsx
```

Expected: FAIL because the container does not provide `onCancel`.

- [ ] **Step 3: Wire previous-history navigation**

Add the callback to the existing state passed to the template:

```tsx
const goBack = () => void navigate(-1);

const cardForm = useCardFormState({
  card,
  categoryOptions,
  onSubmit: async (nextCard) => {
    try {
      await mutations.update(nextCard);
      goBack();
    } catch {
      // The mutation notice owns error feedback and retry.
    }
  },
});

<CardFormTemplate
  layout={{
    headerProps: {
      dark: config.darkMode,
      onClickDarkMode: actions.setDarkMode,
      onClickLogo: actions.goToTop,
      onClickMenuItem: actions.goByMenu,
    },
  }}
  feedbackSlot={
    <RemoteMutationNotice pending={mutations.pending} error={mutations.error} onRetry={mutations.retry} />
  }
  cardForm={{ ...cardForm, onCancel: goBack }}
/>
```

- [ ] **Step 4: Run all focused card editor tests**

Run:

```bash
npm test -- src/features/card/components/CardForm.spec.tsx src/features/card/components/templates/CardFormTemplate.spec.tsx src/features/card/containers/CardFormContainer.spec.tsx
```

Expected: all focused tests PASS.

- [ ] **Step 5: Format the changed source files**

Run:

```bash
npx biome format --write src/features/card/components/CardForm.tsx src/features/card/components/CardForm.spec.tsx src/features/card/components/templates/CardFormTemplate.tsx src/features/card/components/templates/CardFormTemplate.spec.tsx src/features/card/containers/CardFormContainer.tsx src/features/card/containers/CardFormContainer.spec.tsx
```

Expected: Biome completes without errors.

- [ ] **Step 6: Run repository verification**

Run:

```bash
make check
```

Expected: sample build, formatting, lint, TypeScript checks, and unit tests all PASS.

- [ ] **Step 7: Commit the navigation and plan**

```bash
git add docs/card-form-modernization-plan.md src/features/card/containers/CardFormContainer.tsx src/features/card/containers/CardFormContainer.spec.tsx
git commit -m "Add card editor cancel navigation"
```

- [ ] **Step 8: Push and open a pull request**

Push `codex/card-form-modernization` and create a ready pull request with an English title and description summarizing the focused editor layout, navigation behavior, accessibility, and `make check` result.

# Zod Form Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Validate Deck and Card edit forms with Zod, show accessible field errors, and block invalid remote writes.

**Architecture:** Keep schemas inside their owning features and connect them to React Hook Form through `zodResolver`. Each form manages only editable values and merges validated output into the original entity before using the existing mutation path. Shared controls only gain native `aria-invalid` forwarding.

**Tech Stack:** TypeScript 5.9, React 19, React Hook Form 7, Zod 4.4, `@hookform/resolvers`, Vitest, Testing Library.

## Global Constraints

- Deck name is non-blank; surrounding whitespace is removed from the submitted name.
- Deck URL is `undefined`, empty, or a valid absolute URL.
- Card front and back text each contain a non-whitespace character, but their submitted content is not trimmed.
- Invalid forms do not call mutations or navigate.
- Existing Deck, Card, Firestore, CSV, storage, retry, and remote-error behavior remains unchanged.
- Validation copy is exactly `Deck name is required.`, `Enter a valid URL.`, `Front text is required.`, and `Back text is required.`.
- Run `make check` before completion.

---

### Task 1: Forward Invalid State Through Shared Text Controls

**Files:**
- Modify: `src/components/forms/TextControl.spec.tsx`
- Modify: `src/components/forms/Input.tsx`
- Modify: `src/components/forms/Textarea.tsx`

**Interfaces:**
- Consumes: React's native `aria-invalid` value.
- Produces: `Input` and `Textarea` props accepting `"aria-invalid"?: React.AriaAttributes["aria-invalid"]` and forwarding it to the native element.

- [ ] **Step 1: Write the failing control test**

Add this test inside `describe("shared text controls")`:

```tsx
it("forwards invalid state to native text controls", () => {
  const view = render(
    <>
      <Input aria-invalid />
      <Textarea aria-invalid />
    </>
  );

  for (const control of view.container.querySelectorAll("input, textarea")) {
    expect(control).toHaveAttribute("aria-invalid", "true");
  }
});
```

- [ ] **Step 2: Run the test and verify RED**

Run: `npm run test:unit -- src/components/forms/TextControl.spec.tsx`

Expected: FAIL because neither native control has `aria-invalid`.

- [ ] **Step 3: Forward the prop in both controls**

Add this property to each inline prop type:

```ts
"aria-invalid"?: React.AriaAttributes["aria-invalid"];
```

Destructure it as `"aria-invalid": ariaInvalid`, then pass it to the native element:

```tsx
aria-invalid={ariaInvalid}
```

- [ ] **Step 4: Run the test and verify GREEN**

Run: `npm run test:unit -- src/components/forms/TextControl.spec.tsx`

Expected: PASS for all shared text-control tests.

- [ ] **Step 5: Commit the shared control change**

```bash
git add src/components/forms/TextControl.spec.tsx src/components/forms/Input.tsx src/components/forms/Textarea.tsx
git commit -m "Forward invalid text control state"
```

---

### Task 2: Validate Deck Edits

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/features/deck/lib/deckFormSchema.ts`
- Modify: `src/features/deck/containers/DeckFormContainer.tsx`
- Modify: `src/features/deck/containers/DeckFormContainer.spec.tsx`
- Modify: `src/features/deck/components/DeckForm.tsx`

**Interfaces:**
- Produces: `deckFormSchema` and `DeckFormValues = z.infer<typeof deckFormSchema>`.
- Consumes: `zodResolver(deckFormSchema)` in `useForm<DeckFormValues>`.
- Produces: `DeckFormProps.errors?: { name?: string; url?: string }`.
- Preserves: `updateAndGoToList({ ...deck, ...values })` receives a complete `Deck`.

- [ ] **Step 1: Write the failing Deck validation test**

Add a test to `DeckFormContainer.spec.tsx`:

```tsx
it("blocks a blank name and malformed URL", async () => {
  const view = render(<DeckFormContainer />);
  const name = view.container.querySelector("input[name='name']") as Element;
  const url = view.container.querySelector("input[name='url']") as Element;

  await userEvent.clear(name);
  await userEvent.type(name, "   ");
  await userEvent.type(url, "not-a-url");
  await userEvent.click(view.getByRole("button", { name: /save/i }));

  expect(view.getByText("Deck name is required.")).toBeInTheDocument();
  expect(view.getByText("Enter a valid URL.")).toBeInTheDocument();
  expect(name).toHaveAttribute("aria-invalid", "true");
  expect(url).toHaveAttribute("aria-invalid", "true");
  expect(mocks.updateAndGoToList).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the Deck test and verify RED**

Run: `npm run test:unit -- src/features/deck/containers/DeckFormContainer.spec.tsx`

Expected: FAIL because the mutation is called and no validation messages appear.

- [ ] **Step 3: Add the React Hook Form resolver dependency**

Run: `npm install @hookform/resolvers`

Expected: `package.json` and `package-lock.json` record the resolver as a production dependency.

- [ ] **Step 4: Create the Deck form schema**

Create `src/features/deck/lib/deckFormSchema.ts`:

```ts
import * as z from "zod";

export const deckFormSchema = z.object({
  name: z.string().trim().min(1, "Deck name is required."),
  category: z.string(),
  url: z.union([z.literal(""), z.url("Enter a valid URL.")]).optional(),
  convertToBr: z.boolean(),
});

export type DeckFormValues = z.infer<typeof deckFormSchema>;
```

- [ ] **Step 5: Connect DeckFormContainer to the resolver**

Import `zodResolver`, `deckFormSchema`, and `DeckFormValues`. Replace the full-entity form with editable defaults:

```ts
const { formState, handleSubmit, register } = useForm<DeckFormValues>({
  defaultValues: {
    name: deck.name,
    category: deck.category,
    url: deck.url,
    convertToBr: deck.convertToBr,
  },
  resolver: zodResolver(deckFormSchema),
});
```

Pass errors and merge validated output:

```ts
errors: {
  name: formState.errors.name?.message,
  url: formState.errors.url?.message,
},
onSubmit: handleSubmit((values) => deckActions.updateAndGoToList({ ...deck, ...values })),
```

- [ ] **Step 6: Render Deck field errors**

Add `errors?: { name?: string; url?: string }` to `DeckFormProps`. Render the affected fields as:

```tsx
<FormItem col label="Name" error={props.errors?.name}>
  <Input {...props.fields.name} aria-invalid={props.errors?.name != null || undefined} />
</FormItem>
```

```tsx
<FormItem col label="Source URL" error={props.errors?.url}>
  <Input {...props.fields.url} aria-invalid={props.errors?.url != null || undefined} />
</FormItem>
```

- [ ] **Step 7: Run the Deck tests and verify GREEN**

Run: `npm run test:unit -- src/features/deck/containers/DeckFormContainer.spec.tsx src/features/deck/components/DeckForm.spec.tsx`

Expected: PASS for Deck form container and presentation tests.

- [ ] **Step 8: Commit Deck validation**

```bash
git add package.json package-lock.json src/features/deck/lib/deckFormSchema.ts src/features/deck/containers/DeckFormContainer.tsx src/features/deck/containers/DeckFormContainer.spec.tsx src/features/deck/components/DeckForm.tsx
git commit -m "Validate deck edits with Zod"
```

---

### Task 3: Validate Card Edits

**Files:**
- Create: `src/features/card/lib/cardFormSchema.ts`
- Modify: `src/features/card/hooks/useCardFormState.ts`
- Modify: `src/features/card/containers/CardFormContainer.spec.tsx`
- Modify: `src/features/card/components/CardForm.tsx`

**Interfaces:**
- Produces: `cardFormSchema` and `CardFormValues = z.infer<typeof cardFormSchema>`.
- Consumes: `zodResolver(cardFormSchema)` in `useForm<CardFormValues>`.
- Produces: `CardFormProps.errors?: { frontText?: string; backText?: string }`.
- Preserves: `onSubmit?.({ ...card, ...values })` receives a complete `Card`.

- [ ] **Step 1: Write the failing Card validation test**

Add a test to `CardFormContainer.spec.tsx`:

```tsx
it("blocks blank front and back text", async () => {
  const view = render(<CardFormContainer />);
  const frontText = view.container.querySelector("textarea[name='frontText']") as Element;
  const backText = view.container.querySelector("textarea[name='backText']") as Element;

  await userEvent.clear(frontText);
  await userEvent.type(frontText, "   ");
  await userEvent.clear(backText);
  await userEvent.type(backText, "   ");
  await userEvent.click(view.getByRole("button", { name: /save/i }));

  expect(view.getByText("Front text is required.")).toBeInTheDocument();
  expect(view.getByText("Back text is required.")).toBeInTheDocument();
  expect(frontText).toHaveAttribute("aria-invalid", "true");
  expect(backText).toHaveAttribute("aria-invalid", "true");
  expect(mocks.cardUpdate).not.toHaveBeenCalled();
  expect(mocks.navigate).not.toHaveBeenCalled();
});
```

- [ ] **Step 2: Run the Card test and verify RED**

Run: `npm run test:unit -- src/features/card/containers/CardFormContainer.spec.tsx`

Expected: FAIL because the mutation and navigation run and no validation messages appear.

- [ ] **Step 3: Create the Card form schema**

Create `src/features/card/lib/cardFormSchema.ts`:

```ts
import * as z from "zod";

const requiredCardText = (message: string) =>
  z.string().refine((value) => value.trim().length > 0, { message });

export const cardFormSchema = z.object({
  frontText: requiredCardText("Front text is required."),
  backText: requiredCardText("Back text is required."),
  tags: z.array(z.string()),
});

export type CardFormValues = z.infer<typeof cardFormSchema>;
```

- [ ] **Step 4: Connect useCardFormState to the resolver**

Use editable defaults and merge validated values into the original Card:

```ts
const { formState, handleSubmit, register } = useForm<CardFormValues>({
  defaultValues: {
    frontText: card.frontText,
    backText: card.backText,
    tags: card.tags,
  },
  resolver: zodResolver(cardFormSchema),
});
```

Return errors and update submission:

```ts
errors: {
  frontText: formState.errors.frontText?.message,
  backText: formState.errors.backText?.message,
},
onSubmit: handleSubmit((values) => onSubmit?.({ ...card, ...values })),
```

- [ ] **Step 5: Render Card field errors**

Add `errors?: { frontText?: string; backText?: string }` to `CardFormProps`. Render both affected `FormItem` and `Textarea` pairs using the same pattern as Deck:

```tsx
<FormItem col label="Front text" error={props.errors?.frontText}>
  <Textarea
    rows={8}
    {...props.fields.frontText}
    aria-invalid={props.errors?.frontText != null || undefined}
  />
</FormItem>
```

Use `backText` and `Back text` for the second field.

- [ ] **Step 6: Run the Card tests and verify GREEN**

Run: `npm run test:unit -- src/features/card/containers/CardFormContainer.spec.tsx src/features/card/components/CardForm.spec.tsx`

Expected: PASS for Card form container and presentation tests.

- [ ] **Step 7: Commit Card validation**

```bash
git add src/features/card/lib/cardFormSchema.ts src/features/card/hooks/useCardFormState.ts src/features/card/containers/CardFormContainer.spec.tsx src/features/card/components/CardForm.tsx
git commit -m "Validate card edits with Zod"
```

---

### Task 4: Verify and Publish the PR Update

**Files:**
- Modify: `docs/zod-form-validation-plan.md` only if implementation discoveries require exact plan corrections.

**Interfaces:**
- Consumes: all committed changes from Tasks 1-3.
- Produces: an updated `codex/issue-313-zod-config` remote branch and PR #322.

- [ ] **Step 1: Run repository verification**

Run: `make check`

Expected: sample build, formatting, TypeScript, ESLint, Biome, and all unit tests pass.

- [ ] **Step 2: Review the complete branch diff**

Run:

```bash
git diff --check origin/main...HEAD
git diff --stat origin/main...HEAD
git status --short --branch
```

Expected: no whitespace errors, only Issue #313 config/form validation and its design/plan documents, and a clean worktree.

- [ ] **Step 3: Push the branch**

Run: `git push origin codex/issue-313-zod-config`

Expected: the remote branch advances to the final local commit.

- [ ] **Step 4: Update PR #322**

Update the PR summary to include Deck and Card form validation and retain `Closes #313`. Keep the PR in draft state unless the user explicitly requests ready-for-review.

- [ ] **Step 5: Verify remote PR metadata**

Confirm PR #322 targets `main`, uses head `codex/issue-313-zod-config`, contains all new commits, and remains mergeable.

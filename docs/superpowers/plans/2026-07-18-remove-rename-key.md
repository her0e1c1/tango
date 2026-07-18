# Remove `renameKey` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the React Hook Form ref adapter and use React 19's standard `ref` prop throughout the shared form controls.

**Architecture:** The shared form controls will expose and forward a typed `ref` prop to their underlying DOM element. Form state builders will pass `register(...)` results directly, eliminating the conversion utility without changing runtime behavior.

**Tech Stack:** React 19, TypeScript 5.9, React Hook Form 7, Vitest, React Testing Library

## Global Constraints

- Preserve field names, handlers, registration options, validation, default values, and submission behavior.
- Use `ref`, not `inputRef`, in all six shared form controls.
- Delete `src/shared/forms/renameKey.ts` and every import and call.
- Run `make check` before completion.

---

### Task 1: Standardize the shared form control ref contract

**Files:**
- Modify: `src/shared/components/forms/TextControl.spec.tsx`
- Modify: `src/shared/components/forms/SelectionControl.spec.tsx`
- Modify: `src/shared/components/forms/Input.tsx`
- Modify: `src/shared/components/forms/Textarea.tsx`
- Modify: `src/shared/components/forms/Select.tsx`
- Modify: `src/shared/components/forms/Switch.tsx`
- Modify: `src/shared/components/forms/Slider.tsx`
- Modify: `src/shared/components/forms/Tag.tsx`

**Interfaces:**
- Consumes: React 19 function-component `ref` props.
- Produces: `ref?: React.Ref<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>` on the matching control, forwarded to its DOM element.

- [ ] **Step 1: Change the ref-forwarding tests to use the standard prop**

Replace each test render such as:

```tsx
<Input inputRef={inputRef} />
```

with:

```tsx
<Input ref={inputRef} />
```

Apply the same change to `Textarea`, `Select`, `Slider`, `Switch`, and `Tag`. Rename each local `inputRef` variable to `ref` and keep the equivalent assertion against `ref.current`.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```bash
npx vitest run src/shared/components/forms/TextControl.spec.tsx src/shared/components/forms/SelectionControl.spec.tsx
```

Expected: six ref assertions fail because the components do not yet forward their `ref` props.

- [ ] **Step 3: Forward the standard ref from every shared form control**

For each component, replace the prop declaration, destructuring name, and DOM assignment according to this exact mapping:

| Component | Prop declaration | DOM assignment |
| --- | --- | --- |
| `Input` | `ref?: React.Ref<HTMLInputElement>` | `ref={ref}` on `<input>` |
| `Textarea` | `ref?: React.Ref<HTMLTextAreaElement>` | `ref={ref}` on `<textarea>` |
| `Select` | `ref?: React.Ref<HTMLSelectElement>` | `ref={ref}` on `<select>` |
| `Switch` | `ref?: React.Ref<HTMLInputElement>` | `ref={ref}` on its checkbox `<input>` |
| `Slider` | `ref?: React.Ref<HTMLInputElement>` | `ref={ref}` on its range `<input>` |
| `Tag` | `ref?: React.Ref<HTMLInputElement>` | `ref={ref}` on its checkbox `<input>` |

In each destructured function parameter, replace `inputRef` with `ref`. Do not change any other prop or markup.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```bash
npx vitest run src/shared/components/forms/TextControl.spec.tsx src/shared/components/forms/SelectionControl.spec.tsx
```

Expected: both test files pass with all ref assertions green.

### Task 2: Remove the registration adapter

**Files:**
- Modify: `src/features/card/hooks/useCardFormState.ts`
- Modify: `src/features/deck/containers/DeckFormContainer.tsx`
- Modify: `src/features/deck/hooks/useDeckFilterState.ts`
- Modify: `src/features/settings/hooks/useConfigFormState.ts`
- Delete: `src/shared/forms/renameKey.ts`
- Test: `src/features/card/containers/CardFormContainer.spec.tsx`
- Test: `src/features/deck/hooks/useDeckFilterState.spec.tsx`
- Test: `src/features/deck/containers/DeckFormContainer.spec.tsx`
- Test: `src/features/settings/hooks/useConfigFormState.spec.tsx`

**Interfaces:**
- Consumes: shared form controls that accept React Hook Form's standard `ref` property.
- Produces: field prop objects containing the unchanged `UseFormRegisterReturn` shape.

- [ ] **Step 1: Pass registration objects directly**

Replace:

```ts
renameKey(register("frontText"))
```

with:

```ts
register("frontText")
```

For merged props, replace:

```ts
{
  ...renameKey(register("scoreMax", { valueAsNumber: true })),
  min: -10,
}
```

with:

```ts
{
  ...register("scoreMax", { valueAsNumber: true }),
  min: -10,
}
```

Apply this to every call, remove all `renameKey` imports, and delete `src/shared/forms/renameKey.ts`.

- [ ] **Step 2: Verify the adapter is completely removed**

Run:

```bash
rg -n "renameKey|inputRef" src
```

Expected: no matches.

- [ ] **Step 3: Run the focused feature tests**

Run:

```bash
npx vitest run src/features/card/containers/CardFormContainer.spec.tsx src/features/deck/hooks/useDeckFilterState.spec.tsx src/features/deck/containers/DeckFormContainer.spec.tsx src/features/settings/hooks/useConfigFormState.spec.tsx
```

Expected: all four selected test files pass.

### Task 3: Verify and publish

**Files:**
- Verify: all changed source, test, design, and plan files

**Interfaces:**
- Consumes: completed ref standardization and adapter removal.
- Produces: a verified branch and GitHub pull request targeting `main`.

- [ ] **Step 1: Review the final scope**

Run:

```bash
git diff origin/main...HEAD
git status --short
```

Expected: only the design, plan, shared form ref changes, direct registrations, tests, and deleted adapter are present.

- [ ] **Step 2: Run the repository check**

Run:

```bash
make check
```

Expected: sample build, formatting, lint, TypeScript, React diagnostics, and unit tests all pass.

- [ ] **Step 3: Commit the implementation**

```bash
git add src docs/superpowers/plans/2026-07-18-remove-rename-key.md
git commit -m "Remove form registration ref adapter"
```

- [ ] **Step 4: Push and create the PR**

Push `codex/remove-rename-key` to `origin`, then create an English PR targeting `main` with `## Summary` and `## Testing` sections.

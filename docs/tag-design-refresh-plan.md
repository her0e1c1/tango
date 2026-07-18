# Tag Design Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unify selectable, read-only, and removable tags with the approved Structured Marker design and Dense Wrap layout.

**Architecture:** Keep semantic components separate: the existing checkbox-based `Tag`, a read-only `TagLabel`, and a button-based `RemovableTag`. Centralize their visual class composition in `src/components/content/tagStyles.ts`, and route active-filter removal through the existing `useDeckFilterState` callback.

**Tech Stack:** React 19, TypeScript 5.9, Tailwind CSS 4, Vitest, Testing Library, Storybook 10.

## Global Constraints

- Use a control-radius label with a leading circular marker.
- Use neutral styling by default and accent marker, border, and surface styling when selected.
- Use a trailing `×` only for removable active-filter tags.
- Keep read-only tags compact and interactive tags at the shared minimum touch target.
- Preserve native checkbox, button, ref, handler, disabled, and focus semantics.
- Keep card metadata read-only.
- Keep large tag collections wrapped with a maximum height and vertical scrolling.
- Do not add tag-specific persistence, error state, feedback, or retry handling.
- Support light mode, dark mode, narrow viewports, and long unbroken labels.

---

### Task 1: Shared Read-only and Removable Tag Components

**Files:**
- Create: `src/components/content/tagStyles.ts`
- Create: `src/components/content/TagLabel.tsx`
- Create: `src/components/content/RemovableTag.tsx`
- Create: `src/components/content/TagPresentation.spec.tsx`
- Create: `src/components/content/TagLabel.stories.tsx`
- Modify: `src/components/index.ts`

**Interfaces:**
- Produces: `tagClassName(options: { compact?: boolean; interactive?: boolean; selected?: boolean; className?: string }): string`
- Produces: `TagMarker({ selected?: boolean }): React.ReactElement`
- Produces: `TagLabel({ label, className?, selected? }): React.ReactElement`
- Produces: `RemovableTag({ label, onRemove, className? }): React.ReactElement`

- [ ] **Step 1: Write failing semantic and visual tests**

```tsx
it("renders compact read-only tag content outside the tab order", () => {
  render(<TagLabel label="TypeScript" />);
  const tag = screen.getByText("TypeScript").parentElement;
  expect(tag).toHaveAttribute("title", "TypeScript");
  expect(tag).toHaveClass("rounded-control", "text-xs");
  expect(tag).not.toHaveAttribute("tabindex");
  expect(tag?.querySelector('[aria-hidden="true"]')).toHaveClass("rounded-pill", "bg-ink-muted");
});

it("removes one active filter through a native button", async () => {
  const onRemove = vi.fn();
  render(<RemovableTag label="TypeScript" onRemove={onRemove} />);
  const button = screen.getByRole("button", { name: "Remove TypeScript filter" });
  expect(button).toHaveAttribute("type", "button");
  expect(button).toHaveClass("min-h-touch", "rounded-control");
  await userEvent.click(button);
  expect(onRemove).toHaveBeenCalledExactlyOnceWith("TypeScript");
});
```

- [ ] **Step 2: Run the tests and verify missing-module failures**

Run: `npm test -- src/components/content/TagPresentation.spec.tsx`

Expected: FAIL because `TagLabel` and `RemovableTag` do not exist.

- [ ] **Step 3: Implement the centralized visual helper and components**

```tsx
// tagStyles.ts
export interface TagStyleOptions {
  className?: string;
  compact?: boolean;
  interactive?: boolean;
  selected?: boolean;
}

export const tagClassName = ({ compact, interactive, selected, className }: TagStyleOptions) =>
  cx(
    "inline-flex max-w-full min-w-0 items-center border font-medium text-ink",
    "rounded-control border-border bg-surface",
    compact ? "min-h-6 px-2 py-0.5 text-xs" : "min-h-touch min-w-touch px-3 py-2 text-sm",
    interactive && "cursor-pointer transition-colors duration-fast ease-calm",
    selected && "border-accent-primary bg-accent-primary/10 text-accent-primary",
    className
  );

export const TagMarker = ({ selected }: { selected?: boolean }) => (
  <span
    aria-hidden="true"
    className={cx(
      "mr-2 size-2 shrink-0 rounded-pill bg-ink-muted",
      selected && "bg-accent-primary ring-2 ring-accent-primary/20"
    )}
  />
);

// TagLabel.tsx
export const TagLabel = ({ label, className, selected }: TagLabelProps) => (
  <span className={tagClassName({ compact: true, selected, className })} title={label}>
    <TagMarker selected={selected} />
    <span className="min-w-0 truncate">{label}</span>
  </span>
);

// RemovableTag.tsx
export const RemovableTag = ({ label, onRemove, className }: RemovableTagProps) => (
  <button
    type="button"
    aria-label={`Remove ${label} filter`}
    className={tagClassName({ interactive: true, selected: true, className })}
    onClick={() => onRemove(label)}
  >
    <TagMarker selected />
    <span className="min-w-0 truncate">{label}</span>
    <span aria-hidden="true" className="ml-2 shrink-0">×</span>
  </button>
);
```

Export both components from `src/components/index.ts` and add Storybook examples for default, selected, removable, long-label, and light/dark states.

- [ ] **Step 4: Run targeted tests**

Run: `npm test -- src/components/content/TagPresentation.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit the shared presentation components**

```bash
git add src/components/content/tagStyles.ts src/components/content/TagLabel.tsx src/components/content/RemovableTag.tsx src/components/content/TagPresentation.spec.tsx src/components/content/TagLabel.stories.tsx src/components/index.ts
git commit -m "Add shared tag presentation components"
```

### Task 2: Selectable Tag and Dense Wrap Layout

**Files:**
- Modify: `src/components/forms/Tag.tsx`
- Modify: `src/components/forms/SelectionControl.spec.tsx`
- Modify: `src/components/forms/Tag.stories.tsx`
- Modify: `src/components/content/TagList.tsx`
- Modify: `src/components/content/ContentHierarchy.spec.tsx`
- Modify: `src/components/content/TagList.stories.tsx`

**Interfaces:**
- Consumes: `TagMarker` and the visual rules produced by Task 1.
- Preserves: the current public props and native checkbox behavior of `Tag`.
- Preserves: `TagList({ hasManyItems?, children? })`.

- [ ] **Step 1: Change tests to specify Structured Marker and Dense Wrap behavior**

```tsx
it("shows selection through marker, border, and surface changes", () => {
  const view = render(<Tag checked label="Biology" />);
  const input = view.container.querySelector<HTMLInputElement>('input[type="checkbox"]');
  expect(input).toHaveClass("peer", "sr-only");
  expect(input?.nextElementSibling).toHaveClass(
    "rounded-control",
    "peer-checked:border-accent-primary",
    "peer-checked:bg-accent-primary/10"
  );
  expect(input?.nextElementSibling?.querySelector('[aria-hidden="true"]')).toHaveClass("bg-accent-primary");
});

it("keeps large tag collections wrapped inside vertical overflow", () => {
  render(<TagList hasManyItems>Many tags</TagList>);
  expect(screen.getByText("Many tags")).toHaveClass("flex-wrap", "max-h-64", "overflow-y-auto");
  expect(screen.getByText("Many tags")).not.toHaveClass("flex-col", "flex-nowrap");
});
```

- [ ] **Step 2: Run tests and verify they fail against the old pill/ring layout**

Run: `npm test -- src/components/forms/SelectionControl.spec.tsx src/components/content/ContentHierarchy.spec.tsx`

Expected: FAIL on marker and wrapped-overflow assertions.

- [ ] **Step 3: Implement the selectable Structured Marker and Dense Wrap classes**

Use `sr-only peer` for the native checkbox and replace the presentation with the following structure while preserving the existing prop forwarding:

```tsx
<input readOnly type="checkbox" className="peer sr-only" {...nativeProps} />
<span
  className={cx(
    tagClassName({ interactive: onChange != null && !disabled, className }),
    "peer-checked:border-accent-primary peer-checked:bg-accent-primary/10 peer-checked:text-accent-primary",
    "peer-focus-visible:ring-2 peer-focus-visible:ring-focus",
    "peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
  )}
>
  <TagMarker selected={checked} />
  <span className="min-w-0 truncate">{label ?? children}</span>
</span>
```

Keep the `round`, `small`, `large`, and `primary` props accepted for compatibility, but let the approved Structured Marker size and state rules take precedence. Update `TagList` to:

```tsx
<div
  className={cx(
    "flex min-w-0 flex-wrap gap-2 overflow-x-hidden",
    props.hasManyItems && "max-h-64 overflow-y-auto"
  )}
>
  {props.children}
</div>
```

- [ ] **Step 4: Update stories and run the targeted tests**

Add long-label, many-tag, narrow-viewport, light, dark, selected, and disabled stories.

Run: `npm test -- src/components/forms/SelectionControl.spec.tsx src/components/content/ContentHierarchy.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Commit selectable tag and layout changes**

```bash
git add src/components/forms/Tag.tsx src/components/forms/SelectionControl.spec.tsx src/components/forms/Tag.stories.tsx src/components/content/TagList.tsx src/components/content/ContentHierarchy.spec.tsx src/components/content/TagList.stories.tsx
git commit -m "Refresh selectable tag layout"
```

### Task 3: Card Metadata and Active Filter Removal

**Files:**
- Modify: `src/features/card/components/Card.tsx`
- Modify: `src/features/card/components/Card.spec.tsx`
- Modify: `src/features/card/components/templates/CardListTemplate.tsx`
- Modify: `src/features/card/components/templates/CardListTemplate.spec.tsx`
- Modify: `src/features/card/containers/CardListContainer.tsx`
- Modify: `src/features/card/containers/CardListContainer.spec.tsx`
- Modify: `src/features/card/components/Card.stories.tsx`
- Modify: `src/features/card/components/templates/CardListTemplate.stories.tsx`

**Interfaces:**
- Consumes: `TagLabel` and `RemovableTag` from Task 1.
- Adds: `CardListTemplateProps.onRemoveTag?: (tag: string) => void`.
- Uses: `deckStartForm.tagFilterProps.onClickTag?: (tags: string[]) => void` without changing persistence APIs.

- [ ] **Step 1: Write failing integration tests**

```tsx
it("renders card tags as compact read-only markers", () => {
  const view = render(<Card card={card} />);
  const metadata = view.getByLabelText("Tags: one, two");
  expect(within(metadata).queryByRole("button")).not.toBeInTheDocument();
  expect(within(metadata).getByText("one").parentElement).toHaveClass("rounded-control", "text-xs");
});

it("removes one selected tag from the persistent filter summary", async () => {
  const onRemoveTag = vi.fn();
  render(
    <CardListTemplate
      cards={[card]}
      filter={{ scoreMin: null, scoreMax: null, selectedTags: ["one", "two"] }}
      onRemoveTag={onRemoveTag}
    />
  );
  await userEvent.click(screen.getByRole("button", { name: "Remove one filter" }));
  expect(onRemoveTag).toHaveBeenCalledExactlyOnceWith("one");
});
```

In the container spec, set selected tags to `['typescript', 'react']`, click `Remove typescript filter`, and assert the existing mocked `onClickTag` receives `['react']`.

- [ ] **Step 2: Run tests and verify missing-button failures**

Run: `npm test -- src/features/card/components/Card.spec.tsx src/features/card/components/templates/CardListTemplate.spec.tsx src/features/card/containers/CardListContainer.spec.tsx`

Expected: FAIL because card metadata uses local spans and active filters are not buttons.

- [ ] **Step 3: Replace local markup and connect the existing callback**

In `Card.tsx`, replace each metadata span with `<TagLabel label={tag} />` while preserving the existing labelled group and overflow containment.

In `CardListTemplate.tsx`, render each selected value as:

```tsx
<li key={tag} className="max-w-full">
  <RemovableTag label={tag} onRemove={(value) => props.onRemoveTag?.(value)} />
</li>
```

In `CardListContainer.tsx`, pass:

```tsx
onRemoveTag={(tag) => {
  const selectedTags = deckStartForm.tagFilterProps.selectedTags ?? [];
  deckStartForm.tagFilterProps.onClickTag?.(selectedTags.filter((value) => value !== tag));
}}
```

- [ ] **Step 4: Run focused and related tests**

Run: `npm test -- src/features/card/components/Card.spec.tsx src/features/card/components/templates/CardListTemplate.spec.tsx src/features/card/containers/CardListContainer.spec.tsx src/features/deck/components/TagFilter.spec.tsx src/features/deck/hooks/useDeckFilterState.spec.tsx`

Expected: PASS.

- [ ] **Step 5: Update stories and commit integration**

Add a template story whose render callback updates `selectedTags` locally so the removable buttons can be exercised:

```tsx
export const RemovableSelectedTags: Story = {
  render: (args) => {
    const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
    return (
      <Template
        {...args}
        filter={{ scoreMin: null, scoreMax: null, selectedTags }}
        onRemoveTag={(tag) => setSelectedTags((values) => values.filter((value) => value !== tag))}
      />
    );
  },
};
```

Keep the existing long-unbroken metadata and light/dark stories, updating their expected tag appearance to the shared components.

```bash
git add src/features/card/components/Card.tsx src/features/card/components/Card.spec.tsx src/features/card/components/templates/CardListTemplate.tsx src/features/card/components/templates/CardListTemplate.spec.tsx src/features/card/containers/CardListContainer.tsx src/features/card/containers/CardListContainer.spec.tsx src/features/card/components/Card.stories.tsx src/features/card/components/templates/CardListTemplate.stories.tsx
git commit -m "Unify card tag interactions"
```

### Task 4: Repository Verification

**Files:**
- Modify only files required to resolve failures caused by Tasks 1–3.

**Interfaces:**
- Consumes all previous task outputs.
- Produces a clean worktree with repository checks passing.

- [ ] **Step 1: Run formatting without changing unrelated files**

Run:

```bash
npx biome check --write src/components/content/tagStyles.ts src/components/content/TagLabel.tsx src/components/content/RemovableTag.tsx src/components/content/TagPresentation.spec.tsx src/components/content/TagLabel.stories.tsx src/components/index.ts src/components/forms/Tag.tsx src/components/forms/SelectionControl.spec.tsx src/components/forms/Tag.stories.tsx src/components/content/TagList.tsx src/components/content/ContentHierarchy.spec.tsx src/components/content/TagList.stories.tsx src/features/card/components/Card.tsx src/features/card/components/Card.spec.tsx src/features/card/components/templates/CardListTemplate.tsx src/features/card/components/templates/CardListTemplate.spec.tsx src/features/card/containers/CardListContainer.tsx src/features/card/containers/CardListContainer.spec.tsx src/features/card/components/Card.stories.tsx src/features/card/components/templates/CardListTemplate.stories.tsx
git diff --stat
git diff
```

Expected: Biome reports no remaining errors, and the diff contains only files listed in this plan.

- [ ] **Step 2: Run the required repository check**

Run: `make check`

Expected: sample build, format check, lint check, and all unit tests pass.

- [ ] **Step 3: Run final diff and status review**

Run: `git status --short`, `git diff origin/main...HEAD --check`, and `git diff origin/main...HEAD --stat`.

Expected: no unstaged source changes, no whitespace errors, and only tag design/spec/plan files in scope.

- [ ] **Step 4: Commit any verification-only correction**

If Task 4 required a source correction, stage only that correction and commit it with an English imperative subject describing the actual fix. If no correction was required, do not create an empty commit.

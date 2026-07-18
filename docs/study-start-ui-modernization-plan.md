# Study Start UI Modernization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic study start screen with a Calm Focus single-column setup page that identifies the Deck, distinguishes session and matching-card counts, and presents accessible score and tag controls.

**Architecture:** Keep remote reads, filter auto-save, session creation, and navigation in their current hooks and container. Expand the presentation boundary so `DeckStartTemplate` owns page context and the session summary, while `DeckStartForm` and `TagFilter` own semantic filter sections. The container passes only the Deck name, maximum-card value, filtered count, and existing callbacks, and applies one guarded Enter shortcut.

**Tech Stack:** React 19, TypeScript, React Router, react-use, React Hook Form, Tailwind CSS 4 with Calm Focus tokens, Vitest, Testing Library, Storybook 10.

## Global Constraints

- Preserve filter auto-save, score/tag filtering, shuffle, maximum-card handling, dark mode, study session construction, and `/deck/:id/study` navigation.
- Do not change Deck, Card, Config, Firestore, or Zustand data models.
- Add no filters, presets, reset actions, dependencies, or shared components.
- Use only existing Calm Focus semantic utilities; add no raw palette utilities.
- Keep the page single-column at every viewport and prevent horizontal page scrolling.
- Disable pointer and Enter-key start when zero cards match.
- Do not start from the global Enter shortcut when focus is inside an interactive control.
- Run `make check` before completion.

---

## File map

- Create `src/features/study/components/templates/DeckStartTemplate.spec.tsx`: session-summary and empty-state presentation contracts.
- Modify `src/features/study/components/templates/DeckStartTemplate.tsx`: page context, derived counts, primary action, and filter slot.
- Modify `src/features/study/components/templates/DeckStartTemplate.stories.tsx`: default, long, mobile, zero-match, and dark visual states.
- Modify `src/features/deck/components/DeckStartForm.spec.tsx`: score-section semantics, accessible names, values, and callbacks.
- Modify `src/features/deck/components/DeckStartForm.tsx`: labelled Score range section and two score-limit rows.
- Modify `src/features/deck/components/DeckStartForm.stories.tsx`: existing score and tag visual coverage with the modern layout.
- Modify `src/features/deck/components/TagFilter.spec.tsx`: Tags section semantics and callback contracts.
- Modify `src/features/deck/components/TagFilter.tsx`: labelled Tags section, match-mode row, quiet bulk actions, and tag list.
- Modify `src/features/deck/components/TagFilter.stories.tsx`: default, selected, many-tag, mobile, and dark visual states.
- Create `src/features/study/containers/DeckStartContainer.spec.tsx`: Deck wiring and guarded Enter behavior.
- Modify `src/features/study/containers/DeckStartContainer.tsx`: narrow template props and keyboard guard.
- Modify `src/lib/calmFocusVisualContract.spec.ts`: include the modern study start template in semantic presentation enforcement.

---

### Task 1: Build the Deck-aware session summary

**Files:**
- Create: `src/features/study/components/templates/DeckStartTemplate.spec.tsx`
- Modify: `src/features/study/components/templates/DeckStartTemplate.tsx`
- Modify: `src/features/study/components/templates/DeckStartTemplate.stories.tsx`

**Interfaces:**
- Consumes: `LayoutProps`, `Button`, `cardsLength: number`, `maxNumberOfCardsToLearn: number`, and `onClickStart?: () => void`.
- Produces: `DeckStartTemplateProps` with required `deckName`, `maxNumberOfCardsToLearn`, and `cardsLength` props plus the existing layout, filter slot, and Start callback.

- [ ] **Step 1: Write failing template tests**

Create `DeckStartTemplate.spec.tsx` with these complete contracts:

```tsx
import type React from "react";
import { cleanup, render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartTemplate } from "@/features/study/components/templates/DeckStartTemplate";

const renderTemplate = (overrides: Partial<React.ComponentProps<typeof DeckStartTemplate>> = {}) => {
  const onClickStart = vi.fn();
  const view = render(
    <DeckStartTemplate
      deckName="Japanese vocabulary"
      maxNumberOfCardsToLearn={24}
      cardsLength={123}
      onClickStart={onClickStart}
      filterSlot={<div>Filter controls</div>}
      {...overrides}
    />
  );
  return { ...view, onClickStart };
};

describe("DeckStartTemplate", () => {
  afterEach(cleanup);

  it("shows Deck context, capped session size, matching count, and filters", async () => {
    const view = renderTemplate();

    expect(view.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
    expect(view.getByRole("heading", { level: 2, name: "24 cards in this session" })).toBeInTheDocument();
    expect(view.getByText("123 cards match your filters.")).toBeInTheDocument();
    expect(view.getByText("Filter controls")).toBeInTheDocument();

    await userEvent.click(view.getByRole("button", { name: "Start 24 cards" }));
    expect(view.onClickStart).toHaveBeenCalledOnce();
  });

  it("uses singular card wording", () => {
    const view = renderTemplate({ maxNumberOfCardsToLearn: 1, cardsLength: 1 });
    expect(view.getByRole("heading", { level: 2, name: "1 card in this session" })).toBeInTheDocument();
    expect(view.getByText("1 card matches your filters.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
  });

  it("explains and disables an empty session", () => {
    const view = renderTemplate({ cardsLength: 0 });
    expect(view.getByRole("heading", { level: 2, name: "0 cards in this session" })).toBeInTheDocument();
    expect(view.getByText("No cards match your filters.")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "Start 0 cards" })).toBeDisabled();
  });
});
```

- [ ] **Step 2: Run the new tests and verify failure**

Run:

```bash
npx vitest run src/features/study/components/templates/DeckStartTemplate.spec.tsx
```

Expected: FAIL because `DeckStartTemplate` does not accept `deckName` or `maxNumberOfCardsToLearn`, and the new headings and copy do not exist.

- [ ] **Step 3: Implement the focused template**

Replace `DeckStartTemplate.tsx` with a presentation-only component that:

```tsx
import type React from "react";

import { Button } from "@/shared/components";
import { Layout, type LayoutProps } from "@/shared/components/layout/Layout";

export interface DeckStartTemplateProps {
  layout?: LayoutProps;
  deckName: string;
  maxNumberOfCardsToLearn: number;
  cardsLength: number;
  filterSlot?: React.ReactNode;
  onClickStart?: () => void;
}

const cardsLabel = (count: number) => `${count} ${count === 1 ? "card" : "cards"}`;

export const DeckStartTemplate: React.FC<DeckStartTemplateProps> = (props) => {
  const sessionCardsLength = Math.min(props.cardsLength, props.maxNumberOfCardsToLearn);
  const hasCards = props.cardsLength > 0;
  const matchingCopy = hasCards
    ? `${cardsLabel(props.cardsLength)} ${props.cardsLength === 1 ? "matches" : "match"} your filters.`
    : "No cards match your filters.";

  return (
    <Layout showHeader {...props.layout}>
      <div className="mx-auto w-full max-w-reading space-y-section-gap">
        <header>
          <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Study setup</p>
          <h1 className="mt-1 line-clamp-3 break-words text-display font-bold text-ink">{props.deckName}</h1>
          <p className="mt-2 text-body text-ink-muted">Choose what to review, then begin a focused session.</p>
        </header>
        <section className="rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div aria-live="polite" className="min-w-0">
              <p className="text-caption font-bold uppercase tracking-wider text-accent-primary">Session</p>
              <h2 className="mt-1 break-words text-title font-bold text-ink">
                {cardsLabel(sessionCardsLength)} in this session
              </h2>
              <p className="mt-1 text-caption text-ink-muted">{matchingCopy}</p>
            </div>
            <Button
              variant="primary"
              size="lg"
              className="w-full shrink-0 sm:w-auto"
              disabled={!hasCards}
              {...(props.onClickStart !== undefined ? { onClick: props.onClickStart } : {})}
            >
              Start {cardsLabel(sessionCardsLength)}
            </Button>
          </div>
        </section>
        {props.filterSlot}
      </div>
    </Layout>
  );
};
```

- [ ] **Step 4: Update Storybook inputs**

In `DeckStartTemplate.stories.tsx`, remove the `config` arg, add `deckName: fixture.deck.default.name` and `maxNumberOfCardsToLearn: fixture.config.default.maxNumberOfCardsToLearn`, keep the existing filter fixtures, and add:

```tsx
export const NoMatches: Story = { args: { cardsLength: 0 } };

export const Dark: Story = {
  ...Long,
  globals: { theme: "dark" },
};
```

Set `Long` to also use `deckName: fixture.deck.tooLongName.name`. Keep `IphoneX` and `IphoneXLong` on the same full-screen viewport configuration.

- [ ] **Step 5: Run tests and commit**

Run:

```bash
npx vitest run src/features/study/components/templates/DeckStartTemplate.spec.tsx
```

Expected: 3 tests PASS.

Commit:

```bash
git add src/features/study/components/templates/DeckStartTemplate.tsx src/features/study/components/templates/DeckStartTemplate.spec.tsx src/features/study/components/templates/DeckStartTemplate.stories.tsx
git commit -m "Modernize the study session summary"
```

---

### Task 2: Modernize and label score and tag filters

**Files:**
- Modify: `src/features/deck/components/DeckStartForm.spec.tsx`
- Modify: `src/features/deck/components/DeckStartForm.tsx`
- Modify: `src/features/deck/components/DeckStartForm.stories.tsx`
- Modify: `src/features/deck/components/TagFilter.spec.tsx`
- Modify: `src/features/deck/components/TagFilter.tsx`
- Modify: `src/features/deck/components/TagFilter.stories.tsx`

**Interfaces:**
- Consumes: the existing `DeckStartFormProps` and `TagFilterProps` callback and field-binding shapes without changes.
- Produces: semantic `region` elements named `Score range` and `Tags`; controls named `Enable maximum score`, `Maximum score value`, `Enable minimum score`, `Minimum score value`, and `Match all selected tags`.

- [ ] **Step 1: Rewrite score-filter tests to express the accessible contract**

Keep `createProps()` in `DeckStartForm.spec.tsx`, then replace its tests with:

```tsx
it("labels score controls and preserves values and callbacks", async () => {
  const props = createProps();
  const view = render(<DeckStartForm {...props} />);
  const scoreRegion = view.getByRole("region", { name: "Score range" });
  const maxSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable maximum score" });
  const minSwitch = within(scoreRegion).getByRole("checkbox", { name: "Enable minimum score" });
  const maxSlider = within(scoreRegion).getByRole("slider", { name: "Maximum score value" });
  const minSlider = within(scoreRegion).getByRole("slider", { name: "Minimum score value" });

  expect(scoreRegion).toHaveClass("bg-surface");
  expect(within(scoreRegion).getByText("−2 to 4")).toBeInTheDocument();
  expect(maxSwitch).toBeChecked();
  expect(minSwitch).toBeChecked();
  expect(maxSlider).toHaveValue("4");
  expect(minSlider).toHaveValue("-2");

  await userEvent.click(maxSwitch);
  await userEvent.click(minSwitch);
  fireEvent.change(maxSlider, { target: { value: "5" } });
  fireEvent.change(minSlider, { target: { value: "-3" } });

  expect(props.scoreMaxSwitchProps.onChange).toHaveBeenCalledOnce();
  expect(props.scoreMinSwitchProps.onChange).toHaveBeenCalledOnce();
  expect(props.scoreMaxSliderProps.onChange).toHaveBeenCalledOnce();
  expect(props.scoreMinSliderProps.onChange).toHaveBeenCalledOnce();
});

it("shows unrestricted disabled limits", () => {
  const view = render(<DeckStartForm {...createProps()} scoreMax={null} scoreMin={null} />);
  expect(view.getByText("Any score")).toBeInTheDocument();
  expect(view.getByText("No upper limit")).toBeInTheDocument();
  expect(view.getByText("No lower limit")).toBeInTheDocument();
});
```

Add `within` to the Testing Library import.

- [ ] **Step 2: Rewrite tag-filter tests to express section and mode semantics**

Update `TagFilter.spec.tsx` so the first test gets the `Tags` region, asserts the visible `AND` state, and obtains the mode switch by `Match all selected tags`. In the callback test, click that named checkbox instead of querying its implementation `name`. Preserve the individual tag, All, Clear, and callback assertions.

The key assertions are:

```tsx
const tagsRegion = view.getByRole("region", { name: "Tags" });
expect(tagsRegion).toHaveClass("bg-surface");
expect(within(tagsRegion).getByText("AND")).toBeInTheDocument();
expect(within(tagsRegion).getByRole("checkbox", { name: "Match all selected tags" })).toBeChecked();
expect(within(tagsRegion).getByRole("checkbox", { name: "one" })).not.toBeChecked();
expect(within(tagsRegion).getByRole("checkbox", { name: "two" })).toBeChecked();
```

- [ ] **Step 3: Run both component specs and verify failure**

Run:

```bash
npx vitest run src/features/deck/components/DeckStartForm.spec.tsx src/features/deck/components/TagFilter.spec.tsx
```

Expected: FAIL because the current divs, generic section text, and unnamed switches do not expose the new roles or names.

- [ ] **Step 4: Implement the Score range section**

In `DeckStartForm.tsx`, import `useId`, remove `FormItem` and `Section`, and add this local presentation code:

```tsx
interface ScoreLimitProps {
  label: "Maximum score" | "Minimum score";
  enabledLabel: string;
  value: number | null;
  switchId: string;
  sliderId: string;
  descriptionId: string;
  switchProps: React.ComponentProps<typeof Switch>;
  sliderProps: React.ComponentProps<typeof Slider>;
}

const displayScore = (value: number): string => `${value}`.replace("-", "−");

const scoreRangeLabel = (min: number | null, max: number | null): string => {
  if (min != null && max != null) return `${displayScore(min)} to ${displayScore(max)}`;
  if (min != null) return `${displayScore(min)} and above`;
  if (max != null) return `${displayScore(max)} and below`;
  return "Any score";
};

const ScoreLimit: React.FC<ScoreLimitProps> = (props) => {
  const boundary = props.label === "Maximum score" ? "upper" : "lower";
  return (
    <div className="rounded-control bg-surface-muted p-3">
      <div className="flex min-h-touch items-center justify-between gap-4">
        <div className="min-w-0">
          <label htmlFor={props.switchId} className="text-body font-medium text-ink">{props.label}</label>
          <p id={props.descriptionId} className="text-caption text-ink-muted">
            {props.value == null ? `No ${boundary} limit` : `Current limit: ${displayScore(props.value)}`}
          </p>
        </div>
        <Switch
          {...props.switchProps}
          id={props.switchId}
          aria-label={props.enabledLabel}
          aria-describedby={props.descriptionId}
        />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Slider
          {...props.sliderProps}
          id={props.sliderId}
          aria-label={`${props.label} value`}
          aria-describedby={props.descriptionId}
          aria-valuetext={props.value == null ? `${props.label} disabled` : displayScore(props.value)}
        />
        <span className="min-w-12 rounded-control bg-surface px-2 py-1 text-center text-caption font-bold text-accent-primary">
          {props.value == null ? "Any" : displayScore(props.value)}
        </span>
      </div>
    </div>
  );
};
```

Use `useId()` to define `${idPrefix}-score-heading`, `${idPrefix}-maximum-enabled`, `${idPrefix}-maximum-value`, `${idPrefix}-maximum-description`, and equivalent `minimum-*` IDs. Render the form body as:

```tsx
<Form div>
  <section aria-labelledby={headingId} className="space-y-4 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 id={headingId} className="text-title font-semibold text-ink">Score range</h2>
        <p className="mt-1 text-caption text-ink-muted">Limit cards by their current score.</p>
      </div>
      <span className="rounded-control bg-surface-muted px-2 py-1 text-caption font-bold text-accent-primary">
        {scoreRangeLabel(props.scoreMin, props.scoreMax)}
      </span>
    </header>
    <div className="space-y-3">
      <ScoreLimit
        label="Maximum score"
        enabledLabel="Enable maximum score"
        value={props.scoreMax}
        switchId={maximumSwitchId}
        sliderId={maximumSliderId}
        descriptionId={maximumDescriptionId}
        switchProps={props.scoreMaxSwitchProps}
        sliderProps={props.scoreMaxSliderProps}
      />
      <ScoreLimit
        label="Minimum score"
        enabledLabel="Enable minimum score"
        value={props.scoreMin}
        switchId={minimumSwitchId}
        sliderId={minimumSliderId}
        descriptionId={minimumDescriptionId}
        switchProps={props.scoreMinSwitchProps}
        sliderProps={props.scoreMinSliderProps}
      />
    </div>
  </section>
  <TagFilter {...props.tagFilterProps} />
</Form>
```

Field values and callbacks remain unchanged.

- [ ] **Step 5: Implement the Tags section**

In `TagFilter.tsx`, import `useId`, remove `Description` and `Section`, and replace the outer div with a labelled `section`. Use this structure while preserving all props and callbacks:

```tsx
<section aria-labelledby={headingId} data-testid="tag-filter" className="min-w-0 space-y-4 rounded-surface border border-border bg-surface p-4 shadow-surface md:p-5">
  <header className="flex flex-wrap items-start justify-between gap-3">
    <div>
      <h2 id={headingId} className="text-title font-semibold text-ink">Tags</h2>
      <p className="mt-1 text-caption text-ink-muted">Choose which tagged cards belong in this session.</p>
    </div>
    <div className="flex flex-wrap gap-2">
      <Button variant="quiet" size="sm" label="All" {...(props.onClickAll !== undefined ? { onClick: props.onClickAll } : {})} />
      <Button variant="quiet" size="sm" label="Clear" {...(props.onClickClear !== undefined ? { onClick: props.onClickClear } : {})} />
    </div>
  </header>
  <div className="flex min-h-touch items-center justify-between gap-4 rounded-control bg-surface-muted p-3">
    <div className="min-w-0">
      <label htmlFor={modeId} className="text-body font-medium text-ink">Match all selected tags</label>
      <p id={modeDescriptionId} className="text-caption text-ink-muted">
        {props.tagAndFilter ? "Cards must include every selected tag." : "Cards can include any selected tag."}
      </p>
    </div>
    <div className="flex shrink-0 items-center gap-2">
      <span className="text-caption font-bold text-accent-primary">{props.tagAndFilter ? "AND" : "OR"}</span>
      <Switch
        id={modeId}
        name="tag-filter-click-filter"
        aria-label="Match all selected tags"
        aria-describedby={modeDescriptionId}
        {...(props.tagAndFilter !== undefined ? { checked: props.tagAndFilter } : {})}
        onChange={(event) => props.onClickFilter?.(event.target.checked)}
      />
    </div>
  </div>
  <TagList hasManyItems={(props.tags?.length ?? 0) > 30}>
    {props.tags?.map((tag) => (
      <Tag
        small
        key={tag}
        label={tag}
        {...(props.selectedTags !== undefined ? { checked: props.selectedTags.includes(tag) } : {})}
        onChange={() => props.onClickTag?.(updateTags(props.selectedTags ?? [], tag))}
      />
    ))}
  </TagList>
</section>
```

Only attach optional Button callbacks when they are defined, matching the existing exact-optional-property pattern.

- [ ] **Step 6: Update and run stories and tests**

Keep the current DeckStartForm and TagFilter story variants. Update any expected labels to the new copy; no callback or fixture shape changes are needed.

Run:

```bash
npx vitest run src/features/deck/components/DeckStartForm.spec.tsx src/features/deck/components/TagFilter.spec.tsx src/features/deck/hooks/useDeckFilterState.spec.tsx
```

Expected: all tests PASS, including auto-save callback coverage.

- [ ] **Step 7: Commit**

```bash
git add src/features/deck/components/DeckStartForm.tsx src/features/deck/components/DeckStartForm.spec.tsx src/features/deck/components/DeckStartForm.stories.tsx src/features/deck/components/TagFilter.tsx src/features/deck/components/TagFilter.spec.tsx src/features/deck/components/TagFilter.stories.tsx
git commit -m "Modernize study filters"
```

---

### Task 3: Wire Deck context and guard the Enter shortcut

**Files:**
- Create: `src/features/study/containers/DeckStartContainer.spec.tsx`
- Modify: `src/features/study/containers/DeckStartContainer.tsx`

**Interfaces:**
- Consumes: the Task 1 `DeckStartTemplateProps` contract and existing Deck, Card, Config, action, and filter hooks.
- Produces: `DeckStartContent` wiring `deck.name`, `config.maxNumberOfCardsToLearn`, `cards.length`, and a guarded `KeyboardEvent` handler.

- [ ] **Step 1: Write failing container tests**

Create `DeckStartContainer.spec.tsx` with this setup:

```tsx
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";

import { DeckStartContent } from "@/features/study/containers/DeckStartContainer";
import { createCard, createConfig, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  start: vi.fn(),
  update: vi.fn(),
  keyHandler: undefined as ((event: KeyboardEvent) => void) | undefined,
}));

vi.mock("react-use", () => ({
  useKey: (_key: string, handler: (event: KeyboardEvent) => void) => {
    mocks.keyHandler = handler;
  },
}));
vi.mock("@/features/deck/hooks/useDeckActions", () => ({
  useDeckActions: () => ({ update: mocks.update }),
}));
vi.mock("@/features/study/hooks/useStudyActions", () => ({
  useStudyActions: () => ({ start: mocks.start }),
}));
vi.mock("@/shared/hooks/useActions", () => ({
  useActions: () => ({ setDarkMode: vi.fn(), goToTop: vi.fn(), goByMenu: vi.fn() }),
}));
vi.mock("@/features/deck/hooks/useDeckFilterState", () => ({
  useDeckFilterState: () => ({
    scoreMax: 4,
    scoreMin: -2,
    scoreMaxSwitchProps: { name: "maximum-enabled", checked: true, onChange: vi.fn() },
    scoreMinSwitchProps: { name: "minimum-enabled", checked: true, onChange: vi.fn() },
    scoreMaxSliderProps: { name: "maximum", value: "4", min: -10, max: 10, onChange: vi.fn() },
    scoreMinSliderProps: { name: "minimum", value: "-2", min: -10, max: 10, onChange: vi.fn() },
    tagFilterProps: { tags: [], selectedTags: [], tagAndFilter: false },
  }),
}));

const renderContent = ({
  cards = [createCard()],
  config = createConfig(),
}: {
  cards?: Card[];
  config?: ConfigState;
} = {}) =>
  render(
    <DeckStartContent
      deck={createDeck({ name: "Japanese vocabulary" })}
      cards={cards}
      config={config}
      tags={[]}
    />
  );

describe("DeckStartContent", () => {
  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
    mocks.keyHandler = undefined;
  });
```

Append these tests inside the `describe` block:

```tsx
it("passes Deck and session context to the template", () => {
  const view = renderContent({ cards: [createCard()], config: createConfig({ maxNumberOfCardsToLearn: 1 }) });
  expect(view.getByRole("heading", { level: 1, name: "Japanese vocabulary" })).toBeInTheDocument();
  expect(view.getByRole("button", { name: "Start 1 card" })).toBeInTheDocument();
});

it("starts from Enter only when cards match and focus is not interactive", () => {
  const view = renderContent({ cards: [createCard()] });
  act(() => mocks.keyHandler?.({ target: document.body } as unknown as KeyboardEvent));
  expect(mocks.start).toHaveBeenCalledOnce();

  mocks.start.mockClear();
  const slider = view.getByRole("slider", { name: "Maximum score value" });
  act(() => mocks.keyHandler?.({ target: slider } as unknown as KeyboardEvent));
  expect(mocks.start).not.toHaveBeenCalled();
});

it("does not start an empty session from Enter", () => {
  renderContent({ cards: [] });
  act(() => mocks.keyHandler?.({ target: document.body } as unknown as KeyboardEvent));
  expect(mocks.start).not.toHaveBeenCalled();
});
```

Close the file with:

```tsx
});
```

- [ ] **Step 2: Run the container spec and verify failure**

Run:

```bash
npx vitest run src/features/study/containers/DeckStartContainer.spec.tsx
```

Expected: FAIL because `DeckStartContent` is not exported, the old template props are still wired, and Enter is unguarded.

- [ ] **Step 3: Implement container wiring and the shortcut guard**

Change the React import to a value import, export `DeckStartContent`, and add:

```tsx
const hasInteractiveShortcutTarget = (target: EventTarget | null): boolean =>
  target instanceof Element && target.closest("a[href], button, input, select, textarea") != null;

const startFromEnter = React.useCallback(
  (event: KeyboardEvent) => {
    if (cards.length === 0 || hasInteractiveShortcutTarget(event.target)) return;
    studyActions.start();
  },
  [cards.length, studyActions]
);

useKey("Enter", startFromEnter);
```

Replace the old template props with:

```tsx
deckName={deck.name}
maxNumberOfCardsToLearn={config.maxNumberOfCardsToLearn}
cardsLength={cards.length}
```

Keep the Header callbacks, `DeckStartForm`, `RemoteReadBoundary`, filter auto-save, and Start callback unchanged.

- [ ] **Step 4: Run related tests and commit**

Run:

```bash
npx vitest run src/features/study/containers/DeckStartContainer.spec.tsx src/features/study/hooks/useStudyActions.spec.tsx src/features/deck/hooks/useDeckFilterState.spec.tsx
```

Expected: all tests PASS.

Commit:

```bash
git add src/features/study/containers/DeckStartContainer.tsx src/features/study/containers/DeckStartContainer.spec.tsx
git commit -m "Guard study start keyboard navigation"
```

---

### Task 4: Enforce the visual contract and verify the feature

**Files:**
- Modify: `src/lib/calmFocusVisualContract.spec.ts`

**Interfaces:**
- Consumes: the completed template and filter source files.
- Produces: source-level enforcement that the study start route uses readable width and semantic Calm Focus surfaces without raw palette utilities.

- [ ] **Step 1: Add a failing visual-contract assertion**

Add `features/study/components/templates/DeckStartTemplate.tsx` to `ownedPresentationFiles`, then add:

```tsx
it("gives the study start route a focused semantic setup surface", () => {
  const startTemplate = readOwnedSource("features/study/components/templates/DeckStartTemplate.tsx");
  const startForm = readOwnedSource("features/deck/components/DeckStartForm.tsx");
  const tagFilter = readOwnedSource("features/deck/components/TagFilter.tsx");

  expect(startTemplate).toMatch(/max-w-reading/);
  expect(startTemplate).toMatch(/text-display/);
  expect(startTemplate).toMatch(/bg-surface/);
  expect(startForm).toMatch(/<section/);
  expect(tagFilter).toMatch(/<section/);
});
```

- [ ] **Step 2: Run the visual contract and fix only contract-driven omissions**

Run:

```bash
npx vitest run src/lib/calmFocusVisualContract.spec.ts
```

Expected before any necessary source adjustment: FAIL if the new template is absent from ownership or a required semantic utility is missing. Add only the missing semantic class or ownership entry, then rerun until PASS.

- [ ] **Step 3: Run targeted feature verification**

```bash
npx vitest run src/features/study/components/templates/DeckStartTemplate.spec.tsx src/features/study/containers/DeckStartContainer.spec.tsx src/features/deck/components/DeckStartForm.spec.tsx src/features/deck/components/TagFilter.spec.tsx src/features/deck/hooks/useDeckFilterState.spec.tsx src/lib/calmFocusVisualContract.spec.ts
```

Expected: all listed files PASS.

- [ ] **Step 4: Build Storybook**

```bash
npm run build:storybook
```

Expected: Storybook completes successfully with no TypeScript or story-index errors.

- [ ] **Step 5: Run repository-required checks**

```bash
make check
```

Expected: sample build, format check, lint check, and unit tests all PASS. If Docker access is sandbox-blocked, rerun the same command with the required escalation; do not replace it with a narrower command.

- [ ] **Step 6: Review the final diff and commit**

Run:

```bash
git diff --check
git status --short
git diff origin/main...HEAD --stat
git diff origin/main...HEAD
```

Confirm that only the design, plan, study-start presentation, relevant tests/stories, container wiring, and visual contract changed.

Commit the final contract update:

```bash
git add src/lib/calmFocusVisualContract.spec.ts
git commit -m "Enforce the study start visual contract"
```

Then perform a final clean-status and commit-history check before pushing.

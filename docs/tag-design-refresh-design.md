# Tag Design Refresh

## Status

Approved on 2026-07-18.

## Context

Tango currently presents tags in three contexts:

- selectable tags in filters and card forms;
- read-only metadata in card rows;
- active-filter summaries above the card list.

These contexts use similar rounded labels but duplicate their visual rules and do not communicate their different interaction semantics consistently. Active-filter summaries are also read-only, so removing a tag requires reopening the filter panel.

## Goals

- Establish one visual language for every tag context.
- Make selectable, read-only, and removable tags distinguishable without relying on color alone.
- Keep large tag collections compact and usable on narrow screens.
- Let users remove an active tag filter without reopening the filter panel.
- Preserve the existing deck filter state and persistence flow.

## Non-goals

- Assigning a unique color to each tag.
- Adding tag creation, deletion, renaming, search, or sorting.
- Changing tag values or Firestore data structures.
- Making card metadata tags interactive.
- Redesigning score filters or other form controls.

## Visual Direction

Use the approved **Structured Marker** direction:

- a small control-radius label rather than a fully rounded pill;
- a leading circular marker on every tag;
- a neutral marker, border, surface, and text treatment in the default state;
- an accent marker, border, and subtle tinted surface in the selected state;
- a trailing `×` only for removable active-filter tags;
- compact dimensions for read-only metadata and full shared touch targets for interactive tags.

The marker, border, surface, and removal icon distinguish state and behavior without relying on color alone. The same semantic tokens must support light and dark modes.

## Components

### Selectable Tag

The existing form `Tag` remains a native checkbox wrapped by a label. It keeps its current value, handler, ref, disabled-state, and focus behavior. Its presentation adopts the Structured Marker styling. Interactive tags retain the shared minimum touch target.

### Read-only Tag

Introduce a feature-independent content component for tag metadata. It renders non-interactive text with the shared marker styling and a compact size. Card rows use this component instead of local tag markup.

### Removable Tag

Introduce a feature-independent button component for active filters. It uses the shared tag styling plus a trailing `×`, sets `type="button"`, and exposes an accessible name such as `Remove TypeScript filter`. The entire tag is the activation target.

The three components share a small styling helper or equivalent centralized class definition. Their DOM semantics stay explicit instead of using one polymorphic component that changes element type implicitly.

### Tag List

`TagList` uses the approved **Dense Wrap** layout:

- tags wrap naturally with a consistent small gap;
- large collections retain wrapping while adding a maximum height and vertical scrolling;
- the layout never switches to a one-column stack merely because it contains many items;
- horizontal overflow remains prevented.

## Screen Behavior

### Filters and Card Forms

Selectable tags display neutral markers by default and accent markers when checked. Existing All, Clear, and AND/OR controls retain their behavior.

### Card Rows

Card tags remain read-only and visually compact. They must not appear focusable or clickable. Overflow remains constrained so tags cannot widen the card list beyond the viewport.

### Active Filter Summary

Each selected tag renders as a removable tag button. Activating it removes only that tag. The card-list container derives the next selected-tag array and sends it through the existing `onClickTag` callback from `useDeckFilterState`.

## Data Flow

1. The user activates an active-filter tag button.
2. The card-list container removes that value from the current selected-tag array.
3. The container invokes the existing tag-filter callback with the next array.
4. `useDeckFilterState` updates the form value.
5. The existing form subscription submits the updated deck through `useDeckActions`.
6. Existing remote state synchronization refreshes the filtered card list.

No new persistence API or client state store is introduced.

## Error Handling

Tag removal uses the existing deck update path. Pending and failed remote updates continue to use the existing remote mutation feedback. The tag components do not introduce a separate error state or retry mechanism.

## Accessibility

- Selectable tags retain native checkbox semantics.
- Removable tags use native button semantics and specific accessible names.
- Read-only tags are not placed in the tab order.
- Selected state is conveyed by marker, border, and surface changes, not color alone.
- Interactive tags retain the shared minimum touch target and visible focus treatment.
- Disabled selectable tags retain a non-color opacity and cursor cue.
- Long visible labels may truncate only when required by the container; the complete label remains available to assistive technology through the accessible name.
- The tag list remains usable at narrow Storybook viewports and in both color schemes.

## Verification

Automated tests cover:

- selectable tag default, checked, disabled, focus, native value, handler, and ref behavior;
- read-only tag semantics and compact presentation;
- removable tag button semantics, accessible name, and callback;
- removal of one selected filter through the card-list container data flow;
- wrapped layout and vertical overflow for large tag collections;
- viewport containment for long unbroken tag names;
- shared light and dark visual contracts and Storybook examples.

Before completion, run `make check` as required by the repository.

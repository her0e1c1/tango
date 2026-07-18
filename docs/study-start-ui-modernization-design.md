# Study Start UI Modernization Design

## Background

The study start screen currently shows a generic `Filter Cards` heading, a long sentence inside the primary button, and two visually similar filter cards. It does not identify the selected deck, distinguish the capped session size from the number of matching cards, or explain why the start action is unavailable when no cards match.

The Settings and Deck settings pages already use the Calm Focus design tokens, clear page context, readable-width content, semantic sections, and a single dominant action. The study start screen should follow the same direction without changing how filters or study sessions work.

## Goals

- Make the deck and upcoming session understandable before the user changes a filter.
- Give the Start action clear visual priority.
- Distinguish the session size from the total number of cards matching the filters.
- Make score and tag controls easier to scan and operate on mobile and desktop.
- Improve labels, status messaging, keyboard behavior, and touch targets.
- Preserve filter auto-save, shuffle, maximum-card handling, dark mode, and study navigation.

## Non-goals

- Do not add filters, presets, reset actions, or new settings.
- Do not change Deck, Card, Config, Firestore, or Zustand data models.
- Do not change score filtering, tag filtering, shuffling, or session ordering.
- Do not redesign the global header or the study swiper.
- Do not add a new persistence or loading flow.

## Considered approaches

### A. Focused single column (selected)

Show deck context and a session summary first, followed by score and tag sections. This keeps one reading order at every viewport size, gives the Start action clear priority, and aligns with the recently modernized settings surfaces.

### B. Summary and filters split view

Keep the session summary in a left column and filters in a right column on desktop. This makes live count changes easy to observe on wide screens, but collapses back to the selected design on mobile and adds unnecessary breakpoint complexity.

### C. Compact settings sheet

Place the summary and every filter row inside one dense card with a bottom action bar. This shortens the page for small tag sets, but becomes cramped when tag names or tag counts grow.

## Selected page structure

Use one centered `max-w-reading` column inside the existing `Layout`.

1. A page header shows the `Study setup` eyebrow, the deck name as the `h1`, and a short explanation.
2. A session summary surface shows the capped session size, the matching-card count, and the primary Start action.
3. A Score range section shows maximum and minimum controls with their current values.
4. A Tags section shows the match mode, All and Clear actions, and the selectable tags.

The summary language distinguishes the two relevant counts:

- `24 cards in this session` uses all matching cards when `maxNumberOfCardsToLearn <= 0`; otherwise it is `min(cardsLength, maxNumberOfCardsToLearn)`.
- `123 cards match your filters` is the current filtered `cardsLength`.

Use correct singular labels for one card. When no cards match, show `No cards match your filters`, disable the visible Start button, and prevent the Enter shortcut from starting an empty session.

## Visual and responsive treatment

- Use only existing Calm Focus semantic colors, typography, spacing, radius, shadow, focus, and motion tokens.
- Keep the page header unboxed so it establishes context before the interactive surfaces.
- Use `rounded-surface`, `border-border`, `bg-surface`, and `shadow-surface` for the summary and filter sections.
- Make Start the only primary action. Treat All and Clear as quiet secondary actions.
- Show current score values in muted value badges beside their sliders.
- Keep the same single-column reading order on desktop and mobile.
- Let the summary content wrap on small screens and make the Start button full-width when needed.
- Keep tag content within its section, break long unspaced names only in `TagFilter`, and preserve the existing many-tag scrolling behavior.
- Support long deck names and tag names without horizontal page scrolling.
- Preserve light mode, dark mode, visible focus rings, and reduced-motion behavior.

## Component boundaries

### `DeckStartTemplate`

Owns page-level presentation: deck context, session summary, count wording, zero-match message, Start button, filter slot, and readable-width layout. Add a required `deckName` prop and replace the broad `config: ConfigState` prop with a required `maxNumberOfCardsToLearn: number` prop.

The template remains presentation-only. It does not query collections, update filters, build a study session, or navigate.

### `DeckStartForm`

Owns the Score range presentation and places `TagFilter` after it. Replace the generic section divider with a semantic `section` and heading. Associate the maximum and minimum switches and sliders with visible labels, descriptions, and current values.

The component continues to receive the same score and tag field bindings. It does not own form state or persistence.

### `TagFilter`

Owns the Tags section presentation, match-mode switch, All and Clear buttons, and selectable tag list. Give the section and match-mode control explicit accessible names, and opt its tags into the existing `Tag` component's wrapping mode. Preserve the current callback API and compact tags elsewhere.

### `DeckStartContainer`

Passes `deck.name` to `DeckStartTemplate` and continues to provide the current filtered-card count, Config, filter bindings, and Start action. Guard the Enter shortcut with the same non-empty condition as the visible Start button, and pass explicit `useKey` dependencies so rerenders use the current count and Start action.

No new shared component is introduced. The patterns remain local until another screen demonstrates the same need.

## Data flow

1. `DeckStartContainer` reads the current Deck, filtered Cards, Tags, and Config through existing hooks.
2. `useDeckFilterState` initializes score and tag fields from the Deck.
3. Changing a filter continues to auto-submit the Deck through `useDeckActions.update`.
4. `useRemoteCollections.filteredCardsByDeckId` recalculates the matching Cards.
5. The template derives the displayed session size from the matching count and Config maximum.
6. Start continues to call `useStudyActions.start`, which builds the study session, writes the Zustand study state, and navigates to `/deck/:id/study` with history replacement.

The displayed counts and the started session therefore use the same filtered Card source.

## Loading, empty, and error behavior

- Keep `RemoteReadBoundary` authoritative for loading, retry, and Deck-not-found states.
- Keep existing filter auto-save behavior and mutation ownership unchanged.
- Do not introduce a second loading overlay while filtered counts update.
- Announce changing count text with a polite live region.
- Show an inline zero-match explanation instead of introducing a modal or toast.
- Do not start or navigate when the matching-card count is zero, whether the user clicks or presses Enter.

## Accessibility

- Render one page-level `h1` containing the deck name.
- Give Score range and Tags semantic `section` elements with associated `h2` headings.
- Connect score switches, sliders, descriptions, and current values with stable IDs and ARIA attributes.
- Give sliders meaningful names and `aria-valuetext` values.
- Give the tag match-mode switch an explicit accessible name and explanatory text.
- Keep native checkbox inputs visually hidden with `sr-only`, not `display: none`, and show the existing `ring-focus` token on their visible peers.
- Preserve native button, checkbox, and range-input keyboard behavior, including Space activation.
- Keep interactive targets at least the existing `touch` token size.
- Do not rely on color alone for selection, disabled state, match mode, or card counts.
- Prevent the global Enter shortcut from firing while focus is on an interactive form control, so switches and buttons keep their native keyboard behavior.

## Testing strategy

### Template tests

- Render the deck name and one page heading.
- Distinguish capped session size from matching-card count.
- Treat a non-positive maximum as unlimited.
- Use singular and plural card wording correctly.
- Disable Start and explain the zero-match state.
- Preserve the Start callback and filter slot.

### Filter component tests

- Render Score range and Tags as semantic labelled sections.
- Expose maximum and minimum controls by accessible names.
- Preserve score values, enabled state, slider bounds, and callbacks.
- Preserve tag match mode, All, Clear, and individual tag callbacks.
- Keep long and many-tag content structurally contained.

### Container and shortcut tests

- Pass the Deck name and filtered-card count to the template.
- Start on Enter when cards match and focus is not inside a form control.
- Do not start on Enter when no cards match or an interactive control is focused.
- Cover non-empty-to-empty and empty-to-non-empty rerenders with the real `react-use` listener and the current Start action.

### Stories and verification

- Update Default, Long, and mobile stories for the new page context.
- Add zero-match and dark-mode stories.
- Run targeted study-start tests while implementing.
- Run the unit suite and Storybook build.
- Run `make check` before completion.

## Completion criteria

- The screen identifies the selected Deck and gives Start clear priority.
- Session size and matching-card count remain accurate after every filter change.
- Existing filter state, auto-save, session construction, and navigation remain intact.
- Empty sessions cannot start through either pointer or keyboard input.
- Score and tag controls have explicit accessible names and maintain 44px touch targets.
- Long content, mobile layouts, light mode, and dark mode remain usable without horizontal page scrolling.
- Relevant tests, Storybook build, and `make check` pass.

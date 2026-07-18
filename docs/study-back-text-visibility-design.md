# Study Back Text Visibility Design

## Goal

Make the study card's back text visually readable after it is revealed while preserving the existing swipe controls and centered-overlay backdrop behavior.

## Root Cause

The study back view renders four shared `Overlay` instances for the left, right, top, and bottom swipe actions. Every `Overlay` currently adds a fixed, full-viewport, 70% canvas-colored pseudo-element. The four pseudo-elements stack above the back text, repeatedly tinting the page until the text is effectively invisible even though it remains present and visible in the DOM.

## Selected Direction

Apply the backdrop classes only when `Overlay` uses the `center` position. Center overlays represent modal reading surfaces and retain the dimmed backdrop. Edge overlays represent swipe targets, so they keep their position, size, surface, focus, and click behavior without adding a viewport-wide backdrop.

The alternatives considered were:

- Override the backdrop only in the study template. This would limit the immediate change, but it would preserve an unsafe default for every non-center `Overlay` consumer.
- Replace the study swipe overlays with a new component. This would make the distinction explicit, but it would duplicate existing positioning and interaction behavior for a one-class behavioral difference.

## Components and Responsibilities

### `Overlay`

- Continues to own shared positioning, surface, focus, accessibility, and click interaction.
- Adds the fixed pseudo-element backdrop only for `position="center"`.
- Keeps all existing edge dimensions and inset classes unchanged.

### `DeckSwiperTemplate`

- Continues to compose four edge overlays around the revealed back text.
- Requires no API or markup change because edge-overlay semantics are corrected in the shared component.

## Interaction and Data Flow

Clicking the study front text continues to toggle `showBackText` in the study store. When the back view renders, its four swipe targets remain interactive and the back text remains beneath them in the existing layout. Removing the edge backdrops changes only visual stacking; it does not change study state, swipe actions, card data, routing, or remote writes.

## Error Handling

No new runtime error path is introduced. Existing remote-read and mutation feedback remains unchanged. The correction is limited to conditional class composition in `Overlay`.

## Testing

Extend `Overlay.spec.tsx` so each edge position verifies that it does not receive the full-screen backdrop class, while the existing center-overlay assertion continues to verify that the backdrop remains present. Run the focused test before and after the implementation to demonstrate the regression and fix, then run `make check`.

Use the study page in a browser to confirm that revealed back text is visually readable and that all four swipe controls remain available.

## Out of Scope

- Changes to back-text content or syntax highlighting.
- Changes to swipe behavior, dimensions, or keyboard controls.
- New overlay props or new study-specific components.
- Firestore, persistence, routing, or card schema changes.

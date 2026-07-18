# Deck Actions Menu Fix

## Problem

The Deck list action menu closes from its `fieldset` blur handler whenever `FocusEvent.relatedTarget` is `null`. Browsers can report a null related target while pointer focus changes inside the menu. The menu is then unmounted before the pending click reaches Download, Edit, or Delete, so those actions do nothing.

## Design

Keep the existing menu structure and interaction model. Defer the blur decision until the browser has updated `document.activeElement`, then close only when focus is outside the menu root. This preserves outside-focus dismissal while allowing menu item clicks to finish when `relatedTarget` is unavailable.

The change is limited to `DeckActionsMenu`; Deck list callbacks and mutation behavior remain unchanged.

## Testing

Add a regression test that opens the menu, simulates a blur with no related target while focus moves to each management item, and verifies Download, Edit, and Delete still invoke their callbacks. Preserve the existing keyboard navigation and Escape assertions. Run the focused tests and `make check` before publishing the PR.

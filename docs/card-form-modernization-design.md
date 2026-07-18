# Card Form Modernization Design

## Goal

Modernize the card editing page so that editing the front and back feels focused, readable, and consistent with Tango's Calm Focus visual system. Preserve the existing card data model and save behavior.

## Scope

This change updates the presentation and interaction structure of the existing card editor. It does not add preview behavior, change Firestore data, or alter card mutation semantics.

## Selected Direction

Use a focused single-column layout. This direction keeps long card text readable, behaves consistently across desktop and mobile, and fits the existing bounded reading-width layout.

The alternatives considered were:

- A two-column front/back layout, which makes comparison easier but narrows long-form text fields and changes substantially with viewport width.
- An editor-plus-preview layout, which adds useful visual feedback but requires new display behavior and expands the feature scope.

## Page Structure

The page uses the existing application header and a centered `max-w-reading` editing surface.

The editing surface contains, in order:

1. A `Back to cards` action that returns to the previous browser history entry.
2. A `Card editor` eyebrow, `Edit card` heading, and short supporting description.
3. Remote mutation feedback.
4. A Front section with a short explanation and a large textarea.
5. A Back section with a short explanation and a large textarea.
6. A Tags section containing the existing selectable tags.
7. A collapsed `Card information` disclosure containing the unique key, ID, creation date, and last-seen date.
8. A footer action row with `Cancel` and `Save changes` aligned to the end.

All interface copy remains in English to match the application. The layout remains a single column at every viewport size.

## Components and Responsibilities

### `CardFormContainer`

- Continues to load the card and own mutation state.
- Continues to navigate to the previous history entry after a successful save.
- Provides the same previous-history navigation as the cancel action.
- Preserves the current mutation error handling and retry notice.

### `CardFormTemplate`

- Owns page-level presentation: the bounded editing surface, back action, eyebrow, heading, and supporting description.
- Passes editing behavior to `CardForm` without taking ownership of form state.

### `CardForm`

- Owns the semantic form structure for Front, Back, Tags, Card information, and footer actions.
- Exposes an optional `onCancel` callback.
- Uses the shared `Button`, `Form`, `FormItem`, `Tag`, `TagList`, and `Textarea` primitives.
- Keeps unique section-heading relationships for accessibility.

No new general-purpose shared component is required. The change follows the existing `DeckForm` and `DeckFormTemplate` presentation patterns without coupling the two features.

## Interaction and Data Flow

Field changes continue through `useCardFormState`. Submitting the form passes the updated card to `useCardMutations`, and a successful mutation returns to the previous history entry. Mutation failures remain on the page and are communicated by `RemoteMutationNotice`, which retains its retry behavior.

Cancel and `Back to cards` both navigate to the previous browser history entry without submitting. No unsaved-changes confirmation is added.

While a mutation is pending, the primary action is disabled and reads `Saving…`. When idle, it reads `Save changes`.

## Metadata Presentation

Card metadata is secondary to editing, so it is placed inside a collapsed disclosure. Labels use title case: `Unique key`, `ID`, `Created`, and `Last seen`. Unique key and ID rows are always shown; an absent unique key renders as an empty value. Created and Last seen rows are shown only when their timestamps exist, and their dates use the user's locale.

## Accessibility

- Front, Back, and Tags remain semantic sections associated with unique heading IDs.
- The metadata disclosure uses native `details` and `summary` behavior.
- Back, Cancel, and Save remain keyboard-accessible controls with visible focus treatment from the shared visual system.
- Existing field names, values, and callbacks remain intact.
- Touch targets continue to use the shared minimum touch size.

## Error Handling

- Remote read loading, missing-card, and retry states remain owned by `RemoteReadBoundary`.
- Mutation errors remain owned by `RemoteMutationNotice`.
- Cancel does not trigger a mutation.
- Save navigation occurs only after a successful mutation.

## Testing

Update component and container tests to verify:

- The new headings, descriptions, sections, and collapsed card information disclosure.
- Existing field values and change callbacks.
- Unique accessible heading relationships across multiple form instances.
- The `Cancel` callback and form submission remain distinct.
- `Save changes` is enabled while idle and `Saving…` is disabled while submitting.
- The template renders its back action and composes mutation feedback before the form.
- The container supplies previous-history navigation for cancel while preserving successful-save navigation and failure behavior.

Run the focused Vitest tests during implementation and `make check` before finishing the non-documentation change.

## Out of Scope

- Live or rendered card preview.
- Autosave or unsaved-change prompts.
- Changes to tag options or card fields.
- Firestore schema, mutation, or routing changes.
- New visual tokens or global styling changes.

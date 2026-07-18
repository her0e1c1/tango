# Zod Form Validation Design

## Background

Deck and Card editing currently pass React Hook Form values directly to their mutation hooks. TypeScript describes the expected values, but it does not validate browser input at runtime. Empty required text and malformed Deck source URLs can therefore reach remote writes, and the forms do not display field-level errors.

PR #322 already introduces Zod for persisted application configuration. The same dependency should validate Deck and Card edit forms without expanding this change into Firestore document or CSV validation.

## Goals

- Validate Deck and Card edit values before calling mutations.
- Require a non-blank Deck name.
- Accept an empty Deck source URL or a valid absolute URL.
- Require non-blank Card front and back text without trimming valid content.
- Display validation messages directly below the relevant fields.
- Mark invalid controls with `aria-invalid`.
- Preserve existing entity metadata, mutation behavior, retry feedback, and navigation.

## Non-goals

- Do not validate Firestore documents, CSV imports, Deck study filters, or persisted study state.
- Do not change Deck, Card, or storage data models.
- Do not change mutation retry or remote error handling.
- Do not redesign the forms or add validation to fields that are not editable on these screens.

## Considered approaches

### A. React Hook Form Zod resolver (selected)

Connect feature-owned Zod schemas to React Hook Form through `@hookform/resolvers/zod`. React Hook Form blocks invalid submissions and exposes field errors through its existing `formState`. This keeps validation, error display, and submission behavior in the form boundary.

### B. Manual parsing in submit handlers

Call `safeParse` inside each `handleSubmit` callback and translate Zod issues into React Hook Form errors. This avoids another dependency, but duplicates error mapping and bypasses the resolver integration designed for this use case.

### C. Mutation-boundary validation

Parse Deck and Card updates in their mutation hooks. This protects non-form callers, but it reports errors as remote mutation failures rather than actionable field feedback and broadens the issue beyond editing screens.

## Component boundaries

### Deck form schema

Create a schema under `src/features/deck/lib` for the editable Deck fields: `name`, `category`, `url`, and `convertToBr`. The name schema trims surrounding whitespace and requires at least one character. The URL schema accepts `undefined`, an empty string, or a valid absolute URL.

Infer the form-value type from the schema. `DeckFormContainer` initializes only these editable values, connects the schema with `zodResolver`, and merges validated values into the original Deck before calling `updateAndGoToList`. Metadata that is not rendered as an input cannot be removed or rewritten by form parsing.

### Card form schema

Create a schema under `src/features/card/lib` for `frontText`, `backText`, and `tags`. Front and back text must each contain at least one non-whitespace character, but the schema preserves the submitted text so Markdown, code indentation, and intentional surrounding whitespace are not transformed. Tags remain an array of strings.

Infer the form-value type from the schema. `useCardFormState` initializes only editable values, connects the resolver, and merges validated values into the original Card before invoking its submit callback.

### Error presentation

Extend Deck and Card form props with optional field-error messages. Their presentation components pass each message to the existing `FormItem.error` surface. Extend shared `Input` and `Textarea` props to forward `aria-invalid`, and set it only for fields with validation errors.

The forms continue to use the existing mutation notice for remote failures. Validation errors remain local and do not set mutation error state.

## Data flow

1. The container or hook selects editable defaults from the current entity.
2. React Hook Form collects browser values and runs the Zod resolver on submit.
3. Invalid values populate `formState.errors`; React Hook Form does not call the valid-submit callback.
4. Presentation components show messages below the matching fields and mark controls invalid.
5. Valid values are merged into the original Deck or Card.
6. Existing mutation and navigation logic runs unchanged.

## Validation messages

- Blank Deck name: `Deck name is required.`
- Malformed non-empty Deck URL: `Enter a valid URL.`
- Blank Card front text: `Front text is required.`
- Blank Card back text: `Back text is required.`

## Testing strategy

- Add Deck container tests proving that a blank name and malformed URL show the expected messages and do not call `updateAndGoToList`.
- Add Card container tests proving that blank front and back text show the expected messages and do not call the Card mutation or navigate.
- Preserve the existing valid-submit tests to prove that entity metadata is retained when editable values are merged.
- Add focused shared-control coverage for forwarding `aria-invalid` if existing component tests do not already exercise it.
- Run the focused Deck/Card tests during the red-green cycle.
- Run `make check` before committing the implementation.

## Completion criteria

- Deck and Card edit forms use Zod through the React Hook Form resolver.
- Invalid values display the specified field messages and never reach mutation hooks.
- Valid edits retain all non-editable entity fields.
- Existing remote error and navigation behavior remains unchanged.
- `make check` passes.

# Remove `renameKey` Design

## Goal

Remove the adapter that renames React Hook Form's `ref` property to `inputRef`, while preserving all form behavior and making the shared form component API follow React 19 conventions.

## Current State

`renameKey` converts the object returned by React Hook Form's `register` function from `{ ref, name, onChange, onBlur }` to `{ inputRef, name, onChange, onBlur }`. This conversion exists only because the shared `Input`, `Textarea`, `Select`, `Switch`, `Slider`, and `Tag` components expose the non-standard `inputRef` prop.

The application uses React 19, which allows function components to receive `ref` as a prop. The conversion layer is therefore unnecessary.

## Design

Change the six shared form components to accept a correctly typed `ref` prop and pass it to their underlying DOM form element. Consumers can then pass the result of `register(...)` directly to these components through their existing field-prop objects.

Update form state builders and the deck form container to remove every `renameKey(...)` call. Registration options such as `valueAsNumber` remain unchanged. Additional props such as slider limits, select options, and tag values continue to be merged alongside the registration object.

Delete `src/shared/forms/renameKey.ts` after all imports and calls have been removed.

## Compatibility

This is an internal API cleanup. Repository consumers of the shared form components will use `ref` instead of `inputRef`. Runtime behavior, field names, event handlers, validation, default values, and submission behavior must not change.

## Testing

Update shared form component tests to pass refs through the standard `ref` prop and verify that each ref still points to the underlying DOM element. Existing form and hook tests cover registration, editing, submission, and numeric conversion behavior.

Run focused form tests during implementation, then run `make check` before completion.

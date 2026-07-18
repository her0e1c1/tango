# Deck Form UI Modernization Design

## Background

The current deck edit page places every control inside one undifferentiated surface. The unavailable Public switch remains visible, metadata has the same visual weight as editable settings, and the page offers only a Save action. Users who need to manage detailed settings must infer how basic information, import configuration, formatting, and read-only information relate to each other.

The redesign should make all available settings easy to understand without adding navigation overhead. The deck form currently has only four editable settings, so a tabbed settings page or step-by-step wizard would add more interaction than the task requires.

## Goals

- Organize available settings into clear, task-oriented sections.
- Make the page feel consistent with the current Calm Focus design tokens and the redesigned deck list.
- Provide explicit Save and Cancel actions with predictable navigation.
- Keep entered values visible and retryable when a remote update fails.
- Preserve responsive behavior, dark mode, keyboard access, and semantic form structure.

## Non-goals

- Do not enable deck publishing.
- Do not add new validation or business rules.
- Do not change deck persistence, Firestore data, or category values.
- Do not redesign the global header or other deck pages.
- Do not introduce tabs, a sidebar, or a multi-step editing flow.

## Adopted UI

### Page structure

Use one centered settings surface with a readable maximum width. The page header contains a settings label, the current deck name, and a back-to-list action. The form is divided into three sections:

1. **Basic information** contains Name and Category.
2. **Import & formatting** contains Source URL and Convert line breaks.
3. **Deck information** contains ID, Created, and Updated in a collapsed native `details` element.

The unavailable Public setting is omitted. The layout stays single-column on mobile and desktop so labels, descriptions, and controls remain easy to scan. Borders, muted surfaces, radii, focus rings, and colors use existing Calm Focus tokens.

### Actions

Place Cancel and Save changes together after the settings sections.

- Save changes submits the form. While submitting, it is disabled and its label changes to Saving….
- After a successful update, navigate explicitly to `/` with history replacement.
- Cancel discards local edits without confirmation and navigates to `/` with history replacement.
- The page-level back action has the same behavior as Cancel.

Replacing history prevents the browser Back action from reopening the edit page after the user has saved or cancelled.

### Responsive and theme behavior

- Keep the form within the existing reading-width container.
- Use compact padding on mobile and larger padding from the medium breakpoint.
- Keep all action targets at least the existing `touch` token size.
- Use only existing semantic colors so both light and dark themes retain sufficient contrast.
- Long deck names, URLs, and IDs must wrap or truncate without forcing horizontal scrolling.

## Component boundaries

### `DeckFormTemplate`

Owns the page-level presentation: settings label, deck name, back action, feedback slot, and bounded settings surface. It receives callbacks and content through props and does not perform mutations or navigation itself.

### `DeckForm`

Owns the semantic form, setting sections, fields, collapsed deck information, Save changes button, and Cancel button. It receives field bindings, submission state, and callbacks. Remove `isPublic` from `DeckFormFields` because the unavailable setting is no longer rendered.

Use a small internal section treatment rather than introducing a general-purpose shared component. The pattern is local to this form and does not yet justify a new public abstraction.

### `DeckFormContainer`

Owns the `react-hook-form` instance, category options, mutation state, and navigation callbacks. It continues to initialize the form from the remote Deck. It passes only the four visible field bindings to `DeckForm`.

### `useDeckActions`

Owns the update mutation and success navigation. Replace the history-relative update action with an explicitly named update-and-go-to-list action that navigates to `/` with `{ replace: true }` only after the mutation succeeds. Mutation failures remain caught so `RemoteMutationNotice` can present the existing retry flow.

## Data flow

1. `DeckFormContainer` reads the deck from the remote collection.
2. `react-hook-form` initializes Name, Category, URL, and Convert line breaks from the deck.
3. `DeckFormTemplate` renders page context and `DeckForm` renders the editable controls.
4. Submit passes the complete Deck-shaped form data to the update action.
5. A successful mutation navigates to `/` with history replacement.
6. A failed mutation leaves the form mounted with its current values and exposes Retry through `RemoteMutationNotice`.
7. Cancel or the page back action skips mutation and navigates directly to `/` with history replacement.

## Loading and error states

- Keep `RemoteReadBoundary` for loading, retry, and Deck not found states.
- Keep `RemoteMutationNotice` above the form for pending and error announcements.
- Disable Save changes during form submission and show Saving… in the button.
- Do not navigate after a failed mutation.
- Keep the Retry action owned by the mutation notice.
- Do not add field-level errors until concrete validation rules exist.

## Accessibility

- Preserve one page-level `h1` and use `h2` elements for the two editable setting sections.
- Connect each section to its heading with unique `aria-labelledby` values.
- Use native `details` and `summary` for collapsible Deck information.
- Keep all navigation actions as buttons with clear accessible names.
- Preserve visible focus rings and minimum touch target sizes through existing design tokens.
- Announce saving and mutation failures through the existing status and alert semantics.
- Convey labels and descriptions in text rather than by color or icon alone.

## Testing strategy

### Presentation tests

- Render Basic information, Import & formatting, and collapsed Deck information.
- Preserve all visible field values and callbacks.
- Verify the Public setting is absent.
- Verify metadata appears when available and remains associated with its summary.
- Verify Save changes submits when idle, changes to Saving… and disables while submitting.
- Verify Cancel and the page back action call the correct callback.
- Verify unique section heading relationships across multiple form instances.

### Container and action tests

- Pass only Name, Category, URL, and Convert line breaks bindings to the form.
- Submit the edited Deck to the mutation action.
- Navigate to `/` with `{ replace: true }` only after a successful update.
- Keep the page mounted and expose retry state after an update failure.
- Navigate to `/` without mutation when cancelling.

### Stories and visual coverage

- Maintain Default, Long values, Submitting, Dark, and mobile stories.
- Ensure long names, URLs, and IDs do not overflow.
- Review action hierarchy, collapsed information, light/dark contrast, and mobile spacing.

Run `make check` before completion.

# Calm Focus Utility Routes Design

## Goal

Unify Deck and Card editing, CSV Import, and Settings under the existing Calm Focus form and content hierarchy without changing validation, persistence, authentication, synchronization, or route behavior.

## Approach

Apply the existing shared `Form`, `FormItem`, `Section`, content, control, and semantic color primitives directly in each utility-route component. Keep the current component boundaries and presentation props so containers continue to own state and handlers. Avoid a utility-route wrapper or additional shared API unless an existing primitive cannot express the approved layout.

## Component Design

### Deck and Card editing

- Give each template a clear page title and a bounded reading-width surface.
- Group editable fields, disabled availability controls, and metadata into consistent sections.
- Keep existing values, callbacks, submit behavior, submitting state, and the absence of a cancel action.
- Make Public and Local Mode controls visibly unavailable through their disabled control shape and explanatory text.

### CSV Import

- Present upload, format guidance, sample download, and code sample as one shared content/form hierarchy.
- Keep upload and sample-download callbacks unchanged.
- Keep preview, validation, result, and workflow-step changes out of scope.

### Settings

- Group account, layout, study, autoplay, and metadata controls into distinct semantic sections.
- Keep login/logout, switches, sliders, token input, persisted values, and auto-save wiring unchanged.
- Do not add explicit save, synchronization state, or authentication lifecycle behavior.

## Responsive and Visual Behavior

- Use a bounded desktop measure and a single-column mobile flow.
- Allow labels, help text, metadata, and code samples to wrap or scroll without colliding with fixed or sticky application elements.
- Use only Calm Focus semantic color utilities and shared surface, spacing, radius, typography, and control contracts.
- Extend stories with light/dark, desktop/mobile, long-content, disabled, and route-specific state fixtures.

## Data Flow and Error Handling

Containers remain responsible for all state, persistence, authentication, navigation, and error reporting. Presentation components receive the same values and callbacks they do today. Existing feedback slots remain in place, and this change introduces no new error state or side effect.

## Testing

Follow test-driven development for each surface:

1. Extend `calmFocusVisualContract.spec.ts` and add focused component/template assertions.
2. Run each focused spec and confirm the intended presentation assertion fails.
3. Apply the smallest presentation change that satisfies the contract.
4. Rerun focused specs with the visual and component architecture contracts.
5. Run Storybook build, `make check`, application build, and end-to-end tests before publishing the PR.

Existing container tests protect handlers, values, auto-save, authentication, and navigation behavior. Component tests protect hierarchy, disabled state, callbacks, metadata, and retained template composition.

## Non-goals

- Import preview, validation, results, or multi-step workflow
- Local/cloud synchronization clarity or lifecycle changes
- Form schema, persistence model, or state ownership changes
- New cancel, save, navigation, or authentication actions

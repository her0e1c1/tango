# Pages Instructions

- Follow FSD v2.1 page-first: keep route-specific and single-consumer presentation, state connections, workflows, and composition in the corresponding Page slice.
- Keep a workflow in the Page when that Page is its only consumer, even when it represents a meaningful user action; move it to Features only after actual cross-Page reuse appears.
- Keep URL routes and exported Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Name the route entry and composition boundary `*Page.tsx`.
- Move reusable cross-Page workflows to Features and reusable domain concepts, rules, or visual representations to Entities. Do not keep lower-layer slices solely to preserve an architectural label when Steiger identifies them as insignificant.
- Organize `ui/` subdirectories by UI meaning, such as `toolbar`, rather than technical categories such as `component` or `container`.
- Do not create `types.ts` files under `src/pages`. Define types in the action, query, store, or UI module that owns them, and export them only when another module needs them.

## Page composition

- Limit Pages and Containers to calling their Page model, composing UI, and passing prepared values and callbacks to components through props.
- Keep route input reading, screen shortcut mappings and registration (`useKey`), application state connections, form submission wiring, and page-specific navigation control in `model/`, reusing Shared guard primitives.
- Obtain application and domain data, constants, and behavior through the Page model. Do not access stores, queries, actions, APIs, or application/domain hooks directly from UI.
- Keep rendering concerns in UI, including JSX, display conditionals, translations, locale-dependent formatting, `Link` / `NavLink`, and guard UI rendering. UI components, types, and presentation helpers may be imported from lower layers through public APIs; do not introduce a Feature solely to detour around these imports.
- Name a Page-internal composition boundary `*Container.tsx`. Add one only when it clarifies UI composition, not to bypass the Page model boundary.
- Keep every other component under `ui/` presentational by default. It receives prepared data through props and reports user intent through callbacks. UI-only local state and presentation-supporting React or library hooks are allowed.

## Page model boundaries

- Keep Page model hooks limited to connecting route inputs, screen shortcuts, stores, state hooks, queries, actions, forms, and navigation. Put derived-data calculations in `model/queries/` and state-changing operations and workflows in `model/actions/`.
- Actions read and update page-owned store state directly. Do not pass snapshots, pending flags, or setters for that store state through Page models or UI.
- Expose ready-to-use callbacks as named Page model properties, not an actions object. UI must not bind form submissions, sequence actions, or provide workflow-completion callbacks. Connect form submission and action-result-based navigation in the Page model.
- Add stores, hooks, and modules only when their responsibilities are needed; do not create them solely to match another Page's structure.

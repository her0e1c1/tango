# Pages Instructions

## Placement

- Follow FSD v2.1 page-first. Keep code in the Page while only that Page uses it.
- Move a workflow to Features only when multiple Pages actually reuse it.
- Move reusable domain concepts, rules, and visual representations to Entities.
- Do not keep lower-layer slices only to preserve an architectural label when Steiger considers them insignificant.
- Keep routes and exported Pages one-to-one: one route renders one dedicated Page, and one Page serves one route.
- Name the route entry component `*Page.tsx`.
- Organize `ui/` by UI meaning, such as `toolbar`, not by technical categories such as `component` or `container`.
- Do not create `types.ts` under `src/pages`. Define each type in the module that owns it, and export it only when another module needs it.

## Page and UI

- A Page or Container may only:
  - call its Page model,
  - compose UI,
  - pass prepared values and callbacks to components through props.
- When a Page needs route parameters, import and call `useParams()` in the Page component under `ui/`, and pass the required parameters to its Page model.
- Keep other route inputs, screen shortcuts and `useKey` registration, application-state connections, form submission wiring, and page-specific navigation in `model/`.
- Reuse Shared guard primitives for navigation guards.
- Read application and domain data, constants, and behavior through the Page model. UI must not access stores, queries, actions, APIs, or application/domain hooks directly.
- Keep rendering concerns in UI. This includes JSX, display conditions, translations, locale-dependent formatting, `Link` / `NavLink`, and guard UI.
- UI may import reusable components, types, and presentation helpers from lower layers through their public APIs. Do not create a Feature only to avoid such imports.
- Name a Page-internal composition boundary `*Container.tsx`. Add one only when it makes UI composition clearer.
- Other components under `ui/` are presentational by default. They receive prepared data through props and report user intent through callbacks.
- UI-only local state and React or library hooks used only for presentation are allowed.

## Page model

- Use the Page model only for wiring route inputs, shortcuts, stores, state hooks, queries, actions, forms, and navigation.
- Do not put business rules, validation, derived-data calculations, state transitions, or async workflow sequencing in the Page model.
- Put derived-data calculations in `model/queries/`.
- Put state-changing operations and workflows in `model/actions/`.
- Actions may read and update Page-owned store state directly. Do not pass that store's snapshots, pending flags, or setters through the Page model or UI.
- Expose ready-to-use callbacks as named Page model properties. Do not expose an actions object.
- UI must not wire form submission, sequence actions, or provide workflow-completion callbacks.
- Connect form submission and navigation based on action results inside the Page model.
- Add stores, hooks, and modules only when they have a real responsibility. Do not add them only to match another Page's structure.

# Entities Instructions

- Treat `src/entities` as the FSD Entities layer and each `src/entities/<entity>` directory as an Entity slice.
- Keep Entity domain code in `model/` and expose the slice through `index.ts`.
- `model/` implementation files are limited to the following roles:
  - `schema.ts`: Zod schemas, validation, refinements, and schema-level defaults.
  - `types.ts`: shared Entity types and interfaces; prefer deriving types from Zod schemas.
  - `defaults.ts`: Entity default values, initial values, and pure default factories.
  - `rules.ts`: pure domain rules, calculations, relationships, selections, and transformations.
  - `store.ts`: global Entity store and synchronous state mutations.
  - `hooks.ts`: thin React hooks for reading or selecting Entity state.
- Colocate tests as `*.spec.ts` or `*.spec.tsx` next to the file they cover.
- Do not create additional implementation files such as `category.ts`, `relations.ts`, `logic.ts`, `utils.ts`, `helpers.ts`, or `constants.ts`; place the code in the appropriate role above.
- Keep domain models, schemas, defaults, rules, and selectors pure. Global Entity stores and thin selector hooks are allowed as explicit exceptions.
- Do not place UI, use cases, external access, subscriptions, or asynchronous workflows in `entities`.
- `index.ts` is the slice Public API and should contain re-exports only.

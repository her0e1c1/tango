# Entities Instructions

- Treat `src/entities` as the FSD Entities layer and each `src/entities/<entity>` directory as an Entity slice.
- Keep Entity domain code in `model/` and expose the slice through `index.ts`.

## `model/schema.ts`

- Define Zod schemas, validation, refinements, and schema-level defaults.
- Keep schema definitions pure.

## `model/types.ts`

- Define shared Entity types and interfaces.
- Prefer deriving types from Zod schemas.

## `model/defaults.ts`

- Define Entity default values, initial values, and pure default factories.
- Keep defaults independent from stores and external systems.

## `model/rules.ts`

- Define pure domain rules, calculations, relationships, selections, and transformations.
- Do not access stores, React, browser APIs, or external systems.

## `model/store.ts`

- Define the global Entity store and synchronous state mutations.
- Do not perform external access, subscriptions, or asynchronous workflows.

## `model/hooks.ts`

- Define thin React hooks for reading or selecting Entity state.
- Do not place business logic or external access here.

## `index.ts`

- Define the slice Public API using re-exports only.

## Restrictions

- Colocate tests as `*.spec.ts` or `*.spec.tsx` next to the file they cover.
- Do not create additional implementation files such as `category.ts`, `relations.ts`, `logic.ts`, `utils.ts`, `helpers.ts`, or `constants.ts`; place the code in the appropriate role above.
- Do not place UI, use cases, external access, subscriptions, or asynchronous workflows in `entities`.

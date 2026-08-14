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
- As an explicit exception, persistence middleware may access storage, hydrate state, and manage persistence subscriptions.

## `model/hooks.ts`

- Define thin React hooks for reading or selecting Entity state.
- Do not place business logic or external access here.

## `api/`

- Own Entity-specific external access and persistence implementations.
- Collection names, document IDs, Entity CRUD, and Entity-specific query or parsing primitives belong here.
- Firebase, Firestore, and other external SDKs may be accessed only from `api/`, not `model/`.
- Keep runtime subscription lifecycle, feature workflows, and use-case orchestration outside `entities`.

## `@x/`

- Use `@x/` only for explicit cross-slice contracts.
- Prefer type-only re-exports and keep the exposed surface minimal.

## `index.ts`

- Define the slice Public API using re-exports only.

## Restrictions

- Colocate tests as `*.spec.ts` or `*.spec.tsx` next to the file they cover.
- Do not create implementation files outside the roles defined above.
- Do not place UI, use cases, subscription lifecycle, or feature workflow state in `entities`.
- Keep generic external-system helpers in `shared` and Entity-specific persistence in the owning Entity `api/`.

# Entities Instructions

- Treat `src/entities` as the FSD Entities layer and each `src/entities/<entity>` directory as an Entity slice.
- Keep Entity domain code in `model/` and expose the slice through `index.ts`.

## Comments

- Add a brief leading comment to every function, including small helpers, that states what it does.
- Include non-obvious intent and invariants when relevant, and update comments when behavior changes.

## `model/schema.ts`

- Define Zod schemas, validation, refinements, and schema-level defaults.
- Keep schema definitions pure.

## `model/types.ts`

- Define Entity domain types and boundary-specific types.
- Keep types separate when domain, store, persistence, or public API meanings differ.
- Derive types from Zod when Zod defines the validation boundary.
- Do not export domain types from the Entity Public API.

## `model/dto.ts`

- Define pure mappings between Entity boundary types.

## `model/defaults.ts`

- Define Entity default values, initial values, and pure default factories.
- Keep defaults independent from stores and external systems.

## `model/rules.ts`

- Define pure domain rules, calculations, relationships, selections, and transformations.
- Express rules using Entity domain types, not store, persistence, or public API types.
- Let callers pass public Entity types directly when they satisfy the required domain shape; do not map to or construct domain types outside the Entity.
- Do not access stores, React, browser APIs, or external systems.

## `model/store.ts`

- Define the global Entity store with Zustand and synchronous state mutations.
- Do not perform external access, subscriptions, or asynchronous workflows.
- Treat persistence middleware as an explicit exception for storage access, state hydration, and persistence subscriptions.

## `model/hooks.ts`

- Define thin React hooks for reading or selecting Entity state.
- Do not place business logic or external access here.

## `api/`

- Define Entity-specific Firestore access and persistence implementations.
- Keep Firestore access in `api/` to resources related to this Entity.
- Collection names, document IDs, Entity CRUD, and Entity-specific query or parsing primitives belong here.
- Firestore SDK access is allowed here, not in `model/`.

## `@x/`

- Use `@x/` only for explicit cross-slice contracts.
- Prefer type-only re-exports and keep the exposed surface minimal.

## `index.ts`

- Define the slice Public API using re-exports only.

## Restrictions

- Colocate tests as `*.spec.ts` or `*.spec.tsx` next to the file they cover.
- Do not create implementation files outside the roles defined above.
- Do not place UI in `entities`.

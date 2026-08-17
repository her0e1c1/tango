# Entities Instructions

- Treat `src/entities` as the FSD Entities layer and each `src/entities/<entity>` directory as an Entity slice.
- Keep Entity domain code in `model/` and expose the slice through `index.ts`.

## Comments

- Add a brief leading comment to every function, including small helpers, that states what it does.
- Add a brief leading comment to every interface and type alias that states what it represents.
- Include non-obvious intent and invariants when relevant, and update comments when behavior changes.

## `model/schema.ts`

- Define Entity model Zod schemas, validation, refinements, and schema-level defaults.
- Keep schema definitions pure.
- Raw persistence document schemas owned by `api/document.ts` are outside this role.

## `model/domain.ts`

- Define canonical, normalized Entity domain state and pure creation, restoration, and transition functions.
- Use domain terminology instead of persistence terminology, such as `ownerId` rather than a database field named `uid`.
- Keep domain code independent from stores, React, browser APIs, SDKs, and persistence document types.
- Do not export domain types from the Entity Public API.
- When a slice defines a canonical Domain model, route domain-bearing data between public, store, and persistence
  boundaries through that model.

## `model/types.ts`

- Define public contracts and boundary-specific store, persistence, or command types.
- Keep types separate when domain, store, persistence, or public API meanings differ.
- Do not derive public, store, or persistence types from a Domain type through inheritance or intersection.
- Derive types from Zod when Zod defines the validation boundary.

## `model/dto.ts`

- Define pure mappings between Entity boundary types and canonical Domain state.
- Do not map domain-bearing fields directly from one external boundary representation to another when a canonical
  Domain model exists.

## `model/defaults.ts`

- Define Entity default values, initial values, and pure default factories.
- Keep defaults independent from stores and external systems.

## `model/rules.ts`

- Define pure domain rules, calculations, relationships, selections, and transformations.
- Express internal rules using Entity domain types or the smallest semantic domain projection required.
- Convert public Entity values into domain-rule inputs inside the Entity rather than treating structural compatibility
  as a shared boundary.
- Do not access stores, React, browser APIs, or external systems.

## `model/store.ts`

- Define the global Entity store with Zustand and synchronous state mutations.
- Do not perform external access, subscriptions, or asynchronous workflows.
- Treat persistence middleware as an explicit exception for storage access, state hydration, and persistence
  subscriptions.

## `model/hooks.ts`

- Define thin React hooks for reading or selecting Entity state.
- Do not place business logic or external access here.

## `api/`

- Define Entity-specific Firestore access and persistence implementations.
- Keep Firestore access in `api/` to resources related to this Entity.
- Collection names, document IDs, Entity CRUD, and Entity-specific query or parsing primitives belong here.
- Keep raw persistence document schemas beside the parser in `api/document.ts`, together with any types inferred
  directly from those schemas.
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

# Entities Instructions

- Treat `src/entities` as the FSD Entities layer and each `src/entities/<entity>` directory as an Entity slice.
- Keep Entity domain code in `model/`, reusable visual representations in `ui/`, and expose the slice through `index.ts`.

## Simplicity

- Prefer deleting code and reusing an existing type or function before adding an abstraction.
- Do not represent the same data with separate Domain, DTO, store, and view types only because it crosses a boundary.
- Add a mapper only when the source and destination formats actually differ, and keep it next to that boundary.
- Keep one-off types and helpers near their only use when inlining them is clearer.
- Do not add code solely to fill an FSD directory or architectural role.
- Introduce Domain, DTO, Command, Repository, or Value Object concepts only when their distinct behavior requires them.

## Comments

- Use comments for non-obvious intent and invariants, and update them when behavior changes.
- Do not add comments that only restate a function or type name.

## `model/schema.ts`

- Define Entity model Zod schemas, validation, refinements, and schema-level defaults.
- Keep schema definitions pure.
- Raw persistence document schemas owned by `api/document.ts` are outside this role.

## `model/types.ts`

- Create this file only when multiple consumers share the types.
- Do not split identical shapes into boundary-specific aliases.
- Use Zod inference directly when a schema already defines the type and a separate name adds no meaning.

## `model/rules.ts`

- Keep only necessary pure rules, calculations, relationships, selections, and transformations.
- Accept the values a rule needs instead of an entire Entity object.
- Do not access stores, React, browser APIs, or external systems.

## `model/store.ts`

- Define the global Entity store with Zustand state, initialization, and hydration.
- Keep synchronous state getters, selector hooks, and state updates in `store.ts`.
- Apply validation and preserve state invariants at the state update boundary.
- Do not create `model/actions/` or `model/queries/` in Entities.
- Do not perform external access, subscriptions, or asynchronous workflows.
- Treat persistence middleware as an explicit exception for storage access, state hydration, and persistence subscriptions.

## `api/`

- Only `document.ts` and `firestore.ts` may be created under `api/`.
- `document.ts` defines persistence document types and conversions.
- `firestore.ts` defines Entity-specific Firestore access.
- Account is the only exception: `entities/auth/api/` may additionally contain external sign-in/sign-out calls.
- Do not create any other implementation files or tests under `api/`; Entity APIs are covered by integration tests.

## `ui/`

- Define reusable visual representations of this Entity.
- Keep Entity UI presentational: accept prepared data through props and report user intent through callbacks or slots.
- Do not access stores, Entity hooks, APIs, routing, or cross-Entity workflows from `ui/`.
- Keep locale-dependent presentation formatting in UI rather than model code.

## `@x/`

- Use `@x/` only for explicit cross-slice contracts.
- Prefer type-only re-exports and keep the exposed surface minimal.

## `index.ts`

- Define the slice Public API using re-exports only.

## Restrictions

- Outside `api/`, colocate tests as `*.spec.ts` or `*.spec.tsx` next to the file they cover.
- Do not create implementation files outside the roles defined above.

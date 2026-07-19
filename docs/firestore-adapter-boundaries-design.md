# Firestore Adapter Boundaries Design

## Context

The mutation services and remote read controller already accept function-based dependencies, so adding `DeckRepository` or `CardRepository` interfaces would duplicate those boundaries and obscure cross-entity commands such as deleting a deck and its cards. The current problem is dependency ownership: Firebase-independent remote read contracts live under `src/action/firestore`, while application and query modules refer to a Firestore-specific path.

This change reorganizes those boundaries without changing runtime behavior, the Firestore schema, offline behavior, or synchronization semantics.

## Design

### Adapter placement

Move the Firestore implementation from `src/action/firestore` to `src/adapters/firestore`. The adapter owns Firebase SDK calls, collection names, document DTOs, mappers, Timestamp conversion, emulator setup, and test-only Firestore helpers. The adapter keeps the existing deck, card, and event operations so application commands do not gain new CRUD repository interfaces.

Application composition modules may import the adapter to provide concrete functions. Query controllers, feature modules, and presentation components must not import the adapter directly.

### Neutral remote read contracts

Create a Firebase-independent remote read contract module under `src/query`. It owns the snapshot metadata, snapshot payload, change event, and subscription properties consumed by the remote read controller. Both the controller and Firestore event adapter import these neutral contracts.

The contracts describe application-observable data only. Firestore `DocumentChange`, `QuerySnapshot`, and Timestamp types remain inside the adapter and are converted before crossing the boundary.

### Mutation boundaries

Keep the existing injected function dependencies in the deck and card mutation services. Deck deletion remains an application command that coordinates deck and child-card operations; it is not represented as a single-entity repository operation.

Test-only operations such as `exists` and `removeAll` stay inside adapter tests and are not added to production-facing dependency contracts.

### Architecture enforcement

Extend the architecture tests to scan production presentation code and fail when it imports `firebase`, a Firebase subpath, `@/firebase`, or the Firestore adapter. The test resolves source aliases and relative paths so equivalent import styles cannot bypass the rule.

Add a broader dependency assertion that query and feature production modules do not import the Firestore adapter, except for an explicit application composition module responsible for wiring concrete subscriptions.

### Documentation

Update the architecture and testing documentation to name `src/adapters/firestore`, explain that Firebase-independent contracts are owned by query/application code, and identify composition as the only inward-facing adapter reference point. Update paths in test documentation after moving the integration tests.

## Data Flow

1. An application composition module imports Firestore adapter functions.
2. It injects subscription functions into the remote read controller and mutation functions into the existing services.
3. The adapter converts Firestore snapshots and documents into neutral remote read contracts and domain entities.
4. Query controllers update the cache without importing Firebase types or Firestore implementation modules.
5. Feature and presentation code consume application/query APIs only.

## Error Handling

Existing error and retry behavior remains unchanged. The adapter forwards normalized `Error` values through the neutral subscription callback. The remote read controller continues to stop both listeners when one listener fails and performs the existing single automatic recovery attempt.

## Testing

- Add failing architecture assertions before moving imports to prove presentation and query/feature adapter references are detected.
- Move existing Firestore unit and integration tests with the adapter and retain their behavior coverage.
- Keep mutation service and remote read controller tests based on function test doubles with no Firebase runtime.
- Run focused unit tests during the refactor.
- Run `make check` before publishing the pull request.

## Non-goals

- Repository interfaces, a use-case layer, or a dependency injection container
- Firestore schema, cache, offline, synchronization, or UI changes
- Web or mobile adapter implementations
- Runtime behavior changes combined with the directory move

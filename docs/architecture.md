# Architecture

Tango is a React application backed by Firebase Auth and Cloud Firestore. Route composition enters
through features. Application services combine pure domain behavior with external adapters; domain
code does not depend on React, stores, or Firebase.

```text
App / Page composition
  -> Feature containers and hooks
    -> Application services and feature stores
      -> Domain types and pure functions
      -> Firestore adapters
           -> Domain types
```

Presentation components receive plain props. They do not read authentication state, stores, or
Firestore directly. Page modules compose features when a screen needs more than one feature; a
feature must not import another feature only to place its UI.

## State ownership

| State | Owner | Persistence |
| --- | --- | --- |
| Authenticated identity | Firebase Auth through `AuthContext` | Firebase Auth |
| Deck and Card server state | `remoteStore` | Firestore and the Firestore local cache |
| Application configuration | `configStore` | Local storage |
| Active study sessions and study UI state | `studyStore` | Local storage for resumable sessions |
| In-flight study answer reconciliation | `studyStore` | Local storage until acknowledgement or rejection |
| Study attempt history | Firestore `studyAttempt` documents | Firestore and the Firestore local cache |
| Dashboard query lifecycle | Study-history feature read boundary | Runtime only |
| Dashboard metrics | Pure aggregation output | Runtime only; always rebuildable |

`remoteStore` owns the authenticated, continuous Deck and Card subscriptions needed across the
application. Study history is different: it is time-bounded, only needed by the dashboard, and can
contain substantially more documents. It therefore uses a dedicated bounded read boundary mounted
from `/` and is not added to `remoteStore`. Server-backed loads are one-shot; cached or pending
loads use a temporary listener only until they reconcile to a server-backed snapshot.

On UID change or logout, `AuthBootstrap` stops the old user's continuous subscriptions. The
study-history read boundary independently invalidates its request generation and clears its runtime
result, so a late result from the old UID cannot be published for the new user.

## Study history write path

A qualifying study action is handled by one application command:

```text
Study UI action
  -> stable operation ID and captured clock/time zone
  -> pure Card patch and StudyAttempt construction
  -> persist one in-flight command and rollback session
  -> optimistic study-session transition
  -> one Firestore batched write
       - update Card current state
       - create or exactly replay StudyAttempt
  -> local pending / server acknowledgement state
```

The batch keeps Card current state and the append-only attempt atomic. A transaction is not used
because Firestore client transactions fail offline, while batched writes are queued by the client.
Retry or reload recovery reissues the persisted command with the same operation ID and payload.
Acknowledgement clears it; definitive rejection restores its previous session. `GoToNextCard` and
`GoToPrevCard` keep their existing Card-only seen-state writes but do not enter the history batch.

## Study history read path

The dashboard reads at most the latest 30 local days for the confirmed UID, with a hard document
limit. The adapter maps Firestore documents to domain values, then pure functions derive today,
7-day, and 30-day metrics. The presentation layer receives a versioned read model and never receives
raw Firestore documents.

```text
Dashboard container
  -> study-history query service
    -> bounded Firestore adapter query
      -> temporary metadata listener only for cached or pending reconciliation
      -> StudyAttempt[]
        -> pure metric aggregation
          -> versioned dashboard read model
```

Deck and Card names are not copied into attempt documents. Containers join current Deck data for
display. Missing or deleted Decks use the contract fallback without removing historical metrics.

The complete data model, metric definitions, limits, failure states, and phase boundaries are in
[Study history and dashboard contract](study-history.md).

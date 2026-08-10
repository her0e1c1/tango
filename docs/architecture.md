# Architecture

Tango uses an architecture based on
[Feature-Sliced Design (FSD)](https://fsd.how/docs/reference/layers/). The rules in this document are
normative and are enforced by `npm run lint:architecture`.

## Layers

The source tree contains only the layers that have an identified responsibility:

```text
src/
  app/
  pages/
  features/
  entities/
  shared/
```

Add `widgets` between Pages and Features only after a reusable large UI block or a Page with several
independent blocks demonstrates the need. Do not add `processes`; FSD has deprecated it. Do not add
custom top-level layers.

Dependencies point only to strictly lower layers:

```text
app
  -> pages
    -> widgets       # only when needed
      -> features
        -> entities
          -> shared
```

App and Shared are not divided into business slices. In Pages, Widgets, Features, and Entities, a
module may import files from its own slice and public APIs from strictly lower layers. It must not
import another slice on the same layer or any higher layer.

### Layer responsibilities

| Layer | Responsibility |
| --- | --- |
| App | Entrypoint, router, providers, global stores and styles, bootstrap, and app-wide error handling |
| Pages | One screen per slice, including route input, screen layout, lower-layer composition, and screen-only behavior |
| Widgets | Optional reusable large UI blocks composed from lower layers |
| Features | User interactions that are reused by more than one Page |
| Entities | Stable business concepts such as Deck and Card, including contracts, rules, persistence mapping, and reusable representations |
| Shared | Business-independent UI, Firebase setup, storage, formatting, configuration, routes, and focused libraries |

Create a layer, slice, segment, or directory only when it has current responsibilities. Names must
describe purpose. Do not create catch-all directories such as `utils`, `helpers`, `services`,
`logic`, `core`, `state`, `types`, or `common`.

## Page composition

Every route maps to a Page slice. A Page is the screen-level composition root, not a pass-through
alias for one Feature container. It may:

- parse and validate route parameters;
- decide screen layout, display order, and route-specific navigation;
- compose multiple Widgets, Features, Entities, and Shared modules;
- coordinate lower-layer modules through props and callbacks;
- own screen-only loading, empty, error, state, and data-loading behavior.

A Page must not import another Page, deep-import a lower-layer slice, expose Firebase or store
implementation details to presentation, or retain an interaction that is reused by several Pages.
Different Feature slices do not coordinate by importing each other; their Page or, when justified,
a Widget coordinates them.

The route map is:

| Route | Page slice |
| --- | --- |
| `/` | `pages/deck-list` |
| `/deck/:id` | `pages/card-list` |
| `/deck/:id/edit` | `pages/deck-form` |
| `/deck/:id/start` | `pages/deck-start` |
| `/deck/:id/study` | `pages/deck-swiper` |
| `/card/:id` | `pages/card-view` |
| `/card/:id/edit` | `pages/card-form` |
| `/settings` | `pages/settings` |
| `/import` | `pages/deck-import` |

Each Page slice exposes its Page from a root `index.ts`. The App router imports each slice directly:

```tsx
import { DeckListPage } from "@/pages/deck-list";
import { SettingsPage } from "@/pages/settings";
```

Do not create an `@/pages` barrel and do not import `@/pages/deck-list/ui/DeckListPage`.

## Slice structure and public APIs

The root `index.ts` follows the [FSD public API contract](https://fsd.how/docs/reference/public-api/)
for a Page, Widget, Feature, or Entity slice. It explicitly exports only contracts used outside the
slice:

```ts
export { DeckListPage } from "./ui/DeckListPage";
```

Do not use wildcard exports. Consumers use the slice root, never a segment or file deep import.
Files inside the same slice use relative imports with full paths rather than self-importing through
the public API. Do not add segment barrels.

`shared/ui` and other Shared collections use a public API per focused component or library, for
example `@/shared/ui/button`. They do not expose one barrel for the entire collection.

Feature slices may use the following directories when the responsibility exists:

| Directory | Responsibility |
| --- | --- |
| `containers` | Connect slice Hooks to Components through simple prop mapping |
| `hooks` | Feature-local React lifecycle, interaction, and side effects |
| `components` | Stateless presentation that receives plain props |
| `queries` | Read-only external data access |
| `mutations` | One-purpose external writes |
| `subscriptions` | Continuous external subscriptions |
| `commands` | Workflows combining writes, transitions, retries, or rollback |
| `store` | Client state shared by several Hooks in the slice |
| `schemas` | Input validation |
| `selectors` | Pure derived data |
| `rules` | Pure decisions and business invariants |
| `mappers` | External DTO, Entity, and view-model conversion |
| `formatters` | Pure display formatting |

Containers import only same-slice Hooks and Components. They do not import stores, auth, Firebase,
queries, mutations, subscriptions, or commands directly. Hooks own the interaction and call those
modules. Components receive plain values and callbacks; they do not access application, server, or
route state. Exported presentation Components normally have an adjacent behavior-focused test and
Storybook story. Stories use args, fixtures, and callback spies instead of real stores, Firebase,
or the network.

### Ownership decisions

The Deck List implementation established ownership decisions that apply to every Page:

- screen-specific sections, deck-row presentation, dialogs, keyboard shortcuts, and lower-layer
  coordination belong to `pages/deck-list` rather than a route-sized Deck Feature;
- the Page consumes Deck mutation, sample import, and study-session behavior through each Feature
  root, while each Feature keeps its store and command implementation private;
- Deck and Card contracts live at `entities/deck` and `entities/card`; consumers import those
  contracts explicitly;
- reusable controls use focused `shared/ui/*` public APIs, and Firebase initialization and runtime
  ownership lives at `shared/firebase` rather than a business adapter or top-level module.

## Automated enforcement

`npm run lint:architecture` runs as part of `npm run lint` and `mise run check`. It parses TypeScript
imports and exports and rejects:

- source entries outside App, Pages, Features, Entities, Shared, and `vite-env.d.ts`;
- catch-all directory names, global layer barrels, segment barrels, and wildcard exports;
- dependencies on a higher layer or a different slice on the same layer;
- lower-layer deep imports and same-slice imports through the slice public API;
- Shared deep imports that bypass a focused public API;
- presentation imports of routing, stores, Auth, or Firebase;
- removed legacy aliases such as `@/components`, `@/hooks`, and `@/store`.

Specifications and stories may import private contracts to test them, so dependency-direction and
public-API checks skip those files. Source-tree, directory, barrel, and legacy-alias rules still
apply to them. The checker has fixture-based regression tests beside its implementation.

### Related architecture work

| Issue | Integrated decision |
| --- | --- |
| [#284](https://github.com/her0e1c1/tango/issues/284) | Every route keeps a Page slice, Pages own composition, and pass-through Templates are unnecessary. |
| [#337](https://github.com/her0e1c1/tango/issues/337) | Different Feature slices cannot import one another; Pages coordinate them through public contracts. |
| [#442](https://github.com/her0e1c1/tango/issues/442) | Static analysis uses the final FSD layer names and runs in the normal lint command. |
| [#445](https://github.com/her0e1c1/tango/issues/445) | Lower-layer-only dependencies, public APIs, and presentation boundaries replace the legacy domain/presentation split. |

## Preserved behavior contracts

Architecture changes preserve these runtime contracts.

### State ownership

| State | Current runtime owner | Persistence |
| --- | --- | --- |
| Authenticated identity | Firebase Auth through `AuthContext` | Firebase Auth |
| Deck and Card server state | `remoteStore` | Firestore and the Firestore local cache |
| Application configuration | `configStore` | Local storage |
| Active study sessions and study UI state | `studyStore` | Local storage for resumable sessions |
| In-flight study answer reconciliation | `studyStore` | Local storage until acknowledgement or rejection |
| Study attempt history | Firestore `studyAttempt` documents | Firestore and the Firestore local cache |
| Dashboard query lifecycle | Study-history read boundary | Runtime only |
| Dashboard metrics | Pure aggregation output | Runtime only; always rebuildable |

`remoteStore` owns the authenticated, continuous Deck and Card subscriptions needed across the
application. Study history is time-bounded, only needed by the dashboard, and can contain more
documents. It uses a dedicated bounded read boundary mounted from `/` and is not added to
`remoteStore`. Server-backed loads are one-shot; cached or pending loads use a temporary listener
only until they reconcile to a server-backed snapshot.

On UID change or logout, `AuthBootstrap` stops the old user's continuous subscriptions. The
study-history read boundary independently invalidates its request generation and clears its runtime
result, so a late result from the old UID cannot be published for the new user.

### Study history write path

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

### Study history read path

The dashboard reads at most the latest 30 local days for the confirmed UID, with a hard document
limit. The adapter maps Firestore documents to domain values, then pure functions derive today,
7-day, and 30-day metrics. The presentation layer receives a versioned read model and never receives
raw Firestore documents.

```text
Dashboard Page
  -> study-history query Feature
    -> bounded Firestore Entity query
      -> temporary metadata listener only for cached or pending reconciliation
      -> StudyAttempt[]
        -> pure metric aggregation
          -> versioned dashboard read model
```

Deck and Card names are not copied into attempt documents. The Page joins current Deck data for
display. Missing or deleted Decks use the contract fallback without removing historical metrics.

The complete data model, metric definitions, limits, failure states, and phase boundaries are in
[Study history and dashboard contract](study-history.md).

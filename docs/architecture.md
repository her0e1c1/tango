# Architecture

Tango is migrating to [Feature-Sliced Design (FSD)](https://fsd.how/docs/reference/layers/).
The target rules in this document are normative. The migration inventory records temporary legacy
structure that later pull requests must remove without changing observable behavior.

## Target layers

The initial source tree contains only the layers that have an identified responsibility:

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

The target route map is:

| Route | Current Page | Current primary container | Target Page slice |
| --- | --- | --- | --- |
| `/` | `DeckListPage` | `DeckListContainer` | `pages/deck-list` |
| `/deck/:id` | `CardListPage` | `CardListContainer` | `pages/card-list` |
| `/deck/:id/edit` | `DeckFormPage` | `DeckFormContainer` | `pages/deck-form` |
| `/deck/:id/start` | `DeckStartPage` | `DeckStartContainer` | `pages/deck-start` |
| `/deck/:id/study` | `DeckSwiperPage` | `DeckSwiperContainer` | `pages/deck-swiper` |
| `/card/:id` | `CardViewPage` | `CardViewContainer` | `pages/card-view` |
| `/card/:id/edit` | `CardFormPage` | `CardFormContainer` | `pages/card-form` |
| `/settings` | `ConfigPage` | `ConfigContainer` | `pages/settings` |
| `/import` | `DeckImportPage` | `DeckImportContainer` | `pages/deck-import` |

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
| `component` | Stateless presentation that receives plain props |
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

### Deck List pilot decisions

The Deck List pilot established these ownership decisions for later Page migrations:

- screen-specific sections, deck-row presentation, dialogs, keyboard shortcuts, and lower-layer
  coordination belong to `pages/deck-list` rather than a route-sized Deck Feature;
- the Page consumes Deck mutation, sample import, and study-session behavior through each Feature
  root, while each Feature keeps its store and command implementation private;
- Deck and Card contracts begin at `entities/deck` and `entities/card`; remaining ambient consumers
  migrate to those contracts as their owning Page moves;
- reusable controls use focused `shared/ui/*` public APIs, and Firebase initialization and runtime
  ownership lives at `shared/firebase` rather than a business adapter or top-level module;
- legacy compatibility barrels may re-export migrated Shared contracts temporarily, but migrated
  slices import the focused Shared public API directly.

## Migration inventory

This inventory describes `origin/main` at `be13411` before the FSD migration. Every source file is
covered by a path below; adjacent specifications and stories move with the code they verify.

### Current dependency graph

```text
main.tsx
  -> Firebase initialization and Auth providers
  -> App router
       -> global page barrel
            -> pass-through Page
                 -> feature container
                      -> feature UI, hooks, and other feature slices
                      -> global hooks, actions, services, and stores
                           -> Firestore adapters and Firebase
```

The temporary graph violates the target in these known places:

| From slice | To slice | Current imports |
| --- | --- | --- |
| `features/deck` | `features/import` | `DeckListContainer` uses sample-deck bootstrap |
| `features/deck` | `features/study` | Deck-list composition and section building use study Hooks and state |
| `features/card` | `features/deck` | `CardListContainer` composes deck start and filter behavior |
| `features/import` | `features/card` | Deck import calls Card mutation behavior |
| `features/import` | `features/deck` | Deck import calls Deck mutation behavior |
| `features/study` | `features/deck` | `DeckStartContainer` composes deck form and filter behavior |
| `features/study` | `features/card` | Deck swiper composes Card UI and calls Card mutation behavior |

The App imports the wildcard `src/page/index.ts` barrel. Every current Page deep-imports a
`features/*/containers` segment, and those segment barrels mostly use wildcard exports. Feature
internals, tests, and stories also rely on file-level deep imports. `src/components/index.ts` is a
single wildcard barrel for unrelated UI modules. These are migration inputs, not permitted target
patterns.

### Current ownership and destinations

| Current files | Current responsibility and route use | Target owner candidate |
| --- | --- | --- |
| `App.tsx`, `App.spec.tsx`, `main.tsx`, `index.css` | Entrypoint, router, auth shell, global theme, and styles for every route | `app/entrypoint`, `app/routes`, `app/providers`, `app/styles` |
| `auth/**` | Auth provider, bootstrap, UID transition, and logout integration | `app/providers` and app bootstrap; reusable Firebase primitives stay Shared |
| `page/**` | Nine pass-through route components, global Page story, and wildcard barrel | The nine `pages/*` slices in the route map; remove the global barrel |
| `features/deck/**` | Deck list/form UI and interactions used by `/`, deck edit, card list, and deck start | Split among Deck List/Form Pages, reusable deck Features, and `entities/deck` |
| `features/card/**` | Card list/form/view UI and interactions used by card routes and study | Split among Card List/Form/View Pages, reusable card Features, and `entities/card` |
| `features/import/**` | Import screen plus sample-deck bootstrap used on `/` | `pages/deck-import` plus a Feature only for interactions reused by another Page |
| `features/settings/**` | Settings screen and account/configuration interaction used only by `/settings` | `pages/settings`; app-wide configuration contracts move to App |
| `features/study/**` | Start/study screens, resumable study state, and behavior also observed on `/` | Deck Start/Swiper Pages plus reusable study Features; add an Entity only after reuse is demonstrated |
| `components/content/**`, `components/forms/**`, `components/feedback/**`, `components/layout/**`, `components/index.ts` | Business-independent presentation and layout, currently exposed by one global barrel | Focused `shared/ui/*` modules with per-component public APIs |
| `action/card*`, `action/deck*` | Deck/Card construction, CSV mapping, import/export, and file download | Split Deck/Card rules and mappers into Entities; import/export interaction into its owning Feature |
| `action/event*` | Login, logout, and cross-store cleanup | App auth workflow, depending on lower-layer public contracts |
| `action/index.ts` | Wildcard action barrel | Remove after callers use owner slice public APIs |
| `adapters/firestore/card*`, `deck*`, `dto*`, `event*` | Deck/Card Firestore reads, writes, mapping, and subscriptions | `entities/card` and `entities/deck`, with explicit cross-entity coordination above them |
| Other `adapters/firestore/**`, `firebase.ts`, `firebase.spec.ts` | Generic Firebase initialization, runtime, persistence, and metadata | `shared/firebase` |
| `store/remoteStore*`, `store/remoteSelectors*` | Combined Deck/Card subscription state and selectors | Split by Entity where practical; compose combined Page read models above Entities |
| `store/remoteMutationLocks.ts` | Generic keyed concurrency plus Deck membership locks | Generic lock primitive in Shared; business lock keys and rules in Entities or Features |
| `store/configSchema.ts`, `store/configStore*`, `hooks/useConfig.ts` | App-wide validated and persisted configuration | `app/store` and an App-facing Hook; presentation receives plain props |
| `hooks/useActions.ts` | Global route navigation plus auth, config, and download actions | Split route wiring into Pages/App and interactions into their owning slices |
| `hooks/useAsyncAction*` | Generic React async-action lifecycle | Focused Shared library or Hook public API |
| `hooks/useRemoteCollections*` | Auth-aware Deck/Card subscription facade and scheduling | Split Entity access from Page/Feature-specific selection and coordination |
| `services/cardCommands*`, `services/deckCommands*` | Card/Deck write workflows, mutation locks, and remote acknowledgement | Feature or Entity `commands`/`mutations`, according to interaction ownership |
| `services/remoteWrite*` | Generic remote-write acknowledgement timeout | Focused Shared library |
| `domain/remoteSnapshot.ts`, `lib/realtimeChange*` | Generic remote snapshot contracts and pure reconciliation | Focused Shared library |
| `lib/study*` | Study scheduling, swipe rules, and Card transitions | Study Feature rules; stable Card invariants move to `entities/card` |
| `lib/interactionAccessibility.spec.tsx` | Cross-screen accessibility regression coverage | Split into behavior tests beside the UI contracts it verifies |
| `constant.ts`, `util.ts` | Rich-content language mapping, CSV sample data, and category selection | Split focused Shared formatting from Card/Deck/import-specific contracts |
| `styles/**` | Shared visual stylesheet | App global style or the owning Shared UI module |
| `storybook/**` | App decorators, Firebase mocks, Page fixtures, and generic viewport helpers | Split app-wide Storybook setup, owner-local fixtures, and focused Shared test support |
| `test/**` | React test utility and Deck/Card/config factories | Focused Shared test support and owner-local Entity/App factories |
| `vite-env.d.ts` | Vite declarations plus ambient Page, Deck, Card, study, and config business types | Keep only build declarations; move business types to explicit Entity, Feature, or App modules |

### Related work order

| Issue | Relationship to this migration |
| --- | --- |
| [#284](https://github.com/her0e1c1/tango/issues/284) | Its Page, layout, and Template decisions follow this document: every route keeps a Page slice, Pages own composition, and pass-through Templates are not required |
| [#337](https://github.com/her0e1c1/tango/issues/337) | Enforce same-layer Feature isolation in Phase 6 after cross-Feature imports have moved to Pages or lower-layer contracts |
| [#442](https://github.com/her0e1c1/tango/issues/442) | Continue as the static-analysis parent; its architecture checks must use the final FSD layer names and rules |
| [#445](https://github.com/her0e1c1/tango/issues/445) | Replace the legacy domain/presentation proposal with lower-layer-only, public-API, and presentation boundaries after target paths exist |

Migration pull requests proceed in this order:

1. Establish App and Page slice public boundaries without behavior changes.
2. Move Deck List as a vertical Page/Feature/Entity/Shared pilot and resolve its cross-Feature imports.
3. Move the remaining routes one Page at a time.
4. Finish classifying Feature, Entity, and Shared ownership and remove ambient business types.
5. Enforce layer direction, slice isolation, public APIs, and forbidden legacy directories.
6. Delete empty legacy top-level directories, aliases, barrels, and temporary exceptions.

Each pull request must be independently reviewable and revertible. Do not combine directory
migration with UI, route URL, Firebase model, or state-management changes.

## Preserved behavior contracts

The FSD migration changes ownership and import paths, not these runtime contracts.

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

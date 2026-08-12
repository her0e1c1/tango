# Adopt Feature-Sliced Design

Status: Accepted

## Context

The frontend is being organized around explicit architectural boundaries. A shared architectural baseline is needed so directory placement and dependency decisions are consistent as the codebase evolves.

## Decision

Adopt [Feature-Sliced Design (FSD)](https://feature-sliced.design/) as the baseline architectural methodology for the frontend.

Follow FSD's core layering and dependency principles while allowing project-specific segment names and conventions when they make responsibilities clearer. Project-specific rules documented in ADRs take precedence when they intentionally differ from conventional FSD structure.

The application uses these UI responsibilities:

- `app` maps URLs to Page slice public APIs and owns application-wide providers and unknown-route recovery.
- `pages` are screen-level composition roots. A Page owns route parameter validation, route-specific navigation, loading and missing-data recovery, Header wiring, Layout mode, and the ordering of lower-layer UI.
- `features` own reusable user interactions. Feature Hooks connect state and actions, while Feature Components render plain props. Feature code does not own a route, Header, or screen Layout.
- `entities` own reusable business concepts and their data access contracts.
- `shared` owns business-independent infrastructure and UI primitives.

A Page-local `View` is optional. Use one when a screen has meaningful stateless presentation that benefits from isolated tests or Storybook scenarios. Do not create a `View`, `Container`, or other layer merely to forward props or return one child. The `components/templates` convention is not used: screen composition belongs to Pages, and reusable presentation belongs to its owning Feature, Entity, or Shared slice.

Every route keeps a Page slice, even when its current composition is small. This gives route validation, recovery, and future composition one stable owner and keeps the app router dependent only on Page public APIs. Containers are optional Feature implementation details and must not import route state or render a screen Layout.

## Route layout decision

Do not introduce a shared nested `RouteLayout` with `Outlet` for the current route tree. Each Page selects its Layout explicitly because:

- missing-resource feedback intentionally renders outside the normal application shell;
- the study screen uses a fullscreen Layout and changes Header visibility from screen state;
- keeping Layout at the Page makes the route's shell behavior visible without adding context or callback plumbing.

The nine routes follow this composition:

| Route | Page | Layout |
| --- | --- | --- |
| `/` | Deck List | Normal |
| `/deck/:id` | Card List | Normal |
| `/deck/:id/edit` | Deck Form | Normal |
| `/deck/:id/start` | Deck Start | Normal |
| `/deck/:id/study` | Deck Swiper | Fullscreen, state-dependent Header |
| `/card/:id` | Card View | Normal |
| `/card/:id/edit` | Card Form | Normal |
| `/settings` | Settings | Normal |
| `/import` | Deck Import | Normal |

## Verification ownership

- Page tests cover route inputs, recovery, Header and Layout behavior, and coordination between lower-layer modules.
- View and Component tests cover observable rendering and interaction through plain props.
- Storybook targets stateless Views and Components, not stateful Pages or Containers, unless a Page-level scenario is specifically valuable.
- E2E tests cover complete route workflows without asserting architecture details.
- Steiger enforces FSD dependency direction and public API usage; `mise run check` runs the architecture lint and related unit checks before changes are published.

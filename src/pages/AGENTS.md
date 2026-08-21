# Pages Instructions

- Keep URL routes and exported Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Keep screen-specific presentation, state connections, workflows, and composition in the corresponding Page slice.
- Name the route entry and composition boundary `*Page.tsx`. A Page may read route params, own navigation and screen shortcuts, and connect to lower-layer hooks and stores.
- Name a Page-internal state or workflow connection boundary `*Container.tsx`. Add a Container only when splitting the Page makes the connection boundary clearer; a small Page may pass props directly to presentational components.
- Keep every other component under `ui/` presentational by default. It receives prepared data through props, reports user intent through callbacks, and must not connect to application or domain hooks, stores, mutations, or workflows. UI-only local state and presentation-supporting React or library hooks are allowed.
- Pages and their Containers may import lower FSD layers, including Entities, through public APIs. Do not introduce a Feature solely to detour around a lower-layer import.
- Keep reusable domain rules in `entities` and independently meaningful user workflows in `features`; Page-specific models must not duplicate or absorb those responsibilities.
- Own screen-level keyboard shortcut mappings and registration in `src/pages`. Use `useKey` directly and delegate shortcut actions to lower layers.
- Organize `ui/` subdirectories by UI meaning, such as `toolbar`, rather than technical categories such as `component` or `container`.

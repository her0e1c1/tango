# Pages Instructions

- Follow FSD v2.1 page-first: keep route-specific and single-consumer presentation, state connections, workflows, and composition in the corresponding Page slice.
- Keep a workflow in the Page when that Page is its only consumer, even when it represents a meaningful user action; move it to Features only after actual cross-Page reuse appears.
- Keep URL routes and exported Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Name the route entry and composition boundary `*Page.tsx`. Keep route params, navigation, and screen shortcuts in Pages or Containers, and obtain application state and bound action callbacks from the Page model.
- Name a Page-internal composition boundary `*Container.tsx`. Add a Container only when splitting the Page makes the composition clearer; it consumes the Page model rather than duplicating state and action wiring. A small Page may pass the Page model's values and callbacks directly to presentational components.
- Keep every other component under `ui/` presentational by default. It receives prepared data through props, reports user intent through callbacks, and must not connect to application or domain hooks, stores, mutations, or workflows. UI-only local state and presentation-supporting React or library hooks are allowed.
- Pages and their Containers may import lower FSD layers, including Entities, through public APIs. Do not introduce a Feature solely to detour around a lower-layer import.
- Move reusable cross-Page workflows to Features and reusable domain concepts, rules, or visual representations to Entities. Do not keep lower-layer slices solely to preserve an architectural label when Steiger identifies them as insignificant.
- Own screen-level keyboard shortcut mappings and registration in `src/pages`. Use `useKey` directly and delegate shortcut actions to lower layers when such lower-layer behavior is reusable.
- Organize `ui/` subdirectories by UI meaning, such as `toolbar`, rather than technical categories such as `component` or `container`.

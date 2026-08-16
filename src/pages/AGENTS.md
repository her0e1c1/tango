# Pages Instructions

- Keep URL routes and Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Treat Pages as route-level containers and wiring boundaries. Pages may read route params, navigation, Entity state, and Feature model/hooks needed to prepare props and callbacks for lower-layer UI.
- Keep Page components concise and orchestration-only. Compose lower-layer UI and connect it to lower-layer state/actions; do not implement reusable domain rules or complex Feature workflows in Pages.
- Move reusable business logic and Feature-specific workflows to the appropriate `entities` or `features/model` layer, then invoke them from the Page.
- Do not define custom hooks in `src/pages`. Use framework or library hooks such as `useParams`, `useNavigate`, and `useKey`, or existing hooks exposed by lower layers.
- Own screen-level keyboard shortcut mappings and registration in `src/pages`. Use `useKey` directly and delegate shortcut actions to lower layers.

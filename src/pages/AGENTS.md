# Pages Instructions

- Keep URL routes and exported Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Treat Pages as route-level composition boundaries. Pages may read route params, own navigation and screen shortcuts, and compose Feature or Widget state and UI.
- Do not import Entities from Pages, including type-only imports. Pass route parameters as strings and let Feature models resolve Entity state, existence, commands, and Entity-specific transformations.
- Keep Page components concise and orchestration-only. Compose lower-layer UI and connect navigation callbacks; do not implement reusable domain rules or complex Feature workflows in Pages.
- Move reusable business logic and Feature-specific workflows to the appropriate `entities` or `features/model` layer, then invoke them from the Page.
- Do not define custom hooks in `src/pages`. Use framework or library hooks such as `useParams`, `useNavigate`, and `useKey`, or existing hooks exposed by lower layers.
- Own screen-level keyboard shortcut mappings and registration in `src/pages`. Use `useKey` directly and delegate shortcut actions to lower layers.

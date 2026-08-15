# Pages Instructions

- Keep URL routes and Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Keep Pages UI-only. Import containers or components from lower layers and compose them into the Page layout.
- Keep Page components concise. Limit them to simple UI composition, and move complex business logic, state coordination, data fetching, and workflows to the appropriate lower layers.
- Do not define custom hooks in `src/pages`. Use framework or library hooks such as `useParams`, `useNavigate`, and `useKey`, or existing hooks exposed by lower layers.
- Own screen-level keyboard shortcut mappings and registration in `src/pages`. Use `useKey` directly and delegate shortcut actions to lower layers.

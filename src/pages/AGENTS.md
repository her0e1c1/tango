# Pages Instructions

- Treat `src/pages` as route adapters: read route state, compose lower layers, and handle route-level navigation and feedback.
- Routing hooks such as `useParams` and `useNavigate` may be used directly. Do not call business or application hooks from pages.
- Own route- and screen-level keyboard shortcut mappings and registration in `src/pages`, using `useKey` directly by default.
- Lower layers must not register global listeners for Page shortcuts. They expose actions or callbacks that Page shortcut handlers call without adding business or workflow logic.
- Keep business logic, mutations, workflows, store coordination, view-model construction, and non-route effects in lower FSD layers.

# Pages Instructions

- Treat `src/pages` as route adapters: read route state, compose lower layers, and handle route-level navigation and feedback.
- Routing hooks such as `useParams` and `useNavigate` may be used directly. Do not call business or application hooks from pages.
- Keep business logic, mutations, workflows, store coordination, view-model construction, and non-route effects in lower FSD layers.

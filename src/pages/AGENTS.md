# Pages Instructions

- Treat `src/pages` as route adapters. Pages connect router state to lower layers and compose the route-level screen; they do not own business or use-case logic.
- Use routing hooks such as `useParams` and `useNavigate` directly when translating route state into props, callbacks, redirects, or route-level feedback.
- Do not call business or application hooks directly from pages. Move data access, mutations, workflows, store coordination, and feature state into `features`, `widgets`, or the appropriate lower layer.
- Do not use React hooks such as `useEffect` or `useState` to implement business workflows in pages. Route-local adapter state is acceptable only when it cannot reasonably belong to a lower layer.
- Keep domain data transformation and view-model construction out of pages. Prefer the owning feature, entity, or widget.
- Keep keyboard shortcuts, timers, persistence, browser-history guards, and other feature behavior out of pages unless they are strictly route concerns.
- Pages may own route-level loading, not-found handling, redirects, and navigation callbacks.
- Prefer passing plain data and callbacks between pages and lower-layer UI instead of exposing lower-layer implementation details to pages.

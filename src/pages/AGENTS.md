# Pages Instructions

- Keep URL routes and Page components one-to-one: each route renders one dedicated Page, and each Page serves one route.
- Keep Pages UI-only. Import containers or components from `src/features` and only compose their layout.
- Keep Page components concise. Do not add business logic, state management, data fetching, or workflow orchestration.

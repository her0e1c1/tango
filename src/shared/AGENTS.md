# Shared Instructions

- Treat `src/shared` as the lowest FSD layer for application-wide technical primitives and reusable UI.
- Do not place domain state, domain rules, or business workflows in `shared`.
- Application-wide technical contracts, such as route definitions, and business-themed presentational UI are allowed when they do not own domain behavior.
- Shared code must not import from Entities, Features, Widgets, Pages, or App.
- If code requires domain state, rules, or workflow knowledge, place it in the appropriate domain layer.

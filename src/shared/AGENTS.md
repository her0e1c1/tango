# Shared Instructions

- Treat `src/shared` as domain-agnostic shared code.
- Do not place domain concepts, domain-specific terminology, or domain/business logic in `shared`.
- `src/shared/routes` is the explicit exception: it may name domain routes so every layer can share one route contract, but it must not contain domain or business logic.
- Keep only generic, reusable technical code here.
- If code requires domain knowledge, place it in the appropriate domain layer.

# Shared Instructions

- Treat `src/shared` as domain-agnostic shared code.
- Do not place domain concepts, domain-specific terminology, or domain/business logic in `shared`.
- `src/shared/routes` is the explicit exception: it may contain the domain knowledge and terminology needed to define page routes so every layer can share one route contract, but it must not contain domain or business logic beyond route definitions.
- Keep only generic, reusable technical code here.
- If code requires domain knowledge, place it in the appropriate domain layer.

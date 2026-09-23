# Firestore Integration Specification Instructions

- Keep Security Rules common prerequisites in this file instead of duplicating them in `rules-*.md`.
- Link Rules specifications to the common prerequisites below. Keep case-specific document values, authentication actors, SDK operations, and expected results in Given / When / Then.

## Security Rules common prerequisites

- Load the repository's actual `firestore.rules` into the `test-rule` project.
- Prepare Given prerequisite documents in a Rules-disabled context. Execute When directly through the Firebase SDK from a Rules-enabled context.
- Use `google.com` for non-anonymous authentication, `anonymous` for anonymous authentication, and no authentication information for unauthenticated contexts.
- Do not pass Security Rules verification through application schema validation.
- Follow [README](./README.md) for execution, isolation, and cleanup details.

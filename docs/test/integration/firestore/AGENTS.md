# Firestore Integration Specification Instructions

## Scope and case format

- Document persistence, subscription, and security-rule contracts here. Keep browser-facing user flows in `docs/test/e2e`; related E2E links are optional.
- Follow the shared format and ID-only correspondence rules in `../../AGENTS.md`. Do not add implementation file or test-title mappings.
- Use `FIRESTORE-<UPPERCASE-SPEC-FILENAME>-<NN>` IDs, starting at `01` in document order without gaps. Update indexes, anchors, and headings together; README files do not define case IDs.
- Use the categories `read`, `write`, and `batch`. Describe case-specific setup inline; do not add fixture files.
- 正常系・異常系の区分は [共通規約](../../AGENTS.md#正常系異常系の区分) に従い、カテゴリとは別に明示する。
- Parameterized inputs may share a case ID when all authentication actors, inputs, and expected results are documented.
- Distinguish Adapter validation from Rules authorization. Keep unverified expectations explicit instead of treating proposed or skipped tests as verified behavior.
- Keep Security Rules common prerequisites in this file instead of duplicating them in `rules-*.md`.
- Link Rules specifications to the common prerequisites below. Keep case-specific document values, authentication actors, SDK operations, and expected results in Given / When / Then.

## Security Rules common prerequisites

- Load the repository's actual `firestore.rules` into the `test-rule` project.
- Prepare Given prerequisite documents in a Rules-disabled context. Execute When directly through the Firebase SDK from a Rules-enabled context.
- Use `google.com` for non-anonymous authentication, `anonymous` for anonymous authentication, and no authentication information for unauthenticated contexts.
- Do not pass Security Rules verification through application schema validation.
- Follow [README](./README.md) for execution, isolation, and cleanup details.

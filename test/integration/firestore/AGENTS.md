# Firestore Integration Test Instructions

- Treat the case specifications under `docs/test/integration/firestore/` as the single source of truth for Firestore integration test cases.
- Follow the [Security Rules common prerequisites](../../../docs/test/integration/firestore/AGENTS.md#security-rules-common-prerequisites) for Rules setup and authentication contexts.
- Tests under `test/integration/firestore/` must cover every documented test case.
- Each documented case ID must correspond to exactly one test definition (`it` or `it.each`), and each test definition must correspond to exactly one documented case ID. Do not duplicate an ID across definitions or combine multiple case IDs in one definition.
- Each `it` or `it.each` title must include its documented `FIRESTORE-<UPPERCASE-SPEC-FILENAME>-<NN>` ID. Follow `docs/test/integration/firestore/README.md` for the filename prefix and sequential numbering; do not allocate a separate sequence in test files.
- For `it.each`, the definition, not each generated row, is the one-to-one mapping unit. Rows may share its ID only when every authentication, input, and expected-result combination is documented for that case.
- Do not add test cases that are not documented under `docs/test/integration/firestore/`; remove existing undocumented test cases.
- When adding a test, including regressions, first add or update the corresponding specification case, then add the test.
- When changing or removing a specification case or test, update or remove its counterpart in the same change. Keep specification indexes, anchors, and test titles in sync.
- Setup, cleanup, helpers, and other supporting code are not test cases and do not need one-to-one mappings.
- README index entries are references to cases, not additional cases. Separately listed unverified expectations must not be counted as covered test cases.

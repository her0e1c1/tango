# Test Specification Instructions

- These instructions apply to test documentation under `docs/test`, not to application or test implementation files.
- Describe observable behavior in Japanese: purpose, explicit ID anchors and headings, categories, and Given / When / Then. Follow each test level's local `AGENTS.md` for indexes, IDs, categories, and fixtures.
- Use case IDs as the connection to test implementations. Do not maintain `対応テスト`, `対応ファイル`, `対応 Story`, planned test-title fields, implementation mapping columns, test-file links, copied test titles, or Story export lists in specifications or their indexes.
- Keep implementation locations out of case contracts. Common execution instructions may describe runner configuration and test directories; they must not become per-case implementation mappings.
- Describe the required state in Given and keep each Given / When / Then to one block. Split independent behaviors into separate cases; document parameterized inputs and display variants as states and expected results, not implementation names.
- Preserve IDs, anchors, categories, prerequisites, expected results, and related-specification links when removing implementation mappings. Do not change behavior or renumber cases just to remove mappings.
- Keep shared documentation rules here and level-specific documentation rules in the relevant child `AGENTS.md`, not in the repository-root instructions.
- Outside Firestore and Storybook contracts, keep runtime behavior specifications in `e2e`; do not introduce separate unit/integration specification documents or ID systems without an explicit user request.
- The presence of an ID is not proof that a test ran or asserted the specified behavior. Keep unverified expectations explicit; skipped or TODO tests are not passing verification.

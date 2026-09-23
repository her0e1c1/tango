# Test Specification Instructions

- These instructions apply to all test specifications under `docs/test`.
- Describe observable behavior with case IDs, a case index, categories, and Given / When / Then. Follow each test level's existing ID and format rules.
- Do not maintain implementation mappings in specifications or their indexes: no `対応テスト`, `対応ファイル`, or `対応 Story` fields or columns, test-file links, copied test titles, or Story export lists. Keep implementation locations out of the specification contract.
- Use case IDs to connect specifications and implementations. When adding or changing tests, put the relevant IDs in implementation-side test names or Story test labels instead of adding a mapping to the documentation.
- Preserve case IDs, anchors, categories, prerequisites, expected results, and related specification links when removing implementation mappings. Do not change behavior or renumber cases just to remove those mappings.
- The presence of an ID is not proof that a test ran or asserted the specified behavior. Keep unverified expectations explicit; skipped or TODO tests are not passing verification.

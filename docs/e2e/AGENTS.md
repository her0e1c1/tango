# E2E Documentation Instructions

- テスト仕様書には、具体的なテストデータの値を記述しない。
- 具体的な seed 値は `docs/e2e/seed.md` に集約する。
- 各テストケースには、`read`、`write`、`batch` のいずれかのカテゴリを明示する。
- テストケースは `Given` / `When` / `Then` で記述し、それぞれ原則1ブロックとする。
- `When` → `Then` → `When` のように、操作と期待結果を交互に繰り返さない。
- 複数の独立した振る舞いを確認する場合は、テストケースを分割する。

# E2E Documentation Instructions

- `docs/e2e/fixture/{read,write,batch}/*.yaml` を具体的な E2E fixture 状態の正とする。
- fixture はテストケースのカテゴリと同じ `read`、`write`、`batch` ディレクトリに配置する。
- 各テストケースの `Given` の先頭に、使用する fixture YAML へのリンクを `Fixture: ...` として明示する。
- `Given` には fixture 参照だけでなく、テスト開始時に必要な状態を利用者視点で具体的に記述する。
- テストケース本文には、fixture YAML に定義した具体的な値を重複して記述しない。
- fixture YAML にはアプリケーション上の永続状態を記述し、Firestore 固有の serialization は記述しない。
- `read` fixture は共有しても変更せず、`write` / `batch` fixture はケースごとに分離した namespace へ展開する。
- 各テストケースには、`read`、`write`、`batch` のいずれかのカテゴリを明示する。
- テストケースは `Given` / `When` / `Then` で記述し、それぞれ原則1ブロックとする。
- `When` → `Then` → `When` のように、操作と期待結果を交互に繰り返さない。
- 複数の独立した振る舞いを確認する場合は、テストケースを分割する。

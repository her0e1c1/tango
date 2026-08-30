# E2E Documentation Instructions

- 最初に [`conventions.md`](./conventions.md) と [`fixture/README.md`](./fixture/README.md) を読む。
- `docs/e2e/README.md` を全 E2E case ID の索引とし、各 ID をちょうど一つの Playwright test と詳細仕様に対応させる。
- 詳細仕様の Markdown は E2E contract check が読み取れるように `docs/e2e` 直下へ置く。
- 大きな仕様書は、対象 entity だけでなく、表示・管理・一覧操作や session・controls のような利用者の振る舞いで分割する。
- 各テストケースには `read`、`write`、`batch` のいずれかを明示する。
- 各テストケースは `Given` / `When` / `Then` を原則1ブロックずつ記述する。
- `Given` の先頭で、共有 fixture YAML を必ず1つ `Fixture: ...` として指定する。
- `Given` には fixture 参照だけでなく、テスト開始時に必要な状態を利用者視点で具体的に記述する。
- テストケース本文には fixture YAML に定義した具体的な値を重複して記述しない。
- `When` → `Then` → `When` のように操作と期待結果を交互に繰り返さず、独立した振る舞いは別ケースに分割する。
- fixture の構造、継承、既定値、timestamp、namespace は [`fixture/README.md`](./fixture/README.md) を正とし、別文書へ重複定義しない。
- ケースを追加・移動・削除したときは README の索引も同じ変更で更新する。

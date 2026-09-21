# E2E テスト規約

## 対象と実行前提

- `mise run e2e` で Playwright を実行する。
- Deck / Card の remote data は Firestore emulator、認証は Firebase Auth emulator を使用する。
- Google account 連携は Auth emulator の local popup flow で確認し、実際の外部 identity provider には接続しない。
- 設定は従来どおり browser storage に保存する。Deck、Card、StudySession、StudyAnswer は匿名・通常ログインとも同じ Firestore API と永続 cache を使用する。単一タブを対象とし、同じ学習状態を複数端末から同時更新する使い方は対象外とする。
- E2E は代表的な利用者導線を対象とし、各 validation rule や設定・入力手段の組み合わせは unit / component test で確認する。

## 保存先の用語

- `local-only`: 匿名 UID で Firestore の永続 cache を利用し、同期を停止している状態を指す。保存先を選ぶ Deck ごとの mode は存在しない。
- `remote`: 通常アカウントの UID で同じ永続 cache を使い、Firestore の標準同期を有効にした状態を指す。
- 初回の匿名認証には通信が必要。同じ匿名 UID と browser 保存領域が残る場合だけ reload 後も復元する。
- `offline cache`: Firestore SDK が管理する端末内データと保留書き込みを指す。アプリ独自の outbox や再送キューは持たない。
- 作成・編集・削除・インポート・回答の操作完了はローカル snapshot への反映で判定する。クラウドの応答や server timestamp の確定を待たない。
- 検出した初期化・保存・同期エラーは表示する。永続化非対応環境への別 DB による代替は提供しない。

## カテゴリと分離

- `read`: 永続データを変更せず、並列実行の対象とする。
- `write`: ケースごとに分離したデータへ1つの論理操作を永続化し、並列実行の対象とする。
- `batch`: Deck / Card 群、保存先、認証スコープなど複数のリソースを一括で変更する。
- すべてのカテゴリで UID、document ID、browser storage、学習 session をケースごとに分離し、test と retry の間でも識別子を共有しない。
- すべての test case は並列実行でき、同時に実行された別の test case のデータや認証状態に依存しない。

## テストケースの書式

- ID の prefix は仕様ファイル名から `.md` を除いて大文字化する（例: `card-view.md` → `CARD-VIEW`）。
- 各ファイルのケースを記載順に `01` から欠番なく採番する。番号は最低2桁のゼロ埋めとする（例: `CARD-VIEW-01`、`CARD-VIEW-02`）。
- ケースの追加・移動・削除時は必要に応じて振り直し、索引・anchor・Playwright のテスト名・unit / integration test の参照も同時に更新する。

- 各 ID をちょうど一つの Playwright test に対応させる。
- 詳細仕様の Markdown は `docs/e2e` 直下に置く。E2E contract check はこの階層の Markdown を読み取る。
- 各テストケースには `read`、`write`、`batch` のいずれかのカテゴリを明示する。
- テストケースは `Given` / `When` / `Then` で記述し、それぞれ原則1ブロックとする。
- `Given` の先頭で共有 fixture YAML を必ず1つ `Fixture: ...` として指定する。
- `Given` には fixture 参照だけでなく、テスト開始時に必要な状態を利用者視点で具体的に記述する。
- テストケース本文には、fixture YAML に定義した具体的な値を重複して記述しない。
- `When` → `Then` → `When` のように、操作と期待結果を交互に繰り返さない。
- 複数の独立した振る舞いを確認する場合は、テストケースを分割する。
- テストケースを追加・移動したときは、[README の索引](./README.md#テストケース索引)も同じ変更で更新する。

## 共通の期待結果

- `browser error` は、処理されていない page error または予期しない console error を指す。
- 正常系では browser error が発生しないことを確認する。
- 異常系では想定したエラーが画面上で処理され、browser error として残らないことを確認する。

## 変更時の確認

- `npm run lint:e2e-contract`: README の索引、詳細仕様、fixture、Playwright test の対応を確認する。
- `npm run lint:markdown`: Markdown の構文と形式を確認する。
- `mise run e2e`: E2E test を実行する。

# E2E Documentation Instructions

## Directory contract

- `docs/test/e2e/*.md` は `AGENTS.md` を除き、すべて E2E テスト仕様書とする。
- 一般的な説明、索引、規約文書を `docs/test/e2e` 直下に追加しない。
- E2E 仕様書の記述規約はこの `AGENTS.md` を正とする。
- 各仕様書は1つ以上の E2E test case を含む。
- 詳細仕様の Markdown は `docs/test/e2e` 直下へ置く。
- 大きな仕様書は、対象 entity だけでなく、表示・管理・一覧操作や session・controls のような利用者の振る舞いで分割する。
- fixture の構造、継承、既定値、timestamp、namespace は [`fixture/README.md`](./fixture/README.md) を正とする。

## 対象と実行前提

- `mise run e2e` で Playwright を実行する。
- Deck / Card の remote data は Firestore emulator、認証は Firebase Auth emulator を使用する。
- Google account 連携は Auth emulator の local popup flow で確認し、実際の外部 identity provider には接続しない。
- 設定は browser storage に保存する。Deck、Card、StudySession、StudyAnswer は匿名・通常ログインとも同じ Firestore API と永続 cache を使用する。
- 単一タブを対象とし、同じ学習状態を複数端末から同時更新する使い方は対象外とする。
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
- 各ファイルのケースを記載順に `01` から欠番なく採番する。番号は最低2桁のゼロ埋めとする。
- ケースの追加・移動・削除時は必要に応じて振り直し、anchor、Playwright のテスト名、unit / integration test の参照も同時に更新する。
- 各 ID を少なくとも一つの Playwright test に対応させる。同じ ID を複数テストで確認してよく、一つのテストで複数 ID を確認してもよい。テスト名の先頭は fixture 選択用の主 ID とし、追加の ID はその直後に空白区切りで記載する。
- 各テストケースには `read`、`write`、`batch` のいずれかのカテゴリを明示する。
- テストケースは `Given` / `When` / `Then` で記述し、それぞれ原則1ブロックとする。
- `Given` の先頭で共有 fixture YAML を必ず1つ `Fixture: ...` として指定する。
- `Given` には fixture 参照だけでなく、テスト開始時に必要な状態を利用者視点で具体的に記述する。
- テストケース本文には fixture YAML に定義した具体的な値を重複して記述しない。
- `When` → `Then` → `When` のように操作と期待結果を交互に繰り返さない。
- 複数の独立した振る舞いを確認する場合はテストケースを分割する。

## Contract

- `docs/test/e2e/*.md` の仕様書に定義した test case を Playwright test がすべて網羅しなければならない。
- Playwright 側に仕様書に存在しない E2E test case を追加してはならない。
- 詳細仕様での E2E case ID の重複を禁止する。複数テストで同じ仕様 ID を共有することは許可する。
- 仕様 ID の記載漏れは `npm run lint:test-specs` で簡易チェックする。fixture は E2E の global setup で browser 起動前に検証する。
- 手動で管理する E2E case ID の索引は作成しない。仕様書を single source of truth とする。

## 共通の期待結果

- `browser error` は、処理されていない page error または予期しない console error を指す。
- 正常系では browser error が発生しないことを確認する。
- 異常系では想定したエラーが画面上で処理され、browser error として残らないことを確認する。

## 変更時の確認

- `npm run lint:test-specs`: E2E・Firestore・Storybook の仕様 ID が、各テストソース内の文字列先頭にあるかを確認する。Storybook は `play` の step 名に ID を付ける。テストランナーや browser / emulator は起動しない。
- `npm run lint:markdown`: Markdown の構文と形式を確認する。
- `mise run e2e`: 全 fixture の検証後に E2E test を実行する。

この lint は正規表現による文字列照合のみとし、1:1・重複・コメント・skip・実行条件は判定しない。テストの網羅性やアサーションの内容・実行結果はレビューとテスト実行で確認する。

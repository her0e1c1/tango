# E2E Documentation Instructions

## Directory contract

- Pair each specification `<name>.md` with `test/e2e/<name>.spec.ts`; the basenames must match one-to-one.
- 各仕様書のケース ID を参照する E2E テストは、対応するテストファイルにまとめる。ケースとテストの 1:1 対応は `test/e2e/AGENTS.md` に従う。
- Exclude `AGENTS.md`, `README.md`, fixtures, and helpers from file pairing. Keep explicit `[TODO]` cases in the specification without empty or skipped tests; a fully pending specification retains a paired test module with a TODO comment.

- `docs/test/e2e/*.md` は `README.md` と `AGENTS.md` を除き、すべて E2E テスト仕様書とする。
- ケース一覧の README は作成しない。各仕様書内の一覧とケースを正とする。
- 一般的な説明や規約文書を `docs/test/e2e` 直下に追加しない。
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
- E2E は代表的な利用者導線を対象とし、各 validation rule や設定・入力手段の組み合わせは unit / Playwright IT で確認する。
- E2E は利用者の一連の操作と、表示・利用可否・再読み込みや別ブラウザーで利用できる内容を確認する。store の状態投入と外部 I/O の差し替えで独立して確認できる表示・入力・待機・通知・遷移の条件違いは [Playwright IT](../integration/playwright/AGENTS.md) へ整理する。
- サーバー document の保存形式・保持、購読 Adapter、Rules などバックエンドだけの契約は [Firestore IT](../integration/firestore/AGENTS.md) に置く。E2E の操作後に内部フィールドを確認することを、その利用者導線の目的にしない。

## 保存先の用語

- `local-only`: 匿名 UID で Firestore の永続 cache を利用し、同期を停止している状態を指す。保存先を選ぶ Deck ごとの mode は存在しない。
- `remote`: 通常アカウントの UID で同じ永続 cache を使い、Firestore の標準同期を有効にした状態を指す。
- 初回の匿名認証には通信が必要。同じ匿名 UID と browser 保存領域が残る場合だけ reload 後も復元する。
- `offline cache`: Firestore SDK が管理する端末内データと保留書き込みを指す。アプリ独自の outbox や再送キューは持たない。
- 通常アカウントの作成・編集・削除・インポート・回答は、サーバーの保存成功を待って完了する。オフライン中は保存待ちとし、ローカル snapshot への反映と保存成功を区別する。匿名の `local-only` は通信を停止したままサーバー応答を待たずに操作を進め、ローカル snapshot から表示を更新する。
- 保存中にアカウントが変わった場合は、以前の操作の成功・失敗を新しいアカウントへ通知せず、古い結果で画面遷移や現在の選択の終了を行わない。完了した古い処理のロックは解除し、新しい操作を妨げない。
- 検出した初期化・保存・同期エラーは表示する。永続化非対応環境への別 DB による代替は提供しない。

## カテゴリと分離

- `read`: 永続データを変更せず、並列実行の対象とする。
- `write`: ケースごとに分離したデータへ1つの論理操作を永続化し、並列実行の対象とする。
- `batch`: Deck / Card 群、保存先、認証スコープなど複数のリソースを一括で変更する。
- すべてのカテゴリで UID、document ID、browser storage、学習 session をケースごとに分離し、test と retry の間でも識別子を共有しない。
- すべての test case は並列実行でき、同時に実行された別の test case のデータや認証状態に依存しない。

## 振る舞いベースの記述

- `Given` は利用開始時の状態、`When` は利用者の操作や通信断・期限到来などの外部から起きる事象、`Then` は観測できる結果を記述する。画面表示、操作可否、遷移先、読み上げ、再読み込み後の内容、別ブラウザーへの同期などで成否を判断できるようにする。
- 関数・hook・store・内部フィールド・DB の構造、SDK の保存手順、購読の解除順、タイマーや呼び出しの個数を、E2E の期待結果にしない。例えば「同じ ID でキューへ保存する」ではなく「再接続後も重複せず同じ内容を利用できる」と記述する。
- mock、emulator、seed、ID の取得、時計の進め方など、テストを実装する手順をケース本文に書かない。共通の実行前提はこのファイル、fixture の準備は `fixture/README.md`、テスト実装の規約はテスト側で扱う。
- 利用者向けの URL、CSV の列と文字コード、画面の項目名、読み上げ名、表示件数や時間など、外部から確認できる契約は具体的に残す。単に内部用語を削って期待結果を曖昧にしない。
- 内部の計算・保存形式や未実装の将来案を、現在の E2E ケースの期待結果へ混在させない。別のテスト層で扱う仕様への関連リンクは残してよいが、その内部契約を E2E 本文に重複させない。
- 記述の書き換えだけでは既存の ID・anchor・カテゴリ・fixture 参照を変えず、期待する振る舞いの追加・削除とは区別する。テストコードを変更していない場合に、書き換えた期待結果をすべて実行検証済みとは扱わない。

## テストケースの書式

- ID の prefix は仕様ファイル名から `.md` を除いて大文字化する（例: `card-view.md` → `CARD-VIEW`）。
- 各仕様書のケースは正常系、異常系の順に並べ、各区分内では `read` を先に、`write` と `batch` を後に置く。書き込みは操作内容に応じて Create、Update、Delete の順に並べる。CRUD に当てはめにくい操作は利用の流れに沿って並べ、同じ操作の条件違いや `[TODO]` も同じ位置にまとめる。仕様書内の一覧も本文と同じ順にする。
- ID の番号は最低2桁のゼロ埋めとする。新規ケースはファイル内の最大番号の次から採番し、並べ替えだけでは既存の ID・anchor を変更しない。
- ケースの移動先が別ファイルになるなど ID の変更が必要な場合は、anchor、Playwright のテスト名、unit / integration test の参照も同時に更新する。
- 各ケース ID と Playwright test の対応は `test/e2e/AGENTS.md` の 1:1 規約に従う。
- 各テストケースには `read`、`write`、`batch` のいずれかのカテゴリと、[共通規約](../AGENTS.md#正常系異常系の区分) に従った区分を明示する。
- テストケースは `Given` / `When` / `Then` で記述し、それぞれ原則1ブロックとする。
- `Given` の先頭で共有 fixture YAML を必ず1つ `Fixture: ...` として指定する。
- `Given` には fixture 参照だけでなく、テスト開始時に必要な状態を利用者視点で具体的に記述する。
- テストケース本文には fixture YAML に定義した具体的な値を重複して記述しない。
- `When` → `Then` → `When` のように操作と期待結果を交互に繰り返さない。
- 複数の独立した振る舞いを確認する場合はテストケースを分割する。

## Contract

- `docs/test/e2e/*.md` の仕様書に定義した test case を Playwright test がすべて網羅しなければならない。
- Playwright 側に仕様書に存在しない E2E test case を追加してはならない。
- 詳細仕様での E2E case ID の重複を禁止する。
- 仕様 ID の記載漏れは `npm run lint:test-specs` で簡易チェックする。fixture は E2E の global setup で browser 起動前に検証する。
- 別ファイルで手動管理する E2E case ID の索引を作成しない。個々の仕様書を single source of truth とする。

## 共通の期待結果

- `browser error` は、処理されていない page error または予期しない console error を指す。
- 以下はすべての E2E ケースに適用し、ケース本文に重複して記載しない。
- 正常系では browser error が発生しないことを確認する。
- 異常系では想定したエラーが画面上で処理され、browser error として残らないことを確認する。ただし、障害復旧の契約としてブラウザーの診断を保持するケースでは、ケース本文に明記した診断だけを許容し、それ以外の browser error は発生しないことを確認する。

## 保存・復旧を扱うケースの共通契約

- 通常アカウントの作成・編集・削除・インポート・回答はサーバーの保存結果がそろってから完了し、再読み込み後も利用できる内容で確認する。保存受付や画面内の一時表示だけを永続化の成功としない。
- 保存の失敗は画面で確認でき、利用者が再試行したときに内容を失わず、同じ操作のデータを重複して作成しない。成功した保存と失敗した保存が混在する場合は、実際に保存された内容に従って再開する。
- 匿名利用の保存は同じ匿名アカウントのブラウザーだけに保持される。オフライン操作は再接続を待たずに利用でき、再読み込み・再接続後もクラウドに複製されない。
- アカウントを切り替えると以前のアカウントの Deck・Card・学習位置・学習記録を混在させない。以前の操作の完了で現在の画面を別のアカウントの内容へ戻さない。
- 復旧操作では、ケースに明記された対象以外の保存データを消去しない。全ローカルデータの削除が必要な復旧は、利用者が明示的に選んだ場合だけ実行する。
- 学習を再開するだけでは回答数や開始数を増やさない。新たに始めた学習は別の学習として扱い、最後まで終えた学習だけを完了数に含める。

## 変更時の確認

- `npm run lint:test-specs`: E2E・Firestore・Playwright の未 TODO 仕様 ID が各対象 runner のテストソース内の文字列先頭にあるかを確認する。退役表にある旧 Storybook ID と残存 play の参照も別に確認し、旧 play を Playwright 実装の証拠にはしない。テストランナーや browser / emulator は起動しない。
- `npm run lint:markdown`: Markdown の構文と形式を確認する。
- `mise run e2e`: 全 fixture の検証後に E2E test を実行する。

この lint は正規表現による文字列照合のみとし、1:1・重複・コメント・skip・実行条件は判定しない。テストの網羅性やアサーションの内容・実行結果はレビューとテスト実行で確認する。

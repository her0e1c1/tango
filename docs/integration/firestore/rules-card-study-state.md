# CardStudyState Firestore Rules 結合テスト仕様書

## 目的

実際の `firestore.rules` に対する CardStudyState entity の許可・拒否を、認証主体と SDK 操作の組み合わせで確認する。

対応ファイル: [`rules.spec.ts`](../../../test/integration/firestore/rules.spec.ts)

## 共通前提

`test-rule` project で実際の `firestore.rules` を読み込む。Given の事前 document は Rules 無効化 context で準備し、When は Rules 有効の context から直接 SDK を呼ぶ。非匿名認証は `google.com`、匿名認証は `anonymous`、未認証は認証情報なしとする。アプリケーションの schema validation は通さない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-RULES-CARD-STUDY-STATE-01 | write | [本人が任意の状態を作成・読取・更新・削除でき、同一性は変更できない](#firestore-rules-card-study-state-01) |
| FIRESTORE-RULES-CARD-STUDY-STATE-02 | write | [公開 Card の State も本人以外はアクセスできない](#firestore-rules-card-study-state-02) |
| FIRESTORE-RULES-CARD-STUDY-STATE-03 | write | [状態の同一性・メタデータ・所有 Card を検証する](#firestore-rules-card-study-state-03) |
| FIRESTORE-RULES-CARD-STUDY-STATE-04 | write | [区切り文字と Unicode を含む決定的 ID を許可する](#firestore-rules-card-study-state-04) |

<a id="firestore-rules-card-study-state-01"></a>

### FIRESTORE-RULES-CARD-STUDY-STATE-01 本人が任意の状態を作成・読取・更新・削除でき、同一性は変更できない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-CARD-STUDY-STATE-01] permits optional owner state and keeps its identity stable`

Given:

- State がない本人所有の Card がある。

When:

- Card を単体取得し、fsrs: null の State を作成して単体取得・本人 UID 条件付き query を行い、有効な FSRS へ更新する。
- UID・Card ID・作成日時の変更を試み、State の削除と再削除を行う。

Then:

- Card の読取と、State の作成・単体取得・query・FSRS 更新・削除は許可される。
- UID・Card ID・作成日時の変更は拒否される。State がない場合の削除も no-op として許可する。

<a id="firestore-rules-card-study-state-02"></a>

### FIRESTORE-RULES-CARD-STUDY-STATE-02 公開 Card の State も本人以外はアクセスできない

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-CARD-STUDY-STATE-02] keeps public Card state private from %s`

Given:

- 公開 Card と本人の State がある。

When:

- 他ユーザー・同一 UID の匿名・未認証で Card の単体読取と、State の単体・一覧読取、書込・更新・削除を試みる。
- 存在しない State の削除も試みる。

Then:

- Card の単体読取は許可されるが、試みた State への全操作は拒否される。既存 State と未作成 State のどちらも、本人以外による削除は拒否される。

<a id="firestore-rules-card-study-state-03"></a>

### FIRESTORE-RULES-CARD-STUDY-STATE-03 状態の同一性・メタデータ・所有 Card を検証する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-CARD-STUDY-STATE-03] rejects invalid identity, metadata and unrelated Cards`

Given:

- 本人の Deck と Card がある。

When:

- 異なる document ID、version 2、重複 id、異なる Deck、非 map の FSRS、文字列の作成日時、小数の更新日時、他人所有または削除済み Card の State を保存する。
- 本人の正常な Card に、空 map、難易度 0・無限大 stability を持つ FSRS、負の作成日時・年9999上限を超える整数の更新日時を保存する。

Then:

- 同一性・外側の型・所有権に違反する前者は拒否され、後者は許可される。Rules は FSRS を null または map、メタデータ日時を整数としてのみ検証する。
- これはサーバー側のデータ整合性保証を意図的に減らす変更である。本人がアプリを迂回すると不正 FSRS を保存できる。詳細な範囲・必須項目は Zod/Adapter が検証し、不正データで本人の購読・学習が失敗し得る。未評価への読み替えはしない（[Adapter の検証](card-study-state.md#firestore-card-study-state-03)）。

<a id="firestore-rules-card-study-state-04"></a>

### FIRESTORE-RULES-CARD-STUDY-STATE-04 区切り文字と Unicode を含む決定的 ID を許可する

カテゴリ: `write`

対応テスト: `[FIRESTORE-RULES-CARD-STUDY-STATE-04] accepts delimiter and Unicode characters in deterministic IDs`

Given:

- UID は a:日😀、Card ID は b:c😀 とする。

When:

- UID の長さを接頭辞とした State ID で本人が保存し、削除と再削除を行う。

Then:

- 許可される。Deck ID は識別子に含まれない。

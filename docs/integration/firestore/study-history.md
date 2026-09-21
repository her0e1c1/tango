# Study History Firestore 結合テスト仕様書

## 目的

StudySession の開始・完了履歴を期間と Deck で取得する購読契約を確認する。

対応ファイル: [`study-history.spec.ts`](../../../test/integration/firestore/study-history.spec.ts)

関連 E2E: [STUDY-SESSION-09](../../e2e/study-session.md#study-session-09)、[STUDY-SESSION-12](../../e2e/study-session.md#study-session-12)

## 共通前提

非匿名認証の UID `uid` で接続する。保存データと query 条件はこのケース内で準備し、日別集計や UI の表示形式を対象にしない。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-HISTORY-01 | batch | [期間と Deck による履歴取得を cache と権限境界を含めて確認できる](#firestore-study-history-01) |

<a id="firestore-study-history-01"></a>

### FIRESTORE-STUDY-HISTORY-01 期間と Deck による履歴取得を cache と権限境界を含めて確認できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-HISTORY-01] reads period and Deck filters online and from cache`

Given:

- 本人の UID と他テストと重ならない期間 `[start, start + 1)` を用意し、次の session を SDK の batch で保存する。

When:

- `subscribeStudyHistory` で started / completed を、それぞれ Deck 指定なし・対象 Deck 指定ありで取得する。
- ネットワーク停止後、対象 Deck の履歴を再購読する。ネットワーク復旧後に別 UID の履歴を要求する。

Then:

- オンラインでは cache 以外の snapshot を待ち、下表の件数・値を取得する。started は開始日時、completed は完了日時を使い、abandoned を完了に数えない。
- オフラインの started snapshot は `fromCache: true` で130件、completed は1件である。
- 別 UID の履歴取得は `permission-denied` をエラー callback に通知する。

#### 事前データと期待結果

| Deck | 件数 | startedAt | endedAt | endReason |
| --- | --- | --- | --- | --- |
| 対象 | 130 | start | null | null |
| 別 Deck | 1 | start | start | completed |
| 対象 | 1 | start - 1 | start | completed |
| 対象 | 1 | start - 1 | start | abandoned |
| 対象 | 1 | start + 1 | start + 1 | completed |

| 指標 | Deck 条件 | 期待結果 |
| --- | --- | --- |
| started | 指定なし | 131件 |
| completed | 指定なし | 対象 Deck と別 Deck の各1件 |
| started | 対象 Deck | `{ deckId, occurredAt: start }` が130件 |
| completed | 対象 Deck | `{ deckId, occurredAt: start }` が1件 |

終了境界 `start + 1` の session は期間外として扱う。各 record の sessionId は文字列、cardCount は `1` である。started の対象 record は startedAt `start`・endedAt `null`・endReason `null` を持つ。completed の対象 record は startedAt `start - 1`・endedAt `start`・endReason `completed` を持つ。

130件の取得を確認するが、負荷試験や無制限の件数保証ではない。
日別の表示・集計 UI は E2E の責務であり、このケースは取得 record の契約を扱う。

# Study History Firestore 結合テスト仕様書

## 目的

StudySession の開始・完了履歴と回答履歴を、期間・Deck・所有者の条件に従って取得できることを確認する。
サーバーから取得した結果と端末内の結果を区別し、日別集計や UI の表示形式は対象にしない。

関連 E2E: [STUDY-SESSION-09](../../e2e/study-session.md#study-session-09)、[STUDY-SESSION-12](../../e2e/study-session.md#study-session-12)

共通の実行・検証前提は [AGENTS.md](./AGENTS.md#共通前提) を参照する。

差分の再開境界と取得中の競合は [差分同期](./incremental-sync.md) で確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| FIRESTORE-STUDY-HISTORY-01 | batch | 正常系 / 異常系 | [期間と Deck による履歴取得を cache と権限境界を含めて確認できる](#firestore-study-history-01) |
| FIRESTORE-STUDY-HISTORY-02 | read | 正常系 / 異常系 | [回答履歴の期間・順序・上限・cacheを確認する](#firestore-study-history-02) |
| FIRESTORE-STUDY-HISTORY-03 | read | 異常系 | [回答履歴の入力境界を検証する](#firestore-study-history-03) |
| FIRESTORE-STUDY-HISTORY-04 | batch | 正常系 | [回答の追加と同期状態を購読で受け取り解除後は更新しない](#firestore-study-history-04) |

<a id="firestore-study-history-01"></a>

### FIRESTORE-STUDY-HISTORY-01 期間と Deck による履歴取得を cache と権限境界を含めて確認できる

カテゴリ: `batch`

区分: 正常系 / 異常系

Given:

- 本人の UID に次の学習 session が保存されている。取得期間は `[start, start + 1)` とし、時刻の単位は Unix ミリ秒とする。
- 各 session は異なる識別子を持ち、cardCount は `1` である。

| Deck | 件数 | startedAt | endedAt | endReason |
| --- | --- | --- | --- | --- |
| 対象 | 130 | start | null | null |
| 別 Deck | 1 | start | start | completed |
| 対象 | 1 | start - 1 | start | completed |
| 対象 | 1 | start - 1 | start | abandoned |
| 対象 | 1 | start + 1 | start + 1 | completed |

- オンライン取得、対象 Deck の履歴を取得済みのオフライン取得、別 UID の取得を、独立した条件として確認する。

When:

- 対象の通信状態・UID・Deck 条件で、公開された履歴購読を開始する。開始履歴と完了履歴はそれぞれ指定して取得する。

Then:

- 本人のオンライン取得では、サーバーと同期した結果が次の表に一致する。

| 指標 | Deck 条件 | 期待結果 |
| --- | --- | --- |
| started | 指定なし | 131件 |
| completed | 指定なし | 対象 Deck と別 Deck の各1件 |
| started | 対象 Deck | `{ deckId, occurredAt: start }` が130件 |
| completed | 対象 Deck | `{ deckId, occurredAt: start }` が1件 |

- started は開始日時、completed は完了日時を期間判定に使い、abandoned を完了に数えない。終了境界 `start + 1` は含めない。
- 各 record の sessionId は文字列、cardCount は `1` である。対象 Deck の started record は startedAt `start`・endedAt `null`・endReason `null`、completed record は startedAt `start - 1`・endedAt `start`・endReason `completed` を持つ。
- 本人のオフライン取得では、対象 Deck の開始履歴130件・完了履歴1件を cache の結果として返し、サーバーと同期済みの結果として扱わない。
- 別 UID の取得では、公開されたエラー通知に `permission-denied` が届く。
- 130件という入力例を確認し、無制限の件数保証や負荷試験とは扱わない。

<a id="firestore-study-history-02"></a>

### FIRESTORE-STUDY-HISTORY-02 回答履歴の期間・順序・上限・cacheを確認する

カテゴリ: `read`

区分: 正常系 / 異常系

Given:

- 本人の回答が保存されている。対象期間の開始時刻に、対象 Deck の again / hard / good / easy の4回答と別 Deck の1回答がある。
- 対象 Deck には、期間開始前・終了境界の回答が各1件と、不正な rating を持つ期間内の回答が1件ある。
- 同時刻の回答は異なる document ID を持つ。不正 rating は保存データを読む Adapter の検証対象とする。
- 次の取得条件をそれぞれ独立して確認する。

| 取得条件 | 前提 |
| --- | --- |
| 本人のオンライン取得 | Deck 指定あり・なし、上限2件・10件をそれぞれ指定する |
| ログイン済みのオフライン取得 | 対象範囲の履歴を端末内で参照できる |
| 匿名の取得 | 匿名利用者自身の履歴を端末内で参照できる |
| cache にない範囲の取得 | 通信がなく、指定した範囲の履歴が端末内にない |

When:

- 公開された回答履歴の購読操作へ、対象の期間・Deck・上限を指定する。

Then:

- answeredAt 降順、同時刻は document ID 降順で返す。半開区間外を除き、上限10件では Deck 指定ありで正常4件・指定なしで正常5件を返す。
- 不正回答を正常な回答へ補完せず、invalidCount で知らせる。上限2件では truncated、全件取得では非 truncated となる。
- オンラインの結果は server、オフラインと匿名の結果は cache と区別される。cache にない範囲は cache の0件となり、サーバー上にも履歴がないとは断定しない。

<a id="firestore-study-history-03"></a>

### FIRESTORE-STUDY-HISTORY-03 回答履歴の入力境界を検証する

カテゴリ: `read`

区分: 異常系

Given:

- 現在の認証済み利用者は UID `uid` である。
- ほかの条件は有効とし、次のいずれか一つだけが不正な取得条件を独立した入力例とする。

| 不正にする条件 | 入力例 |
| --- | --- |
| 所有者 | 空 UID、現在の利用者と異なる UID |
| Deck | 空の Deck ID |
| 期間 | 開始が終了より後、開始と終了が同じ、非有限の時刻 |
| 取得上限 | 0、小数、1001件 |

When:

- 公開された回答履歴の購読操作へ、対象の不正条件を指定する。

Then:

- 入力を拒否し、正常な取得結果として返さない。
- この拒否は Adapter の入力検証であり、Rules の認可成功・失敗を保証するものではない。

<a id="firestore-study-history-04"></a>

### FIRESTORE-STUDY-HISTORY-04 回答の追加と同期状態を購読で受け取り解除後は更新しない

カテゴリ: `batch`

区分: 正常系

Given:

- 本人の対象 Deck と期間に回答はなく、上限10件で購読している。
- 同じ本人 UID の別クライアントからも回答を保存できる。

When:

- オフラインで公開された回答保存操作を使って good の回答を1件保存し、再接続する。
- 別クライアントから同じ範囲に easy の回答を追加する。
- 購読を解除してから、別クライアントから同じ範囲に again の回答を追加する。

Then:

- 最初は server の0件が届き、オフラインの保存は cache の1件かつ未同期として届く。
- 再接続後は同じ1件が server かつ同期済みとなる。回答内容が同じでも同期状態の変化を通知する。
- 購読し直さず、別クライアントの追加を含む2件が表示される。
- 解除後に受信側の独立した監視が server の again を確認した時点でも、解除済みの購読には通知が増えず good と easy の2件の結果が残る。

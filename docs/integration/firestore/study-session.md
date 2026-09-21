# StudySession Firestore 結合テスト仕様書

## 目的

学習順序・位置と開始・中断・完了の保存、購読による復元、SDK のオフライン queue を確認する。

対応ファイル: [`study-session.spec.ts`](../../../test/integration/firestore/study-session.spec.ts)

関連 E2E: [STUDY-SESSION-01](../../e2e/study-session.md#study-session-01)、[STUDY-SESSION-03](../../e2e/study-session.md#study-session-03)、[STUDY-SESSION-05](../../e2e/study-session.md#study-session-05)、[PERSISTENCE-02](../../e2e/persistence.md#persistence-02)

## 共通前提

本人の非匿名認証 UID は `uid` とし、ケースごとに Deck ID と store を分離する。学習設定はシャッフルなし・枚数制限なし。特記しない限り Card の順序は `first`、`second`、`third` の3枚とする。
詳細な実行・cleanup の前提は [README](./README.md) を参照する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-STUDY-SESSION-01 | batch | [学習順序と位置を保存し再購読で復元できる](#firestore-study-session-01) |
| FIRESTORE-STUDY-SESSION-02 | batch | [離脱だけでは終了せず明示的な再開始で旧 session を中断する](#firestore-study-session-02) |
| FIRESTORE-STUDY-SESSION-03 | write | [最後の Card を一度だけ完了し開始時のメタデータを維持する](#firestore-study-session-03) |
| FIRESTORE-STUDY-SESSION-04 | batch | [オフラインで開始・位置更新・中断した session を同じ ID で同期できる](#firestore-study-session-04) |
| FIRESTORE-STUDY-SESSION-05 | batch | [別 Deck の未送信書込があってもオフライン復元後に再開始できる](#firestore-study-session-05) |
| FIRESTORE-STUDY-SESSION-06 | read | [不正な document があっても有効な session の復元と再開始を妨げない](#firestore-study-session-06) |

<a id="firestore-study-session-01"></a>

### FIRESTORE-STUDY-SESSION-01 学習順序と位置を保存し再購読で復元できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-SESSION-01] restores saved order and cursor after resubscribing`

Given:

- 本人の新しい Deck ID と、順序 `first`、`second`、`third` の3枚を用意する。
- シャッフルなし・枚数制限なしで session の購読を開始する。

When:

- `startStudy` で開始し、`setStudySessionIndex` で位置を `1` にして送信完了を待つ。
- 購読を解除して session store を空にし、同じ UID で再購読する。
- `touchStudySession` の後、保存位置を `2` に更新する。

Then:

- `studySession/{sessionId}` に UID、deckId、固定された cardOrderIds、`currentIndex: 1` を保存する。
- startedAt・createdAt・updatedAt は Timestamp、endedAt・endReason は `null` であり、answers は保存しない。
- 再購読で同じ session ID・順序・位置 `1` を復元し、その後の更新で位置 `2` になる。
- 復元後と touch 後の lastStudiedAt は正数で、後続 snapshot で touch 後の値より小さくならない。購読エラーは発生しない。

このケースの復元は store の初期化と同じ Firestore インスタンスでの再購読を指す。新規 SDK インスタンス、ブラウザ reload、別端末の検証ではない。

<a id="firestore-study-session-02"></a>

### FIRESTORE-STUDY-SESSION-02 離脱だけでは終了せず明示的な再開始で旧 session を中断する

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-SESSION-02] abandons the previous session only on explicit restart`

Given:

- 本人の session を開始し、位置 `1` まで保存している。

When:

- 購読解除後に旧 session を取得し、再購読して同じ Deck の `startStudy` を実行する。
- その後、旧 session に遅れて届く位置更新を保存する。

Then:

- 購読を解除しただけでは旧 session の endReason は `null` のままである。
- 再開始後は旧 session の endReason が `abandoned`、endedAt が Timestamp になる。
- 新 session は旧 session と異なる ID、位置 `0`、endReason `null` で保存される。
- 遅延した位置更新後も旧 session の endReason は `abandoned` のままである。

<a id="firestore-study-session-03"></a>

### FIRESTORE-STUDY-SESSION-03 最後の Card を一度だけ完了し開始時のメタデータを維持する

カテゴリ: `write`

対応テスト: `[FIRESTORE-STUDY-SESSION-03] completes the final Card once and preserves lifecycle metadata`

Given:

- 本人の3枚の session が存在し、位置は最後の `2` である。開始時の createdAt と startedAt を取得している。

When:

- 同じ session に対して `moveStudySession` を実行し、送信完了後にもう一度実行する。

Then:

- 最初は `true`、2回目は `false` を返し、再開対象の session は store からなくなる。
- 保存位置は `2`、endReason は `completed`、endedAt は Timestamp になる。
- createdAt と startedAt は開始時の値を保持する。

<a id="firestore-study-session-04"></a>

### FIRESTORE-STUDY-SESSION-04 オフラインで開始・位置更新・中断した session を同じ ID で同期できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-SESSION-04] syncs offline creation, progress and abandonment`

Given:

- 本人の UID で購読中であり、SDK のネットワークを無効化している。

When:

- session を開始して位置を `1` に進め、`abandonStudySession` を実行して購読を解除する。
- cache を取得した後、store を空にし、ネットワークを戻して pending writes の完了を待つ。

Then:

- オフライン cache に `currentIndex: 1` と `endReason: "abandoned"` が反映される。
- 再接続後も同じ session ID に位置 `1` と `abandoned` が保存される。
- 本人の query 結果のうち対象 Deck に属する document は、その session ID の1件だけである。

<a id="firestore-study-session-05"></a>

### FIRESTORE-STUDY-SESSION-05 別 Deck の未送信書込があってもオフライン復元後に再開始できる

カテゴリ: `batch`

対応テスト: `[FIRESTORE-STUDY-SESSION-05] restarts offline while another Deck has pending writes`

Given:

- 本人の2つの Deck とそれぞれ3枚の Card が store にある。
- 対象 Deck の session を位置 `1` まで同期し、購読解除・ネットワーク停止・session store 初期化を行う。

When:

- 再購読して対象 Deck の位置を cache から復元する。
- オフラインで別 Deck の `startStudySession` を実行し、続けて対象 Deck を再開始する。最後にネットワークを戻して送信完了を待つ。

Then:

- 再購読で以前の位置を復元できる。別 Deck の開始は `true` を返し、別 Deck の Card 順序を store に保持する。
- 対象 Deck の再開始も `true` を返し、旧 session と異なる ID・位置 `0` になる。
- 再接続後、新 session の endReason は `null`、旧 session は `abandoned` である。

<a id="firestore-study-session-06"></a>

### FIRESTORE-STUDY-SESSION-06 不正な document があっても有効な session の復元と再開始を妨げない

カテゴリ: `read`

対応テスト: `[FIRESTORE-STUDY-SESSION-06] ignores malformed documents without blocking study`

Given:

- 本人の有効な session と、同じ UID だが必須項目がなく `answers: []` だけを持つ不正な document が存在する。
- 購読を解除し、session store を空にしている。

When:

- 再購読して有効な session の復元を待ち、同じ Deck の学習を再開始する。

Then:

- 有効な session ID が復元され、新 session は endReason `null` で保存される。
- 不正な document による購読エラー通知は発生しない。

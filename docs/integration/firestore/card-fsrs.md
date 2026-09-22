# Card FSRS Firestore 結合テスト仕様書

## 目的

Card.fsrs の購読・検証・UID 分離・削除と初期 readiness を確認する。FSRS の数値検証は Adapter、アクセス制御は Rules の契約とする。

対応ファイル: [`card-fsrs.spec.ts`](../../../test/integration/firestore/card-fsrs.spec.ts)

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-CARD-FSRS-01 | write | [null と評価済み Card を同じ購読で復元する](#firestore-card-fsrs-01) |
| FIRESTORE-CARD-FSRS-02 | read | [本人の Card だけを復元し停止でクリアする](#firestore-card-fsrs-02) |
| FIRESTORE-CARD-FSRS-03 | read | [不正 FSRS を未評価に読み替えない](#firestore-card-fsrs-03) |
| FIRESTORE-CARD-FSRS-04 | write | [削除 Card の状態を隠し他の Card は維持する](#firestore-card-fsrs-04) |
| FIRESTORE-CARD-FSRS-05 | read | [購読拒否を通知する](#firestore-card-fsrs-05) |
| FIRESTORE-CARD-FSRS-06 | write | [オフライン削除を再接続後も維持する](#firestore-card-fsrs-06) |

<a id="firestore-card-fsrs-01"></a>

### FIRESTORE-CARD-FSRS-01 null と評価済み Card を同じ購読で復元する

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-FSRS-01] restores null and rated Cards through one subscription`

Given:

- 本人の Deck と fsrs: null の Card がある。

When:

- アプリ購読を開始し、Card の fsrs と updatedAt を更新する。

Then:

- 最初は null、続く snapshot では保存した FSRS と更新時刻を取得する。

<a id="firestore-card-fsrs-02"></a>

### FIRESTORE-CARD-FSRS-02 本人の Card だけを復元し停止でクリアする

カテゴリ: `read`

対応テスト: `[FIRESTORE-CARD-FSRS-02] restores only the active UID and clears Cards on stop`

Given:

- 本人と別 UID の評価済み Card がある。

When:

- 本人 UID で購読し停止する。

Then:

- 本人の Card.fsrs のみ復元し、停止後は空になる。

<a id="firestore-card-fsrs-03"></a>

### FIRESTORE-CARD-FSRS-03 不正 FSRS を未評価に読み替えない

カテゴリ: `read`

対応テスト: `[FIRESTORE-CARD-FSRS-03] rejects invalid persisted FSRS: %j`

Given:

- FSRS は空 map、余分な field、難易度 0/11、state=new、stability 0/Infinity/NaN、dueAt -1/253402300800000、lastReviewedAt 1.5、reps 0、lapses > reps、learningSteps 0.5、scheduledDays 36501 を用いる。本人クライアントで Rules を通して保存する。

When:

- アプリ購読を開始する。

Then:

- Rules は map を許可するが Adapter の検証により ready が reject し、不正 Card を store に公開しない。

<a id="firestore-card-fsrs-04"></a>

### FIRESTORE-CARD-FSRS-04 削除 Card の状態を隠し他の Card は維持する

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-FSRS-04] hides deleted Card state without changing other Cards`

Given:

- 本人の同じ Deck に評価済み Card が2件ある。

When:

- 片方の Card を削除する。

Then:

- 残った Card の FSRS は維持され、削除 Card は学習対象にならない。独立した状態 document はない。

<a id="firestore-card-fsrs-05"></a>

### FIRESTORE-CARD-FSRS-05 購読拒否を通知する

カテゴリ: `read`

対応テスト: `[FIRESTORE-CARD-FSRS-05] surfaces a denied subscription`

Given:

- 本人の認証 context から他人の UID を購読する。

When:

- アプリ購読の ready を待つ。

Then:

- ready が reject する。

<a id="firestore-card-fsrs-06"></a>

### FIRESTORE-CARD-FSRS-06 オフライン削除を再接続後も維持する

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-FSRS-06] preserves offline deletion after reconnect`

Given:

- 本人の評価済み Card を購読済みである。

When:

- ネットワークを無効化して Card を削除し、再接続して保留書き込みを待つ。

Then:

- ローカル一覧から消え、サーバーにも tombstone が保存される。状態の別削除は不要である。

# CardStudyState Firestore 結合テスト仕様書

## 目的

個人学習状態の購読・検証・削除と初期 readiness を確認する。

対応ファイル: [`card-study-state.spec.ts`](../../../test/integration/firestore/card-study-state.spec.ts)

## 共通前提

専用 project `test-card-study-state` に実際の Rules を読み込む。ケースごとに独立した UID の非匿名 context と store を使用する。事前データは Rules 無効化 context でテスト内に作り、対象の購読・削除 API は mock しない。FSRS 数値の検証は Adapter、アクセス拒否は Rules の契約である。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| FIRESTORE-CARD-STUDY-STATE-01 | subscription | [旧 Card の値を参照せず欠落と null を未評価として扱う](#firestore-card-study-state-01) |
| FIRESTORE-CARD-STUDY-STATE-02 | subscription | [本人の State だけを復元し購読停止でクリアする](#firestore-card-study-state-02) |
| FIRESTORE-CARD-STUDY-STATE-03 | subscription | [不正データを未評価へ読み替えない](#firestore-card-study-state-03) |
| FIRESTORE-CARD-STUDY-STATE-04 | subscription | [削除対象と本人に属する State だけを削除する](#firestore-card-study-state-04) |
| FIRESTORE-CARD-STUDY-STATE-05 | subscription | [購読拒否を未評価へ読み替えない](#firestore-card-study-state-05) |

| FIRESTORE-CARD-STUDY-STATE-06 | write | [未取得の State も決定的 ID で削除できる](#firestore-card-study-state-06) |

<a id="firestore-card-study-state-01"></a>

### FIRESTORE-CARD-STUDY-STATE-01 旧 Card の値を参照せず欠落と null を未評価として扱う

カテゴリ: `subscription`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-01] treats missing and null state as unrated without copying legacy Card values`

Given:

- 本人の Deck と Card に旧 difficulty、閲覧履歴、有効な旧 studySchedule が残っている。

When:

- アプリ購読を開始し、State がない結果を確認した後、fsrs: null の State を保存する。

Then:

- どちらも fsrs: null として読み取れ、初期の State collection は空である。旧値をコピーしない。

<a id="firestore-card-study-state-02"></a>

### FIRESTORE-CARD-STUDY-STATE-02 本人の State だけを復元し購読停止でクリアする

カテゴリ: `subscription`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-02] restores only the active UID and clears state on stop`

Given:

- 本人と別 UID の State がある。

When:

- 本人 UID でアプリ購読を開始して停止する。

Then:

- 本人の値のみ復元し、停止後は store が空になる。

<a id="firestore-card-study-state-03"></a>

### FIRESTORE-CARD-STUDY-STATE-03 不正データを未評価へ読み替えない

カテゴリ: `subscription`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-03] rejects invalid persisted state: $name`

Given:

- schemaVersion 2 と外側の余分な field は Rules を無効にした管理用 setup で保存する。
- FSRS は空 map、余分な field、難易度 0/11、state=new、stability 0/Infinity/NaN、dueAt -1/253402300800000、lastReviewedAt 1.5、reps 0、lapses > reps、learningSteps 0.5、scheduledDays 36501 をそれぞれ用いる。本人所有の Card/Deck を用意し、通常の本人クライアントで Rules を通して保存する。
- Rules はこれらの map を許可するが、アプリの Zod/Adapter は不正な FSRS を拒否する契約とする。

When:

- アプリ購読を開始する。

Then:

- ready が reject し、State getter もエラーを投げる。新規状態として扱わない。

<a id="firestore-card-study-state-04"></a>

### FIRESTORE-CARD-STUDY-STATE-04 削除対象と本人に属する State だけを削除する

カテゴリ: `subscription`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-04] cleans up only existing state for the requested Card or Deck`

Given:

- 本人の同じ Deck に2件と別 Deck に1件の State がある。

When:

- Card 指定で1件を削除し、存在しない Card を指定し、続いて Deck 指定で削除する。

Then:

- 対象の State だけが消え、別 Deck の State は残る。欠落状態に新しい document を作らない。

<a id="firestore-card-study-state-05"></a>

### FIRESTORE-CARD-STUDY-STATE-05 購読拒否を未評価へ読み替えない

カテゴリ: `subscription`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-05] surfaces a denied subscription instead of an empty state`

Given:

- 本人の認証 context から他人の UID を購読する。

When:

- アプリ購読の ready を待つ。

Then:

- ready が reject し、State getter もエラーを投げる。

<a id="firestore-card-study-state-06"></a>

### FIRESTORE-CARD-STUDY-STATE-06 未取得の State も決定的 ID で削除できる

カテゴリ: `write`

対応テスト: `[FIRESTORE-CARD-STUDY-STATE-06] deletes uncached server state and tolerates missing state`

Given:

- サーバーに本人の State があるが、端末の cache と store にはない。

When:

- ネットワークを無効化し、その Card ID と State が存在しない別 Card ID の削除を実行して再接続する。

Then:

- 既存 State は削除され、欠落 State の削除は成功する。存在確認の追加 read はしない。

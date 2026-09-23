# FSRS 復習期限判定 単体テスト仕様書

## 目的

同じ基準時刻に対して、未評価・復習対象・未来の復習予定を一貫して区別できることを確認する。学習開始画面の表示、出題順、枚数制限、期限到来を検知するタイマーは対象外とする。

共通前提は [AGENTS.md](./AGENTS.md) を参照する。観測境界は `classifyFsrsState`、対応テストファイルは [fsrsRules.spec.ts][tests] とする。

## テストケース

| ID | カテゴリ | テストケース | 対応状況 |
| --- | --- | --- | --- |
| UNIT-FSRS-CLASSIFICATION-01 | read | [明示的な未評価状態を新規として扱う](#unit-fsrs-classification-01) | 既存対応 |
| UNIT-FSRS-CLASSIFICATION-02 | read | [期限と基準時刻の境界で復習対象を判定する](#unit-fsrs-classification-02) | 一部対応 |
| UNIT-FSRS-CLASSIFICATION-03 | read | [不正な状態を新規や復習予定に読み替えない](#unit-fsrs-classification-03) | 未対応 |

<a id="unit-fsrs-classification-01"></a>

### UNIT-FSRS-CLASSIFICATION-01 明示的な未評価状態を新規として扱う

カテゴリ: `read`

Given:

- FSRS 状態が明示的な `null` で、基準時刻が `t0` である。

When:

- この Card の復習状態を判定する。

Then:

- 結果は `new` になる。
- 存在しない復習期限や難易度を補って返さない。

対応テスト: [fsrsRules.spec.ts][tests] の `classifies absence as new without fabricating difficulty`。

対応状況: **既存対応**。判定結果が期限などを持たない `{ status: "new" }` であることを確認している。

<a id="unit-fsrs-classification-02"></a>

### UNIT-FSRS-CLASSIFICATION-02 期限と基準時刻の境界で復習対象を判定する

カテゴリ: `read`

Given:

- 有効な評価済み状態があり、期限は `t0 + 10日` である。
- `learning`・`review`・`relearning` の各段階について、次の基準時刻を独立した入力例とする。

| 基準時刻 | 期待する判定 |
| --- | --- |
| 期限の `1ミリ秒前` | future |
| 期限と同時刻 | due |
| 期限の `1ミリ秒後` | due |

When:

- 指定した基準時刻で復習状態を一度判定する。

Then:

- 判定は表の結果になり、期限と一致する時刻を復習対象に含める。
- 結果には元の期限をそのまま返す。
- 学習段階によって期限の比較条件は変わらず、日付単位への丸めを行わない。
- 判定によって入力状態を更新しない。

対応テスト: [fsrsRules.spec.ts][tests] の `saves and restores %s without changing the next calculation`。

対応状況: **一部対応**。既存テストは初回評価後の期限と同時刻で `due` になることを確認する。直前・直後、再学習中、返される期限、入力状態の不変性は未確認。

<a id="unit-fsrs-classification-03"></a>

### UNIT-FSRS-CLASSIFICATION-03 不正な状態を新規や復習予定に読み替えない

カテゴリ: `read`

Given:

- 基準時刻は `t0` とする。
- `undefined`、必要な値を持たない空オブジェクト、有効な評価済み状態の期限だけを `NaN` にした値を、それぞれ独立した不正入力例とする。

When:

- 不正な入力の復習状態を判定する。

Then:

- 入力を拒否し、`new`・`due`・`future` のいずれの正常な判定結果も返さない。
- 値の欠落や不正期限を、明示的な未評価状態 `null` と同一視しない。

対応テスト: [fsrsRules.spec.ts][tests] に追加する対象。既存の対応タイトルなし。

対応状況: **未対応**。不正入力を渡した期限判定の assertion はまだない。外部データを取得する処理や、エラーの UI 表示はこのケースに含めない。

[tests]: ../../../../src/entities/card/model/fsrsRules.spec.ts

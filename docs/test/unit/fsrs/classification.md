# FSRS 復習期限判定 単体テスト仕様書

## 目的

同じ基準時刻に対して、未評価・復習対象・未来の復習予定を一貫して区別できることを確認する。学習開始画面の表示、出題順、枚数制限、期限到来を検知するタイマーは対象外とする。

共通前提は [AGENTS.md](./AGENTS.md) を参照する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| UNIT-FSRS-CLASSIFICATION-01 | read | 正常系 | [明示的な未評価状態を新規として扱う](#unit-fsrs-classification-01) |
| UNIT-FSRS-CLASSIFICATION-02 | read | 正常系 | [期限と基準時刻の境界で復習対象を判定する](#unit-fsrs-classification-02) |
| UNIT-FSRS-CLASSIFICATION-03 | read | 異常系 | [不正な状態を新規や復習予定に読み替えない](#unit-fsrs-classification-03) |
| UNIT-FSRS-CLASSIFICATION-04 | read | 異常系 | [不正な基準時刻では復習状態を判定しない](#unit-fsrs-classification-04) |

<a id="unit-fsrs-classification-01"></a>

### UNIT-FSRS-CLASSIFICATION-01 明示的な未評価状態を新規として扱う

カテゴリ: `read`

区分: 正常系

Given:

- FSRS 状態が明示的な `null` で、基準時刻が `t0` である。

When:

- この Card の復習状態を判定する。

Then:

- 結果は `new` になる。
- 存在しない復習期限や難易度を補って返さない。

<a id="unit-fsrs-classification-02"></a>

### UNIT-FSRS-CLASSIFICATION-02 [TODO] 期限と基準時刻の境界で復習対象を判定する

カテゴリ: `read`

区分: 正常系

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

<a id="unit-fsrs-classification-03"></a>

### UNIT-FSRS-CLASSIFICATION-03 [TODO] 不正な状態を新規や復習予定に読み替えない

カテゴリ: `read`

区分: 異常系

Given:

- 基準時刻は `t0` とする。
- `undefined`、必要な値を持たない空オブジェクト、有効な評価済み状態の期限だけを `NaN` にした値を、それぞれ独立した不正入力例とする。

When:

- 不正な入力の復習状態を判定する。

Then:

- 入力を拒否し、`new`・`due`・`future` のいずれの正常な判定結果も返さない。
- 値の欠落や不正期限を、明示的な未評価状態 `null` と同一視しない。

<a id="unit-fsrs-classification-04"></a>

### UNIT-FSRS-CLASSIFICATION-04 [TODO] 不正な基準時刻では復習状態を判定しない

カテゴリ: `read`

区分: 異常系

Given:

- FSRS 状態は未評価の `null`、または有効な評価済み状態である。
- 基準時刻は `-1`、`NaN`、`t0 + 0.5` のいずれかであり、有効な非負整数の Unix ミリ秒ではない。状態と時刻の各組み合わせを独立した入力例とする。

When:

- 指定した基準時刻で復習状態を判定する。

Then:

- 基準時刻を拒否し、`new`・`due`・`future` のいずれの正常な判定結果も返さない。
- 未評価か評価済みかによって、不正な時刻を受け付ける条件を変えない。
- 入力した学習状態は変更されない。

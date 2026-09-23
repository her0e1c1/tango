# FSRS 評価・状態更新 単体テスト仕様書

## 目的

未評価または評価済みの Card に一度回答したとき、評価と学習履歴を反映した次回期限・記憶状態・評価回数を返すことを確認する。保存や画面操作ではなく、FSRS を利用するアプリケーションの入出力契約を対象にする。

共通前提は [AGENTS.md](./AGENTS.md) を参照する。観測境界は `calculateFsrsState`、対応テストファイルは [fsrsRules.spec.ts][tests] とする。

## テストケース

| ID | カテゴリ | テストケース | 対応状況 |
| --- | --- | --- | --- |
| UNIT-FSRS-SCHEDULING-01 | write | [未評価の Card を選択した評価で学習開始する](#unit-fsrs-scheduling-01) | 一部対応 |
| UNIT-FSRS-SCHEDULING-02 | write | [学習段階に応じて状態と忘却回数を更新する](#unit-fsrs-scheduling-02) | 一部対応 |
| UNIT-FSRS-SCHEDULING-03 | write | [復元した学習状態から同じ計算結果で学習を継続する](#unit-fsrs-scheduling-03) | 一部対応 |
| UNIT-FSRS-SCHEDULING-04 | write | [不正な状態や回答時刻で更新結果を作らない](#unit-fsrs-scheduling-04) | 未対応 |

<a id="unit-fsrs-scheduling-01"></a>

### UNIT-FSRS-SCHEDULING-01 未評価の Card を選択した評価で学習開始する

カテゴリ: `write`

Given:

- FSRS 状態が `null` の未評価 Card と、回答時刻 `t0` がある。
- `again`、`hard`、`good`、`easy` をそれぞれ独立した入力例とする。

When:

- 選択した評価で一度回答した後の FSRS 状態を求める。

Then:

- 評価回数は `1`、忘却回数は `0`、最終評価日時は `t0` になる。
- `again`・`hard`・`good` は `learning`、`easy` は `review` になる。
- 次回期限、安定性、難易度、予定間隔、学習ステップ位置は、その評価に対応する採用版 FSRS の参照結果と一致する。異なる評価を同じ評価に読み替えない。
- 次回期限は回答時刻より後、安定性は正、難易度は `1` 以上 `10` 以下になる。
- 同じ未評価状態・評価・回答時刻からは同じ結果になる。

対応テスト: [fsrsRules.spec.ts][tests] の `saves and restores %s without changing the next calculation`。

対応状況: **一部対応**。既存の4評価の例は評価回数を確認するが、初回評価ごとの状態・忘却回数・参照結果・再現性の assertion は不足している。

<a id="unit-fsrs-scheduling-02"></a>

### UNIT-FSRS-SCHEDULING-02 学習段階に応じて状態と忘却回数を更新する

カテゴリ: `write`

Given:

- 学習履歴から得た有効な `learning`・`review`・`relearning` の状態があり、その次回期限を回答時刻とする。
- `learning` は未評価から `again`、`review` はそこから `easy`、`relearning` はさらに `again` と回答した履歴を Given で準備する。各回答は直前の次回期限に行う。
- 下表の各行を独立した入力例とする。複数の評価を記した行は評価ごとに実行する。

| 回答前の段階 | 今回の評価 | 回答後の段階 | 忘却回数 |
| --- | --- | --- | --- |
| learning | again | learning | 変わらない |
| learning | easy | review | 変わらない |
| review | again | relearning | 1 増える |
| review | hard / good / easy | review | 変わらない |
| relearning | again | relearning | 変わらない |
| relearning | good / easy | review | 変わらない |

When:

- 準備した状態に今回の評価を一度適用した後の FSRS 状態を求める。

Then:

- 学習段階と忘却回数は表の結果になる。学習中・再学習中の `again` を、復習中の失敗と同じ忘却回数の増加として扱わない。
- どの段階でも評価回数は直前の値から `1` 増え、最終評価日時は今回の回答時刻になる。
- 次回期限と記憶状態は今回の評価と直前の状態を反映した参照結果と一致し、未評価からの計算に戻らない。
- 入力した直前の状態は変更されない。

対応テスト: [fsrsRules.spec.ts][tests] の `keeps library lapse semantics across learning, review and relearning`。

対応状況: **一部対応**。既存テストは `learning → review → relearning` と最初の忘却回数増加を確認する。表の残りの評価、各段階の回数・最終評価日時、入力状態の不変性は未確認。

<a id="unit-fsrs-scheduling-03"></a>

### UNIT-FSRS-SCHEDULING-03 復元した学習状態から同じ計算結果で学習を継続する

カテゴリ: `write`

Given:

- `t0` を開始基準とする `again → hard → easy → again → good` の評価履歴を入力例とし、各回答時刻は直前の次回期限の `1日後` とする。最初の回答時刻は `t0 + 1日` とする。
- 各例では今回の回答より前の履歴だけを Given で準備する。アプリケーションの状態は JSON 往復後の値から復元し、比較用には同じ履歴を採用版 FSRS で継続した状態を別に用意する。
- 復元した状態をもう一度同じ入力として利用できるよう、操作前の値を保持する。

When:

- 復元した状態に今回の評価を一度適用する。

Then:

- 次回期限、学習段階、安定性、難易度、最終評価日時、評価回数、忘却回数、予定間隔、学習ステップ位置が、同じ履歴を中断せず継続した参照結果と一致する。
- 時刻の単位や精度が変わらず、復元のたびに評価回数や学習段階が初期化されない。
- 操作前の入力状態は変わらず、同じ入力から独立に計算した場合も結果は一致する。
- JSON 往復は学習の継続性を確認する準備であり、Firestore や browser storage への保存成功を保証しない。

対応テスト: [fsrsRules.spec.ts][tests] の `saves and restores %s without changing the next calculation`、`continues serialized state exactly like the pinned scheduler across rating phases`。

対応状況: **一部対応**。既存テストは JSON 復元後の継続結果と主要数値を参照計算と比較するが、参照結果の学習段階と入力状態の不変性は比較していない。

<a id="unit-fsrs-scheduling-04"></a>

### UNIT-FSRS-SCHEDULING-04 不正な状態や回答時刻で更新結果を作らない

カテゴリ: `write`

Given:

- 評価は `good` とし、次のいずれか一つだけを不正にした入力を準備する。

| 不正にする入力 | 代表値 | その他の入力 |
| --- | --- | --- |
| 回答時刻 | `-1` / `NaN` / `t0 + 0.5` | 未評価状態 `null` |
| 直前の安定性 | `0` | 共通の評価済み状態、回答時刻はその期限 |
| 直前の難易度 | `11` | 共通の評価済み状態、回答時刻はその期限 |
| 直前の忘却回数 | 評価回数を超える `4` | 共通の評価済み状態、回答時刻はその期限 |

When:

- 指定した状態・評価・回答時刻から更新後の FSRS 状態を求める。

Then:

- 入力を拒否し、更新後の状態を返さない。
- 不正な状態を未評価に戻したり、不正な値を既定値で埋めたりして計算を続けない。
- 入力した状態は変更されない。

対応テスト: [fsrsRules.spec.ts][tests] に追加する対象。既存の対応タイトルなし。

対応状況: **未対応**。公開計算境界での入力拒否を確認する assertion はまだない。ここに挙げたドメイン上の代表例に限定し、schema の全制約を機械的に列挙しない。

[tests]: ../../../../src/entities/card/model/fsrsRules.spec.ts

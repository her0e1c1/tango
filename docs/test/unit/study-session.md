# 学習セッションの単体テスト仕様

## 目的

学習候補の選定、現在位置の解決、Deck ごとのセッション管理、開始・再開・前進、保存失敗と古い操作の扱いを確認する。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-STUDY-SESSION-01](#unit-study-session-01) | `read` | タグと期限を使って学習候補を入力順に選ぶ |
| [UNIT-STUDY-SESSION-02](#unit-study-session-02) | `read` | 壊れた FSRS 状態を未学習として扱わない |
| [UNIT-STUDY-SESSION-03](#unit-study-session-03) | `read` | 次の Card の有無と位置を判定する |
| [UNIT-STUDY-SESSION-04](#unit-study-session-04) | `read` | 現在の Card を解決し、準備中と無効を区別する |
| [UNIT-STUDY-SESSION-05](#unit-study-session-05) | `read` | 操作対象の位置の変更を検知し時刻だけの変更は許容する |
| [UNIT-STUDY-SESSION-06](#unit-study-session-06) | `read` | Deck ごとに独立したセッションを参照できる |
| [UNIT-STUDY-SESSION-07](#unit-study-session-07) | `write` | 指定した Deck のセッションだけを取り除く |
| [UNIT-STUDY-SESSION-08](#unit-study-session-08) | `write` | 表示中セッションの初期化で旧バックアップを削除しない |
| [UNIT-STUDY-SESSION-09](#unit-study-session-09) | `write` | 指定された Card 順序で先頭から開始する |
| [UNIT-STUDY-SESSION-10](#unit-study-session-10) | `write` | 呼び出し元の配列変更で学習順序が変わらない |
| [UNIT-STUDY-SESSION-11](#unit-study-session-11) | `write` | 再開始の保存が失敗したら以前の位置を維持し、再試行できる |
| [UNIT-STUDY-SESSION-12](#unit-study-session-12) | `write` | 対象 Deck の位置と最終学習時刻だけを更新する |
| [UNIT-STUDY-SESSION-13](#unit-study-session-13) | `write` | 前進し、最後の Card の次でセッションを終了する |
| [UNIT-STUDY-SESSION-14](#unit-study-session-14) | `write` | 時刻だけ変わった操作は進めるが同じ古い操作を再適用しない |
| [UNIT-STUDY-SESSION-15](#unit-study-session-15) | `write` | 同じ Card から再開始しても古いセッションの操作を適用しない |
| [UNIT-STUDY-SESSION-16](#unit-study-session-16) | `write` | 範囲外・小数の位置を保存しない |
| [UNIT-STUDY-SESSION-17](#unit-study-session-17) | `write` | 後退で現在 Card や再開位置を変えず、前進は受け入れる |
| [UNIT-STUDY-SESSION-18](#unit-study-session-18) | `write` | 既存の対象セッションの最終学習時刻だけを更新する |
| [UNIT-STUDY-SESSION-19](#unit-study-session-19) | `write` | 認証利用者が変わったら既存セッションへの操作を拒否する |
| [UNIT-STUDY-SESSION-20](#unit-study-session-20) | `write` | 保存失敗を返し、セッションを変更しない |
| [UNIT-STUDY-SESSION-21](#unit-study-session-21) | `write` | セッションの購読失敗を通知する |
| [UNIT-STUDY-SESSION-22](#unit-study-session-22) | `write` | 購読終了を SDK に伝える |
| [UNIT-STUDY-SESSION-23](#unit-study-session-23) | `write` | アカウントを切り替えたら前のセッションを残さない |

## ケース詳細

<a id="unit-study-session-01"></a>

### UNIT-STUDY-SESSION-01: タグと期限を使って学習候補を入力順に選ぶ

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `applies tags and deadlines with interval=%s`

**Given**: Deck はタグ `selected` を OR 条件で選択する。入力順に、現在時刻 `T` が期限の Card `due`、未学習 Card `new`、別タグの Card `other-tag`、期限 `T+1` の Card `future` がある。別タグ以外は選択タグを持つ。

**When**: 間隔による制限を有効・無効にして、時刻 `T` の学習候補と次の期限を求める。

**Then**: 別タグの Card は常に除外する。有効時は期限ちょうどの Card と未学習 Card を選び、次の期限を返す。無効時は将来の Card も選ぶ。

| 間隔制限 | 候補の順序 | 次の期限 |
| --- | --- | --- |
| 有効 | `due, new` | `T+1` |
| 無効 | `due, new, future` | `undefined` |

<a id="unit-study-session-02"></a>

### UNIT-STUDY-SESSION-02: 壊れた FSRS 状態を未学習として扱わない

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `rejects malformed FSRS state instead of classifying it as new`

**Given**: タグ条件に一致する Card の FSRS 状態があり、回答回数 `reps` だけを不正な `0` にしている。

**When**: 間隔制限を有効にして学習候補を選ぶ。

**Then**: 不正な FSRS 状態として失敗する。`fsrs=null` の未学習 Card と同じ扱いにしない。

<a id="unit-study-session-03"></a>

### UNIT-STUDY-SESSION-03: 次の Card の有無と位置を判定する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `moves within the session card order` / [model/rules.spec.ts][rules] — `returns no index when movement completes the session` / [model/rules.spec.ts][rules] — `reports whether movement stays inside the Card order`

**Given**: 3枚の Card があり、現在位置は0始まりの `1` または最後の `2` である。

**When**: 次の位置と、まだ次の Card があるかを求める。

**Then**: 位置 `1` の次は `2` で移動可能。最後の `2` では次の位置はなく、次の Card もない。

<a id="unit-study-session-04"></a>

### UNIT-STUDY-SESSION-04: 現在の Card を解決し、準備中と無効を区別する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `resolves the Card at the active session position` / [model/rules.spec.ts][rules] — `waits while Cards have not loaded` / [model/rules.spec.ts][rules] — `rejects a missing session, empty position, or absent loaded Card`

**Given**: 現在位置を持つセッションと Card 一覧について、次の組み合わせがある。

**When**: 現在の学習状態を解決する。

**Then**: 現在の Card が取得できるときだけ `studying` とそのセッション・Card を返す。空の Card 一覧による準備中と、無効な位置・欠落を区別する。

| 事前状態 | 結果 |
| --- | --- |
| 有効な位置・対象 Card あり | `studying` |
| 有効な位置・Card 一覧が空 | `preparing` |
| セッションなし | `invalid` |
| Card 順序が空 | `invalid` |
| Card 一覧は空でないが現在 Card がない | `invalid` |

<a id="unit-study-session-05"></a>

### UNIT-STUDY-SESSION-05: 操作対象の位置の変更を検知し時刻だけの変更は許容する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `ignores timestamp-only changes` / [model/rules.spec.ts][rules] — `detects a replaced session, changed index, active card, or removed session`

**Given**: 操作開始時のセッションと、比較対象となる現在のセッションがある。

**When**: 操作対象の位置が変わっていないかを判定する。

**Then**: 最終学習時刻だけの違いは同じ位置とみなす。セッション ID、位置、現在 Card のいずれかが違う、またはセッションがなくなった場合は同じ位置とみなさない。

<a id="unit-study-session-06"></a>

### UNIT-STUDY-SESSION-06: Deck ごとに独立したセッションを参照できる

カテゴリ: `read`

対応テスト: [model/store.spec.ts][store] — `keeps independent study sessions for multiple decks`

**Given**: テスト用 helper で、時刻 `1000` に Deck 1 の2枚、時刻 `2000` に Deck 2 の1枚のセッションを用意する。順序は固定、所有者は同じである。

**When**: 現在のセッションを参照する。

**Then**: それぞれの Deck に、指定した Card 順序、開始位置 `0`、それぞれの学習時刻・開始時刻・所有者を持つセッションが存在する。片方で他方を上書きしない。

<a id="unit-study-session-07"></a>

### UNIT-STUDY-SESSION-07: 指定した Deck のセッションだけを取り除く

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `removes only the requested session`

**Given**: 異なる2つの Deck にセッションがある。

**When**: Deck 1 のセッションを削除する。

**Then**: Deck 1 のセッションだけがなくなり、Deck 2 のセッションは残る。

<a id="unit-study-session-08"></a>

### UNIT-STUDY-SESSION-08: 表示中セッションの初期化で旧バックアップを削除しない

カテゴリ: `write`

対応テスト: [model/store.spec.ts][store] — `clears the visible session without deleting the legacy backup`

**Given**: セッションが存在し、browser storage の `tango-study` に旧バックアップ文字列が保存されている。

**When**: 表示中のセッションを初期化する。

**Then**: セッションを取得できなくなるが、旧バックアップの文字列はそのまま残る。旧データからの復元を保証するケースではない。

<a id="unit-study-session-09"></a>

### UNIT-STUDY-SESSION-09: 指定された Card 順序で先頭から開始する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `starts at index zero with the configured card order`

**Given**: 所有者 `owner` が認証され、保存成功と反映をモックしている。Card 順序は `third, second` である。

**When**: その順序で学習開始を要求する。

**Then**: 作成されたセッションの位置は `0` で、Card 順序は `third, second` のままである。

<a id="unit-study-session-10"></a>

### UNIT-STUDY-SESSION-10: 呼び出し元の配列変更で学習順序が変わらない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `copies the card order into the session`

**Given**: 学習開始に渡す配列は `first, second` で、保存成功と反映をモックしている。

**When**: 開始完了後に呼び出し元が元の配列を反転する。

**Then**: セッションの Card 順序は `first, second` のままである。

<a id="unit-study-session-11"></a>

### UNIT-STUDY-SESSION-11: 再開始の保存が失敗したら以前の位置を維持し、再試行できる

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `preserves the prior run and cursor when a replacement cannot be saved locally`

**Given**: `first, second` の学習が位置 `1` まで進んでいる。再開始の保存は保留でき、その後 `Persistence quota exceeded` で失敗するようにモックする。次の再試行は成功させる。

**When**: 同じ Deck の学習を再開始し、失敗後に再度開始する。

**Then**: 保存が保留中・失敗後とも以前のセッションと位置を保持し、失敗は呼び出し元へ返す。再試行成功後は新しいセッション ID と元の Card 順序で位置 `0` から開始する。

<a id="unit-study-session-12"></a>

### UNIT-STUDY-SESSION-12: 対象 Deck の位置と最終学習時刻だけを更新する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `updates only the requested session and its last studied time`

**Given**: 時刻 `1000` に用意した2つの Deck のセッションがあり、両方とも2枚の先頭にいる。

**When**: 時刻 `3000` に Deck 1 の位置を `1` へ進める。

**Then**: Deck 1 は位置 `1`・最終学習時刻 `3000` になり、Deck 2 は位置 `0`・時刻 `1000` のままである。

<a id="unit-study-session-13"></a>

### UNIT-STUDY-SESSION-13: 前進し、最後の Card の次でセッションを終了する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `moves within a session and removes it when movement reaches an edge`

**Given**: 2枚のセッションについて、先頭の状態と最後の Card の状態を用意する。保存成功と反映をモックしている。

**When**: 現在のセッションを対象に一つ先へ進める。

**Then**: 先頭からは最後の Card へ進み、最後からはセッションがなくなる。どちらも操作成功を返す。

<a id="unit-study-session-14"></a>

### UNIT-STUDY-SESSION-14: 時刻だけ変わった操作は進めるが同じ古い操作を再適用しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `moves only when the persisted swipe still owns the active card`

**Given**: 2枚の先頭に対する操作開始時のセッションがある。現在状態は、最終学習時刻だけが更新された状態、またはその操作ですでに次へ進んだ状態とする。

**When**: 操作開始時のセッションを使って前進を要求する。

**Then**: 時刻だけの変更なら成功して位置 `1` へ進む。すでに進んだあとの同じ古い操作は `false` を返し、位置 `1` のままにする。

<a id="unit-study-session-15"></a>

### UNIT-STUDY-SESSION-15: 同じ Card から再開始しても古いセッションの操作を適用しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `does not move a replacement session that starts on the same card`

**Given**: 同じ Deck を同じ Card 順序で開始し直したため、先頭 Card は同じだがセッション ID が変わっている。

**When**: 前のセッションを対象にした前進を要求する。

**Then**: `false` を返し、新しいセッションの位置は `0` のままである。

<a id="unit-study-session-16"></a>

### UNIT-STUDY-SESSION-16: 範囲外・小数の位置を保存しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `does not persist an invalid session index: %s`

**Given**: 2枚のセッションが位置 `0`、最終学習時刻 `1000` にある。

**When**: 時刻 `3000` に、位置 `-1`、`2`、`0.5` のいずれかへ変更する。

**Then**: 位置は `0`、最終学習時刻は `1000` のままである。

<a id="unit-study-session-17"></a>

### UNIT-STUDY-SESSION-17: 後退で現在 Card や再開位置を変えず、前進は受け入れる

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `keeps the current Card and persisted resume point when asked to move backward`

**Given**: 3枚のセッションが位置 `1` にある。

**When**: 位置 `0` への変更を要求する。前進の比較として位置 `2` への変更も対象とする。

**Then**: 後退は `false` を返し、セッションと旧 `tango-study` 保存値を変更しない。前進は `true` を返して位置 `2` になる。

<a id="unit-study-session-18"></a>

### UNIT-STUDY-SESSION-18: 既存の対象セッションの最終学習時刻だけを更新する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `touches only an existing requested session`

**Given**: 時刻 `1000` に作られた Deck 1 のセッションがある。別の `missing-deck` にはセッションがない。

**When**: 時刻 `4000` に、それぞれの Deck への学習時刻更新を要求する。

**Then**: Deck 1 の最終学習時刻は `4000` になり、存在しない Deck のセッションは作られない。

<a id="unit-study-session-19"></a>

### UNIT-STUDY-SESSION-19: 認証利用者が変わったら既存セッションへの操作を拒否する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects %s after the owner changes`

**Given**: 所有者 `owner` のセッションを保持したまま、認証 UID が `other-owner` に変わっている。

**When**: 位置指定、前進、学習時刻更新のいずれかを要求する。

**Then**: `Study session owner changed` のエラーで失敗し、セッションは変更しない。

<a id="unit-study-session-20"></a>

### UNIT-STUDY-SESSION-20: 保存失敗を返し、セッションを変更しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `propagates a failed %s write without changing the session`

**Given**: 有効なセッションがあり、対応する保存操作が `Persistence quota exceeded` で失敗するようにモックされている。完了のケースだけは1枚、それ以外は2枚のセッションとする。

**When**: 位置指定、前進、最終 Card からの完了、学習時刻更新のいずれかを要求する。

**Then**: 保存エラーを呼び出し元へ返す。いずれの操作でも開始前のセッションを保持し、完了失敗でセッションを取り除かない。

<a id="unit-study-session-21"></a>

### UNIT-STUDY-SESSION-21: セッションの購読失敗を通知する

カテゴリ: `write`

対応テスト: [api/firestore.spec.ts][firestore] — `reports subscription failure and delegates departure to the SDK`

**Given**: セッションを購読中であり、エラー通知先が指定されている。

**When**: SDK から購読エラーを受信する。

**Then**: 同じエラーを通知先へ渡す。

<a id="unit-study-session-22"></a>

### UNIT-STUDY-SESSION-22: 購読終了を SDK に伝える

カテゴリ: `write`

対応テスト: [api/firestore.spec.ts][firestore] — `reports subscription failure and delegates departure to the SDK`

**Given**: セッションの購読が開始され、終了用の関数を受け取っている。

**When**: その終了用関数を呼ぶ。

**Then**: SDK に購読の解除を要求する。解除後の遅延通知の扱いはこのテストでは未検証。

<a id="unit-study-session-23"></a>

### UNIT-STUDY-SESSION-23: アカウントを切り替えたら前のセッションを残さない

カテゴリ: `write`

対応テスト: [api/firestore.spec.ts][firestore] — `clears all previous account sessions and reflects the current snapshot`

**Given**: 前の利用者の異なる2つの Deck のセッションがある。現在の利用者の受信データは空とする。

**When**: 現在の利用者の購読を開始し、空の受信データを反映する。

**Then**: 前の利用者のセッションは購読開始・空データの反映を通して参照できなくなる。別アカウントのセッションを現在の結果に残さない。

## 検証範囲の注意

認証・Firestore・保存完了後の反映はテスト側のモックや既存 helper で与える。成功時のモック反映は実際の保存や snapshot 配信の保証ではない。複数 document の原子性、Rules、履歴取得、実機の再読込・オフライン復旧は結合テストまたは E2E の対象。

[rules]: ../../../src/entities/study-session/model/rules.spec.ts
[store]: ../../../src/entities/study-session/model/store.spec.ts
[mutations]: ../../../src/entities/study-session/api/mutations.spec.ts
[firestore]: ../../../src/entities/study-session/api/firestore.spec.ts

# Card の単体テスト仕様

## 目的

Card の入力・所有者・抽出規則、保存 document の解析、購読データの反映、FSRS 状態の更新と復元を確認する。表示 component の契約は [card-view](./card-view.md) に分離する。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-CARD-01](#unit-card-01) | `read` | 入力フォームの内容だけを検証できる |
| [UNIT-CARD-02](#unit-card-02) | `read` | 両面が空なら両方の入力エラーを返す |
| [UNIT-CARD-03](#unit-card-03) | `read` | 表・裏・一意キーの空白だけの内容を拒否する |
| [UNIT-CARD-04](#unit-card-04) | `read` | Card 内容のエラーを項目別に取得できる |
| [UNIT-CARD-05](#unit-card-05) | `read` | 作成時に未削除状態を補い保存時刻は加えない |
| [UNIT-CARD-06](#unit-card-06) | `read` | 作成・編集・削除入力の所有者を検証する |
| [UNIT-CARD-07](#unit-card-07) | `read` | 作成と部分編集でも内容の検証を行う |
| [UNIT-CARD-08](#unit-card-08) | `read` | 通常編集で所属 Deck や旧学習値を変更させない |
| [UNIT-CARD-09](#unit-card-09) | `read` | 指定 Deck の Card だけを入力順で抽出する |
| [UNIT-CARD-10](#unit-card-10) | `read` | 指定 Deck のタグを重複なくソートして返す |
| [UNIT-CARD-11](#unit-card-11) | `read` | ID に一致する Card を取得し、存在しなければ失敗する |
| [UNIT-CARD-12](#unit-card-12) | `read` | Firebase に接続せず Card ID を生成する |
| [UNIT-CARD-13](#unit-card-13) | `read` | 有効な Card document を余分な既定値なしで読み取る |
| [UNIT-CARD-14](#unit-card-14) | `read` | 不正な Card document を対象 ID 付きで拒否する |
| [UNIT-CARD-15](#unit-card-15) | `read` | Card への変換で現行の値だけを公開する |
| [UNIT-CARD-16](#unit-card-16) | `write` | 永続化 API の入口で実行者と所有者を検証する |
| [UNIT-CARD-17](#unit-card-17) | `write` | 匿名・通常アカウントとも所有 Deck に Card を作成要求できる |
| [UNIT-CARD-18](#unit-card-18) | `write` | 存在しない Deck や他人の Deck への作成を拒否する |
| [UNIT-CARD-19](#unit-card-19) | `write` | 存在しない Card の編集・削除を拒否する |
| [UNIT-CARD-20](#unit-card-20) | `write` | 他人の Card の編集・削除を委譲しない |
| [UNIT-CARD-21](#unit-card-21) | `write` | 各購読データで現在の Card 一覧を置き換える |
| [UNIT-CARD-22](#unit-card-22) | `write` | 不正な Card の購読データを識別して通知する |
| [UNIT-CARD-23](#unit-card-23) | `write` | Card の購読失敗をそのまま通知する |
| [UNIT-CARD-24](#unit-card-24) | `read` | FSRS 状態を保存・復元しても次回計算が変わらない |
| [UNIT-CARD-25](#unit-card-25) | `read` | 学習・復習・再学習で失敗回数の意味を維持する |
| [UNIT-CARD-26](#unit-card-26) | `read` | 復習直後の想起確率は 1 になる |
| [UNIT-CARD-27](#unit-card-27) | `read` | 複数評価と保存復元を通して固定ライブラリと互換である |
| [UNIT-CARD-28](#unit-card-28) | `read` | 状態がない Card を未学習として扱う |

## ケース詳細

<a id="unit-card-01"></a>

### UNIT-CARD-01: 入力フォームの内容だけを検証できる

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `accepts content without asking for an identity`

**Given**: 表 `Front`、裏 `Back`、タグ `custom` の入力があり、UID・Card ID・一意キーは含まれていない。

**When**: フォーム用の Card 内容入力を検証する。

**Then**: 指定した内容を受け入れ、識別情報の入力を要求しない。

<a id="unit-card-02"></a>

### UNIT-CARD-02: 両面が空なら両方の入力エラーを返す

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `reports the required fields when both sides are empty`

**Given**: 表・裏とも空文字で、タグは空配列である。

**When**: フォーム用の Card 内容入力を検証する。

**Then**: 表と裏それぞれのフィールドに必須エラーを返す。

<a id="unit-card-03"></a>

### UNIT-CARD-03: 表・裏・一意キーの空白だけの内容を拒否する

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `rejects blank front text: %j` / [model/schema.spec.ts][schema] — `rejects blank back text: %j` / [model/schema.spec.ts][schema] — `rejects blank unique keys: %j`

**Given**: 永続化に必要な Card 内容があり、検証する項目以外は有効である。

**When**: 表、裏、一意キーのいずれかに空文字、半角空白のみ、または改行・タブのみを指定して検証する。

**Then**: 対象項目の必須エラーで失敗する。

<a id="unit-card-04"></a>

### UNIT-CARD-04: Card 内容のエラーを項目別に取得できる

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `returns field errors from the Card content schema` / [model/rules.spec.ts][rules] — `returns no errors for valid Card content`

**Given**: 表が半角空白、裏が改行、一意キーがタブの内容、または全項目が有効な内容がある。

**When**: Card 内容の検証エラーを取得する。

**Then**: 空白だけの内容では表・裏・一意キーそれぞれについて項目名と `required` の理由を返す。有効な内容では空のエラー集合を返す。

<a id="unit-card-05"></a>

### UNIT-CARD-05: 作成時に未削除状態を補い保存時刻は加えない

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `applies entity defaults without adding persistence timestamps`

**Given**: 実行者・所有者がともに `uid-a` で、有効な Card ID、Deck ID、表、裏、タグ、一意キーの作成入力がある。

**When**: Card 作成入力を検証する。

**Then**: 指定した内容を保持し、`deletedAt=null` を補う。作成・更新時刻はこの入力検証では加えない。

<a id="unit-card-06"></a>

### UNIT-CARD-06: 作成・編集・削除入力の所有者を検証する

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `validates create ownership` / [model/schema.spec.ts][schema] — `keeps ordinary edits within Card-owned editable fields` / [model/schema.spec.ts][schema] — `validates delete ownership and returns only Card identity`

**Given**: Card の所有者 UID と実行者 UID が与えられている。

**When**: 作成・編集・削除の各操作入力を検証する。

**Then**: 異なる UID は所有者不一致で拒否する。所有者自身の削除入力は実行者 UID と Card の ID・所有者 UID のみを返す。

<a id="unit-card-07"></a>

### UNIT-CARD-07: 作成と部分編集でも内容の検証を行う

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `applies Card content validation to creates and edits`

**Given**: 実行者と所有者が一致し、作成入力の一意キー、または部分編集入力の表だけが半角空白である。

**When**: 作成または編集の操作入力を検証する。

**Then**: 作成では一意キーの必須エラー、編集では表の必須エラーで失敗する。

<a id="unit-card-08"></a>

### UNIT-CARD-08: 通常編集で所属 Deck や旧学習値を変更させない

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `keeps ordinary edits within Card-owned editable fields`

**Given**: 有効な Card の内容に、新しい表、別の Deck ID、旧項目 `difficulty=99` と `numberOfSeen=99` が混在している。実行者は所有者と一致する。

**When**: 通常の Card 編集入力を検証する。

**Then**: Card の ID・所有者と編集可能な表・裏・タグ・一意キーのみを返す。別の Deck ID と旧学習項目を編集値に含めない。

<a id="unit-card-09"></a>

### UNIT-CARD-09: 指定 Deck の Card だけを入力順で抽出する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `returns cards matching the specified deckId`

**Given**: Card の順序が `deck-a` の `card-1`、`deck-b` の `card-2`、`deck-a` の `card-3` である。

**When**: `deck-a` の Card を抽出する。

**Then**: `card-1`、`card-3` の順序で返す。別 Deck の Card は含まれない。

<a id="unit-card-10"></a>

### UNIT-CARD-10: 指定 Deck のタグを重複なくソートして返す

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `returns unique sorted tags for the specified deckId`

**Given**: `deck-a` の Card が `n5, kanji` と `kanji, verb` を持ち、別 Deck の Card は `other` を持つ。

**When**: `deck-a` のタグ一覧を取得する。

**Then**: `kanji, n5, verb` の順序で返す。重複したタグと別 Deck のタグを含めない。

<a id="unit-card-11"></a>

### UNIT-CARD-11: ID に一致する Card を取得し、存在しなければ失敗する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `returns the card matching the specified id` / [model/rules.spec.ts][rules] — `throws when no card matches the specified id`

**Given**: 対象を含む Card 一覧、または空の一覧がある。

**When**: 必須取得操作に対象 ID を渡す。

**Then**: 一致する Card を返す。空の一覧で `missing` を指定した場合は `Card not found: missing` で失敗する。

<a id="unit-card-12"></a>

### UNIT-CARD-12: Firebase に接続せず Card ID を生成する

カテゴリ: `read`

対応テスト: [api/id.spec.ts][id] — `generates an ID without Firebase`

**Given**: Firebase の認証・通信を用意していない。

**When**: Card ID を生成する。

**Then**: 英大文字・英小文字・数字からなる20文字の ID を返す。ID の一意性の統計的保証は対象外。

<a id="unit-card-13"></a>

### UNIT-CARD-13: 有効な Card document を余分な既定値なしで読み取る

カテゴリ: `read`

対応テスト: [api/document.spec.ts][document] — `parses a valid document without adding optional fields` / [api/document.spec.ts][document] — `preserves optional fields`

**Given**: 表・裏・タグ・一意キー・Deck ID・所有者・作成更新時刻・`fsrs=null`・`deletedAt=null` がある。旧重複 ID、URL、開始行 `7`、終了行 `8` は省略する場合と指定する場合がある。

**When**: Card document を解析する。

**Then**: 必須の保存値を保持する。任意項目は指定した値を保持し、省略された項目を勝手に追加しない。

<a id="unit-card-14"></a>

### UNIT-CARD-14: 不正な Card document を対象 ID 付きで拒否する

カテゴリ: `read`

対応テスト: [api/document.spec.ts][document] — `rejects a %s required field`

**Given**: 有効な document `card-a` を基準に、表を欠落させる、タグを `[42]` にする、FSRS を欠落させる、FSRS を空 object にする、のいずれかを行う。

**When**: Card document を解析する。

**Then**: `FirestoreDocumentValidationError` で失敗し、コレクション `card` と document ID `card-a` を特定できる。

<a id="unit-card-15"></a>

### UNIT-CARD-15: Card への変換で現行の値だけを公開する

カテゴリ: `read`

対応テスト: [model/dto.spec.ts][dto] — `maps only Card fields from a physical Card document`

**Given**: document `card-a` に内容、所有者、時刻、`fsrs=null`、未削除状態、URL、開始終了行に加え、旧項目 `difficulty`・`numberOfSeen` が含まれている。

**When**: 保存形式から Card に変換する。

**Then**: document ID を Card ID として採用し、現行の内容・FSRS・時刻・リンク情報を保持する。旧2項目は結果に含めない。

<a id="unit-card-16"></a>

### UNIT-CARD-16: 永続化 API の入口で実行者と所有者を検証する

カテゴリ: `write`

対応テスト: [api/firestore.spec.ts][firestore] — `rejects create requests without a confirmed matching owner` / [api/firestore.spec.ts][firestore] — `rejects edit requests without a confirmed matching owner` / [api/firestore.spec.ts][firestore] — `rejects delete requests without a confirmed matching owner`

**Given**: 所有者 `uid-a` の有効な Card があり、実行者 UID が空、または `uid-b` の要求がある。

**When**: 作成・編集・削除の各永続化 API を呼ぶ。

**Then**: 空 UID では `confirmed user`、異なる UID では所有者不一致を示すエラーで失敗する。

<a id="unit-card-17"></a>

### UNIT-CARD-17: 匿名・通常アカウントとも所有 Deck に Card を作成要求できる

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `creates a Card for %s through Firestore`

**Given**: 実行者は `anonymous-owner` または `linked-owner` であり、参照先 Deck の所有者と一致している。保存処理はモックする。

**When**: 有効な Card 内容を指定して作成する。

**Then**: 実行者 UID を Card の所有者として付け、同じ UID と対象 Card ID を永続化境界へ渡す。

<a id="unit-card-18"></a>

### UNIT-CARD-18: 存在しない Deck や他人の Deck への作成を拒否する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects an unknown Deck and a mismatched remote owner before writing`

**Given**: 指定 Deck が存在しない、または実行者とは異なる UID が Deck を所有している。

**When**: その Deck への Card 作成を要求する。

**Then**: 存在しなければ対象 Deck が見つからないエラー、所有者が違えば Deck の所有者不一致エラーで失敗し、Card の保存を要求しない。

<a id="unit-card-19"></a>

### UNIT-CARD-19: 存在しない Card の編集・削除を拒否する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects edit and delete when the Card cannot be resolved`

**Given**: 現在参照できる Card 一覧に `missing` がない。

**When**: その Card の編集または削除を要求する。

**Then**: `Card "missing" was not found` のエラーで失敗する。

<a id="unit-card-20"></a>

### UNIT-CARD-20: 他人の Card の編集・削除を委譲しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects another owner's Card before editing or deleting`

**Given**: Card の所有者は `owner`、実行者は `other` である。

**When**: Card の編集または削除を要求する。

**Then**: 所有者不一致で失敗し、対応する保存操作を要求しない。

<a id="unit-card-21"></a>

### UNIT-CARD-21: 各購読データで現在の Card 一覧を置き換える

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `fully replaces active Cards from each snapshot`

**Given**: Card を購読中で、所属 Deck を参照できる。受信データには有効 Card と削除済み Card があり、続く受信では別の有効 Card だけが含まれる。

**When**: それぞれの受信データを購読コールバックへ渡す。

**Then**: 参照 hook はその受信に含まれる有効 Card のみを返す。内容・タグ・URL・開始終了行を保持し、削除済み Card と次の受信に存在しない旧 Card は返さない。

<a id="unit-card-22"></a>

### UNIT-CARD-22: 不正な Card の購読データを識別して通知する

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `reports invalid Firestore documents`

**Given**: 購読中に document `invalid` のタグが `null` のデータが届く。

**When**: そのデータを購読コールバックへ渡す。

**Then**: `FirestoreDocumentValidationError` と document ID `invalid` を含むエラーを通知する。失敗後に既存一覧を保持するかはこのテストでは未検証。

<a id="unit-card-23"></a>

### UNIT-CARD-23: Card の購読失敗をそのまま通知する

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `reports Firestore subscription errors`

**Given**: Card を購読中で、エラー通知先が指定されている。

**When**: 購読エラーを受信する。

**Then**: 同じエラーを通知先に渡す。

<a id="unit-card-24"></a>

### UNIT-CARD-24: FSRS 状態を保存・復元しても次回計算が変わらない

カテゴリ: `read`

対応テスト: [model/fsrsRules.spec.ts][fsrs] — `saves and restores %s without changing the next calculation`

**Given**: 未学習 Card を固定時刻で `again`、`hard`、`good`、`easy` のいずれかに評価し、得られた状態を JSON へ保存・復元する。

**When**: 元の状態と復元した状態の両方から、各状態の期限時刻に `good` で次回状態を計算する。

**Then**: 両方の結果が一致する。最初の評価後の回答回数は `1` であり、保存状態に `elapsedDays` を要求しない。期限時刻ちょうどの分類は `due` となる。

<a id="unit-card-25"></a>

### UNIT-CARD-25: 学習・復習・再学習で失敗回数の意味を維持する

カテゴリ: `read`

対応テスト: [model/fsrsRules.spec.ts][fsrs] — `keeps library lapse semantics across learning, review and relearning`

**Given**: 未学習 Card から始め、評価時刻は初回の固定時刻、以後は直前の期限とする。

**When**: `again`、`easy`、`again` の順で評価する。

**Then**: 初回は `learning` で失敗回数 `0`、次は `review`、最後は `relearning` で失敗回数 `1`・回答回数 `3` となる。

<a id="unit-card-26"></a>

### UNIT-CARD-26: 復習直後の想起確率は 1 になる

カテゴリ: `read`

対応テスト: [model/fsrsRules.spec.ts][fsrs] — `keeps library lapse semantics across learning, review and relearning`

**Given**: 初回の `again` のあと、その期限に `easy` と評価して復習状態になった Card がある。

**When**: 最終評価時刻ちょうどの想起確率を求める。

**Then**: 結果は `1` である。時間経過後の曲線全体や丸め精度はこのケースでは検証しない。

<a id="unit-card-27"></a>

### UNIT-CARD-27: 複数評価と保存復元を通して固定ライブラリと互換である

カテゴリ: `read`

対応テスト: [model/fsrsRules.spec.ts][fsrs] — `continues serialized state exactly like the pinned scheduler across rating phases`

**Given**: 未学習 Card と、保持率 `0.9`、fuzz 無効、最大間隔 `36500` 日、短期学習有効、学習ステップ `1m, 10m`、再学習ステップ `10m` の固定スケジューラーを用意する。

**When**: `again → hard → easy → again → good` を、それぞれ直前の期限から1日後に評価する。アプリの状態は評価ごとに JSON 保存・復元する。

**Then**: 毎回、期限・難易度・安定度・最終評価時刻・回答回数・失敗回数・予定間隔・学習ステップ数がライブラリの結果と一致する。

<a id="unit-card-28"></a>

### UNIT-CARD-28: 状態がない Card を未学習として扱う

カテゴリ: `read`

対応テスト: [model/fsrsRules.spec.ts][fsrs] — `classifies absence as new without fabricating difficulty`

**Given**: Card の FSRS 状態が `null` である。

**When**: 固定時刻で学習状態を分類する。

**Then**: `status=new` のみを返し、未学習 Card の難易度を作り出さない。

## 検証範囲の注意

Firestore SDK、保存処理、必要な他 Entity の参照をモックする。実際の永続化、Rules、他端末同期、学習回答との原子的な保存は対象外。FSRS はリポジトリで固定したライブラリを実際に使い、保存形式とアプリ側の計算結果の互換性を確認する。

[schema]: ../../../src/entities/card/model/schema.spec.ts
[rules]: ../../../src/entities/card/model/rules.spec.ts
[dto]: ../../../src/entities/card/model/dto.spec.ts
[fsrs]: ../../../src/entities/card/model/fsrsRules.spec.ts
[document]: ../../../src/entities/card/api/document.spec.ts
[id]: ../../../src/entities/card/api/id.spec.ts
[firestore]: ../../../src/entities/card/api/firestore.spec.ts
[mutations]: ../../../src/entities/card/api/mutations.spec.ts
[subscription]: ../../../src/entities/card/api/subscription.spec.tsx

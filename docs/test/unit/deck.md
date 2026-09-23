# Deck の単体テスト仕様

## 目的

Deck の入力、タグ・表示カテゴリの選択、識別子、保存形式との変換、所有者の確認、購読データの反映を確認する。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-DECK-01](#unit-deck-01) | `read` | 対応カテゴリとコード言語を判定する |
| [UNIT-DECK-02](#unit-deck-02) | `read` | 先頭の対応タグを表示カテゴリとして採用する |
| [UNIT-DECK-03](#unit-deck-03) | `read` | 選択タグの OR・AND 条件を適用する |
| [UNIT-DECK-04](#unit-deck-04) | `read` | ID に一致する Deck を取得し、存在しなければ失敗する |
| [UNIT-DECK-05](#unit-deck-05) | `read` | Firebase に接続せず Deck ID を生成する |
| [UNIT-DECK-06](#unit-deck-06) | `read` | Deck 作成入力を正規化し既定値を補う |
| [UNIT-DECK-07](#unit-deck-07) | `read` | 不正な作成・編集入力を拒否する |
| [UNIT-DECK-08](#unit-deck-08) | `read` | 作成入力から呼び出し元指定の所有者を除く |
| [UNIT-DECK-09](#unit-deck-09) | `read` | 指定項目だけの編集を受け付ける |
| [UNIT-DECK-10](#unit-deck-10) | `read` | URL の削除と未変更を区別する |
| [UNIT-DECK-11](#unit-deck-11) | `read` | 既存 document の文字列を現在の作成入力規則で拒否しない |
| [UNIT-DECK-12](#unit-deck-12) | `read` | 作成データに実行者と保存時刻を付ける |
| [UNIT-DECK-13](#unit-deck-13) | `read` | document の外側の ID を Deck の ID に採用する |
| [UNIT-DECK-14](#unit-deck-14) | `write` | 永続化 API の入口で実行者と削除 ID を検証する |
| [UNIT-DECK-15](#unit-deck-15) | `write` | 存在しない Deck の編集・削除を拒否する |
| [UNIT-DECK-16](#unit-deck-16) | `write` | 所有者が異なる Deck の編集・削除を委譲しない |
| [UNIT-DECK-17](#unit-deck-17) | `write` | 所有者自身の編集・削除を永続化境界へ渡す |
| [UNIT-DECK-18](#unit-deck-18) | `write` | 購読データから削除されていない Deck を公開する |
| [UNIT-DECK-19](#unit-deck-19) | `write` | 不正な購読 document を識別して通知する |
| [UNIT-DECK-20](#unit-deck-20) | `write` | 購読失敗を呼び出し元へ通知する |

## ケース詳細

<a id="unit-deck-01"></a>

### UNIT-DECK-01: 対応カテゴリとコード言語を判定する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `defines supported categories including application categories and major languages` / [model/rules.spec.ts][rules] — `identifies code languages correctly`

**Given**: カテゴリ候補として `raw`、`math` と主要なコード言語・別名を用意する。

**When**: 対応カテゴリとコード言語の判定結果を取得する。

**Then**: 対応カテゴリに `raw`、`math`、`python`、`typescript`、`javascript`、`golang`、`sh` が含まれる。`ts` と `python` はコード言語であり、`raw`、`math`、`unknown` はコード言語ではない。

<a id="unit-deck-02"></a>

### UNIT-DECK-02: 先頭の対応タグを表示カテゴリとして採用する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `uses the first supported tag as the effective category` / [model/rules.spec.ts][rules] — `accepts language aliases for tag resolution` / [model/rules.spec.ts][rules] — `falls back to the deck category when no supported tag exists`

**Given**: Deck のカテゴリは `markdown` で、次のタグ列が与えられる。

**When**: 有効な表示カテゴリを求める。

**Then**: 対応している最初のタグを使い、対応タグがなければ Deck のカテゴリを使う。言語の別名も受け入れる。

| タグの順序 | 期待カテゴリ |
| --- | --- |
| `unknown, math, python` | `math` |
| `ts` | `ts` |
| `unknown` | `markdown` |

<a id="unit-deck-03"></a>

### UNIT-DECK-03: 選択タグの OR・AND 条件を適用する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `accepts any tag set when the Deck has no selected tags` / [model/rules.spec.ts][rules] — `applies the Deck's OR and AND tag modes`

**Given**: 候補のタグ、Deck の選択タグ、OR または AND のモードがある。

**When**: タグ条件に一致するかを判定する。

**Then**: 選択タグが空なら受け入れ、選択がある場合は指定されたモードで判定する。

| 候補タグ | 選択タグ | モード | 結果 |
| --- | --- | --- | --- |
| 空 | 空 | OR | 一致 |
| `x` | `x, y` | OR | 一致 |
| `x` | `x, y` | AND | 不一致 |

<a id="unit-deck-04"></a>

### UNIT-DECK-04: ID に一致する Deck を取得し、存在しなければ失敗する

カテゴリ: `read`

対応テスト: [model/rules.spec.ts][rules] — `returns the deck matching the specified id` / [model/rules.spec.ts][rules] — `throws when no deck matches the specified id`

**Given**: 複数の Deck の一覧、または空の一覧がある。

**When**: 必須取得操作に対象 ID を渡す。

**Then**: 一致する Deck があればその Deck を返す。空の一覧で `missing` を指定した場合は `Deck not found: missing` で失敗する。

<a id="unit-deck-05"></a>

### UNIT-DECK-05: Firebase に接続せず Deck ID を生成する

カテゴリ: `read`

対応テスト: [api/id.spec.ts][id] — `generates an ID without Firebase`

**Given**: Firebase の認証・通信を用意していない。

**When**: Deck ID を生成する。

**Then**: 英大文字・英小文字・数字からなる20文字の ID を返す。衝突しないことやランダム性の統計的性質はこのケースでは検証しない。

<a id="unit-deck-06"></a>

### UNIT-DECK-06: Deck 作成入力を正規化し既定値を補う

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `applies entity defaults without adding persistence timestamps`

**Given**: UID `uid-a`、Deck ID `deck`、名前 ` Deck ` の作成入力がある。

**When**: 作成入力を検証する。

**Then**: 名前は `Deck` となる。`isPublic=false`、`selectedTags=[]`、`tagAndFilter=false`、`category=""`、`convertToBr=false` を補い、永続化時刻は加えない。

<a id="unit-deck-07"></a>

### UNIT-DECK-07: 不正な作成・編集入力を拒否する

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `createDeckSchema > rejects an invalid %s` / [model/schema.spec.ts][schema] — `editDeckSchema > rejects an invalid %s`

**Given**: 作成、または名前・URL を指定する部分編集の入力がある。ほかの入力項目は有効とする。

**When**: 次の不正な値を一つずつ渡して入力を検証する。

**Then**: いずれも該当する項目のエラーで失敗する。

| 項目 | 不正値 | エラーの識別内容 |
| --- | --- | --- |
| UID | 空文字 | confirmed user |
| Deck ID | 空文字 | Deck id |
| 指定した名前 | 空白のみ | Deck name |
| 指定した URL | `not-a-url` | valid URL |

<a id="unit-deck-08"></a>

### UNIT-DECK-08: 作成入力から呼び出し元指定の所有者を除く

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `drops caller-provided owner metadata from the command`

**Given**: 実行者 UID は `actor` だが、Deck 入力には所有者として別の UID が含まれている。

**When**: 作成入力を検証する。

**Then**: Deck 作成データには呼び出し元が指定した所有者 UID を残さない。実行者 UID は作成要求の文脈として保持する。

<a id="unit-deck-09"></a>

### UNIT-DECK-09: 指定項目だけの編集を受け付ける

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `accepts a partial edit with a non-empty Deck id`

**Given**: UID `uid-a`、ID `deck`、名前 ` Renamed `、URL `https://example.com` の部分編集入力がある。

**When**: 編集入力を検証する。

**Then**: 名前を `Renamed` に正規化し、ID と指定した編集値だけを返す。未指定の編集項目を既定値で埋めない。

<a id="unit-deck-10"></a>

### UNIT-DECK-10: URL の削除と未変更を区別する

カテゴリ: `read`

対応テスト: [model/schema.spec.ts][schema] — `uses null to distinguish clearing a URL from leaving it unchanged`

**Given**: 有効な UID と Deck ID の編集入力に、URL を指定しない場合と `null` を指定する場合がある。

**When**: 編集入力を検証する。

**Then**: 未指定の場合は出力にも URL を加えず、`null` は URL の明示的な削除指定として保持する。

<a id="unit-deck-11"></a>

### UNIT-DECK-11: 既存 document の文字列を現在の作成入力規則で拒否しない

カテゴリ: `read`

対応テスト: [api/document.spec.ts][document] — `accepts legacy strings without applying current command validation`

**Given**: 型が正しい既存 document に、空の UID・空の名前・URL `legacy-value` が含まれている。

**When**: 保存済み Deck document を解析する。

**Then**: これらの文字列と保存値をそのまま受け入れる。現在の作成入力の必須値・URL 検証を既存データの読みに適用しない。

<a id="unit-deck-12"></a>

### UNIT-DECK-12: 作成データに実行者と保存時刻を付ける

カテゴリ: `read`

対応テスト: [api/document.spec.ts][document] — `maps a remote create command to the Firestore boundary`

**Given**: 検証済みの Deck 作成データ、実行者 `actor`、保存時刻 `10` がある。

**When**: 保存用 document に変換する。

**Then**: 所有者は `actor`、作成・更新時刻はともに `10`、削除時刻は `null` となり、Deck ID・名前・設定を保持する。

<a id="unit-deck-13"></a>

### UNIT-DECK-13: document の外側の ID を Deck の ID に採用する

カテゴリ: `read`

対応テスト: [api/document.spec.ts][document] — `maps a Firestore document to the remote store boundary`

**Given**: document ID は `deck` で、本文には旧形式の重複 ID `legacy-duplicate-id` と所有者・設定・時刻がある。

**When**: 保存済み document を Deck に変換する。

**Then**: Deck ID は `deck` となり、所有者・名前・設定・作成更新時刻を保持する。削除時刻や旧重複 ID を表示用 Deck に混入させない。

<a id="unit-deck-14"></a>

### UNIT-DECK-14: 永続化 API の入口で実行者と削除 ID を検証する

カテゴリ: `write`

対応テスト: [api/firestore.spec.ts][firestore] — `rejects create requests without a confirmed actor` / [api/firestore.spec.ts][firestore] — `rejects edit requests without a confirmed user` / [api/firestore.spec.ts][firestore] — `rejects delete requests without a confirmed user or Deck id`

**Given**: 有効な Deck データがあり、実行者 UID が空の要求、または削除 ID が空の要求を用意する。

**When**: 作成・編集・削除の永続化 API を呼ぶ。

**Then**: UID が空なら各操作は `confirmed user` のエラーで失敗する。有効な UID でも削除 ID が空なら `Deck id` のエラーで失敗する。

<a id="unit-deck-15"></a>

### UNIT-DECK-15: 存在しない Deck の編集・削除を拒否する

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects edit and delete when the Deck cannot be resolved`

**Given**: 現在参照できる Deck 一覧に ID `missing` が存在しない。

**When**: その Deck の編集または削除を要求する。

**Then**: `Deck "missing" was not found` のエラーで失敗する。

<a id="unit-deck-16"></a>

### UNIT-DECK-16: 所有者が異なる Deck の編集・削除を委譲しない

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `rejects remote deletion when the authenticated user does not own the Deck` / [api/mutations.spec.ts][mutations] — `rejects remote edits before writing when the authenticated user does not own the Deck`

**Given**: Deck の所有者は `owner` であり、実行者は `other-user` である。

**When**: その Deck の名前変更または削除を要求する。

**Then**: 所有者不一致で失敗し、対応する永続化操作を要求しない。これはアプリの事前検証であり Rules の認可ではない。

<a id="unit-deck-17"></a>

### UNIT-DECK-17: 所有者自身の編集・削除を永続化境界へ渡す

カテゴリ: `write`

対応テスト: [api/mutations.spec.ts][mutations] — `routes matching-owner edits and deletes to remote persistence`

**Given**: 実行者が所有する Deck `remote` が存在し、永続化操作をモックしている。

**When**: 名前を `Renamed` に変更する要求、または削除要求を行う。

**Then**: 同じ実行者 UID と対象 ID を永続化境界へ渡す。名前変更では指定した新しい名前も渡す。

<a id="unit-deck-18"></a>

### UNIT-DECK-18: 購読データから削除されていない Deck を公開する

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `replaces the store with active Decks`

**Given**: Deck 一覧は空で購読中である。受信データには URL 付きの有効な Deck と、削除時刻が設定された Deck がある。

**When**: そのデータを購読コールバックへ渡す。

**Then**: 参照 hook は有効な Deck のみを返し、その ID と URL を保持する。

<a id="unit-deck-19"></a>

### UNIT-DECK-19: 不正な購読 document を識別して通知する

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `reports invalid Firestore documents`

**Given**: Deck を購読中であり、document `invalid` の `selectedTags` に数値 `42` が含まれている。

**When**: その document を受信する。

**Then**: エラー通知には `FirestoreDocumentValidationError` と document ID `invalid` が含まれる。受信失敗後の既存一覧の保持はこのテストでは未検証。

<a id="unit-deck-20"></a>

### UNIT-DECK-20: 購読失敗を呼び出し元へ通知する

カテゴリ: `write`

対応テスト: [api/subscription.spec.tsx][subscription] — `reports Firestore subscription errors`

**Given**: Deck の購読が開始され、エラー通知先が指定されている。

**When**: SDK の購読エラーを受け取る。

**Then**: 同じエラーを通知先に渡す。

## 検証範囲の注意

保存処理・Firestore SDK は必要な境界でモックする。実際の書き込み、削除に伴う関連データの処理、Rules による認可、購読クエリの実行は Firestore 結合テストの対象。型だけの検査は本仕様の runtime ケースに含めない。

[rules]: ../../../src/entities/deck/model/rules.spec.ts
[schema]: ../../../src/entities/deck/model/schema.spec.ts
[document]: ../../../src/entities/deck/api/document.spec.ts
[id]: ../../../src/entities/deck/api/id.spec.ts
[firestore]: ../../../src/entities/deck/api/firestore.spec.ts
[mutations]: ../../../src/entities/deck/api/mutations.spec.ts
[subscription]: ../../../src/entities/deck/api/subscription.spec.tsx

# E2E Fixture 規約

`docs/e2e/fixture/*.yaml` を E2E 開始時の論理的な永続状態の仕様とし、すべてのカテゴリで共有する。
各テストケースは `Given` の先頭で使用する fixture を1つ明示する。

## 構造

- `auth.users` は mock する認証 identity を表す。
- `remote` は Firestore emulator に保存する Deck / Card を表す。
- `browser` は localStorage に保存する preference、local-only data、Study session を表す。
- fixture YAML にはアプリケーション上の永続状態を記述し、Firestore 固有の serialization は記述しない。
- 認証失敗、network failure、dialog の表示状態など永続状態ではない前提は fixture に含めず、各ケースの `Given` に記述する。
- YAML alias は使用しない。

## 継承

- トップレベルの `extends` に、同じディレクトリの bare filename を1つだけ指定できる。
- 継承 chain を利用できる。
- object は再帰的に merge し、array と scalar は子の値で全置換する。
- object map は key 単位で再帰的に merge し、同じ entry の field は子が上書きする。
- 子で省略した親の entry は保持され、空 object や削除 sentinel では削除できない。
- 空の map が必要な fixture は、その map を持たない親から継承する。

## 既定値と省略

- fixture YAML はアプリケーションの既定状態からの差分だけを記述する。
- `false`、`0`、`null`、空配列、空 object という見た目だけで省略せず、その field の既定値と一致するときだけ省略する。
- 既定値が `null` の field に意味のある `0` を指定する場合など、値が既定値と異なるときは明示する。
- 継承を materialize した結果で省略された field はアプリケーションの既定値、存在しない collection は空として扱う。
- fixture に記述していない preference はアプリケーションの既定値を利用し、`loadSample` の既定値は `true` とする。

### Deck

省略 field は次の値で正規化する。

- `isPublic: false`
- `scoreMax: null`
- `scoreMin: null`
- `selectedTags: []`
- `tagAndFilter: false`
- `category: ""`
- `convertToBr: false`
- `createdAt: 0`
- `updatedAt: 0`
- remote Deck の `deletedAt: null`

### Card

省略 field は次の値で正規化する。

- `tags: []`
- `score: 0`
- `numberOfSeen: 0`
- `deletedAt: null`
- `createdAt: 0`
- `updatedAt: 0`

### Study session

省略された `lastStudiedAt` は `0` として正規化する。

## Timestamp

- 数値 timestamp field (`createdAt`、`updatedAt`、`lastStudiedAt` など) の初期値は `0` (Unix epoch milliseconds) とする。
- timestamp の値、順序、経過時間そのものがテスト条件でない限り、fixture YAML に timestamp を記述しない。

## Logical ID と namespace

- fixture 内の ID と UID は logical ID とする。
- すべてのカテゴリで logical ID と UID を test case と retry ごとに分離した namespace へ展開し、他ケースと共有しない。
- UID、Deck / Card / session ID、Card の `deckId`、`studySessions` の map key と `cardOrderIds` は同じ対応表で展開する。
- application-defined stable ID である `sample-v1` と `sample-v1-card-*` は namespace へ展開せず、そのまま利用する。

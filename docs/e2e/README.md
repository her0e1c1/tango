# E2E テスト仕様書

## 目的

ブラウザ上の主要な利用者導線を、永続化、認証、失敗後の復旧を含む acceptance test として確認する。
このディレクトリの仕様を E2E test case の single source of truth とし、各 ID をちょうど一つの Playwright test に対応させる。

## 前提

- `mise run e2e` で Playwright を実行する。
- Deck / Card の remote data は Firestore emulator、認証は Firebase Auth emulator を使用する。
- Google account 連携は Auth emulator の local popup flow で確認し、実際の外部 identity provider には接続しない。
- Config / Study session と local-only data は browser storage に保存する。
- E2E は代表的な利用者導線を対象とし、各 validation rule や設定・入力手段の組み合わせは
  unit / component test で確認する。

## 保存先の用語

- `local-only`: Deck / Card を remote に作成せず、現在の browser storage だけに保存する状態を指す。
- `remote`: 現在の認証 UID に属する Deck / Card を Firestore emulator に保存する状態を指す。
- `offline cache`: remote data の browser 上の cache と、offline 中に remote へ反映待ちとなった変更を指す。local-only data とは区別する。

## カテゴリ

- `read`: 永続データを変更せず、並列実行の対象とする。
- `write`: ケースごとに分離したデータへ1つの論理操作を永続化し、並列実行の対象とする。
- `batch`: Deck / Card 群、保存先、認証スコープなど複数のリソースを一括で変更する。
- すべてのカテゴリで UID、document ID、browser storage、学習 session をケースごとに分離し、test と retry の間でも識別子を共有しない。
- すべての test case は並列実行でき、同時に実行された別の test case のデータや認証状態に依存しない。

## Fixture

- `fixture/*.yaml` を E2E 開始時の論理的な永続状態の仕様とし、すべてのカテゴリで共有する。
- 各テストケースは `Given` の先頭で使用する fixture を明示する。
- fixture はトップレベルの `extends` に同じディレクトリの bare filename を1つ指定して継承でき、継承 chain も利用できる。
- 継承では object を再帰的に merge し、array と scalar は子の値で全置換する。
- object map は key 単位で再帰的に merge し、同じ entry の field は子が上書きする。子で省略した親の entry は保持され、空 object や削除 sentinel では削除できない。空の map が必要な fixture はその map を持たない親から継承する。
- YAML alias は使用しない。
- `auth.users` は mock する認証 identity、`remote` は Firestore emulator、`browser` は localStorage に保存する状態を表す。
- fixture 内の ID と UID は論理 ID とし、すべてのカテゴリで test case と retry ごとの namespace に展開して他ケースと共有しない。
- UID、Deck / Card / session ID、Card の `deckId`、`studySessions` の map key と `cardOrderIds` は同じ対応表で展開する。
- application-defined stable ID である `sample-v1` と `sample-v1-card-*` は namespace に展開せず、そのまま利用する。
- Deck の省略 field は `isPublic: false`、`scoreMax: null`、`scoreMin: null`、`selectedTags: []`、`tagAndFilter: false`、`category: ""`、`convertToBr: false`、`createdAt: 0`、`updatedAt: 0` として正規化し、remote Deck の `deletedAt` は `null` とする。
- Card の省略 field は `tags: []`、`score: 0`、`numberOfSeen: 0`、`deletedAt: null`、`createdAt: 0`、`updatedAt: 0` として正規化する。
- Study session の省略された `lastStudiedAt` は `0` として正規化する。
- fixture に記述していない preference はアプリケーションの既定値を利用し、`loadSample` の既定値は `true` とする。
- 継承を materialize した結果に存在しない collection は空として扱う。
- 認証失敗、network failure、dialog の表示状態など永続状態ではない前提は fixture に含めず、各ケースの `Given` に記述する。

## 共通の期待結果

- `browser error` は、処理されていない page error または予期しない console error を指す。
- 正常系では browser error が発生しないことを確認する。
- 異常系では想定したエラーが画面上で処理され、browser error として残らないことを確認する。

## テストケース

### Navigation

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| NAVIGATION-01 | read | [存在しない route から Deck 一覧へ復帰できる](./navigation.md#navigation-01) |

### Account

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](./account.md#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](./account.md#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](./account.md#account-03) |
| ACCOUNT-04 | read | [認証初期化失敗から Reload で復帰できる](./account.md#account-04) |

### Settings

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SETTINGS-01 | write | [Dark mode を自動保存して reload 後も反映できる](./settings.md#settings-01) |
| SETTINGS-02 | write | [Maximum cards 設定を次の学習 session に反映できる](./settings.md#settings-02) |

### Import

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| IMPORT-01 | read | [有効な CSV を永続化せずに preview できる](./import.md#import-01) |
| IMPORT-02 | read | [不正な行を含む CSV の import を阻止できる](./import.md#import-02) |
| IMPORT-03 | batch | [CSV を remote に import して reload 後も利用できる](./import.md#import-03) |
| IMPORT-04 | batch | [CSV を local-only に import して reload 後に学習できる](./import.md#import-04) |
| IMPORT-05 | batch | [失敗した import を同じ保存先へ重複なく再試行できる](./import.md#import-05) |
| IMPORT-06 | batch | [Sample Deck を保存して一覧へ戻り、再追加しても重複しない](./import.md#import-06) |
| IMPORT-07 | batch | [Sample Deck を一度だけ初期生成できる](./import.md#import-07) |

### Deck

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](./deck.md#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して reload 後も確認できる](./deck.md#deck-02) |
| DECK-03 | batch | [Deck と関連データをまとめて削除できる](./deck.md#deck-03) |
| DECK-04 | read | [Deck の削除を取り消せる](./deck.md#deck-04) |
| DECK-05 | batch | [Deck の削除失敗後に再試行できる](./deck.md#deck-05) |
| DECK-06 | read | [存在しない Deck から復帰できる](./deck.md#deck-06) |
| DECK-07 | batch | [local-only Deck と Card を remote へ移行できる](./deck.md#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](./deck.md#deck-08) |
| DECK-09 | write | [空の remote Deck を作成して reload 後も確認できる](./deck.md#deck-09) |
| DECK-10 | write | [remote Deck の作成失敗後に重複なく再試行できる](./deck.md#deck-10) |

### Card

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧に学習情報を表示できる](./card.md#card-01) |
| CARD-02 | read | [Card の裏面 overlay を開ける](./card.md#card-02) |
| CARD-03 | write | [Card 編集内容を保存して reload 後も確認できる](./card.md#card-03) |
| CARD-04 | write | [Card を削除できる](./card.md#card-04) |
| CARD-05 | write | [Card の右 swipe で score を増やせる](./card.md#card-05) |
| CARD-06 | write | [Card の左 swipe で score を減らせる](./card.md#card-06) |
| CARD-07 | read | [開いている Card の裏面 overlay を閉じられる](./card.md#card-07) |
| CARD-08 | read | [Card の削除を取り消せる](./card.md#card-08) |
| CARD-09 | write | [Card の編集失敗後に再試行できる](./card.md#card-09) |
| CARD-10 | write | [score と tag の filter を保存して Card 一覧へ反映できる](./card.md#card-10) |
| CARD-11 | read | [Card view を直接開ける](./card.md#card-11) |
| CARD-12 | read | [存在しない Card から復帰できる](./card.md#card-12) |

### Study

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](./study.md#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](./study.md#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](./study.md#swipe-04) |
| SWIPE-05 | write | [previous-card action で前の Card へ戻れる](./study.md#swipe-05) |
| SWIPE-06 | write | [filter と学習上限を反映して session を開始できる](./study.md#swipe-06) |
| SWIPE-07 | read | [filter に一致する Card がない場合は session を開始できない](./study.md#swipe-07) |
| SWIPE-08 | write | [学習画面から戻った後に同じ位置から Continue できる](./study.md#swipe-08) |
| SWIPE-09 | write | [Restart で新しい session を先頭から開始できる](./study.md#swipe-09) |
| SWIPE-10 | write | [最後の Card を完了して session を終了できる](./study.md#swipe-10) |
| SWIPE-11 | batch | [複数 Deck の学習 session を独立して維持できる](./study.md#swipe-11) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](./study.md#swipe-12) |
| SWIPE-13 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](./study.md#swipe-13) |
| SWIPE-14 | read | [non-primary mouse の drag を無視できる](./study.md#swipe-14) |
| SWIPE-16 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](./study.md#swipe-16) |
| SWIPE-17 | write | [local-only Deck の学習結果と session を reload 後も維持できる](./study.md#swipe-17) |
| SWIPE-24 | read | [Help dialog に現在の操作 mapping を表示できる](./study.md#swipe-24) |

### Study Back Text

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-01 | read | [学習中の Card を表面から裏面へ切り替えられる](./study-back-text.md#swipe-01) |
| SWIPE-15 | read | [裏面 text を選択しても Card の状態を維持できる](./study-back-text.md#swipe-15) |
| SWIPE-18 | read | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](./study-back-text.md#swipe-18) |
| SWIPE-19 | read | [長い裏面 text を scroll しても Card の状態を維持できる](./study-back-text.md#swipe-19) |
| SWIPE-20 | write | [左 overlay から設定済み action を実行できる](./study-back-text.md#swipe-20) |
| SWIPE-21 | write | [右 overlay から設定済み action を実行できる](./study-back-text.md#swipe-21) |
| SWIPE-22 | read | [狭い画面でも overlay の下で裏面を全幅表示できる](./study-back-text.md#swipe-22) |
| SWIPE-23 | read | [overlay 上から長い裏面 text を scroll できる](./study-back-text.md#swipe-23) |

### Persistence

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSIST-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](./persistence.md#persist-01) |
| PERSIST-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](./persistence.md#persist-02) |

# E2E テスト仕様書

## 前提

- `mise run e2e` で Playwright を実行する。
- Deck / Card は Firestore emulator または localStorage、Config / Study session は localStorage に保存し、
  Firebase Auth API は mock する。
- Google など外部 identity provider の画面操作は対象外とし、Account E2E ではアプリ内の認証状態とデータ境界を確認する。
- E2E は代表的な利用者導線を対象とし、各 validation rule や設定・入力手段の組み合わせは
  unit / component test で確認する。

## カテゴリ

- `read`: 永続データを変更せず、並列実行の対象とする。
- `write`: ケースごとに分離したデータへ1つの論理操作を永続化し、並列実行の対象とする。
- `batch`: Deck / Card 群、保存先、認証スコープなど複数のリソースを一括で変更する。

## 共通の期待結果

- `browser error` は、処理されていない page error または予期しない console error を指す。
- 正常系では browser error が発生しないことを確認する。
- 異常系では想定したエラーが画面上で処理され、browser error として残らないことを確認する。

## テストケース

### App

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| APP-01 | batch | [Sample Deck を一度だけ初期生成できる](./app.md#app-01) |
| APP-02 | read | [存在しない route から Deck 一覧へ復帰できる](./app.md#app-02) |
| APP-03 | read | [認証初期化失敗から Reload で復帰できる](./app.md#app-03) |

### Account

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](./account.md#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](./account.md#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](./account.md#account-03) |

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
| IMPORT-06 | batch | [Sample Deck を繰り返し追加しても重複しない](./import.md#import-06) |

### Deck

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](./deck.md#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して reload 後も確認できる](./deck.md#deck-02) |
| DECK-03 | batch | [Deck と関連データをまとめて削除できる](./deck.md#deck-03) |
| DECK-04 | read | [Deck の削除を取り消せる](./deck.md#deck-04) |
| DECK-05 | batch | [Deck の削除失敗後に再試行できる](./deck.md#deck-05) |
| DECK-06 | read | [存在しない Deck から復帰できる](./deck.md#deck-06) |
| DECK-07 | batch | [local-only Deck と Card を remote storage へ移行できる](./deck.md#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](./deck.md#deck-08) |

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

### Swipe

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-01 | read | [学習中の Card を表面から裏面へ切り替えられる](./swipe.md#swipe-01) |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](./swipe.md#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](./swipe.md#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](./swipe.md#swipe-04) |
| SWIPE-05 | write | [previous-card action で前の Card へ戻れる](./swipe.md#swipe-05) |
| SWIPE-06 | write | [filter と学習上限を反映して session を開始できる](./swipe.md#swipe-06) |
| SWIPE-07 | read | [filter に一致する Card がない場合は session を開始できない](./swipe.md#swipe-07) |
| SWIPE-08 | write | [Exit 後に同じ位置から Continue できる](./swipe.md#swipe-08) |
| SWIPE-09 | write | [Restart で新しい session を先頭から開始できる](./swipe.md#swipe-09) |
| SWIPE-10 | write | [最後の Card を完了して session を終了できる](./swipe.md#swipe-10) |
| SWIPE-11 | batch | [複数 Deck の学習 session を独立して維持できる](./swipe.md#swipe-11) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](./swipe.md#swipe-12) |
| SWIPE-13 | write | [primary mouse の上方向 drag で次の Card へ進める](./swipe.md#swipe-13) |
| SWIPE-14 | read | [non-primary mouse の drag を無視できる](./swipe.md#swipe-14) |
| SWIPE-15 | read | [裏面 text を選択しても Card の状態を維持できる](./swipe.md#swipe-15) |

### Persistence

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSIST-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](./persistence.md#persist-01) |
| PERSIST-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](./persistence.md#persist-02) |

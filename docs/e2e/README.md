# E2E テスト仕様書

ブラウザ上の主要な利用者導線を、永続化、認証、失敗後の復旧を含む acceptance test として確認する。
このディレクトリの仕様を E2E test case の single source of truth とし、各 ID をちょうど一つの Playwright test に対応させる。

## ドキュメント構成

| 文書 | 責務 |
| --- | --- |
| [E2E テスト規約](./conventions.md) | 実行前提、保存先の用語、カテゴリ、テストケースの書式、共通の期待結果 |
| [Fixture 規約](./fixture/README.md) | fixture の構造、継承、既定値、namespace |
| この README | 全テストケースの索引。E2E contract check が各 ID の過不足を検証する |
| 機能別の仕様書 | 各テストケースの Given / When / Then |

機能別の仕様書は `docs/e2e` 直下に置き、対象領域と振る舞いが分かる名前にする。
大きくなった領域は、Card の表示・管理・一覧操作、Study の session・controls のように利用者の振る舞いで分割する。

## テストケース索引

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
| SETTINGS-02 | write | [Maximum cards 設定を学習開始画面に反映できる](./settings.md#settings-02) |
| SETTINGS-03 | batch | [Respect review schedule を次の学習 session に反映できる](./settings.md#settings-03) |
| SETTINGS-04 | write | [日本語設定を自動保存して reload 後も反映できる](./settings.md#settings-04) |
| SETTINGS-05 | write | [System 設定で browser locale を解決して reload 後も反映できる](./settings.md#settings-05) |

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
| DECK-01 | read | [Deck 一覧から Card 一覧へ遷移できる](./deck-navigation.md#deck-01) |
| DECK-02 | write | [Deck 編集内容を保存して reload 後も確認できる](./deck-management.md#deck-02) |
| DECK-03 | batch | [Deck と関連データをまとめて削除できる](./deck-management.md#deck-03) |
| DECK-04 | read | [Deck の削除を取り消せる](./deck-management.md#deck-04) |
| DECK-05 | batch | [Deck の削除失敗後に再試行できる](./deck-management.md#deck-05) |
| DECK-06 | read | [存在しない Deck から復帰できる](./deck-navigation.md#deck-06) |
| DECK-07 | batch | [local-only Deck と Card を remote へ移行できる](./deck-transfer.md#deck-07) |
| DECK-08 | read | [Deck の Card を CSV で export できる](./deck-transfer.md#deck-08) |
| DECK-09 | write | [空の remote Deck を作成して reload 後も確認できる](./deck-management.md#deck-09) |
| DECK-10 | write | [remote Deck の作成失敗後に重複なく再試行できる](./deck-management.md#deck-10) |
| DECK-11 | write | [空の local-only Deck を作成して reload 後も確認できる](./deck-management.md#deck-11) |

### Card

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-01 | read | [Card 一覧に学習情報を表示できる](./card-view.md#card-01) |
| CARD-02 | read | [Card の裏面 overlay を開ける](./card-view.md#card-02) |
| CARD-03 | write | [Card 編集内容を保存して reload 後も確認できる](./card-management.md#card-03) |
| CARD-04 | write | [Card を削除できる](./card-management.md#card-04) |
| CARD-05 | write | [Card の右 swipe で score を増やせる](./card-list-actions.md#card-05) |
| CARD-06 | write | [Card の左 swipe で score を減らせる](./card-list-actions.md#card-06) |
| CARD-07 | read | [開いている Card の裏面 overlay を閉じられる](./card-view.md#card-07) |
| CARD-08 | read | [Card の削除を取り消せる](./card-management.md#card-08) |
| CARD-09 | write | [Card の編集失敗後に再試行できる](./card-management.md#card-09) |
| CARD-10 | write | [score と tag の filter を保存して Card 一覧へ反映できる](./card-list-actions.md#card-10) |
| CARD-11 | read | [Card view を直接開ける](./card-view.md#card-11) |
| CARD-12 | read | [存在しない Card から復帰できる](./card-view.md#card-12) |
| CARD-13 | write | [remote Deck に Card を作成できる](./card-management.md#card-13) |
| CARD-14 | write | [local-only Deck に Card を作成できる](./card-management.md#card-14) |
| CARD-15 | write | [remote Card の作成失敗後に重複なく再試行できる](./card-management.md#card-15) |

### Study

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](./study-actions.md#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](./study-actions.md#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](./study-actions.md#swipe-04) |
| SWIPE-05 | write | [previous-card action で前の Card へ戻れる](./study-actions.md#swipe-05) |
| SWIPE-06 | write | [filter と学習上限を反映して session を開始できる](./study-session.md#swipe-06) |
| SWIPE-07 | read | [filter に一致する Card がない場合は session を開始できない](./study-session.md#swipe-07) |
| SWIPE-08 | write | [学習画面から戻った後に同じ位置から Continue できる](./study-session.md#swipe-08) |
| SWIPE-09 | write | [Restart で新しい session を先頭から開始できる](./study-session.md#swipe-09) |
| SWIPE-10 | write | [最後の Card を完了して completion screen を表示できる](./study-session.md#swipe-10) |
| SWIPE-11 | batch | [複数 Deck の学習 session を独立して維持できる](./study-session.md#swipe-11) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](./study-actions.md#swipe-12) |
| SWIPE-13 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#swipe-13) |
| SWIPE-14 | read | [non-primary mouse の drag を無視できる](./study-controls.md#swipe-14) |
| SWIPE-16 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#swipe-16) |
| SWIPE-17 | write | [local-only Deck の学習結果と session を reload 後も維持できる](./study-session.md#swipe-17) |
| SWIPE-24 | read | [Help dialog に現在の操作 mapping を表示できる](./study-controls.md#swipe-24) |
| SWIPE-25 | write | [Help button の表示設定を reload 後も維持できる](./study-controls.md#swipe-25) |

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
| SWIPE-23 | read | [overlay 上の wheel と touch で長い裏面 text を scroll できる](./study-back-text.md#swipe-23) |

### Persistence

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSIST-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](./persistence.md#persist-01) |
| PERSIST-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](./persistence.md#persist-02) |

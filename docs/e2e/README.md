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
| NAVIGATION-02 | read | [画面の keyboard shortcut で主要 route へ遷移できる](./navigation.md#navigation-02) |
| NAVIGATION-03 | write | [共通エラー画面が現在の言語で表示され Reload で復旧する](./navigation.md#navigation-03) |
| NAVIGATION-04 | read | [初期化リクエストを読み取れなくても通常起動できる](./navigation.md#navigation-04) |
| NAVIGATION-05 | read | [未処理の実行時例外と Promise rejection から復旧できる](./navigation.md#navigation-05) |
| NAVIGATION-06 | read | [通常アプリの起動失敗から復旧できる](./navigation.md#navigation-06) |
| NAVIGATION-07 | write | [初期化失敗時は通常起動せず復旧画面を表示する](./navigation.md#navigation-07) |

### Account

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| ACCOUNT-01 | batch | [匿名アカウントを Google アカウントに連携してデータを維持できる](./account.md#account-01) |
| ACCOUNT-02 | write | [Google sign-in のエラー表示から再試行できる](./account.md#account-02) |
| ACCOUNT-03 | batch | [sign-out 後に新しい匿名アカウントへ切り替えられる](./account.md#account-03) |
| ACCOUNT-04 | read | [認証初期化失敗から Reload で復帰できる](./account.md#account-04) |
| ACCOUNT-05 | batch | [処理中と通知表示中の言語変更を共通 toast に反映できる](./account.md#account-05) |

### Settings

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SETTINGS-01 | write | [Dark mode を自動保存して reload 後も反映できる](./settings.md#settings-01) |
| SETTINGS-02 | write | [Maximum cards 設定を学習開始画面に反映できる](./settings.md#settings-02) |
| SETTINGS-03 | batch | [Respect review schedule を次の学習 session に反映できる](./settings.md#settings-03) |
| SETTINGS-04 | write | [日本語設定を自動保存して reload 後も反映できる](./settings.md#settings-04) |
| SETTINGS-05 | write | [System 設定で browser locale を解決して reload 後も反映できる](./settings.md#settings-05) |
| SETTINGS-06 | read | [無効な保存済み設定から現在の既定値へ復旧できる](./settings.md#settings-06) |
| SETTINGS-07 | read | [詳細設定をキーボードで開閉してフォーカス位置を確認できる](./settings.md#settings-07) |
| SETTINGS-08 | write | [Card の検証エラーが言語変更に追随し入力を保持する](./settings.md#settings-08) |
| SETTINGS-09 | write | [CSV の検証結果が再読み込みなしで言語変更に追随する](./settings.md#settings-09) |
| SETTINGS-10 | write | [自動再生の間隔の0の意味を表示して数値のまま保存できる](./settings.md#settings-10) |
| SETTINGS-11 | batch | [間隔0から正の値へ戻して同じ学習 session の再生操作を利用できる](./settings.md#settings-11) |

### Import

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| IMPORT-01 | read | [有効な CSV を永続化せずに preview できる](./import.md#import-01) |
| IMPORT-02 | read | [不正な行を含む CSV の import を阻止できる](./import.md#import-02) |
| IMPORT-03 | batch | [CSV を remote に import して reload 後も利用できる](./import.md#import-03) |
| IMPORT-04 | batch | [CSV を local-only に import して reload 後に学習できる](./import.md#import-04) |
| IMPORT-05 | batch | [queued import の同期拒否を通知できる](./import.md#import-05) |
| IMPORT-06 | batch | [4種類の例を同じ確認・保存フローで追加できる](./import.md#import-06) |
| IMPORT-07 | batch | [Sample Deck を一度だけ初期生成できる](./import.md#import-07) |
| IMPORT-08 | batch | [Sample deck の全内容を local-only に取り込んで学習できる](./import.md#import-08) |
| IMPORT-09 | batch | [通常ユーザーの Sample deck を同期できる](./import.md#import-09) |
| IMPORT-10 | batch | [Google 未ログインの Sample deck を local-only に維持できる](./import.md#import-10) |

### Deck Navigation

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-NAVIGATION-01 | read | [Deck 一覧から Card 一覧へ遷移できる](./deck-navigation.md#deck-navigation-01) |
| DECK-NAVIGATION-02 | read | [存在しない Deck から復帰できる](./deck-navigation.md#deck-navigation-02) |
| DECK-NAVIGATION-03 | read | [remote Deck を学習データを変更せずに閲覧できる](./deck-navigation.md#deck-navigation-03) |
| DECK-NAVIGATION-04 | read | [local-only Deck の閲覧位置を保存せずに再入場できる](./deck-navigation.md#deck-navigation-04) |
| DECK-NAVIGATION-05 | write | [現在のtag filter に一致する全 Card を標準順で閲覧できる](./deck-navigation.md#deck-navigation-05) |
| DECK-NAVIGATION-06 | read | [復習期日の設定を閲覧対象へ反映できる](./deck-navigation.md#deck-navigation-06) |
| DECK-NAVIGATION-07 | read | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](./deck-navigation.md#deck-navigation-07) |
| DECK-NAVIGATION-08 | read | [1件の Card の長い解答を touch で閲覧して終了できる](./deck-navigation.md#deck-navigation-08) |
| DECK-NAVIGATION-09 | write | [閲覧と学習で表示設定と操作ヘルプを共有できる](./deck-navigation.md#deck-navigation-09) |
| DECK-NAVIGATION-10 | read | [学習データを保存せずに閲覧を自動再生できる](./deck-navigation.md#deck-navigation-10) |
| DECK-NAVIGATION-11 | read | [閲覧の進捗スライダーで前後へ移動できる](./deck-navigation.md#deck-navigation-11) |
| DECK-NAVIGATION-12 | read | [保持中の復習件数と学習導線を表示できる](./deck-navigation.md#deck-navigation-12) |
| DECK-NAVIGATION-13 | read | [復習期限の到達で一覧を更新できる](./deck-navigation.md#deck-navigation-13) |
| DECK-NAVIGATION-14 | write | [view mode で長い表面を読みながら移動を防止できる](./deck-navigation.md#deck-navigation-14) |
| DECK-NAVIGATION-15 | write | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](./deck-navigation.md#deck-navigation-15) |
| DECK-NAVIGATION-16 | write | [view mode 中も閲覧ボタンと自動再生を使える](./deck-navigation.md#deck-navigation-16) |

### Deck Management

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-MANAGEMENT-01 | write | [Deck 編集内容を保存して reload 後も確認できる](./deck-management.md#deck-management-01) |
| DECK-MANAGEMENT-02 | batch | [Deck と関連データをまとめて削除できる](./deck-management.md#deck-management-02) |
| DECK-MANAGEMENT-03 | read | [Deck の削除を取り消せる](./deck-management.md#deck-management-03) |
| DECK-MANAGEMENT-04 | batch | [Deck の削除失敗後に再試行できる](./deck-management.md#deck-management-04) |
| DECK-MANAGEMENT-05 | write | [空の remote Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-05) |
| DECK-MANAGEMENT-06 | write | [remote Deck の作成失敗を通知できる](./deck-management.md#deck-management-06) |
| DECK-MANAGEMENT-07 | write | [空の local-only Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-07) |
| DECK-MANAGEMENT-08 | read | [未保存の Deck 編集内容を離脱前に確認できる](./deck-management.md#deck-management-08) |

### Deck Transfer

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| DECK-TRANSFER-01 | read | [Deck の Card を CSV で export できる](./deck-transfer.md#deck-transfer-01) |

### Card View

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-VIEW-01 | read | [Card 一覧に学習情報を表示できる](./card-view.md#card-view-01) |
| CARD-VIEW-02 | read | [Card の裏面 overlay を開ける](./card-view.md#card-view-02) |
| CARD-VIEW-03 | read | [開いている Card の裏面 overlay を閉じられる](./card-view.md#card-view-03) |
| CARD-VIEW-04 | read | [Card view を直接開ける](./card-view.md#card-view-04) |
| CARD-VIEW-05 | read | [存在しない Card から復帰できる](./card-view.md#card-view-05) |
| CARD-VIEW-06 | write | [評価後の記憶状態を確認できる](./card-view.md#card-view-06) |

### Card Management

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-MANAGEMENT-01 | write | [Card 編集内容を保存して reload 後も確認できる](./card-management.md#card-management-01) |
| CARD-MANAGEMENT-02 | write | [Card を削除できる](./card-management.md#card-management-02) |
| CARD-MANAGEMENT-03 | read | [Card の削除を取り消せる](./card-management.md#card-management-03) |
| CARD-MANAGEMENT-04 | write | [Card の編集失敗後に再試行できる](./card-management.md#card-management-04) |
| CARD-MANAGEMENT-05 | write | [remote Deck に Card を作成できる](./card-management.md#card-management-05) |
| CARD-MANAGEMENT-06 | write | [local-only Deck に Card を作成できる](./card-management.md#card-management-06) |
| CARD-MANAGEMENT-07 | write | [remote Card の作成拒否後に新しい ID で重複なく再試行できる](./card-management.md#card-management-07) |
| CARD-MANAGEMENT-08 | write | [Card の削除失敗後に再試行できる](./card-management.md#card-management-08) |
| CARD-MANAGEMENT-09 | read | [未保存の Card 編集内容を離脱前に確認できる](./card-management.md#card-management-09) |
| CARD-MANAGEMENT-10 | read | [Card の未表示の面にある入力エラーを修正できる](./card-management.md#card-management-10) |
| CARD-MANAGEMENT-11 | read | [未保存の Card 作成内容の離脱を確認できる](./card-management.md#card-management-11) |
| CARD-MANAGEMENT-12 | write | [Card 作成成功が未回答の離脱確認より優先される](./card-management.md#card-management-12) |
| CARD-MANAGEMENT-13 | write | [Card 作成中に離脱しても保存成功時に一覧へ移動する](./card-management.md#card-management-13) |
| CARD-MANAGEMENT-14 | write | [Card 作成失敗後も離脱確認と入力を保持して再試行できる](./card-management.md#card-management-14) |
| CARD-MANAGEMENT-15 | read | [作成中の未保存の解答をプレビューできる](./card-management.md#card-management-15) |
| CARD-MANAGEMENT-16 | read | [編集中の未保存の解答と表示形式をプレビューできる](./card-management.md#card-management-16) |

### Card List Actions

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| CARD-LIST-ACTIONS-01 | write | [tag の filter を保存して Card 一覧へ反映できる](./card-list-actions.md#card-list-actions-01) |
| CARD-LIST-ACTIONS-02 | read | [Card を追加が新しい順に表示できる](./card-list-actions.md#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | [Card の表示順を標準へ戻せる](./card-list-actions.md#card-list-actions-03) |

### Study Actions

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-ACTIONS-01 | write | [good action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-01) |
| STUDY-ACTIONS-02 | write | [again action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-02) |
| STUDY-ACTIONS-03 | write | [スキップ で次の Card へ進める](./study-actions.md#study-actions-03) |
| STUDY-ACTIONS-04 | read | [学習中に前の Card へ戻れない](./study-actions.md#study-actions-04) |
| STUDY-ACTIONS-05 | write | [学習結果の保存失敗後に同じ Card から再試行できる](./study-actions.md#study-actions-05) |

### Study Session

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-SESSION-01 | write | [filter と学習上限を反映して session を開始できる](./study-session.md#study-session-01) |
| STUDY-SESSION-02 | read | [filter に一致する Card がない場合は session を開始できない](./study-session.md#study-session-02) |
| STUDY-SESSION-03 | write | [学習画面から戻った後に同じ位置から Continue できる](./study-session.md#study-session-03) |
| STUDY-SESSION-04 | write | [Restart で新しい session を先頭から開始できる](./study-session.md#study-session-04) |
| STUDY-SESSION-05 | write | [最後の Card を完了して completion screen を表示できる](./study-session.md#study-session-05) |
| STUDY-SESSION-06 | batch | [複数 Deck の学習 session を独立して維持できる](./study-session.md#study-session-06) |
| STUDY-SESSION-07 | write | [local-only Deck の学習結果と session を reload 後も維持できる](./study-session.md#study-session-07) |
| STUDY-SESSION-08 | batch | [展開した tag filter を保存して学習 session に適用できる](./study-session.md#study-session-08) |

### Study Controls

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-CONTROLS-01 | write | [remote Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-01) |
| STUDY-CONTROLS-02 | read | [non-primary mouse の drag を無視できる](./study-controls.md#study-controls-02) |
| STUDY-CONTROLS-03 | write | [local-only Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-03) |
| STUDY-CONTROLS-04 | read | [Help dialog に現在の操作 mapping を表示できる](./study-controls.md#study-controls-04) |
| STUDY-CONTROLS-05 | write | [Help button の表示設定を reload 後も維持できる](./study-controls.md#study-controls-05) |
| STUDY-CONTROLS-06 | write | [view mode で長い表面を操作の誤発火なくスクロールできる](./study-controls.md#study-controls-06) |
| STUDY-CONTROLS-07 | write | [view mode をタップまたは Enter で終了して表面を維持できる](./study-controls.md#study-controls-07) |
| STUDY-CONTROLS-08 | batch | [view mode 中も評価ボタンと自動再生で次の Card へ進める](./study-controls.md#study-controls-08) |
| STUDY-CONTROLS-09 | write | [view mode 設定を閲覧・学習・reload 間で共有できる](./study-controls.md#study-controls-09) |
| STUDY-CONTROLS-10 | write | [横向きの短い画面でも本文と操作ボタンに到達できる](./study-controls.md#study-controls-10) |
| STUDY-CONTROLS-11 | write | [view mode でタッチスクロールとピンチ拡大ができる](./study-controls.md#study-controls-11) |

### Study Back Text

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-BACK-TEXT-01 | read | [学習中の Card を表面から裏面へ切り替えられる](./study-back-text.md#study-back-text-01) |
| STUDY-BACK-TEXT-02 | read | [裏面 text を選択しても Card の状態を維持できる](./study-back-text.md#study-back-text-02) |
| STUDY-BACK-TEXT-03 | read | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](./study-back-text.md#study-back-text-03) |
| STUDY-BACK-TEXT-04 | read | [長い裏面 text を scroll しても Card の状態を維持できる](./study-back-text.md#study-back-text-04) |
| STUDY-BACK-TEXT-05 | write | [左 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-05) |
| STUDY-BACK-TEXT-06 | write | [右 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-06) |
| STUDY-BACK-TEXT-07 | read | [狭い画面でも overlay の下で裏面を全幅表示できる](./study-back-text.md#study-back-text-07) |
| STUDY-BACK-TEXT-08 | read | [overlay 上の wheel と touch で長い裏面 text を scroll できる](./study-back-text.md#study-back-text-08) |

### Persistence

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| PERSISTENCE-01 | read | [UID ごとに remote data を分離して reload 後も表示できる](./persistence.md#persistence-01) |
| PERSISTENCE-02 | batch | [offline cache の変更を再接続後に remote へ同期できる](./persistence.md#persistence-02) |
| PERSISTENCE-03 | write | [別の open client に remote Card の変更を即時反映できる](./persistence.md#persistence-03) |
| PERSISTENCE-04 | batch | [未ログインの変更を local-only に維持できる](./persistence.md#persistence-04) |

### Study history

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| STUDY-SESSION-09 | write | [30日分の学習記録](./study-session.md#study-session-09) |
| STUDY-SESSION-10 | read | [URLとデッキ選択](./study-session.md#study-session-10) |
| STUDY-SESSION-11 | read | [表示できないデッキ](./study-session.md#study-session-11) |
| STUDY-SESSION-12 | write | [匿名の端末内学習記録](./study-session.md#study-session-12) |
| STUDY-SESSION-13 | read | [学習記録の期間選択](./study-session.md#study-session-13) |

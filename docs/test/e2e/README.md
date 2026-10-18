# E2E テストケース索引

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| ACCOUNT-01 | batch | 正常系 | [匿名アカウントと同じ UID で Google 連携の完了を確認できる](./account.md#account-01) |
| ACCOUNT-02 | write | 異常系 | [Google sign-in のエラー表示から再試行できる](./account.md#account-02) |
| ACCOUNT-03 | batch | 正常系 | [sign-out 後に新しい匿名アカウントへ切り替えられる](./account.md#account-03) |
| ACCOUNT-04 | read | 異常系 | [認証初期化失敗から Reload で復帰できる](./account.md#account-04) |
| ACCOUNT-05 | batch | 正常系 | [処理完了時の言語で結果が通知される](./account.md#account-05) |
| ACCOUNT-06 | batch | 正常系 | [Google 連携後も Deck と Card を利用・同期できる](./account.md#account-06) |
| ACCOUNT-07 | batch | 正常系 | [Google 連携後も同じ位置から学習を再開できる](./account.md#account-07) |
| ACCOUNT-08 | batch | 正常系 | [Google 連携後も以前の学習結果を利用できる](./account.md#account-08) |
| ACCOUNT-09 | read | 正常系 | [sign-in 前に匿名データの引き継ぎ条件を確認できる](./account.md#account-09) |
| ACCOUNT-10 | batch | 正常系 | [既存の別アカウントへログインするとそのデータだけを利用できる](./account.md#account-10) |
| ACCOUNT-11 | batch | 正常系 | [Google sign-in をキャンセルしても匿名データを利用できる](./account.md#account-11) |
| ACCOUNT-12 | batch | 異常系 | [Google sign-in に失敗しても匿名データを利用できる](./account.md#account-12) |
| ACCOUNT-13 | write | 異常系 | [sign-in のエラー通知が期限または成功まで維持される](./account.md#account-13) |
| ACCOUNT-14 | batch | 正常系 | [sign-out 後に以前のアカウントのデータを利用できない](./account.md#account-14) |
| ACCOUNT-15 | batch | 異常系 | [未同期の変更があると sign-out を中止して同期を案内する](./account.md#account-15) |
| ACCOUNT-16 | batch | 正常系 | [アカウント切り替え中に以前のデータを新しいアカウントのデータとして表示しない](./account.md#account-16) |
| ACCOUNT-17 | batch | 異常系 | [アカウント切り替えの中断後も元のデータを利用できる](./account.md#account-17) |
| ACCOUNT-18 | read | 異常系 | [初回の認証初期化失敗を現在の言語で確認できる](./account.md#account-18) |
| ACCOUNT-19 | batch | 正常系 | [表示中の通知は言語変更後も focus と表示期限を維持する](./account.md#account-19) |
| CARD-FILTER-01 | read | 正常系 | [学習条件にかかわらず Card を全件表示できる](./card-filter.md#card-filter-01) |
| CARD-FILTER-02 | read | 正常系 | [他の Deck のフィルター条件にかかわらず Card を全件表示できる](./card-filter.md#card-filter-02) |
| CARD-FILTER-03 | read | 正常系 | [Card が登録されていない Deck は0件表示になる](./card-filter.md#card-filter-03) |
| CARD-FILTER-04 | read | 正常系 | [フィルターに一致する Card がない場合は0件表示になる](./card-filter.md#card-filter-04) |
| CARD-FILTER-05 | write | 正常系 | [リロード後も同じタグと AND / OR 条件を復元できる](./card-filter.md#card-filter-05) |
| CARD-FILTER-06 | write | 正常系 | [フィルターを解除した状態もリロード後に維持できる](./card-filter.md#card-filter-06) |
| CARD-FILTER-07 | write | 正常系 | [単一タグで Card を絞り込める](./card-filter.md#card-filter-07) |
| CARD-FILTER-08 | write | 正常系 | [AND 条件ですべての選択タグを持つ Card に絞り込める](./card-filter.md#card-filter-08) |
| CARD-FILTER-09 | write | 正常系 | [OR 条件でいずれかの選択タグを持つ Card に絞り込める](./card-filter.md#card-filter-09) |
| CARD-FILTER-10 | read | 正常系 | [絞り込み結果を追加が新しい順にソートできる](./card-filter.md#card-filter-10) |
| CARD-FILTER-11 | read | 正常系 | [絞り込み結果の表示順を標準へ戻せる](./card-filter.md#card-filter-11) |
| CARD-FILTER-12 | write | 正常系 | [タグ未選択なら AND / OR にかかわらず全件表示する](./card-filter.md#card-filter-12) |
| CARD-FILTER-13 | read | 正常系 | [リロードでソートだけを標準へ戻しフィルターを維持する](./card-filter.md#card-filter-13) |
| CARD-LIST-ACTIONS-01 | write | 正常系 | [tag の filter を保存して Card 一覧へ反映できる](./card-list-actions.md#card-list-actions-01) |
| CARD-LIST-ACTIONS-02 | read | 正常系 | [Card を追加が新しい順に表示できる](./card-list-actions.md#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | 正常系 | [Card の表示順を標準へ戻せる](./card-list-actions.md#card-list-actions-03) |
| CARD-MANAGEMENT-01 | write | 正常系 | [Card 編集内容を保存して reload 後も確認できる](./card-management.md#card-management-01) |
| CARD-MANAGEMENT-02 | write | 正常系 | [Card を削除できる](./card-management.md#card-management-02) |
| CARD-MANAGEMENT-03 | read | 正常系 | [Card の削除を取り消せる](./card-management.md#card-management-03) |
| CARD-MANAGEMENT-04 | write | 異常系 | [Card の編集失敗後に再試行できる](./card-management.md#card-management-04) |
| CARD-MANAGEMENT-05 | write | 正常系 | [ログイン中の Deck に Card を作成できる](./card-management.md#card-management-05) |
| CARD-MANAGEMENT-06 | write | 正常系 | [匿名で利用中の Deck に Card を作成できる](./card-management.md#card-management-06) |
| CARD-MANAGEMENT-07 | write | 異常系 | [Card の作成拒否後に重複なく再試行できる](./card-management.md#card-management-07) |
| CARD-MANAGEMENT-08 | write | 異常系 | [Card の削除失敗後に再試行できる](./card-management.md#card-management-08) |
| CARD-MANAGEMENT-09 | read | 正常系 | [未保存の Card 編集内容を離脱前に確認できる](./card-management.md#card-management-09) |
| CARD-MANAGEMENT-10 | read | 異常系 | [Card の未表示の面にある入力エラーを修正できる](./card-management.md#card-management-10) |
| CARD-MANAGEMENT-11 | read | 正常系 | [未保存の Card 作成内容の離脱を確認できる](./card-management.md#card-management-11) |
| CARD-MANAGEMENT-12 | write | 正常系 | [Card 作成成功が未回答の離脱確認より優先される](./card-management.md#card-management-12) |
| CARD-MANAGEMENT-13 | write | 正常系 | [Card 作成中に離脱しても保存処理を維持する](./card-management.md#card-management-13) |
| CARD-MANAGEMENT-14 | write | 異常系 | [Card 作成失敗後も離脱確認と入力を保持して再試行できる](./card-management.md#card-management-14) |
| CARD-MANAGEMENT-15 | read | 正常系 | [作成中の未保存の解答をプレビューできる](./card-management.md#card-management-15) |
| CARD-MANAGEMENT-16 | read | 正常系 | [編集中の未保存の解答と表示形式をプレビューできる](./card-management.md#card-management-16) |
| CARD-TAG-MANAGEMENT-01 | write | 正常系 | [確認なしのタグ編集を Card 保存時に反映する](./card-tag-management.md#card-tag-management-01) |
| CARD-TAG-MANAGEMENT-02 | read | 正常系 | [未保存のタグ変更を破棄する](./card-tag-management.md#card-tag-management-02) |
| CARD-TAG-MANAGEMENT-03 | write | 異常系 | [空名と重複を修正して保存する](./card-tag-management.md#card-tag-management-03) |
| CARD-TAG-MANAGEMENT-04 | write | 正常系 | [Card のタグ集合で絞り込み最終割り当ての解除に追従する](./card-tag-management.md#card-tag-management-04) |
| CARD-TAG-MANAGEMENT-05 | write | 正常系 | [オフラインで編集したタグを再接続後に同期する](./card-tag-management.md#card-tag-management-05) |
| CARD-TAG-MANAGEMENT-06 | write | 正常系 | [匿名のタグ編集をローカルで保持する](./card-tag-management.md#card-tag-management-06) |
| CARD-VIEW-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](./card-view.md#card-view-01) |
| CARD-VIEW-02 | read | 正常系 | [Card の裏面 overlay を開ける](./card-view.md#card-view-02) |
| CARD-VIEW-03 | read | 正常系 | [開いている Card の裏面 overlay を閉じられる](./card-view.md#card-view-03) |
| CARD-VIEW-04 | read | 正常系 | [Card view を直接開ける](./card-view.md#card-view-04) |
| CARD-VIEW-05 | read | 異常系 | [存在しない Card から復帰できる](./card-view.md#card-view-05) |
| CARD-VIEW-06 | write | 正常系 | [評価後の記憶状態を確認できる](./card-view.md#card-view-06) |
| DECK-IMPORT-01 | read | 正常系 | [有効な CSV を保存せずに preview できる](./deck-import.md#deck-import-01) |
| DECK-IMPORT-02 | read | 異常系 | [不正な行を含む CSV の import を阻止できる](./deck-import.md#deck-import-02) |
| DECK-IMPORT-03 | batch | 正常系 | [ログイン中に CSV を import して reload 後も利用できる](./deck-import.md#deck-import-03) |
| DECK-IMPORT-04 | batch | 正常系 | [匿名で CSV を import して reload 後に学習できる](./deck-import.md#deck-import-04) |
| DECK-IMPORT-05 | batch | 異常系 | [取り込んだ内容の同期拒否を反映できる](./deck-import.md#deck-import-05) |
| DECK-IMPORT-06 | batch | 正常系 | [4種類の例を同じ確認・保存の手順で追加できる](./deck-import.md#deck-import-06) |
| DECK-IMPORT-07 | batch | 正常系 | [Sample Deck を一度だけ初期生成できる](./deck-import.md#deck-import-07) |
| DECK-IMPORT-08 | batch | 正常系 | [Sample deck の全内容を匿名で取り込んで学習できる](./deck-import.md#deck-import-08) |
| DECK-IMPORT-09 | batch | 正常系 | [通常ユーザーの Sample deck を同期できる](./deck-import.md#deck-import-09) |
| DECK-IMPORT-10 | batch | 正常系 | [Google 未ログインの Sample deck をこのブラウザーだけに維持できる](./deck-import.md#deck-import-10) |
| DECK-IMPORT-11 | read | 異常系 | [同じ CSV を修正して再選択できる](./deck-import.md#deck-import-11) |
| DECK-MANAGEMENT-01 | write | 正常系 | [Deck 編集内容を保存して reload 後も確認できる](./deck-management.md#deck-management-01) |
| DECK-MANAGEMENT-02 | batch | 正常系 / 異常系 | [Deck と関連データをまとめて削除できる](./deck-management.md#deck-management-02) |
| DECK-MANAGEMENT-03 | read | 正常系 | [Deck の削除を取り消せる](./deck-management.md#deck-management-03) |
| DECK-MANAGEMENT-04 | batch | 異常系 | [Deck の削除失敗後に再試行できる](./deck-management.md#deck-management-04) |
| DECK-MANAGEMENT-05 | write | 正常系 | [ログイン中に空の Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-05) |
| DECK-MANAGEMENT-06 | write | 異常系 | [ログイン中の Deck 作成拒否を反映できる](./deck-management.md#deck-management-06) |
| DECK-MANAGEMENT-07 | write | 正常系 | [匿名で空の Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-07) |
| DECK-MANAGEMENT-08 | read | 正常系 | [未保存の Deck 編集内容を離脱前に確認できる](./deck-management.md#deck-management-08) |
| DECK-TRANSFER-01 | read | 正常系 | [Deck の Card を CSV で export できる](./deck-transfer.md#deck-transfer-01) |
| DECK-TRANSFER-02 | read | 正常系 | [特殊文字とタグなしの Card を内容を失わず CSV へ出力する](./deck-transfer.md#deck-transfer-02) |
| NAVIGATION-01 | read | 異常系 | [存在しない route から Deck 一覧へ復帰できる](./navigation.md#navigation-01) |
| NAVIGATION-02 | read | 正常系 | [画面の keyboard shortcut で主要 route へ遷移できる](./navigation.md#navigation-02) |
| NAVIGATION-03 | write | 異常系 | [共通エラー画面が現在の言語で表示され Reload で復旧する](./navigation.md#navigation-03) |
| NAVIGATION-04 | read | 異常系 | [処理中の予期しないエラーから復旧できる](./navigation.md#navigation-04) |
| NAVIGATION-05 | read | 異常系 | [不正な PWA キャッシュによる起動失敗時に手動復旧を案内する](./navigation.md#navigation-05) |
| NAVIGATION-06 | read | 正常系 | [Deck 一覧から Card 一覧へ遷移できる](./navigation.md#navigation-06) |
| NAVIGATION-07 | read | 異常系 | [存在しない Deck から復帰できる](./navigation.md#navigation-07) |
| NAVIGATION-08 | read | 正常系 | [ログイン中の Deck を学習データを変更せずに閲覧できる](./navigation.md#navigation-08) |
| NAVIGATION-09 | read | 正常系 | [匿名利用中の Deck を先頭から閲覧し直せる](./navigation.md#navigation-09) |
| NAVIGATION-10 | read | 正常系 | [学習条件に依存せず全 Card を標準順で閲覧できる](./navigation.md#navigation-10) |
| NAVIGATION-11 | read | 正常系 | [復習期日前の Card も閲覧できる](./navigation.md#navigation-11) |
| NAVIGATION-12 | read | 正常系 / 異常系 | [閲覧対象が空または Deck が存在しない場合に一覧へ戻れる](./navigation.md#navigation-12) |
| NAVIGATION-13 | read | 正常系 | [1件の Card の長い解答を touch で閲覧して終了できる](./navigation.md#navigation-13) |
| NAVIGATION-14 | write | 正常系 | [閲覧と学習で表示設定と操作ヘルプを共有できる](./navigation.md#navigation-14) |
| NAVIGATION-15 | read | 正常系 | [学習データを変更せずに閲覧を自動再生できる](./navigation.md#navigation-15) |
| NAVIGATION-16 | read | 正常系 | [閲覧の進捗スライダーで前後へ移動できる](./navigation.md#navigation-16) |
| NAVIGATION-17 | read | 正常系 | [読み込み済みの復習件数と学習導線を表示できる](./navigation.md#navigation-17) |
| NAVIGATION-18 | read | 正常系 | [復習期限の到達で一覧を更新できる](./navigation.md#navigation-18) |
| NAVIGATION-19 | write | 正常系 | [view mode で長い表面を読みながら移動を防止できる](./navigation.md#navigation-19) |
| NAVIGATION-20 | write | 正常系 | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](./navigation.md#navigation-20) |
| NAVIGATION-21 | write | 正常系 | [view mode 中も閲覧ボタンと自動再生を使える](./navigation.md#navigation-21) |
| NAVIGATION-22 | batch | 異常系 | [保存データの初期化失敗からローカルデータを削除して再起動する](./navigation.md#navigation-22) |
| PERSISTENCE-01 | read | 正常系 | [アカウントごとのデータを再読み込み後も分離して表示できる](./persistence.md#persistence-01) |
| PERSISTENCE-02 | batch | 正常系 | [オフラインの変更を再接続後に同期できる](./persistence.md#persistence-02) |
| PERSISTENCE-03 | write | 正常系 | [別のブラウザーに Card の変更を再読み込みなしで反映できる](./persistence.md#persistence-03) |
| PERSISTENCE-04 | batch | 正常系 | [未ログインの変更をこのブラウザーだけに維持できる](./persistence.md#persistence-04) |
| PERSISTENCE-05 | batch | 正常系 | [未ログインでもオフラインの Card 操作を再読み込み後まで維持できる](./persistence.md#persistence-05) |
| PERSISTENCE-06 | batch | 正常系 | [オフラインで進めた学習を同期後に別ブラウザーで再開できる](./persistence.md#persistence-06) |
| PERSISTENCE-07 | batch | 異常系 | [端末内のデータが失われてもサーバーから再取得できる](./persistence.md#persistence-07) |
| PERSISTENCE-08 | read | 正常系 | [オフラインの再読み込みで保存済みの学習位置を復元できる](./persistence.md#persistence-08) |
| PERSISTENCE-09 | batch | 正常系 | [画面を閉じている間の変更と論理削除を再開後に反映できる](./persistence.md#persistence-09) |
| PERSISTENCE-10 | batch | 異常系 | [不正な匿名 Card の保存値があっても正常なデータを再起動後に利用できる](./persistence.md#persistence-10) |
| SETTINGS-01 | write | 正常系 | [Dark mode を自動保存して reload 後も反映できる](./settings.md#settings-01) |
| SETTINGS-02 | write | 正常系 | [Maximum cards 設定を学習開始画面に反映できる](./settings.md#settings-02) |
| SETTINGS-03 | batch | 正常系 | [Respect review schedule を次の学習 session に反映できる](./settings.md#settings-03) |
| SETTINGS-04 | write | 正常系 | [日本語設定を自動保存して reload 後も反映できる](./settings.md#settings-04) |
| SETTINGS-05 | write | 正常系 | [System 設定でブラウザーの言語を reload 後も反映できる](./settings.md#settings-05) |
| SETTINGS-06 | read | 異常系 | [無効な保存済み設定から現在の既定値へ復旧できる](./settings.md#settings-06) |
| SETTINGS-07 | read | 正常系 | [詳細設定をキーボードで開閉してフォーカス位置を確認できる](./settings.md#settings-07) |
| SETTINGS-08 | write | 異常系 | [Card の検証エラーが言語変更に追随し入力を保持する](./settings.md#settings-08) |
| SETTINGS-09 | write | 異常系 | [CSV の検証結果が再読み込みなしで言語変更に追随する](./settings.md#settings-09) |
| SETTINGS-10 | write | 正常系 | [自動再生の間隔の0の意味を表示して reload 後も維持できる](./settings.md#settings-10) |
| SETTINGS-11 | batch | 正常系 | [間隔0から正の値へ戻して同じ学習 session の再生操作を利用できる](./settings.md#settings-11) |
| STUDY-ACTIONS-01 | write | 正常系 | [good action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-01) |
| STUDY-ACTIONS-02 | write | 正常系 | [again action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-02) |
| STUDY-ACTIONS-03 | write | 正常系 | [スキップで次の Card へ進める](./study-actions.md#study-actions-03) |
| STUDY-ACTIONS-04 | read | 正常系 | [学習中に前の Card へ戻れない](./study-actions.md#study-actions-04) |
| STUDY-ACTIONS-05 | write | 異常系 | [回答履歴の保存失敗時も保存済みの学習状態と位置を維持する](./study-actions.md#study-actions-05) |
| STUDY-BACK-TEXT-01 | read | 正常系 | [学習中の Card を表面から裏面へ切り替えられる](./study-back-text.md#study-back-text-01) |
| STUDY-BACK-TEXT-02 | read | 正常系 | [裏面 text を選択しても Card の状態を維持できる](./study-back-text.md#study-back-text-02) |
| STUDY-BACK-TEXT-03 | read | 正常系 | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](./study-back-text.md#study-back-text-03) |
| STUDY-BACK-TEXT-04 | read | 正常系 | [長い裏面 text を scroll しても Card の状態を維持できる](./study-back-text.md#study-back-text-04) |
| STUDY-BACK-TEXT-05 | write | 正常系 | [左 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-05) |
| STUDY-BACK-TEXT-06 | write | 正常系 | [右 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-06) |
| STUDY-BACK-TEXT-07 | read | 正常系 | [狭い画面でも overlay の下で裏面を全幅表示できる](./study-back-text.md#study-back-text-07) |
| STUDY-BACK-TEXT-08 | read | 正常系 | [overlay 上の wheel と touch で長い裏面 text を scroll できる](./study-back-text.md#study-back-text-08) |
| STUDY-CONTROLS-01 | write | 正常系 | [ログイン中の Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-01) |
| STUDY-CONTROLS-02 | read | 正常系 | [non-primary mouse の drag を無視できる](./study-controls.md#study-controls-02) |
| STUDY-CONTROLS-03 | write | 正常系 | [匿名利用中の Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-03) |
| STUDY-CONTROLS-04 | read | 正常系 | [Help dialog に現在の操作の割り当てを表示できる](./study-controls.md#study-controls-04) |
| STUDY-CONTROLS-05 | write | 正常系 | [Help button の表示設定を reload 後も維持できる](./study-controls.md#study-controls-05) |
| STUDY-CONTROLS-06 | write | 正常系 | [view mode で長い表面を操作の誤発火なくスクロールできる](./study-controls.md#study-controls-06) |
| STUDY-CONTROLS-07 | write | 正常系 | [view mode をタップまたは Enter で終了して表面を維持できる](./study-controls.md#study-controls-07) |
| STUDY-CONTROLS-08 | batch | 正常系 | [view mode 中も評価ボタンと自動再生で次の Card へ進める](./study-controls.md#study-controls-08) |
| STUDY-CONTROLS-09 | write | 正常系 | [view mode 設定を閲覧・学習・reload 間で共有できる](./study-controls.md#study-controls-09) |
| STUDY-CONTROLS-10 | write | 正常系 | [横向きの短い画面でも本文と操作ボタンに到達できる](./study-controls.md#study-controls-10) |
| STUDY-CONTROLS-11 | write | 正常系 | [view mode でタッチスクロールとピンチ拡大ができる](./study-controls.md#study-controls-11) |
| STUDY-CONTROLS-12 | write | 正常系 | [方向ボタンの読み上げ名で現在の操作を確認できる](./study-controls.md#study-controls-12) |
| STUDY-CONTROLS-13 | write | 正常系 | [方向キーを長押ししても追加評価せず再押下で進める](./study-controls.md#study-controls-13) |
| STUDY-CONTROLS-14 | write | 正常系 | [Space と b の長押しで連続切替せず再押下で切り替える](./study-controls.md#study-controls-14) |
| STUDY-CONTROLS-15 | write | 正常系 | [修飾付きショートカットを無視して通常入力を受け付ける](./study-controls.md#study-controls-15) |
| STUDY-CONTROLS-16 | write | 正常系 | [修飾付き Enter で view mode を終了しない](./study-controls.md#study-controls-16) |
| STUDY-SESSION-01 | write | 正常系 | [filter と学習上限を反映して session を開始できる](./study-session.md#study-session-01) |
| STUDY-SESSION-02 | read | 正常系 | [filter に一致する Card がない場合は session を開始できない](./study-session.md#study-session-02) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](./study-session.md#study-session-03) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい session を先頭から開始できる](./study-session.md#study-session-04) |
| STUDY-SESSION-05 | write | 正常系 | [最後の Card を完了して completion screen を表示できる](./study-session.md#study-session-05) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習 session を独立して維持できる](./study-session.md#study-session-06) |
| STUDY-SESSION-07 | write | 正常系 | [匿名での学習結果と再開位置を reload 後も維持できる](./study-session.md#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開した tag filter を保存して学習 session に適用できる](./study-session.md#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](./study-session.md#study-session-09) |
| STUDY-SESSION-10 | read | 正常系 | [URL と Deck 選択が再読み込み・戻る・進むでも一致する](./study-session.md#study-session-10) |
| STUDY-SESSION-11 | read | 異常系 | [表示できない Deck を勝手に全件表示へ切り替えない](./study-session.md#study-session-11) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](./study-session.md#study-session-12) |
| STUDY-SESSION-13 | read | 正常系 | [期間を選んで学習記録を確認できる](./study-session.md#study-session-13) |

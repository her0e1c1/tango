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
| CARD-FILTER-14 | read | 正常系 | [別の Deck から戻ると元のフィルターを復元できる](./card-filter.md#card-filter-14) |
| CARD-FILTER-15 | read | 正常系 | [Card 未登録の一覧から Card の追加へ進める](./card-filter.md#card-filter-15) |
| CARD-FILTER-16 | read | 正常系 | [Card 未登録の Deck 閲覧から Deck 一覧へ戻れる](./card-filter.md#card-filter-16) |
| CARD-LIST-ACTIONS-01 | write | 正常系 | [tag の filter を保存して Card 一覧へ反映できる](./card-list-actions.md#card-list-actions-01) |
| CARD-LIST-ACTIONS-02 | read | 正常系 | [Card を追加が新しい順に表示できる](./card-list-actions.md#card-list-actions-02) |
| CARD-LIST-ACTIONS-03 | read | 正常系 | [Card の表示順を標準へ戻せる](./card-list-actions.md#card-list-actions-03) |
| CARD-LIST-ACTIONS-04 | write | 正常系 | [選択済みタグをキーボードで解除して操作を続けられる](./card-list-actions.md#card-list-actions-04) |
| CARD-LIST-ACTIONS-05 | write | 正常系 | [filter 保存中に変更しても最後の選択を維持できる](./card-list-actions.md#card-list-actions-05) |
| CARD-LIST-ACTIONS-06 | write | 異常系 | [filter 保存失敗後も選択を維持して次の変更を保存できる](./card-list-actions.md#card-list-actions-06) |
| CARD-LIST-ACTIONS-07 | read | 正常系 | [並び替え後も選択した Card のプレビューと行操作を利用できる](./card-list-actions.md#card-list-actions-07) |
| CARD-LIST-ACTIONS-08 | read | 正常系 | [別 Card の変更後も行のフォーカスとメニューを維持できる](./card-list-actions.md#card-list-actions-08) |
| CARD-LIST-ACTIONS-09 | write | 正常系 | [言語やフィルターを変更しても並び順を保持できる](./card-list-actions.md#card-list-actions-09) |
| CARD-LIST-ACTIONS-10 | read | 正常系 | [filter 保存中も並び替えでき禁止中の操作は実行できない](./card-list-actions.md#card-list-actions-10) |
| CARD-LIST-ACTIONS-11 | read | 正常系 | [画面を離れるか Deck を変更すると並び順が標準に戻る](./card-list-actions.md#card-list-actions-11) |
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
| CARD-MANAGEMENT-17 | read | 正常系 | [Card の tab と拡大画面を切り替えても下書きを維持する](./card-management.md#card-management-17) |
| CARD-MANAGEMENT-18 | write | 正常系 | [Card のタグ候補を選んで下書きへ反映できる](./card-management.md#card-management-18) |
| CARD-MANAGEMENT-19 | write | 正常系 | [Card の編集保存中は重ねて操作できない](./card-management.md#card-management-19) |
| CARD-MANAGEMENT-20 | write | 正常系 | [Card 編集画面の離脱後に保存が完了しても現在の画面を維持する](./card-management.md#card-management-20) |
| CARD-MANAGEMENT-21 | read | 正常系 | [別のブラウザーから変更が届いても編集中の Card の入力を維持する](./card-management.md#card-management-21) |
| CARD-MANAGEMENT-22 | write | 正常系 | [Card 作成で所属 Deck のタグを選択し新規タグを追加できる](./card-management.md#card-management-22) |
| CARD-MANAGEMENT-23 | read | 正常系 | [通知の表示が変化しても Card の離脱確認を操作できる](./card-management.md#card-management-23) |
| CARD-MANAGEMENT-24 | read | 正常系 | [未変更の Card 作成画面は確認なしで取り消せる](./card-management.md#card-management-24) |
| CARD-MANAGEMENT-25 | write | 異常系 | [Card 作成画面を離れた後の保存拒否で入力画面へ戻らない](./card-management.md#card-management-25) |
| CARD-TAG-MANAGEMENT-01 | write | 正常系 | [タグと両面の本文を Card 保存時にまとめて反映する](./card-tag-management.md#card-tag-management-01) |
| CARD-TAG-MANAGEMENT-02 | read | 正常系 | [未保存のタグ変更を破棄する](./card-tag-management.md#card-tag-management-02) |
| CARD-TAG-MANAGEMENT-03 | write | 異常系 | [空のタグ名を修正して保存する](./card-tag-management.md#card-tag-management-03) |
| CARD-TAG-MANAGEMENT-04 | write | 正常系 | [Card のタグで一覧と Deck 閲覧を絞り込む](./card-tag-management.md#card-tag-management-04) |
| CARD-TAG-MANAGEMENT-05 | write | 正常系 | [オフラインのタグ保存は成功を待つ](./card-tag-management.md#card-tag-management-05) |
| CARD-TAG-MANAGEMENT-06 | write | 正常系 | [匿名のタグ編集を再読込後もローカルで保持する](./card-tag-management.md#card-tag-management-06) |
| CARD-TAG-MANAGEMENT-07 | read | 正常系 | [タグ入力中の Enter は Card を送信せず下書きを保つ](./card-tag-management.md#card-tag-management-07) |
| CARD-TAG-MANAGEMENT-08 | write | 正常系 | [タグ名の前後空白だけを除いて選択順に保存する](./card-tag-management.md#card-tag-management-08) |
| CARD-TAG-MANAGEMENT-09 | read | 正常系 | [入力直後の候補クリックで対象タグだけを解除する](./card-tag-management.md#card-tag-management-09) |
| CARD-TAG-MANAGEMENT-10 | write | 異常系 | [重複するタグ名を修正して保存する](./card-tag-management.md#card-tag-management-10) |
| CARD-TAG-MANAGEMENT-11 | read | 正常系 | [絞り込み候補は同じ Deck のタグを重複なく表示する](./card-tag-management.md#card-tag-management-11) |
| CARD-TAG-MANAGEMENT-12 | write | 正常系 | [最終割り当てを外したタグの絞り込みを解除する](./card-tag-management.md#card-tag-management-12) |
| CARD-TAG-MANAGEMENT-13 | read | 正常系 | [タグのオフライン保存中に再読込すると最後の確定内容を表示する](./card-tag-management.md#card-tag-management-13) |
| CARD-TAG-MANAGEMENT-14 | write | 正常系 | [保留中のタグ変更を再接続後に同期する](./card-tag-management.md#card-tag-management-14) |
| CARD-TAG-MANAGEMENT-15 | read | 正常系 | [再接続後も匿名のタグ編集はローカルに留まる](./card-tag-management.md#card-tag-management-15) |
| CARD-VIEW-01 | read | 正常系 | [Card 一覧に学習情報を表示できる](./card-view.md#card-view-01) |
| CARD-VIEW-02 | read | 正常系 | [Card の裏面 overlay を開ける](./card-view.md#card-view-02) |
| CARD-VIEW-03 | read | 正常系 | [開いている Card の裏面 overlay を閉じられる](./card-view.md#card-view-03) |
| CARD-VIEW-04 | read | 正常系 | [Card view を直接開ける](./card-view.md#card-view-04) |
| CARD-VIEW-05 | read | 異常系 | [存在しない Card から復帰できる](./card-view.md#card-view-05) |
| CARD-VIEW-06 | write | 正常系 | [評価後の記憶状態を確認できる](./card-view.md#card-view-06) |
| CARD-VIEW-07 | read | 正常系 | [Card の閲覧 URL の変更に表示が追従する](./card-view.md#card-view-07) |
| CARD-VIEW-08 | read | 正常系 | [未評価の Card に推定した記憶状態を表示しない](./card-view.md#card-view-08) |
| CARD-VIEW-09 | read | 正常系 | [別の Card や画面への復帰時に記憶状態を更新する](./card-view.md#card-view-09) |
| CARD-VIEW-10 | read | 異常系 | [読み込めない記憶状態を未評価として表示しない](./card-view.md#card-view-10) |
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
| DECK-IMPORT-12 | read | 異常系 | [複数行フィールドを含む CSV の論理レコード単位で診断を確認できる](./deck-import.md#deck-import-12) |
| DECK-IMPORT-13 | read | 異常系 | [CSV の引用符エラーを論理レコードと元列値で確認できる](./deck-import.md#deck-import-13) |
| DECK-IMPORT-14 | read | 異常系 | [空白だけの CSV をファイル全体のエラーとして拒否できる](./deck-import.md#deck-import-14) |
| DECK-IMPORT-15 | read | 正常系 | [4種類の例の内容に一致する CSV をダウンロードできる](./deck-import.md#deck-import-15) |
| DECK-IMPORT-16 | read | 正常系 | [4種類の例を保存せずに preview できる](./deck-import.md#deck-import-16) |
| DECK-IMPORT-17 | batch | 正常系 | [同じ例を再び選んで新しい Deck として追加できる](./deck-import.md#deck-import-17) |
| DECK-IMPORT-18 | batch | 異常系 | [例の保存失敗後も同じ内容で重複せず再試行できる](./deck-import.md#deck-import-18) |
| DECK-IMPORT-19 | batch | 正常系 | [例の選択後にアカウントを変更すると以前の内容を保存できない](./deck-import.md#deck-import-19) |
| DECK-IMPORT-20 | read | 正常系 | [ファイル選択の取消後も現在の確認内容を維持できる](./deck-import.md#deck-import-20) |
| DECK-IMPORT-21 | batch | 正常系 | [匿名で追加した例をクラウドに保存しない](./deck-import.md#deck-import-21) |
| DECK-MANAGEMENT-01 | write | 正常系 | [Deck 編集内容を保存して reload 後も確認できる](./deck-management.md#deck-management-01) |
| DECK-MANAGEMENT-02 | batch | 正常系 | [Deck と関連データをまとめて削除できる](./deck-management.md#deck-management-02) |
| DECK-MANAGEMENT-03 | read | 正常系 | [Deck の削除を取り消せる](./deck-management.md#deck-management-03) |
| DECK-MANAGEMENT-04 | batch | 異常系 | [Deck の削除失敗後に再試行できる](./deck-management.md#deck-management-04) |
| DECK-MANAGEMENT-05 | write | 正常系 | [ログイン中に空の Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-05) |
| DECK-MANAGEMENT-06 | write | 異常系 | [ログイン中の Deck 作成拒否を反映できる](./deck-management.md#deck-management-06) |
| DECK-MANAGEMENT-07 | write | 正常系 | [匿名で空の Deck を作成して reload 後も確認できる](./deck-management.md#deck-management-07) |
| DECK-MANAGEMENT-08 | read | 正常系 | [未保存の Deck 編集内容を維持して編集を続けられる](./deck-management.md#deck-management-08) |
| DECK-MANAGEMENT-09 | batch | 異常系 | [学習 session の終了失敗後も Deck の削除成功を維持する](./deck-management.md#deck-management-09) |
| DECK-MANAGEMENT-10 | read | 正常系 | [未保存の Deck 編集内容を破棄して一覧へ戻れる](./deck-management.md#deck-management-10) |
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
| NAVIGATION-12 | read | 正常系 | [空の Deck の閲覧画面から一覧へ戻れる](./navigation.md#navigation-12) |
| NAVIGATION-13 | read | 正常系 | [1件の Card の長い解答を touch で閲覧して終了できる](./navigation.md#navigation-13) |
| NAVIGATION-14 | write | 正常系 | [閲覧の表示設定を保存して学習にも反映できる](./navigation.md#navigation-14) |
| NAVIGATION-15 | read | 正常系 | [学習データを変更せずに閲覧を自動再生できる](./navigation.md#navigation-15) |
| NAVIGATION-16 | read | 正常系 | [閲覧の進捗スライダーで前後へ移動できる](./navigation.md#navigation-16) |
| NAVIGATION-17 | read | 正常系 | [読み込み済みの復習件数と集計条件を表示できる](./navigation.md#navigation-17) |
| NAVIGATION-18 | read | 正常系 | [復習期限の到達で一覧を更新できる](./navigation.md#navigation-18) |
| NAVIGATION-19 | write | 正常系 | [view mode で長い表面を読みながら移動を防止できる](./navigation.md#navigation-19) |
| NAVIGATION-20 | write | 正常系 | [閲覧の view mode 終了後に通常の表裏操作へ戻れる](./navigation.md#navigation-20) |
| NAVIGATION-21 | write | 正常系 | [view mode 中も閲覧ボタンで次へ進める](./navigation.md#navigation-21) |
| NAVIGATION-22 | batch | 異常系 | [保存データの初期化失敗からローカルデータを削除して再起動する](./navigation.md#navigation-22) |
| NAVIGATION-23 | read | 異常系 | [保存済みの言語を利用できない場合はエラーを英語で案内する](./navigation.md#navigation-23) |
| NAVIGATION-24 | read | 異常系 | [個別に処理された失敗では画面全体を復旧画面に置き換えない](./navigation.md#navigation-24) |
| NAVIGATION-25 | read | 正常系 | [Deck 一覧の追加メニューを開閉して操作項目を選べる](./navigation.md#navigation-25) |
| NAVIGATION-26 | read | 正常系 | [Deck 一覧の追加メニューから作成とインポートの画面へ遷移できる](./navigation.md#navigation-26) |
| NAVIGATION-27 | read | 正常系 | [閲覧 Card の表裏を切り替えて裏面の内容を利用できる](./navigation.md#navigation-27) |
| NAVIGATION-28 | read | 正常系 | [閲覧で未対応の mouse と上下操作は Card を変更しない](./navigation.md#navigation-28) |
| NAVIGATION-29 | read | 異常系 | [存在しない Deck の閲覧画面から一覧へ戻れる](./navigation.md#navigation-29) |
| NAVIGATION-30 | read | 正常系 | [閲覧 Help で操作を確認して元の Card へ戻れる](./navigation.md#navigation-30) |
| NAVIGATION-31 | read | 正常系 | [閲覧の編集リンクから現在の Card を編集画面で開ける](./navigation.md#navigation-31) |
| NAVIGATION-32 | read | 正常系 | [再生間隔0では閲覧の自動送りを利用できない](./navigation.md#navigation-32) |
| NAVIGATION-33 | read | 正常系 | [閲覧 Help の表示中は自動送りを中断する](./navigation.md#navigation-33) |
| NAVIGATION-34 | write | 正常系 | [閲覧の keyboard 操作は focus 対象の標準操作を維持する](./navigation.md#navigation-34) |
| NAVIGATION-35 | read | 正常系 | [Deck 一覧を状態ごとの区分と操作を含むレイアウトで表示する](./navigation.md#navigation-35) |
| NAVIGATION-36 | read | 正常系 | [Deck 一覧を学習状態と復習期限の順に並べる](./navigation.md#navigation-36) |
| NAVIGATION-37 | read | 正常系 | [復習と新規が0件の Deck では理由を区別して表示する](./navigation.md#navigation-37) |
| NAVIGATION-38 | read | 正常系 | [Deck 一覧の Review と Study new から開始設定へ進める](./navigation.md#navigation-38) |
| NAVIGATION-39 | read | 正常系 | [間隔反復 OFF では件数を隠して学習と管理の導線を維持する](./navigation.md#navigation-39) |
| NAVIGATION-40 | read | 正常系 | [条件の変更と画面復帰で一覧の復習件数を更新する](./navigation.md#navigation-40) |
| NAVIGATION-41 | write | 正常系 | [view mode 中も閲覧の自動再生で次へ進める](./navigation.md#navigation-41) |
| NAVIGATION-42 | batch | 異常系 | [ローカルデータの削除失敗時は再試行を案内する](./navigation.md#navigation-42) |
| NAVIGATION-43 | batch | 異常系 | [ローカルデータ削除後の起動失敗時は復旧画面を表示する](./navigation.md#navigation-43) |
| NAVIGATION-44 | read | 正常系 | [空の Deck 一覧でも追加メニューを利用できる](./navigation.md#navigation-44) |
| NAVIGATION-45 | write | 正常系 | [Deck 一覧の Continue から既存の学習を再開できる](./navigation.md#navigation-45) |
| PERSISTENCE-01 | read | 正常系 | [アカウントごとのデータを再読み込み後も分離して表示できる](./persistence.md#persistence-01) |
| PERSISTENCE-02 | batch | 正常系 | [オフラインの変更を再接続後に同期できる](./persistence.md#persistence-02) |
| PERSISTENCE-03 | write | 正常系 | [別のブラウザーに Card の変更を再読み込みなしで反映できる](./persistence.md#persistence-03) |
| PERSISTENCE-04 | batch | 正常系 | [未ログインの Deck の変更をこのブラウザーだけに維持できる](./persistence.md#persistence-04) |
| PERSISTENCE-05 | batch | 正常系 | [未ログインでもオフラインで作成した Card を再読み込み後まで維持できる](./persistence.md#persistence-05) |
| PERSISTENCE-06 | batch | 正常系 | [オフラインで進めた学習を同期後に別ブラウザーで再開できる](./persistence.md#persistence-06) |
| PERSISTENCE-07 | batch | 異常系 | [端末内のデータが失われてもサーバーから再取得できる](./persistence.md#persistence-07) |
| PERSISTENCE-08 | read | 正常系 | [オフラインの再読み込みで保存済みの学習位置を復元できる](./persistence.md#persistence-08) |
| PERSISTENCE-09 | batch | 正常系 | [画面を閉じている間の Card の編集を再開後に反映できる](./persistence.md#persistence-09) |
| PERSISTENCE-10 | batch | 異常系 | [不正な匿名 Card の保存値があっても正常なデータを再起動後に利用できる](./persistence.md#persistence-10) |
| PERSISTENCE-11 | batch | 正常系 | [未ログインの Card の変更をこのブラウザーだけに維持できる](./persistence.md#persistence-11) |
| PERSISTENCE-12 | batch | 正常系 | [未ログインでもオフラインで削除した Card を再読み込み後に表示しない](./persistence.md#persistence-12) |
| PERSISTENCE-13 | batch | 正常系 | [未ログインでもオフラインでインポートした Card を再読み込み後まで維持できる](./persistence.md#persistence-13) |
| PERSISTENCE-14 | read | 正常系 | [変更なしで画面を開き直しても全 Card を重複なく表示できる](./persistence.md#persistence-14) |
| PERSISTENCE-15 | batch | 正常系 | [画面を閉じている間に論理削除された Card を再開後に表示しない](./persistence.md#persistence-15) |
| PERSISTENCE-16 | batch | 正常系 | [画面を閉じている間に論理削除された Deck を再開後に表示しない](./persistence.md#persistence-16) |
| PERSISTENCE-17 | batch | 異常系 | [不正な匿名 Card の保存値を修復すると再び表示できる](./persistence.md#persistence-17) |
| PERSISTENCE-18 | batch | 異常系 | [不正な匿名 Card があっても小さい画面で正常な Card の学習を完了できる](./persistence.md#persistence-18) |
| PERSISTENCE-19 | read | 異常系 | [不正な匿名 Card の表示・編集リンクで復旧警告を維持できる](./persistence.md#persistence-19) |
| PERSISTENCE-20 | read | 異常系 | [全 Card が不正な匿名 Deck の表示リンクで復旧警告を維持できる](./persistence.md#persistence-20) |
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
| SETTINGS-12 | write | 正常系 | [Maximum cards を変更しても進行中の学習を同じ位置から再開できる](./settings.md#settings-12) |
| SETTINGS-13 | read | 正常系 | [旧既定の方向操作だけを現在の4評価へ移行できる](./settings.md#settings-13) |
| SETTINGS-14 | write | 正常系 | [有効な CSV preview は言語変更後も選択を保持して取り込みを待つ](./settings.md#settings-14) |
| SETTINGS-15 | write | 異常系 | [CSV の準備・取り込みのエラー案内は言語変更後も再試行内容と通知期限を保持する](./settings.md#settings-15) |
| SETTINGS-16 | write | 正常系 | [自動再生の間隔を0から正の値へ戻すと秒数表示へ戻る](./settings.md#settings-16) |
| SETTINGS-17 | batch | 正常系 | [間隔0では自動送りと再生操作を無効にして手動で学習できる](./settings.md#settings-17) |
| STUDY-ACTIONS-01 | write | 正常系 | [good action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-01) |
| STUDY-ACTIONS-02 | write | 正常系 | [again action で学習結果を保存して次の Card へ進める](./study-actions.md#study-actions-02) |
| STUDY-ACTIONS-03 | write | 正常系 | [スキップで次の Card へ進める](./study-actions.md#study-actions-03) |
| STUDY-ACTIONS-04 | read | 正常系 | [学習中に前の Card へ戻れない](./study-actions.md#study-actions-04) |
| STUDY-ACTIONS-05 | write | 異常系 | [回答履歴の保存失敗時も保存済みの学習状態と位置を維持する](./study-actions.md#study-actions-05) |
| STUDY-ACTIONS-06 | write | 正常系 | [評価以外の学習操作では回答を記録しない](./study-actions.md#study-actions-06) |
| STUDY-ACTIONS-07 | write | 正常系 | [4方向の評価が入力手段によらず一致する](./study-actions.md#study-actions-07) |
| STUDY-ACTIONS-08 | write | 正常系 | [保存中は競合する学習操作を受け付けず成功時に操作待ちを解除する](./study-actions.md#study-actions-08) |
| STUDY-ACTIONS-09 | write | 正常系 | [最後の回答の保存中や session 不在だけでは自動遷移しない](./study-actions.md#study-actions-09) |
| STUDY-ACTIONS-10 | write | 異常系 | [匿名利用ではサーバー応答を待たず保存の操作待ちを解除する](./study-actions.md#study-actions-10) |
| STUDY-ACTIONS-11 | write | 正常系 | [オフライン中の保存は再接続後に一度だけ反映される](./study-actions.md#study-actions-11) |
| STUDY-ACTIONS-12 | write | 異常系 | [学習位置の同期拒否後は復元された位置を表示する](./study-actions.md#study-actions-12) |
| STUDY-ACTIONS-13 | write | 正常系 | [切り替え前の操作結果を現在の学習へ反映しない](./study-actions.md#study-actions-13) |
| STUDY-ACTIONS-14 | write | 異常系 | [アカウント変更後に以前のアカウントの Card へ回答できない](./study-actions.md#study-actions-14) |
| STUDY-ACTIONS-15 | write | 異常系 | [保存失敗時に操作待ちを解除して購読結果を表示する](./study-actions.md#study-actions-15) |
| STUDY-ACTIONS-16 | write | 正常系 | [明示的な学習中止の成功で一覧へ戻る](./study-actions.md#study-actions-16) |
| STUDY-BACK-TEXT-01 | read | 正常系 | [学習中の Card を表面から裏面へ切り替えられる](./study-back-text.md#study-back-text-01) |
| STUDY-BACK-TEXT-02 | read | 正常系 | [裏面 text を選択しても Card の状態を維持できる](./study-back-text.md#study-back-text-02) |
| STUDY-BACK-TEXT-03 | read | 正常系 | [overlay 設定 OFF の裏面 tap で同じ Card の表面へ戻れる](./study-back-text.md#study-back-text-03) |
| STUDY-BACK-TEXT-04 | read | 正常系 | [長い裏面 text を scroll しても Card の状態を維持できる](./study-back-text.md#study-back-text-04) |
| STUDY-BACK-TEXT-05 | write | 正常系 | [左 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-05) |
| STUDY-BACK-TEXT-06 | write | 正常系 | [右 overlay から設定済み action を実行できる](./study-back-text.md#study-back-text-06) |
| STUDY-BACK-TEXT-07 | read | 正常系 | [狭い画面でも overlay の下で裏面を全幅表示できる](./study-back-text.md#study-back-text-07) |
| STUDY-BACK-TEXT-08 | read | 正常系 | [左 overlay 上の wheel で長い裏面 text を scroll できる](./study-back-text.md#study-back-text-08) |
| STUDY-BACK-TEXT-09 | read | 正常系 | [右 overlay 上の touch で長い裏面 text を scroll できる](./study-back-text.md#study-back-text-09) |
| STUDY-CONTROLS-01 | write | 正常系 | [ログイン中の Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-01) |
| STUDY-CONTROLS-02 | read | 正常系 | [non-primary mouse の drag を無視できる](./study-controls.md#study-controls-02) |
| STUDY-CONTROLS-03 | write | 正常系 | [匿名利用中の Deck で primary mouse の上方向 drag により次の Card へ進める](./study-controls.md#study-controls-03) |
| STUDY-CONTROLS-04 | read | 正常系 | [Help dialog に現在の操作の割り当てを表示できる](./study-controls.md#study-controls-04) |
| STUDY-CONTROLS-05 | write | 正常系 | [Help button の表示設定を reload 後も維持できる](./study-controls.md#study-controls-05) |
| STUDY-CONTROLS-06 | write | 正常系 | [view mode で長い表面を操作の誤発火なくスクロールできる](./study-controls.md#study-controls-06) |
| STUDY-CONTROLS-07 | write | 正常系 | [view mode をタップまたは Enter で終了して表面を維持できる](./study-controls.md#study-controls-07) |
| STUDY-CONTROLS-08 | batch | 正常系 | [view mode 中も評価ボタンで次の Card へ進める](./study-controls.md#study-controls-08) |
| STUDY-CONTROLS-09 | write | 正常系 | [view mode 設定を閲覧・学習・reload 間で共有できる](./study-controls.md#study-controls-09) |
| STUDY-CONTROLS-10 | write | 正常系 | [横向きの短い画面でも本文と操作ボタンに到達できる](./study-controls.md#study-controls-10) |
| STUDY-CONTROLS-11 | write | 正常系 | [view mode でタッチスクロールができる](./study-controls.md#study-controls-11) |
| STUDY-CONTROLS-12 | write | 正常系 | [方向ボタンの読み上げ名で現在の操作を確認できる](./study-controls.md#study-controls-12) |
| STUDY-CONTROLS-13 | write | 正常系 | [方向キーを長押ししても追加評価せず再押下で進める](./study-controls.md#study-controls-13) |
| STUDY-CONTROLS-14 | write | 正常系 | [Space の長押しで再生を連続切替せず再押下で切り替える](./study-controls.md#study-controls-14) |
| STUDY-CONTROLS-15 | write | 正常系 | [修飾付きショートカットを無視して通常入力を受け付ける](./study-controls.md#study-controls-15) |
| STUDY-CONTROLS-16 | write | 正常系 | [修飾付き Enter で view mode を終了しない](./study-controls.md#study-controls-16) |
| STUDY-CONTROLS-17 | read | 正常系 | [Help dialog 内のキー入力と focus を学習操作から分離できる](./study-controls.md#study-controls-17) |
| STUDY-CONTROLS-18 | read | 正常系 | [Help dialog 表示中の通知が dialog の操作と focus を妨げない](./study-controls.md#study-controls-18) |
| STUDY-CONTROLS-19 | write | 正常系 | [閲覧モードボタンの表示設定を閲覧・学習・reload 間で共有できる](./study-controls.md#study-controls-19) |
| STUDY-CONTROLS-20 | write | 正常系 | [Card・表裏・モードの変更で本文のスクロール位置が先頭へ戻る](./study-controls.md#study-controls-20) |
| STUDY-CONTROLS-21 | batch | 正常系 | [view mode 中も自動再生で次の Card へ進める](./study-controls.md#study-controls-21) |
| STUDY-CONTROLS-22 | write | 正常系 | [view mode でピンチ拡大ができる](./study-controls.md#study-controls-22) |
| STUDY-CONTROLS-23 | write | 正常系 | [b の長押しで方向ボタンを連続切替せず再押下で切り替える](./study-controls.md#study-controls-23) |
| STUDY-SESSION-01 | write | 正常系 | [filter と学習上限を反映して session を開始できる](./study-session.md#study-session-01) |
| STUDY-SESSION-02 | read | 正常系 | [filter に一致する Card がない場合は session を開始できない](./study-session.md#study-session-02) |
| STUDY-SESSION-03 | write | 正常系 | [学習画面から戻った後に同じ位置から Continue できる](./study-session.md#study-session-03) |
| STUDY-SESSION-04 | write | 正常系 | [Restart で新しい session を先頭から開始できる](./study-session.md#study-session-04) |
| STUDY-SESSION-05 | write | 正常系 | [最後の Card を完了して completion screen を表示できる](./study-session.md#study-session-05) |
| STUDY-SESSION-06 | batch | 正常系 | [複数 Deck の学習 session を独立して維持できる](./study-session.md#study-session-06) |
| STUDY-SESSION-07 | write | 正常系 | [匿名での学習結果と再開位置を reload 後も維持できる](./study-session.md#study-session-07) |
| STUDY-SESSION-08 | batch | 正常系 | [展開した tag filter を自動保存して reload 後も維持できる](./study-session.md#study-session-08) |
| STUDY-SESSION-09 | write | 正常系 | [学習を完了すると30日分の開始・完了数を確認できる](./study-session.md#study-session-09) |
| STUDY-SESSION-10 | read | 正常系 | [URL と Deck 選択が再読み込み・戻る・進むでも一致する](./study-session.md#study-session-10) |
| STUDY-SESSION-11 | read | 異常系 | [表示できない Deck を勝手に全件表示へ切り替えない](./study-session.md#study-session-11) |
| STUDY-SESSION-12 | write | 正常系 | [匿名の学習記録を同じブラウザーで再表示できる](./study-session.md#study-session-12) |
| STUDY-SESSION-13 | read | 正常系 | [プリセット期間を選んで学習記録と日別表を確認できる](./study-session.md#study-session-13) |
| STUDY-SESSION-14 | write | 正常系 | [開始時点の Card・設定・時刻で出題対象を選び直す](./study-session.md#study-session-14) |
| STUDY-SESSION-15 | write | 正常系 | [間隔反復と shuffle の設定に従って出題順と上限内の Card を選ぶ](./study-session.md#study-session-15) |
| STUDY-SESSION-16 | read | 異常系 | [学習結果を読み込めない場合は未評価や対象0件として扱わない](./study-session.md#study-session-16) |
| STUDY-SESSION-17 | read | 正常系 | [学習条件を Card 一覧と Deck 閲覧のフィルターへ引き継がない](./study-session.md#study-session-17) |
| STUDY-SESSION-18 | read | 正常系 | [期限・画面復帰・Card と設定の変更に合わせて学習対象件数を更新する](./study-session.md#study-session-18) |
| STUDY-SESSION-19 | write | 正常系 | [アカウント切り替え後に以前のアカウントへ新しい学習を追加しない](./study-session.md#study-session-19) |
| STUDY-SESSION-20 | write | 正常系 | [通常アカウントの Start・Restart・Continue は保存成功まで遷移を待つ](./study-session.md#study-session-20) |
| STUDY-SESSION-21 | write | 正常系 | [Continue 処理中にアカウントや画面が変わると元の学習へ遷移しない](./study-session.md#study-session-21) |
| STUDY-SESSION-22 | read | 正常系 | [保存済みの学習をオフラインの reload や別ブラウザーから再開できる](./study-session.md#study-session-22) |
| STUDY-SESSION-23 | read | 異常系 | [利用できない学習を案内し後から届いた学習を表示する](./study-session.md#study-session-23) |
| STUDY-SESSION-24 | read | 正常系 | [保存済みの学習 URL を直接開くと読み込み後に保存位置を表示する](./study-session.md#study-session-24) |
| STUDY-SESSION-25 | write | 正常系 | [端末間の時計ずれがあっても終了済みの学習を再開しない](./study-session.md#study-session-25) |
| STUDY-SESSION-26 | write | 異常系 | [読み込めない過去の学習があっても利用できる学習を再開できる](./study-session.md#study-session-26) |
| STUDY-SESSION-27 | write | 異常系 | [Restart の保存失敗後も以前の学習を失わずに再試行できる](./study-session.md#study-session-27) |
| STUDY-SESSION-28 | write | 正常系 | [明示的に終了した未完了の学習を完了として数えない](./study-session.md#study-session-28) |
| STUDY-SESSION-29 | batch | 正常系 | [Deck の削除で終了した未完了の学習を完了として数えない](./study-session.md#study-session-29) |
| STUDY-SESSION-30 | read | 正常系 | [匿名で評価した Card は復習期限を迎えると新しい学習の対象に戻る](./study-session.md#study-session-30) |
| STUDY-SESSION-31 | write | 正常系 | [期限に達した匿名の Card を新しい学習で再評価できる](./study-session.md#study-session-31) |
| STUDY-SESSION-32 | write | 正常系 | [保存済みの tag filter に一致する Card だけで学習を開始できる](./study-session.md#study-session-32) |
| STUDY-SESSION-33 | read | 異常系 | [学習記録の取得失敗後に同じ期間で全体の集計を再試行できる](./study-session.md#study-session-33) |
| STUDY-SESSION-34 | read | 正常系 | [ログイン中の通信断でも読み込み済みの学習記録を表示できる](./study-session.md#study-session-34) |
| STUDY-SESSION-35 | read | 正常系 | [開始日と終了日を指定して Deck と期間を再読み込み後も維持できる](./study-session.md#study-session-35) |
| STUDY-SESSION-36 | read | 異常系 | [無効な日付入力を適用せず現在の期間を維持する](./study-session.md#study-session-36) |
| STUDY-SESSION-37 | read | 異常系 | [無効な URL の期間をエラーとして示し有効な期間で復帰できる](./study-session.md#study-session-37) |
| STUDY-SESSION-38 | read | 正常系 | [期間の切り替え後に以前の期間の結果を混ぜない](./study-session.md#study-session-38) |
| STUDY-SESSION-39 | read | 正常系 | [端末の日付変更時に相対期間を更新し指定期間を維持する](./study-session.md#study-session-39) |

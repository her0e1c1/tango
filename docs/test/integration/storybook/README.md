# Storybook 画面別結合テスト仕様書

## Deck 一覧画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-LIST-01 | interaction | 正常系 | [Deck 作成画面を開く](./deck-list.md#storybook-deck-list-01) |
| STORYBOOK-DECK-LIST-02 | interaction | 正常系 | [Deck インポート画面を開く](./deck-list.md#storybook-deck-list-02) |
| STORYBOOK-DECK-LIST-03 | render | 正常系 | [固定文言だけを日本語にする](./deck-list.md#storybook-deck-list-03) |
| STORYBOOK-DECK-LIST-04 | interaction | 正常系 | [選んだ Deck を閲覧する](./deck-list.md#storybook-deck-list-04) |
| STORYBOOK-DECK-LIST-05 | render | 正常系 | [空の一覧にも追加導線を表示する](./deck-list.md#storybook-deck-list-05) |
| STORYBOOK-DECK-LIST-06 | render | 正常系 | [復習対象・新規件数と説明を表示する](./deck-list.md#storybook-deck-list-06) |
| STORYBOOK-DECK-LIST-07 | interaction | 正常系 | [ダウンロード操作後にメニューを閉じる](./deck-list.md#storybook-deck-list-07) |
| STORYBOOK-DECK-LIST-08 | interaction | 正常系 | [学習履歴画面を開く](./deck-list.md#storybook-deck-list-08) |
| STORYBOOK-DECK-LIST-09 | render | 正常系 | [学習中と未開始を一つの一覧に表示する](./deck-list.md#storybook-deck-list-09) |
| STORYBOOK-DECK-LIST-10 | interaction | 正常系 | [複数のメニューを同時に開かない](./deck-list.md#storybook-deck-list-10) |
| STORYBOOK-DECK-LIST-11 | interaction | 正常系 | [追加メニューをキーボードで開閉する](./deck-list.md#storybook-deck-list-11) |
| STORYBOOK-DECK-LIST-12 | interaction | 正常系 | [作成操作後に追加メニューを残さない](./deck-list.md#storybook-deck-list-12) |
| STORYBOOK-DECK-LIST-13 | render | 正常系 | [確認中に空の一覧と断定しない](./deck-list.md#storybook-deck-list-13) |
| STORYBOOK-DECK-LIST-14 | interaction | 異常系 | [初期データ取得失敗から復旧操作を選ぶ](./deck-list.md#storybook-deck-list-14) |
| STORYBOOK-DECK-LIST-15 | interaction | 正常系 | [復習対象0件の理由を区別する](./deck-list.md#storybook-deck-list-15) |
| STORYBOOK-DECK-LIST-16 | interaction | 正常系 | [復習と新規学習を区別して開始する](./deck-list.md#storybook-deck-list-16) |
| STORYBOOK-DECK-LIST-17 | render | 正常系 | [学習位置を表示する](./deck-list.md#storybook-deck-list-17) |
| STORYBOOK-DECK-LIST-18 | interaction | 正常系 | [学習操作で閲覧画面を開かない](./deck-list.md#storybook-deck-list-18) |
| STORYBOOK-DECK-LIST-19 | interaction | 正常系 | [各操作を選んだ Deck に適用する](./deck-list.md#storybook-deck-list-19) |
| STORYBOOK-DECK-LIST-20 | render | 正常系 | [ローカル Deck にリモート表示を付けない](./deck-list.md#storybook-deck-list-20) |
| STORYBOOK-DECK-LIST-21 | render | 正常系 | [処理中の Deck だけを操作不可にする](./deck-list.md#storybook-deck-list-21) |
| STORYBOOK-DECK-LIST-22 | render | 正常系 | [未開始なら再開し直す操作を表示しない](./deck-list.md#storybook-deck-list-22) |
| STORYBOOK-DECK-LIST-23 | interaction | 正常系 | [メニューを矢印キーで移動する](./deck-list.md#storybook-deck-list-23) |
| STORYBOOK-DECK-LIST-24 | interaction | 正常系 | [メニュー内のフォーカス移動で操作を失わない](./deck-list.md#storybook-deck-list-24) |
| STORYBOOK-DECK-LIST-25 | interaction | 正常系 | [メニューの外へ移ったフォーカスを奪わない](./deck-list.md#storybook-deck-list-25) |
| STORYBOOK-DECK-LIST-26 | interaction | 正常系 | [操作が再び有効になってもメニューを開かない](./deck-list.md#storybook-deck-list-26) |
| STORYBOOK-APP-LAYOUT-01 | interaction | 正常系 | [固定ヘッダーと本文を重ねずにスクロールする](./deck-list.md#storybook-app-layout-01) |
| STORYBOOK-APP-LAYOUT-02 | render | 正常系 | [初期表示でヘッダーと本文を重ねない](./deck-list.md#storybook-app-layout-02) |

## Deck 作成画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力する](./deck-create.md#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | render | 正常系 | [効果のない改行変換設定を表示しない](./deck-create.md#storybook-deck-form-02) |
| STORYBOOK-DECK-CREATE-01 | interaction | 正常系 | [作成の成功後に新しい Deck を確認する](./deck-create.md#storybook-deck-create-01) |
| STORYBOOK-DECK-CREATE-02 | interaction | 異常系 | [作成に失敗しても入力を保持する](./deck-create.md#storybook-deck-create-02) |
| STORYBOOK-DECK-CREATE-03 | interaction | 異常系 | [空欄と空白のみの名前に現在の言語でエラーを表示する](./deck-create.md#storybook-deck-create-03) |
| STORYBOOK-DECK-CREATE-04 | interaction | 異常系 | [表示中の名前エラーを言語変更に追従させる](./deck-create.md#storybook-deck-create-04) |

## Deck 編集画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-04 | interaction | 正常系 | [確認して Deck を削除する](./deck-edit.md#storybook-deck-form-04) |
| STORYBOOK-DECK-FORM-05 | interaction | 正常系 | [削除を取り消して編集を続ける](./deck-edit.md#storybook-deck-form-05) |
| STORYBOOK-DECK-FORM-06 | interaction | 正常系 | [削除処理中は再確定と取消しを受け付けない](./deck-edit.md#storybook-deck-form-06) |
| STORYBOOK-DECK-EDIT-01 | render | 正常系 | [選んだ Deck の保存済み内容を編集する](./deck-edit.md#storybook-deck-edit-01) |
| STORYBOOK-DECK-EDIT-02 | interaction | 正常系 | [変更した名前を一覧へ反映する](./deck-edit.md#storybook-deck-edit-02) |
| STORYBOOK-DECK-EDIT-03 | interaction | 異常系 | [保存失敗後も編集値を保持する](./deck-edit.md#storybook-deck-edit-03) |
| STORYBOOK-DECK-EDIT-04 | interaction | 異常系 | [空欄と空白のみの名前に現在の言語でエラーを表示する](./deck-edit.md#storybook-deck-edit-04) |
| STORYBOOK-DECK-EDIT-05 | interaction | 異常系 | [表示中の名前エラーを言語変更に追従させる](./deck-edit.md#storybook-deck-edit-05) |

## Deck インポート画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-IMPORT-01 | render | 正常系 | [初期画面に保存先選択を表示しない](./deck-import.md#storybook-import-01) |
| STORYBOOK-IMPORT-02 | interaction | 正常系 | [CSV を読み込んでプレビューする](./deck-import.md#storybook-import-02) |
| STORYBOOK-IMPORT-03 | interaction | 異常系 | [日本語の診断と無効な確定操作を表示する](./deck-import.md#storybook-import-03) |
| STORYBOOK-IMPORT-04 | interaction | 異常系 | [プレビュー失敗を安全な日本語にする](./deck-import.md#storybook-import-04) |
| STORYBOOK-IMPORT-05 | interaction | 異常系 | [診断を翻訳してユーザー入力を保持する](./deck-import.md#storybook-import-05) |
| STORYBOOK-IMPORT-06 | interaction | 正常系 | [CSV 形式の説明を開く](./deck-import.md#storybook-import-06) |
| STORYBOOK-IMPORT-07 | render | 正常系 | [インポート処理中の選択を無効にする](./deck-import.md#storybook-import-07) |
| STORYBOOK-IMPORT-08 | interaction | 正常系 | [選んだサンプルを試す](./deck-import.md#storybook-import-08) |
| STORYBOOK-IMPORT-09 | interaction | 正常系 | [プレビュー後もファイルを選び直す](./deck-import.md#storybook-import-09) |
| STORYBOOK-IMPORT-10 | interaction | 正常系 | [内容確認とインポート確定を区別する](./deck-import.md#storybook-import-10) |
| STORYBOOK-IMPORT-11 | interaction | 異常系 | [不正な行があれば確定を止める](./deck-import.md#storybook-import-11) |
| STORYBOOK-IMPORT-12 | interaction | 異常系 | [準備失敗後もファイルを選び直す](./deck-import.md#storybook-import-12) |

## Card 一覧画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-LIST-01 | interaction | 正常系 | [Card 作成画面を開く](./card-list.md#storybook-card-list-01) |
| STORYBOOK-CARD-LIST-02 | render | 正常系 | [Card 未作成の空状態を表示する](./card-list.md#storybook-card-list-02) |
| STORYBOOK-CARD-LIST-03 | render | 正常系 | [フィルターによる0件状態を表示する](./card-list.md#storybook-card-list-03) |
| STORYBOOK-CARD-LIST-04 | render | 正常系 | [学習の復習期限で閲覧を0件にしない](./card-list.md#storybook-card-list-04) |
| STORYBOOK-CARD-LIST-05 | interaction | 正常系 | [選んだ Card を閲覧する](./card-list.md#storybook-card-list-05) |
| STORYBOOK-CARD-LIST-06 | interaction | 正常系 | [選択タグを解除して一覧を更新する](./card-list.md#storybook-card-list-06) |
| STORYBOOK-CARD-LIST-07 | interaction | 正常系 | [Card の拡大表示を閉じる](./card-list.md#storybook-card-list-07) |
| STORYBOOK-CARD-LIST-08 | interaction | 正常系 | [標準順に戻す](./card-list.md#storybook-card-list-08) |
| STORYBOOK-CARD-LIST-09 | interaction | 正常系 | [メニューから Card を編集する](./card-list.md#storybook-card-list-09) |
| STORYBOOK-CARD-LIST-10 | render | 正常系 | [空の理由を断定できない間は誤案内しない](./card-list.md#storybook-card-list-10) |
| STORYBOOK-CARD-LIST-11 | render | 正常系 | [長い選択タグの名前を確認できる](./card-list.md#storybook-card-list-11) |
| STORYBOOK-CARD-LIST-12 | interaction | 正常系 | [タグ解除後に残るタグへフォーカスを移す](./card-list.md#storybook-card-list-12) |
| STORYBOOK-CARD-LIST-13 | interaction | 正常系 | [最後のタグ解除後はフィルターへ戻る](./card-list.md#storybook-card-list-13) |
| STORYBOOK-CARD-LIST-14 | interaction | 正常系 | [Tab 移動だけでは選択を変えない](./card-list.md#storybook-card-list-14) |
| STORYBOOK-CARD-LIST-15 | interaction | 正常系 | [メニューを一つに保ち対象の削除で閉じる](./card-list.md#storybook-card-list-15) |
| STORYBOOK-CARD-LIST-16 | interaction | 正常系 | [並べ替え後も選んだ Card を操作する](./card-list.md#storybook-card-list-16) |
| STORYBOOK-CARD-LIST-17 | interaction | 正常系 | [空状態から Card 作成を始める](./card-list.md#storybook-card-list-17) |
| STORYBOOK-CARD-LIST-18 | interaction | 正常系 | [0件状態からフィルターを解除する](./card-list.md#storybook-card-list-18) |
| STORYBOOK-CARD-LIST-19 | interaction | 正常系 | [行の編集操作で対象を取り違えない](./card-list.md#storybook-card-list-19) |
| STORYBOOK-CARD-LIST-20 | render | 正常系 | [処理中の Card を操作させない](./card-list.md#storybook-card-list-20) |
| STORYBOOK-CARD-LIST-21 | interaction | 正常系 | [選んだ Card の削除を開始する](./card-list.md#storybook-card-list-21) |
| STORYBOOK-CARD-LIST-22 | render | 正常系 | [操作不可の Card にメニューを開かない](./card-list.md#storybook-card-list-22) |
| STORYBOOK-DECK-FILTER-01 | interaction | 正常系 | [閲覧タグをまとめて解除する](./card-list.md#storybook-deck-filter-01) |
| STORYBOOK-DECK-FILTER-02 | interaction | 正常系 | [折りたたまれたタグを表示する](./card-list.md#storybook-deck-filter-02) |
| STORYBOOK-DECK-FILTER-03 | interaction | 正常系 | [タグ選択を一覧へ反映する](./card-list.md#storybook-deck-filter-03) |
| STORYBOOK-DECK-FILTER-04 | interaction | 正常系 | [同じタグを重複して表示しない](./card-list.md#storybook-deck-filter-04) |
| STORYBOOK-DECK-FILTER-05 | interaction | 正常系 | [Any と All で絞り込み結果を変える](./card-list.md#storybook-deck-filter-05) |
| STORYBOOK-DECK-FILTER-06 | interaction | 正常系 | [候補から消えた選択タグも解除できる](./card-list.md#storybook-deck-filter-06) |
| STORYBOOK-DECK-FILTER-07 | interaction | 正常系 | [追加表示したタグをキーボードで選ぶ](./card-list.md#storybook-deck-filter-07) |
| STORYBOOK-DECK-FILTER-08 | interaction | 正常系 | [解除で隠れるタグからフォーカスを移す](./card-list.md#storybook-deck-filter-08) |
| STORYBOOK-DECK-FILTER-09 | interaction | 正常系 | [最後の候補外タグを解除する](./card-list.md#storybook-deck-filter-09) |
| STORYBOOK-DECK-FILTER-10 | interaction | 正常系 | [Clear が無効になる前にフォーカスを移す](./card-list.md#storybook-deck-filter-10) |
| STORYBOOK-DECK-FILTER-11 | render | 正常系 | [8件以下では追加表示操作を出さない](./card-list.md#storybook-deck-filter-11) |
| STORYBOOK-DECK-FILTER-12 | render | 正常系 | [タグ候補がなくても一致条件を保持する](./card-list.md#storybook-deck-filter-12) |
| STORYBOOK-DECK-FILTER-13 | render | 正常系 | [大量の選択タグをスクロールして確認する](./card-list.md#storybook-deck-filter-13) |
| STORYBOOK-DECK-FILTER-14 | render | 正常系 | [長い候補タグ名を確認できる](./card-list.md#storybook-deck-filter-14) |
| STORYBOOK-DECK-FILTER-15 | interaction | 正常系 | [言語が変わってもタグの展開を保つ](./card-list.md#storybook-deck-filter-15) |

## Card 作成画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-05 | interaction | 正常系 | [入力した両面で Card を作成する](./card-create.md#storybook-card-form-05) |
| STORYBOOK-CARD-FORM-17 | interaction | 正常系 | [作成成功を画面で通知する](./card-create.md#storybook-card-form-17) |
| STORYBOOK-CARD-FORM-18 | interaction | 異常系 | [作成失敗後に入力を保って再試行する](./card-create.md#storybook-card-form-18) |
| STORYBOOK-CARD-FORM-19 | interaction | 正常系 | [作成中の連続操作を抑止する](./card-create.md#storybook-card-form-19) |
| STORYBOOK-CARD-CREATE-01 | interaction | 異常系 | [未入力のまま Card を作成しない](./card-create.md#storybook-card-create-01) |
| STORYBOOK-CARD-CREATE-02 | interaction | 正常系 | [下書きを保存せず解答を確認する](./card-create.md#storybook-card-create-02) |

## Card 編集画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-01 | interaction | 正常系 | [タブを切り替えても表面の入力を保持する](./card-edit.md#storybook-card-form-01) |
| STORYBOOK-CARD-FORM-02 | interaction | 正常系 | [編集する Card のタグを選ぶ](./card-edit.md#storybook-card-form-02) |
| STORYBOOK-CARD-FORM-03 | interaction | 異常系 | [日本語の入力エラーを関連付ける](./card-edit.md#storybook-card-form-03) |
| STORYBOOK-CARD-FORM-04 | interaction | 正常系 | [解答プレビューを開く](./card-edit.md#storybook-card-form-04) |
| STORYBOOK-CARD-FORM-06 | interaction | 正常系 | [拡大編集後も両面の下書きを保つ](./card-edit.md#storybook-card-form-06) |
| STORYBOOK-CARD-FORM-07 | interaction | 正常系 | [独自タグの選択と要約を保って保存する](./card-edit.md#storybook-card-form-07) |
| STORYBOOK-CARD-FORM-08 | interaction | 正常系 | [キーボードで編集面を切り替える](./card-edit.md#storybook-card-form-08) |
| STORYBOOK-CARD-FORM-09 | interaction | 異常系 | [裏面エラーのある入力欄を開く](./card-edit.md#storybook-card-form-09) |
| STORYBOOK-CARD-FORM-10 | interaction | 異常系 | [未知のエラーを安全な翻訳文で表示する](./card-edit.md#storybook-card-form-10) |
| STORYBOOK-CARD-FORM-11 | interaction | 異常系 | [言語変更後も下書きとタグを保つ](./card-edit.md#storybook-card-form-11) |
| STORYBOOK-CARD-FORM-12 | interaction | 正常系 | [不完全な下書きを保存せずプレビューする](./card-edit.md#storybook-card-form-12) |
| STORYBOOK-CARD-FORM-13 | interaction | 異常系 | [拡大編集の変更を数式プレビューへ反映する](./card-edit.md#storybook-card-form-13) |
| STORYBOOK-CARD-FORM-14 | interaction | 正常系 | [表示条件に応じてコードを表示する](./card-edit.md#storybook-card-form-14) |
| STORYBOOK-CARD-FORM-15 | interaction | 正常系 | [タグ変更をプレビューへ反映する](./card-edit.md#storybook-card-form-15) |
| STORYBOOK-CARD-FORM-16 | interaction | 正常系 | [言語が変わってもプレビューを開いておく](./card-edit.md#storybook-card-form-16) |
| STORYBOOK-CARD-FORM-20 | interaction | 正常系 | [保存中は編集と離脱を無効にする](./card-edit.md#storybook-card-form-20) |
| STORYBOOK-CARD-FORM-21 | interaction | 正常系 | [外部更新で編集中の下書きを上書きしない](./card-edit.md#storybook-card-form-21) |
| STORYBOOK-CARD-FORM-22 | interaction | 異常系 | [両面が不正なら表面から修正する](./card-edit.md#storybook-card-form-22) |
| STORYBOOK-CARD-FORM-23 | interaction | 異常系 | [保存失敗後に同じ下書きを再送信する](./card-edit.md#storybook-card-form-23) |
| STORYBOOK-CARD-FORM-24 | interaction | 正常系 | [確認なしのタグ編集を下書きへ即時反映する](./card-edit.md#storybook-card-form-24) |
| STORYBOOK-CARD-FORM-25 | interaction | 異常系 | [空白や重複したタグ名で保存しない](./card-edit.md#storybook-card-form-25) |
| STORYBOOK-CARD-EDIT-01 | interaction | 正常系 | [長い解答プレビューへキーボードで移動する](./card-edit.md#storybook-card-edit-01) |
| STORYBOOK-CARD-EDIT-02 | interaction | 正常系 | [プレビューを閉じた拡大編集内でフォーカスを循環させる](./card-edit.md#storybook-card-edit-02) |

## Card 閲覧画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-VIEW-01 | interaction | 正常系 | [指定した Card の両面を読む](./card-view.md#storybook-card-view-01) |
| STORYBOOK-CARD-VIEW-02 | interaction | 正常系 | [表示している Card を編集する](./card-view.md#storybook-card-view-02) |
| STORYBOOK-CARD-VIEW-03 | render | 異常系 | [存在しない Card を案内する](./card-view.md#storybook-card-view-03) |

## Deck 閲覧画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-PLAYER-01 | interaction | 正常系 | [読書中のスクロールを Card 移動にしない](./deck-view.md#storybook-card-player-01) |
| STORYBOOK-CARD-PLAYER-02 | interaction | 正常系 | [文字選択中に閲覧を終了しない](./deck-view.md#storybook-card-player-02) |
| STORYBOOK-CARD-PLAYER-03 | interaction | 正常系 | [Space とタップを区別する](./deck-view.md#storybook-card-player-03) |
| STORYBOOK-CARD-PLAYER-04 | interaction | 正常系 | [閲覧設定で許可済みの裏面操作を失わない](./deck-view.md#storybook-card-player-04) |
| STORYBOOK-CARD-PLAYER-05 | interaction | 正常系 | [編集操作の表示を切り替える](./deck-view.md#storybook-card-player-05) |
| STORYBOOK-CARD-PLAYER-06 | render | 正常系 | [裏面に編集操作を表示しない](./deck-view.md#storybook-card-player-06) |
| STORYBOOK-CARD-PLAYER-07 | render | 正常系 | [裏面では解答に集中できる表示にする](./deck-view.md#storybook-card-player-07) |
| STORYBOOK-CARD-PLAYER-08 | interaction | 正常系 | [端の Card 移動と解答クリックを分離する](./deck-view.md#storybook-card-player-08) |
| STORYBOOK-CARD-PLAYER-09 | interaction | 正常系 | [端のホイール入力でも文章をスクロールする](./deck-view.md#storybook-card-player-09) |
| STORYBOOK-CARD-PLAYER-10 | interaction | 正常系 | [操作一覧から閲覧操作を選ぶ](./deck-view.md#storybook-card-player-10) |
| STORYBOOK-CARD-PLAYER-11 | interaction | 正常系 | [ヘルプの再表示操作を失わない](./deck-view.md#storybook-card-player-11) |
| STORYBOOK-CARD-PLAYER-12 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](./deck-view.md#storybook-card-player-12) |
| STORYBOOK-CARD-PLAYER-13 | interaction | 正常系 | [閲覧モードと切替ボタンの表示を分ける](./deck-view.md#storybook-card-player-13) |
| STORYBOOK-CARD-PLAYER-14 | interaction | 正常系 | [表示設定をショートカットで切り替える](./deck-view.md#storybook-card-player-14) |
| STORYBOOK-CARD-PLAYER-15 | interaction | 正常系 | [Card の詳細表示をまとめて切り替える](./deck-view.md#storybook-card-player-15) |
| STORYBOOK-CARD-PLAYER-16 | interaction | 正常系 | [再生操作が使えない理由を確認する](./deck-view.md#storybook-card-player-16) |
| STORYBOOK-CARD-PLAYER-17 | render | 正常系 | [選んだ下部操作だけを表示する](./deck-view.md#storybook-card-player-17) |
| STORYBOOK-CARD-PLAYER-18 | interaction | 正常系 | [許可されていない裏面の方向操作を無視する](./deck-view.md#storybook-card-player-18) |
| STORYBOOK-CARD-PLAYER-19 | interaction | 正常系 | [方向ボタンを隠しても表面のスワイプを使う](./deck-view.md#storybook-card-player-19) |
| STORYBOOK-CARD-PLAYER-20 | interaction | 正常系 | [ドラッグ後にクリックを重複して扱わない](./deck-view.md#storybook-card-player-20) |
| STORYBOOK-CARD-PLAYER-21 | interaction | 正常系 | [中・右ボタンのドラッグで Card を移動しない](./deck-view.md#storybook-card-player-21) |
| STORYBOOK-CARD-PLAYER-22 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](./deck-view.md#storybook-card-player-22) |
| STORYBOOK-CARD-PLAYER-23 | render | 正常系 | [未評価と FSRS 難易度を区別する](./deck-view.md#storybook-card-player-23) |
| STORYBOOK-DECK-VIEW-01 | interaction | 正常系 | [閲覧条件に一致する Card を順番に読む](./deck-view.md#storybook-deck-view-01) |
| STORYBOOK-DECK-VIEW-02 | render | 正常系 | [Card がない場合に戻る操作を表示する](./deck-view.md#storybook-deck-view-02) |
| STORYBOOK-DECK-VIEW-03 | render | 正常系 | [閲覧条件による0件を未作成と区別する](./deck-view.md#storybook-deck-view-03) |

## 学習開始画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-SESSION-START-01 | interaction | 正常系 | [学習を開始する](./study-session-start.md#storybook-study-session-start-01) |
| STORYBOOK-STUDY-SESSION-START-02 | render | 正常系 | [対象がない場合に理由を示す](./study-session-start.md#storybook-study-session-start-02) |
| STORYBOOK-STUDY-SESSION-START-03 | interaction | 異常系 | [開始に失敗した場合に復旧できる](./study-session-start.md#storybook-study-session-start-03) |

## 学習画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | 正常系 | [再生を開始して一時停止表示にする](./study-session.md#storybook-study-controls-01) |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | 正常系 | [Card を評価せずスキップする](./study-session.md#storybook-study-controls-02) |
| STORYBOOK-STUDY-CONTROLS-03 | interaction | 正常系 | [Enter で再生を開始する](./study-session.md#storybook-study-controls-03) |
| STORYBOOK-STUDY-CONTROLS-04 | interaction | 正常系 | [スライダーで表示位置を変える](./study-session.md#storybook-study-controls-04) |
| STORYBOOK-STUDY-CONTROLS-05 | interaction | 正常系 | [無効な方向操作を Tab 移動から除く](./study-session.md#storybook-study-controls-05) |
| STORYBOOK-STUDY-CONTROLS-06 | interaction | 正常系 | [Enter で有効な方向操作を実行する](./study-session.md#storybook-study-controls-06) |
| STORYBOOK-STUDY-CONTROLS-07 | interaction | 正常系 | [学習ヘルプをモーダルとして開く](./study-session.md#storybook-study-controls-07) |
| STORYBOOK-STUDY-CONTROLS-08 | interaction | 正常系 | [ヘルプ内にフォーカスを保ち Escape で戻る](./study-session.md#storybook-study-controls-08) |
| STORYBOOK-STUDY-CONTROLS-09 | interaction | 正常系 | [ヘルプ表示中は背景の通知を操作させない](./study-session.md#storybook-study-controls-09) |
| STORYBOOK-STUDY-CONTROLS-10 | interaction | 正常系 | [ヘルプを閉じて通知の操作を戻す](./study-session.md#storybook-study-controls-10) |
| STORYBOOK-STUDY-SESSION-01 | interaction | 正常系 | [解答を確認して評価すると次へ進む](./study-session.md#storybook-study-session-01) |
| STORYBOOK-STUDY-SESSION-02 | interaction | 正常系 | [最後の Card を終えると完了を表示する](./study-session.md#storybook-study-session-02) |
| STORYBOOK-STUDY-SESSION-03 | interaction | 異常系 | [回答処理の失敗を成功と扱わない](./study-session.md#storybook-study-session-03) |
| STORYBOOK-STUDY-SESSION-04 | interaction | 正常系 | [方向ボタンの名前が言語と現在の操作に追従する](./study-session.md#storybook-study-session-04) |

## 学習履歴画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-HISTORY-01 | interaction | 正常系 | [期間プリセットを集計表示へ反映する](./study-history.md#storybook-study-history-01) |
| STORYBOOK-STUDY-HISTORY-02 | interaction | 正常系 | [任意期間を入力する](./study-history.md#storybook-study-history-02) |
| STORYBOOK-STUDY-HISTORY-03 | interaction | 正常系 | [日別表を30日単位で開く](./study-history.md#storybook-study-history-03) |
| STORYBOOK-STUDY-HISTORY-04 | interaction | 正常系 | [日別表の古い日付へ進む](./study-history.md#storybook-study-history-04) |
| STORYBOOK-STUDY-HISTORY-05 | render | 正常系 | [セッションの終了状態を区別する](./study-history.md#storybook-study-history-05) |
| STORYBOOK-STUDY-HISTORY-06 | render | 正常系 | [セッションの状態を日本語で表示する](./study-history.md#storybook-study-history-06) |
| STORYBOOK-STUDY-HISTORY-07 | interaction | 正常系 | [最近のセッションをすべて展開する](./study-history.md#storybook-study-history-07) |
| STORYBOOK-STUDY-HISTORY-08 | render | 正常系 | [30日分の集計グラフを表示する](./study-history.md#storybook-study-history-08) |
| STORYBOOK-STUDY-HISTORY-09 | render | 正常系 | [90日分のグラフに集約単位を示す](./study-history.md#storybook-study-history-09) |

## 設定画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-SETTINGS-01 | render | 正常系 | [設定画面を日本語で表示する](./settings.md#storybook-settings-01) |
| STORYBOOK-SETTINGS-02 | interaction | 正常系 | [再生操作の表示設定を切り替える](./settings.md#storybook-settings-02) |
| STORYBOOK-SETTINGS-03 | interaction | 正常系 | [スワイプ操作の表示設定を切り替える](./settings.md#storybook-settings-03) |
| STORYBOOK-SETTINGS-04 | render | 正常系 | [設定とアカウント操作を分離する](./settings.md#storybook-settings-04) |
| STORYBOOK-SETTINGS-05 | interaction | 正常系 | [入力変更を画面へ反映する](./settings.md#storybook-settings-05) |
| STORYBOOK-SETTINGS-06 | render | 正常系 | [復習の説明とバージョン情報を表示する](./settings.md#storybook-settings-06) |
| STORYBOOK-SETTINGS-07 | render | 正常系 | [ラベルと説明を対応する入力に関連付ける](./settings.md#storybook-settings-07) |
| STORYBOOK-SETTINGS-08 | render | 正常系 | [日本語の操作名と読み上げ値を表示する](./settings.md#storybook-settings-08) |
| STORYBOOK-SETTINGS-09 | interaction | 正常系 | [最大カード数0を全件として説明する](./settings.md#storybook-settings-09) |
| STORYBOOK-SETTINGS-10 | interaction | 正常系 | [再生間隔の境界値を説明する](./settings.md#storybook-settings-10) |
| STORYBOOK-SETTINGS-11 | interaction | 正常系 | [ショートカットでホームへ戻る](./settings.md#storybook-settings-11) |

## アカウント画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-ACCOUNT-01 | interaction | 正常系 | [匿名アカウントからログインする](./account.md#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | 正常系 | [ログアウトする](./account.md#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | interaction | 正常系 | [ログイン待機中の操作を無効にする](./account.md#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | interaction | 正常系 | [ログアウト待機中の操作を無効にする](./account.md#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | 正常系 | [アカウント画面を日本語で表示する](./account.md#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | 正常系 | [認証状態と UID を表示する](./account.md#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | 正常系 | [先行操作の完了で別操作の待機を解除しない](./account.md#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | 正常系 | [言語変更でプロフィール値を変えない](./account.md#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | 正常系 | [ショートカットでホームへ戻る](./account.md#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | 異常系 | [認証失敗後に再試行する](./account.md#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | 異常系 | [表示済みの通知を画面離脱だけで消さない](./account.md#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | 異常系 | [画面離脱後に届く失敗も通知する](./account.md#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | 正常系 | [日本語で認証成功を通知する](./account.md#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | 正常系 / 異常系 | [画面へ戻っても認証待機を保つ](./account.md#storybook-account-14) |

## ページ未検出画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-NOT-FOUND-01 | render | 異常系 | [未知の URL を案内する](./not-found.md#storybook-not-found-01) |
| STORYBOOK-NOT-FOUND-02 | interaction | 異常系 | [見つからない画面からホームへ戻る](./not-found.md#storybook-not-found-02) |

# Storybook 結合テスト仕様書

[記述規約・実行前提](./AGENTS.md)

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-APP-LAYOUT-01 | interaction | 正常系 | [固定 Header が本文に重ならずスクロール中も同じ位置に残る](./app-layout.md#storybook-app-layout-01) |
| STORYBOOK-APP-LAYOUT-02 | render | 正常系 | [固定を無効にした Header の下に本文を配置する](./app-layout.md#storybook-app-layout-02) |
| STORYBOOK-DECK-LIST-01 | interaction | 正常系 | [Deck 作成を要求する](./deck-list.md#storybook-deck-list-01) |
| STORYBOOK-DECK-LIST-02 | interaction | 正常系 | [Deck インポートを要求する](./deck-list.md#storybook-deck-list-02) |
| STORYBOOK-DECK-LIST-03 | render | 正常系 | [固定文言だけを日本語にする](./deck-list.md#storybook-deck-list-03) |
| STORYBOOK-DECK-LIST-04 | interaction | 正常系 | [Deck の閲覧を要求する](./deck-list.md#storybook-deck-list-04) |
| STORYBOOK-DECK-LIST-05 | render | 正常系 | [空の一覧にも追加導線を表示する](./deck-list.md#storybook-deck-list-05) |
| STORYBOOK-DECK-LIST-06 | render | 正常系 | [復習対象・新規件数と説明を表示する](./deck-list.md#storybook-deck-list-06) |
| STORYBOOK-DECK-LIST-07 | interaction | 正常系 | [ダウンロードを要求してメニューを閉じる](./deck-list.md#storybook-deck-list-07) |
| STORYBOOK-DECK-LIST-08 | interaction | 正常系 | [学習履歴を要求する](./deck-list.md#storybook-deck-list-08) |
| STORYBOOK-DECK-LIST-09 | render | 正常系 | [学習中と未開始を一つの一覧に表示する](./deck-list.md#storybook-deck-list-09) |
| STORYBOOK-DECK-LIST-10 | interaction | 正常系 | [複数のメニューを同時に開かない](./deck-list.md#storybook-deck-list-10) |
| STORYBOOK-DECK-LIST-11 | interaction | 正常系 | [追加メニューをキーボードで開閉する](./deck-list.md#storybook-deck-list-11) |
| STORYBOOK-DECK-LIST-12 | interaction | 正常系 | [作成要求後に追加ボタンへ戻る](./deck-list.md#storybook-deck-list-12) |
| STORYBOOK-DECK-LIST-13 | render | 正常系 | [確認中に空の一覧と断定しない](./deck-list.md#storybook-deck-list-13) |
| STORYBOOK-DECK-LIST-14 | interaction | 異常系 | [初期データ取得失敗から操作を選ぶ](./deck-list.md#storybook-deck-list-14) |
| STORYBOOK-DECK-LIST-15 | interaction | 正常系 | [復習対象0件の理由を区別する](./deck-list.md#storybook-deck-list-15) |
| STORYBOOK-DECK-LIST-16 | interaction | 正常系 | [復習と新規学習を区別して要求する](./deck-list.md#storybook-deck-list-16) |
| STORYBOOK-DECK-LIST-17 | render | 正常系 | [学習位置を表示する](./deck-list.md#storybook-deck-list-17) |
| STORYBOOK-DECK-LIST-18 | interaction | 正常系 | [Study で行の閲覧を起動しない](./deck-list.md#storybook-deck-list-18) |
| STORYBOOK-DECK-LIST-19 | interaction | 正常系 | [各操作に対象 ID を渡す](./deck-list.md#storybook-deck-list-19) |
| STORYBOOK-DECK-LIST-20 | render | 正常系 | [ローカル Deck にリモート表示を付けない](./deck-list.md#storybook-deck-list-20) |
| STORYBOOK-DECK-LIST-21 | render | 正常系 | [処理中の行だけを無効にする](./deck-list.md#storybook-deck-list-21) |
| STORYBOOK-DECK-LIST-22 | render | 正常系 | [未開始なら Restart を表示しない](./deck-list.md#storybook-deck-list-22) |
| STORYBOOK-DECK-LIST-23 | interaction | 正常系 | [メニューを矢印キーで移動する](./deck-list.md#storybook-deck-list-23) |
| STORYBOOK-DECK-LIST-24 | interaction | 正常系 | [メニュー内のフォーカス移動で操作を失わない](./deck-list.md#storybook-deck-list-24) |
| STORYBOOK-DECK-LIST-25 | interaction | 正常系 | [外へ移ったフォーカスを奪わない](./deck-list.md#storybook-deck-list-25) |
| STORYBOOK-DECK-LIST-26 | interaction | 正常系 | [再有効化してもメニューを閉じたままにする](./deck-list.md#storybook-deck-list-26) |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力できる](./deck-form.md#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | interaction | 正常系 | [詳細設定を閉じて開き直しても入力を保持する](./deck-form.md#storybook-deck-form-02) |
| STORYBOOK-DECK-FORM-03 | render | 異常系 | [詳細項目のエラーを見える状態で表示する](./deck-form.md#storybook-deck-form-03) |
| STORYBOOK-DECK-FORM-04 | interaction | 正常系 | [削除確認から確定 callback を通知する](./deck-form.md#storybook-deck-form-04) |
| STORYBOOK-DECK-FORM-05 | interaction | 正常系 | [削除を確定せずに取消しを通知する](./deck-form.md#storybook-deck-form-05) |
| STORYBOOK-DECK-FORM-06 | interaction | 正常系 | [削除処理中は再確定と取消しを通知しない](./deck-form.md#storybook-deck-form-06) |
| STORYBOOK-CARD-LIST-01 | interaction | 正常系 | [Card の追加を要求する](./card-list.md#storybook-card-list-01) |
| STORYBOOK-CARD-LIST-02 | render | 正常系 | [Card 未作成の空状態を表示する](./card-list.md#storybook-card-list-02) |
| STORYBOOK-CARD-LIST-03 | render | 正常系 | [フィルターによる0件状態を表示する](./card-list.md#storybook-card-list-03) |
| STORYBOOK-CARD-LIST-04 | render | 正常系 | [復習期限による0件状態を区別する](./card-list.md#storybook-card-list-04) |
| STORYBOOK-CARD-LIST-05 | interaction | 正常系 | [閲覧要求に対象 ID を渡す](./card-list.md#storybook-card-list-05) |
| STORYBOOK-CARD-LIST-06 | interaction | 正常系 | [選択タグを解除する](./card-list.md#storybook-card-list-06) |
| STORYBOOK-CARD-LIST-07 | interaction | 正常系 | [Card の overlay を閉じる](./card-list.md#storybook-card-list-07) |
| STORYBOOK-CARD-LIST-08 | interaction | 正常系 | [標準順への変更を要求する](./card-list.md#storybook-card-list-08) |
| STORYBOOK-CARD-LIST-09 | interaction | 正常系 | [編集を要求してメニューを閉じる](./card-list.md#storybook-card-list-09) |
| STORYBOOK-CARD-LIST-10 | render | 正常系 | [空理由がなければ案内を断定しない](./card-list.md#storybook-card-list-10) |
| STORYBOOK-CARD-LIST-11 | render | 正常系 | [長い選択タグを保持する](./card-list.md#storybook-card-list-11) |
| STORYBOOK-CARD-LIST-12 | interaction | 正常系 | [タグ解除後に残るタグへフォーカスを移す](./card-list.md#storybook-card-list-12) |
| STORYBOOK-CARD-LIST-13 | interaction | 正常系 | [最後のタグ解除後はフィルターへ戻る](./card-list.md#storybook-card-list-13) |
| STORYBOOK-CARD-LIST-14 | interaction | 正常系 | [Tab 移動で選択を変えない](./card-list.md#storybook-card-list-14) |
| STORYBOOK-CARD-LIST-15 | interaction | 正常系 | [メニューを一つに保ち行の削除で閉じる](./card-list.md#storybook-card-list-15) |
| STORYBOOK-CARD-LIST-16 | interaction | 正常系 | [並べ替え後も同じ Card を操作する](./card-list.md#storybook-card-list-16) |
| STORYBOOK-CARD-LIST-17 | interaction | 正常系 | [空状態から追加を要求する](./card-list.md#storybook-card-list-17) |
| STORYBOOK-CARD-LIST-18 | interaction | 正常系 | [0件状態からフィルター解除を要求する](./card-list.md#storybook-card-list-18) |
| STORYBOOK-CARD-LIST-19 | interaction | 正常系 | [行の編集要求に対象 ID を渡す](./card-list.md#storybook-card-list-19) |
| STORYBOOK-CARD-LIST-20 | render | 正常系 | [処理中の行を操作させない](./card-list.md#storybook-card-list-20) |
| STORYBOOK-CARD-LIST-21 | interaction | 正常系 | [削除を要求する](./card-list.md#storybook-card-list-21) |
| STORYBOOK-CARD-LIST-22 | render | 正常系 | [無効なメニューを表示しない](./card-list.md#storybook-card-list-22) |
| STORYBOOK-CARD-FORM-01 | interaction | 正常系 | [タブ間で表面の入力を保持する](./card-form.md#storybook-card-form-01) |
| STORYBOOK-CARD-FORM-02 | interaction | 正常系 | [タグを選択する](./card-form.md#storybook-card-form-02) |
| STORYBOOK-CARD-FORM-03 | render | 異常系 | [日本語エラーを入力に関連付ける](./card-form.md#storybook-card-form-03) |
| STORYBOOK-CARD-FORM-04 | interaction | 正常系 | [解答プレビューを開く](./card-form.md#storybook-card-form-04) |
| STORYBOOK-CARD-FORM-05 | interaction | 正常系 | [作成操作を通知する](./card-form.md#storybook-card-form-05) |
| STORYBOOK-CARD-FORM-06 | interaction | 正常系 | [拡大編集後も両面の下書きを保つ](./card-form.md#storybook-card-form-06) |
| STORYBOOK-CARD-FORM-07 | interaction | 正常系 | [独自タグの選択と要約を保って送信する](./card-form.md#storybook-card-form-07) |
| STORYBOOK-CARD-FORM-08 | interaction | 正常系 | [キーボードで面を切り替える](./card-form.md#storybook-card-form-08) |
| STORYBOOK-CARD-FORM-09 | interaction | 異常系 | [裏面エラーを開いてフォーカスする](./card-form.md#storybook-card-form-09) |
| STORYBOOK-CARD-FORM-10 | interaction | 異常系 | [未知のエラーを安全な翻訳文で表示する](./card-form.md#storybook-card-form-10) |
| STORYBOOK-CARD-FORM-11 | interaction | 異常系 | [言語変更後も下書きとタグを保つ](./card-form.md#storybook-card-form-11) |
| STORYBOOK-CARD-FORM-12 | interaction | 正常系 | [不完全な下書きを送信せずプレビューする](./card-form.md#storybook-card-form-12) |
| STORYBOOK-CARD-FORM-13 | interaction | 異常系 | [拡大編集の変更を数式プレビューに反映する](./card-form.md#storybook-card-form-13) |
| STORYBOOK-CARD-FORM-14 | interaction | 正常系 | [表示条件に応じてコードを表示する](./card-form.md#storybook-card-form-14) |
| STORYBOOK-CARD-FORM-15 | interaction | 正常系 | [タグ変更をプレビューに反映する](./card-form.md#storybook-card-form-15) |
| STORYBOOK-CARD-FORM-16 | interaction | 正常系 | [言語変更後もプレビューを開いておく](./card-form.md#storybook-card-form-16) |
| STORYBOOK-CARD-FORM-17 | interaction | 正常系 | [作成成功を通知する](./card-form.md#storybook-card-form-17) |
| STORYBOOK-CARD-FORM-18 | interaction | 異常系 | [作成失敗後に入力を保って再試行する](./card-form.md#storybook-card-form-18) |
| STORYBOOK-CARD-FORM-19 | interaction | 正常系 | [作成中の連続送信を抑止する](./card-form.md#storybook-card-form-19) |
| STORYBOOK-CARD-FORM-20 | interaction | 正常系 | [保存中は編集と離脱を無効にする](./card-form.md#storybook-card-form-20) |
| STORYBOOK-CARD-FORM-21 | interaction | 正常系 | [外部更新で編集値を上書きしない](./card-form.md#storybook-card-form-21) |
| STORYBOOK-CARD-FORM-22 | interaction | 異常系 | [両面が不正なら表面から修正する](./card-form.md#storybook-card-form-22) |
| STORYBOOK-CARD-FORM-23 | interaction | 異常系 | [編集の保存失敗後に再送信する](./card-form.md#storybook-card-form-23) |
| STORYBOOK-DECK-FILTER-01 | interaction | 正常系 | [選択タグをクリアする](./deck-filter.md#storybook-deck-filter-01) |
| STORYBOOK-DECK-FILTER-02 | interaction | 正常系 | [折りたたまれたタグを表示する](./deck-filter.md#storybook-deck-filter-02) |
| STORYBOOK-DECK-FILTER-03 | interaction | 正常系 | [タグ選択を通知する](./deck-filter.md#storybook-deck-filter-03) |
| STORYBOOK-DECK-FILTER-04 | interaction | 正常系 | [重複を除いて選択を扱う](./deck-filter.md#storybook-deck-filter-04) |
| STORYBOOK-DECK-FILTER-05 | interaction | 正常系 | [Any と All を切り替える](./deck-filter.md#storybook-deck-filter-05) |
| STORYBOOK-DECK-FILTER-06 | interaction | 正常系 | [選択済みと候補外のタグを先頭に保つ](./deck-filter.md#storybook-deck-filter-06) |
| STORYBOOK-DECK-FILTER-07 | interaction | 正常系 | [追加表示したタグへキーボードで移動する](./deck-filter.md#storybook-deck-filter-07) |
| STORYBOOK-DECK-FILTER-08 | interaction | 正常系 | [解除で隠れるタグからフォーカスを移す](./deck-filter.md#storybook-deck-filter-08) |
| STORYBOOK-DECK-FILTER-09 | interaction | 正常系 | [最後の候補外タグを解除する](./deck-filter.md#storybook-deck-filter-09) |
| STORYBOOK-DECK-FILTER-10 | interaction | 正常系 | [Clear の無効化前にフォーカスを移す](./deck-filter.md#storybook-deck-filter-10) |
| STORYBOOK-DECK-FILTER-11 | render | 正常系 | [8件以下では開示ボタンを表示しない](./deck-filter.md#storybook-deck-filter-11) |
| STORYBOOK-DECK-FILTER-12 | render | 正常系 | [空状態でも一致条件を保つ](./deck-filter.md#storybook-deck-filter-12) |
| STORYBOOK-DECK-FILTER-13 | render | 正常系 | [大量の選択タグをスクロール領域にする](./deck-filter.md#storybook-deck-filter-13) |
| STORYBOOK-DECK-FILTER-14 | render | 正常系 | [長いタグ名を保持する](./deck-filter.md#storybook-deck-filter-14) |
| STORYBOOK-DECK-FILTER-15 | interaction | 正常系 | [言語変更後も展開状態を保つ](./deck-filter.md#storybook-deck-filter-15) |
| STORYBOOK-IMPORT-01 | render | 正常系 | [初期画面に保存先選択を表示しない](./import.md#storybook-import-01) |
| STORYBOOK-IMPORT-02 | interaction | 正常系 | [CSV を読み込んでプレビューする](./import.md#storybook-import-02) |
| STORYBOOK-IMPORT-03 | render | 異常系 | [日本語の診断と無効な確定操作を表示する](./import.md#storybook-import-03) |
| STORYBOOK-IMPORT-04 | interaction | 異常系 | [プレビュー失敗を安全な日本語にする](./import.md#storybook-import-04) |
| STORYBOOK-IMPORT-05 | interaction | 異常系 | [診断を翻訳しユーザー入力は保持する](./import.md#storybook-import-05) |
| STORYBOOK-IMPORT-06 | interaction | 正常系 | [形式の説明を必要なときだけ開く](./import.md#storybook-import-06) |
| STORYBOOK-IMPORT-07 | render | 正常系 | [処理中の選択を無効にする](./import.md#storybook-import-07) |
| STORYBOOK-IMPORT-08 | interaction | 正常系 | [各サンプルの操作を要求する](./import.md#storybook-import-08) |
| STORYBOOK-IMPORT-09 | interaction | 正常系 | [レビュー後もファイルを選び直せる](./import.md#storybook-import-09) |
| STORYBOOK-IMPORT-10 | interaction | 正常系 | [内容確認だけでは保存を要求しない](./import.md#storybook-import-10) |
| STORYBOOK-IMPORT-11 | render | 異常系 | [一部の行が不正なら確定を止める](./import.md#storybook-import-11) |
| STORYBOOK-IMPORT-12 | render | 異常系 | [準備失敗後も選び直せる](./import.md#storybook-import-12) |
| STORYBOOK-STUDY-CONTROLS-01 | interaction | 正常系 | [再生を要求して一時停止表示にする](./study-controls.md#storybook-study-controls-01) |
| STORYBOOK-STUDY-CONTROLS-02 | interaction | 正常系 | [スキップを要求する](./study-controls.md#storybook-study-controls-02) |
| STORYBOOK-STUDY-CONTROLS-03 | interaction | 正常系 | [Enter で再生を要求する](./study-controls.md#storybook-study-controls-03) |
| STORYBOOK-STUDY-CONTROLS-04 | interaction | 正常系 | [スライダーで表示位置を要求する](./study-controls.md#storybook-study-controls-04) |
| STORYBOOK-STUDY-CONTROLS-05 | interaction | 正常系 | [無効な方向を Tab 移動から除く](./study-controls.md#storybook-study-controls-05) |
| STORYBOOK-STUDY-CONTROLS-06 | interaction | 正常系 | [Enter で方向操作を要求する](./study-controls.md#storybook-study-controls-06) |
| STORYBOOK-STUDY-CONTROLS-07 | interaction | 正常系 | [ヘルプをモーダルとして開く](./study-controls.md#storybook-study-controls-07) |
| STORYBOOK-STUDY-CONTROLS-08 | interaction | 正常系 | [ヘルプ内にフォーカスを保ち Escape で戻る](./study-controls.md#storybook-study-controls-08) |
| STORYBOOK-STUDY-CONTROLS-09 | interaction | 正常系 | [背景の通知を操作させない](./study-controls.md#storybook-study-controls-09) |
| STORYBOOK-STUDY-CONTROLS-10 | interaction | 正常系 | [ヘルプを閉じて通知の操作を戻す](./study-controls.md#storybook-study-controls-10) |
| STORYBOOK-CARD-PLAYER-01 | interaction | 正常系 | [読書ジェスチャーを学習操作にしない](./card-player.md#storybook-card-player-01) |
| STORYBOOK-CARD-PLAYER-02 | interaction | 正常系 | [文字選択中に閲覧を終了しない](./card-player.md#storybook-card-player-02) |
| STORYBOOK-CARD-PLAYER-03 | interaction | 正常系 | [Space とタップを区別する](./card-player.md#storybook-card-player-03) |
| STORYBOOK-CARD-PLAYER-04 | interaction | 正常系 | [閲覧設定で裏面の許可済み操作を変えない](./card-player.md#storybook-card-player-04) |
| STORYBOOK-CARD-PLAYER-05 | interaction | 正常系 | [編集リンクの表示を切り替える](./card-player.md#storybook-card-player-05) |
| STORYBOOK-CARD-PLAYER-06 | render | 正常系 | [裏面と編集非対応画面に編集操作を出さない](./card-player.md#storybook-card-player-06) |
| STORYBOOK-CARD-PLAYER-07 | render | 正常系 | [裏面では解答に集中できる表示にする](./card-player.md#storybook-card-player-07) |
| STORYBOOK-CARD-PLAYER-08 | interaction | 正常系 | [端の操作と解答クリックを分離する](./card-player.md#storybook-card-player-08) |
| STORYBOOK-CARD-PLAYER-09 | interaction | 正常系 | [端のホイール入力をスクロールへ渡す](./card-player.md#storybook-card-player-09) |
| STORYBOOK-CARD-PLAYER-10 | interaction | 正常系 | [操作一覧から各操作を要求する](./card-player.md#storybook-card-player-10) |
| STORYBOOK-CARD-PLAYER-11 | interaction | 正常系 | [ヘルプの再表示操作を失わない](./card-player.md#storybook-card-player-11) |
| STORYBOOK-CARD-PLAYER-12 | interaction | 正常系 | [閲覧モードの状態をボタンで示す](./card-player.md#storybook-card-player-12) |
| STORYBOOK-CARD-PLAYER-13 | interaction | 正常系 | [閲覧モードとボタン表示を区別する](./card-player.md#storybook-card-player-13) |
| STORYBOOK-CARD-PLAYER-14 | interaction | 正常系 | [表示設定に従ってショートカットを組み合わせる](./card-player.md#storybook-card-player-14) |
| STORYBOOK-CARD-PLAYER-15 | interaction | 正常系 | [詳細表示をまとめて切り替える](./card-player.md#storybook-card-player-15) |
| STORYBOOK-CARD-PLAYER-16 | interaction | 正常系 | [再生設定が使えない理由を確認できる](./card-player.md#storybook-card-player-16) |
| STORYBOOK-CARD-PLAYER-17 | render | 正常系 | [選択した下部操作だけを表示する](./card-player.md#storybook-card-player-17) |
| STORYBOOK-CARD-PLAYER-18 | interaction | 正常系 | [未許可の裏面スワイプを無視する](./card-player.md#storybook-card-player-18) |
| STORYBOOK-CARD-PLAYER-19 | interaction | 正常系 | [表面スワイプをボタン表示と独立して扱う](./card-player.md#storybook-card-player-19) |
| STORYBOOK-CARD-PLAYER-20 | interaction | 正常系 | [ドラッグをクリックとして重複処理しない](./card-player.md#storybook-card-player-20) |
| STORYBOOK-CARD-PLAYER-21 | interaction | 正常系 | [中・右ボタンのドラッグを無視する](./card-player.md#storybook-card-player-21) |
| STORYBOOK-CARD-PLAYER-22 | interaction | 正常系 | [裏面のドラッグ後に誤操作しない](./card-player.md#storybook-card-player-22) |
| STORYBOOK-CARD-PLAYER-23 | render | 正常系 | [未評価と FSRS 難易度を区別する](./card-player.md#storybook-card-player-23) |
| STORYBOOK-STUDY-HISTORY-01 | interaction | 正常系 | [プリセットの選択要求を通知する](./study-history.md#storybook-study-history-01) |
| STORYBOOK-STUDY-HISTORY-02 | interaction | 正常系 | [任意期間の入力欄を開く](./study-history.md#storybook-study-history-02) |
| STORYBOOK-STUDY-HISTORY-03 | interaction | 正常系 | [折りたたんだ日別表を30日単位で開く](./study-history.md#storybook-study-history-03) |
| STORYBOOK-STUDY-HISTORY-04 | interaction | 正常系 | [日別表の古い日付のページへ進む](./study-history.md#storybook-study-history-04) |
| STORYBOOK-STUDY-HISTORY-05 | render | 正常系 | [最近のセッションの終了状態を区別する](./study-history.md#storybook-study-history-05) |
| STORYBOOK-STUDY-HISTORY-06 | render | 正常系 | [最近のセッションの状態を日本語で表示する](./study-history.md#storybook-study-history-06) |
| STORYBOOK-STUDY-HISTORY-07 | interaction | 正常系 | [最近のセッションを全件展開する](./study-history.md#storybook-study-history-07) |
| STORYBOOK-STUDY-HISTORY-08 | render | 正常系 | [30日分の集計グラフを表示する](./study-history.md#storybook-study-history-08) |
| STORYBOOK-STUDY-HISTORY-09 | render | 正常系 | [90日分のグラフに集約単位を表示する](./study-history.md#storybook-study-history-09) |
| STORYBOOK-SETTINGS-01 | render | 正常系 | [設定を日本語で表示する](./settings.md#storybook-settings-01) |
| STORYBOOK-SETTINGS-02 | interaction | 正常系 | [再生操作の表示設定を切り替える](./settings.md#storybook-settings-02) |
| STORYBOOK-SETTINGS-03 | interaction | 正常系 | [セクション内のスイッチ変更を通知する](./settings.md#storybook-settings-03) |
| STORYBOOK-SETTINGS-04 | render | 正常系 | [設定とアカウント操作を分離する](./settings.md#storybook-settings-04) |
| STORYBOOK-SETTINGS-05 | interaction | 正常系 | [入力変更を表示に反映する](./settings.md#storybook-settings-05) |
| STORYBOOK-SETTINGS-06 | render | 正常系 | [復習説明とバージョン情報を表示する](./settings.md#storybook-settings-06) |
| STORYBOOK-SETTINGS-07 | render | 正常系 | [ラベルと説明を対応する UI に関連付ける](./settings.md#storybook-settings-07) |
| STORYBOOK-SETTINGS-08 | render | 正常系 | [日本語の操作名と読み上げ値を表示する](./settings.md#storybook-settings-08) |
| STORYBOOK-SETTINGS-09 | interaction | 正常系 | [最大カード数0を全件として説明する](./settings.md#storybook-settings-09) |
| STORYBOOK-SETTINGS-10 | interaction | 正常系 | [再生間隔の境界値を説明する](./settings.md#storybook-settings-10) |
| STORYBOOK-SETTINGS-11 | interaction | 正常系 | [ショートカットでホームへ戻る](./settings.md#storybook-settings-11) |
| STORYBOOK-ACCOUNT-01 | interaction | 正常系 | [匿名アカウントからログインを要求する](./account.md#storybook-account-01) |
| STORYBOOK-ACCOUNT-02 | interaction | 正常系 | [ログアウトを要求する](./account.md#storybook-account-02) |
| STORYBOOK-ACCOUNT-03 | render | 正常系 | [ログイン待機中の操作を無効にする](./account.md#storybook-account-03) |
| STORYBOOK-ACCOUNT-04 | render | 正常系 | [ログアウト待機中の操作を無効にする](./account.md#storybook-account-04) |
| STORYBOOK-ACCOUNT-05 | render | 正常系 | [日本語の画面を表示する](./account.md#storybook-account-05) |
| STORYBOOK-ACCOUNT-06 | render | 正常系 | [認証状態と UID を表示する](./account.md#storybook-account-06) |
| STORYBOOK-ACCOUNT-07 | interaction | 正常系 | [先行操作の完了で別操作の待機を解除しない](./account.md#storybook-account-07) |
| STORYBOOK-ACCOUNT-08 | interaction | 正常系 | [言語変更でプロフィール値を変えない](./account.md#storybook-account-08) |
| STORYBOOK-ACCOUNT-09 | interaction | 正常系 | [ショートカットでホームへ戻る](./account.md#storybook-account-09) |
| STORYBOOK-ACCOUNT-10 | interaction | 異常系 | [認証失敗後に再試行する](./account.md#storybook-account-10) |
| STORYBOOK-ACCOUNT-11 | interaction | 異常系 | [表示済みの通知を画面離脱だけで消さない](./account.md#storybook-account-11) |
| STORYBOOK-ACCOUNT-12 | interaction | 異常系 | [画面離脱後に届く失敗も通知する](./account.md#storybook-account-12) |
| STORYBOOK-ACCOUNT-13 | interaction | 正常系 | [日本語で認証結果を通知する](./account.md#storybook-account-13) |
| STORYBOOK-ACCOUNT-14 | interaction | 正常系 / 異常系 | [画面へ戻っても待機状態を保つ](./account.md#storybook-account-14) |

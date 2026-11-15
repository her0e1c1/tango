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
| STORYBOOK-DECK-LIST-27 | interaction | 正常系 | [識別子を取り違えず名前から Card 一覧へ進む](./deck-list.md#storybook-deck-list-27) |
| STORYBOOK-DECK-LIST-28 | interaction | 正常系 | [読み込み済みの全 Deck の件数と集計条件を説明する](./deck-list.md#storybook-deck-list-28) |
| STORYBOOK-DECK-LIST-29 | interaction | 正常系 | [復習期日の到来で件数と並び順を更新する](./deck-list.md#storybook-deck-list-29) |
| STORYBOOK-DECK-LIST-30 | interaction | 正常系 | [追加メニューを各入力方法で閉じてフォーカスを戻す](./deck-list.md#storybook-deck-list-30) |
| STORYBOOK-DECK-LIST-31 | interaction | 正常系 | [学習状態で区分した Deck を各表示条件で操作できる](./deck-list.md#storybook-deck-list-31) |
| STORYBOOK-DECK-LIST-32 | render | 正常系 | [学習状態と復習期日を基準に Deck を並べる](./deck-list.md#storybook-deck-list-32) |
| STORYBOOK-DECK-LIST-33 | interaction | 正常系 | [0件の理由を同期完了や学習完了と区別する](./deck-list.md#storybook-deck-list-33) |
| STORYBOOK-DECK-LIST-34 | render | 正常系 | [間隔反復が無効なら件数を隠して操作を維持する](./deck-list.md#storybook-deck-list-34) |
| STORYBOOK-DECK-LIST-35 | interaction | 正常系 | [状態の変化と画面復帰に現在の復習件数を反映する](./deck-list.md#storybook-deck-list-35) |
| STORYBOOK-DECK-LIST-36 | interaction | 正常系 | [空の一覧の追加メニューから作成とインポートを選ぶ](./deck-list.md#storybook-deck-list-36) |
| STORYBOOK-DECK-LIST-37 | interaction | 正常系 | [複数 Deck の既存学習を作り直さず個別に再開する](./deck-list.md#storybook-deck-list-37) |
| STORYBOOK-DECK-LIST-38 | interaction | 正常系 | [Continue の待機中は全 Deck の再開を重ねない](./deck-list.md#storybook-deck-list-38) |
| STORYBOOK-DECK-LIST-39 | interaction | 異常系 | [Continue の失敗を通知し別 Deck で再試行する](./deck-list.md#storybook-deck-list-39) |
| STORYBOOK-DECK-LIST-40 | interaction | 正常系 | [長い Deck 名の削除確認を読んで取り消す](./deck-list.md#storybook-deck-list-40) |
| STORYBOOK-DECK-LIST-41 | interaction | 正常系 | [削除の成功を通知して対象の利用を終了する](./deck-list.md#storybook-deck-list-41) |
| STORYBOOK-DECK-LIST-42 | interaction | 異常系 | [削除失敗後に確認を開き直して再試行する](./deck-list.md#storybook-deck-list-42) |
| STORYBOOK-DECK-LIST-43 | interaction | 異常系 | [学習終了の後処理が失敗しても削除成功を取り消さない](./deck-list.md#storybook-deck-list-43) |
| STORYBOOK-DECK-LIST-44 | interaction | 正常系 | [対象 Deck の内容を CSV 出力へ引き渡す](./deck-list.md#storybook-deck-list-44) |
| STORYBOOK-DECK-LIST-45 | interaction | 正常系 | [自動追加した Sample Deck を画面復帰で重複させない](./deck-list.md#storybook-deck-list-45) |
| STORYBOOK-DECK-LIST-46 | interaction | 正常系 | [Continue の古い完了で離脱先や別アカウントから遷移しない](./deck-list.md#storybook-deck-list-46) |
| STORYBOOK-DECK-LIST-47 | interaction | 正常系 | [時計がずれても終了済みの学習を再開しない](./deck-list.md#storybook-deck-list-47) |
| STORYBOOK-DECK-LIST-48 | interaction | 異常系 | [読取不能な過去の学習を現在の再開対象へ混ぜない](./deck-list.md#storybook-deck-list-48) |
| STORYBOOK-DECK-LIST-49 | interaction | 正常系 | [一覧のショートカットで設定とインポートへ進む](./deck-list.md#storybook-deck-list-49) |
| STORYBOOK-DECK-LIST-50 | interaction | 正常系 | [復習と新規の操作では学習をまだ作り直さない](./deck-list.md#storybook-deck-list-50) |

## Deck 作成画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-DECK-FORM-01 | interaction | 正常系 | [名前とカテゴリを入力する](./deck-create.md#storybook-deck-form-01) |
| STORYBOOK-DECK-FORM-02 | render | 正常系 | [効果のない改行変換設定を表示しない](./deck-create.md#storybook-deck-form-02) |
| STORYBOOK-DECK-CREATE-01 | interaction | 正常系 | [作成の成功後に新しい Deck を確認する](./deck-create.md#storybook-deck-create-01) |
| STORYBOOK-DECK-CREATE-02 | interaction | 異常系 | [作成に失敗しても入力を保持する](./deck-create.md#storybook-deck-create-02) |
| STORYBOOK-DECK-CREATE-03 | interaction | 異常系 | [空欄と空白のみの名前に現在の言語でエラーを表示する](./deck-create.md#storybook-deck-create-03) |
| STORYBOOK-DECK-CREATE-04 | interaction | 異常系 | [表示中の名前エラーを言語変更に追従させる](./deck-create.md#storybook-deck-create-04) |
| STORYBOOK-DECK-CREATE-05 | interaction | 正常系 | [各認証状態で空の Deck の作成結果を表示する](./deck-create.md#storybook-deck-create-05) |
| STORYBOOK-DECK-CREATE-06 | interaction | 異常系 | [作成結果を待ってから失敗を通知する](./deck-create.md#storybook-deck-create-06) |

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
| STORYBOOK-DECK-EDIT-06 | interaction | 正常系 | [通知が変わっても未保存の Deck 編集を続ける](./deck-edit.md#storybook-deck-edit-06) |
| STORYBOOK-DECK-EDIT-07 | interaction | 正常系 | [編集を続けた後の再離脱で変更を破棄する](./deck-edit.md#storybook-deck-edit-07) |
| STORYBOOK-DECK-EDIT-08 | interaction | 正常系 | [表示形式と名前の変更を反映し非編集の内容を保つ](./deck-edit.md#storybook-deck-edit-08) |

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
| STORYBOOK-DECK-IMPORT-01 | interaction | 正常系 | [ファイル選択へキーボードで移動し保存前にプレビューする](./deck-import.md#storybook-deck-import-01) |
| STORYBOOK-DECK-IMPORT-02 | interaction | 正常系 | [選択を取り消してもプレビューと診断を保持する](./deck-import.md#storybook-deck-import-02) |
| STORYBOOK-DECK-IMPORT-03 | interaction | 正常系 | [4種類の例の全内容を CSV で出力する](./deck-import.md#storybook-deck-import-03) |
| STORYBOOK-DECK-IMPORT-04 | interaction | 正常系 | [4種類の例を追加確定前に保存しない](./deck-import.md#storybook-deck-import-04) |
| STORYBOOK-DECK-IMPORT-05 | interaction | 正常系 | [CSV と各例の追加成功を件数と一覧へ反映する](./deck-import.md#storybook-deck-import-05) |
| STORYBOOK-DECK-IMPORT-06 | interaction | 正常系 | [新たに選んだ同名の CSV や例を別の Deck として追加する](./deck-import.md#storybook-deck-import-06) |
| STORYBOOK-DECK-IMPORT-07 | interaction | 正常系 | [アカウント変更後に以前の選択を追加できない](./deck-import.md#storybook-deck-import-07) |
| STORYBOOK-DECK-IMPORT-08 | interaction | 異常系 | [不正な UTF-8 を拒否し同名の修正ファイルを再検証する](./deck-import.md#storybook-deck-import-08) |
| STORYBOOK-DECK-IMPORT-09 | interaction | 異常系 | [複数行 CSV の診断を論理レコードと元列値で示す](./deck-import.md#storybook-deck-import-09) |
| STORYBOOK-DECK-IMPORT-10 | interaction | 異常系 | [引用符エラーに論理レコード番号と元列値を示す](./deck-import.md#storybook-deck-import-10) |
| STORYBOOK-DECK-IMPORT-11 | interaction | 異常系 | [空白だけの CSV をファイル全体のエラーにする](./deck-import.md#storybook-deck-import-11) |
| STORYBOOK-DECK-IMPORT-12 | interaction | 異常系 | [保存失敗後に同じプレビューで再試行する](./deck-import.md#storybook-deck-import-12) |
| STORYBOOK-DECK-IMPORT-13 | interaction | 異常系 | [不正な必須列の CSV 全体を追加不可にする](./deck-import.md#storybook-deck-import-13) |
| STORYBOOK-DECK-IMPORT-14 | interaction | 異常系 | [System 言語変更でも CSV の診断と入力を保持する](./deck-import.md#storybook-deck-import-14) |
| STORYBOOK-DECK-IMPORT-15 | interaction | 正常系 | [System 言語変更でも有効な CSV の選択を保つ](./deck-import.md#storybook-deck-import-15) |
| STORYBOOK-DECK-IMPORT-16 | interaction | 異常系 | [System 言語変更でも再試行内容と通知期限を保つ](./deck-import.md#storybook-deck-import-16) |
| STORYBOOK-DECK-IMPORT-17 | interaction | 正常系 | [取り込み中の離脱と再入場でも競合操作と古い遷移を防ぐ](./deck-import.md#storybook-deck-import-17) |

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
| STORYBOOK-CARD-LIST-23 | interaction | 正常系 | [開いた時点の解答を開き直すまで保持する](./card-list.md#storybook-card-list-23) |
| STORYBOOK-CARD-LIST-24 | interaction | 正常系 | [起点の Card が消えた後は並び順へ戻る](./card-list.md#storybook-card-list-24) |
| STORYBOOK-CARD-LIST-25 | interaction | 正常系 | [解答プレビュー中も通知を確認できる](./card-list.md#storybook-card-list-25) |
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
| STORYBOOK-CARD-LIST-26 | interaction | 正常系 | [Card を追加が新しい順に表示できる](./card-list.md#storybook-card-list-26) |
| STORYBOOK-CARD-LIST-27 | interaction | 正常系 | [Card の表示順を標準へ戻せる](./card-list.md#storybook-card-list-27) |
| STORYBOOK-CARD-LIST-28 | interaction | 正常系 | [並び替え後も選択した Card のプレビューと行操作を利用できる](./card-list.md#storybook-card-list-28) |
| STORYBOOK-CARD-LIST-29 | interaction | 正常系 | [別 Card の変更後も行のフォーカスとメニューを維持できる](./card-list.md#storybook-card-list-29) |
| STORYBOOK-CARD-LIST-30 | interaction | 正常系 | [フィルター保存中も並び替えでき、禁止中の操作は実行できない](./card-list.md#storybook-card-list-30) |
| STORYBOOK-CARD-LIST-31 | interaction | 正常系 | [画面を離れるか Deck を変更すると並び順が標準に戻る](./card-list.md#storybook-card-list-31) |
| STORYBOOK-CARD-LIST-32 | interaction | 正常系 | [フィルター保存中に変更しても最後の選択を維持できる](./card-list.md#storybook-card-list-32) |
| STORYBOOK-CARD-LIST-33 | interaction | 正常系 | [言語やフィルターを変更しても並び順を保持できる](./card-list.md#storybook-card-list-33) |
| STORYBOOK-CARD-LIST-34 | interaction | 異常系 | [フィルター保存失敗後も選択を維持して次の変更を保存できる](./card-list.md#storybook-card-list-34) |
| STORYBOOK-CARD-LIST-35 | interaction | 正常系 | [Card の解答プレビューを開ける](./card-list.md#storybook-card-list-35) |
| STORYBOOK-CARD-LIST-36 | interaction | 正常系 | [Card の解答プレビューを閉じて一覧へ戻れる](./card-list.md#storybook-card-list-36) |
| STORYBOOK-CARD-LIST-37 | interaction | 正常系 | [解答の文章を選択できる](./card-list.md#storybook-card-list-37) |
| STORYBOOK-CARD-LIST-38 | interaction | 正常系 | [解答のリンクと脚注をたどれる](./card-list.md#storybook-card-list-38) |
| STORYBOOK-CARD-LIST-39 | interaction | 正常系 | [解答の本文をキーボードで縦にスクロールできる](./card-list.md#storybook-card-list-39) |
| STORYBOOK-CARD-LIST-40 | interaction | 正常系 | [解答のコードをキーボードで横にスクロールできる](./card-list.md#storybook-card-list-40) |
| STORYBOOK-CARD-LIST-41 | interaction | 正常系 | [解答の数式をキーボードで横にスクロールできる](./card-list.md#storybook-card-list-41) |
| STORYBOOK-CARD-LIST-42 | render | 正常系 | [Card 一覧に学習情報を表示できる](./card-list.md#storybook-card-list-42) |
| STORYBOOK-CARD-LIST-43 | interaction | 異常系 | [存在しない Deck から復帰できる](./card-list.md#storybook-card-list-43) |
| STORYBOOK-CARD-LIST-44 | interaction | 正常系 | [Card の削除を取り消せる](./card-list.md#storybook-card-list-44) |
| STORYBOOK-CARD-LIST-45 | interaction | 正常系 | [削除成功の応答後に一覧を更新する](./card-list.md#storybook-card-list-45) |
| STORYBOOK-CARD-LIST-46 | interaction | 異常系 | [削除失敗の応答後に同じ Card を再試行する](./card-list.md#storybook-card-list-46) |
| STORYBOOK-CARD-LIST-47 | interaction | 異常系 | [読めない Card の件数と結果の回復を表示する](./card-list.md#storybook-card-list-47) |
| STORYBOOK-CARD-LIST-48 | interaction | 正常系 | [Card 一覧からキーボードで画面を移る](./card-list.md#storybook-card-list-48) |
| STORYBOOK-CARD-LIST-49 | interaction | 正常系 | [フィルター不一致の0件から条件を確認して変更する](./card-list.md#storybook-card-list-49) |
| STORYBOOK-CARD-LIST-50 | render | 正常系 | [同じ Deck のタグだけを重複なく候補にする](./card-list.md#storybook-card-list-50) |

## Card 作成画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-FORM-05 | interaction | 正常系 | [入力した両面で Card を作成する](./card-create.md#storybook-card-form-05) |
| STORYBOOK-CARD-FORM-17 | interaction | 正常系 | [作成成功を画面で通知する](./card-create.md#storybook-card-form-17) |
| STORYBOOK-CARD-FORM-18 | interaction | 異常系 | [作成失敗後に入力を保って再試行する](./card-create.md#storybook-card-form-18) |
| STORYBOOK-CARD-FORM-19 | interaction | 正常系 | [作成中の連続操作を抑止する](./card-create.md#storybook-card-form-19) |
| STORYBOOK-CARD-CREATE-01 | interaction | 異常系 | [未入力のまま Card を作成しない](./card-create.md#storybook-card-create-01) |
| STORYBOOK-CARD-CREATE-02 | interaction | 正常系 | [下書きを保存せず解答を確認する](./card-create.md#storybook-card-create-02) |
| STORYBOOK-CARD-CREATE-03 | interaction | 正常系 | [未保存の Card 作成内容の離脱を確認できる](./card-create.md#storybook-card-create-03) |
| STORYBOOK-CARD-CREATE-04 | interaction | 正常系 | [未変更の Card 作成画面は確認なしで取り消せる](./card-create.md#storybook-card-create-04) |
| STORYBOOK-CARD-CREATE-05 | interaction | 正常系 | [作成中の未保存の解答をプレビューできる](./card-create.md#storybook-card-create-05) |
| STORYBOOK-CARD-CREATE-06 | interaction | 正常系 | [狭い画面で両面とタグを入力して作成する](./card-create.md#storybook-card-create-06) |
| STORYBOOK-CARD-CREATE-07 | interaction | 正常系 | [長い Card 本文の作成通知を狭い画面で閉じる](./card-create.md#storybook-card-create-07) |
| STORYBOOK-CARD-CREATE-08 | interaction | 正常系 | [作成成功の応答で未回答の離脱確認を閉じる](./card-create.md#storybook-card-create-08) |
| STORYBOOK-CARD-CREATE-09 | interaction | 正常系 | [作成中の離脱後に遅い成功で画面を戻さない](./card-create.md#storybook-card-create-09) |
| STORYBOOK-CARD-CREATE-10 | interaction | 異常系 | [作成失敗の応答後も離脱確認と入力を保持する](./card-create.md#storybook-card-create-10) |
| STORYBOOK-CARD-CREATE-11 | interaction | 異常系 | [作成画面の離脱後に失敗の応答を通知する](./card-create.md#storybook-card-create-11) |
| STORYBOOK-CARD-CREATE-12 | interaction | 正常系 | [Card 作成で所属 Deck のタグを選択し新規タグを追加できる](./card-create.md#storybook-card-create-12) |

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
| STORYBOOK-CARD-EDIT-03 | interaction | 正常系 | [未保存の Card 編集内容を離脱前に確認できる](./card-edit.md#storybook-card-edit-03) |
| STORYBOOK-CARD-EDIT-04 | interaction | 正常系 | [編集中の未保存の解答と表示形式をプレビューできる](./card-edit.md#storybook-card-edit-04) |
| STORYBOOK-CARD-EDIT-05 | interaction | 正常系 | [Card のタグ候補を選んで下書きへ反映できる](./card-edit.md#storybook-card-edit-05) |
| STORYBOOK-CARD-EDIT-06 | interaction | 正常系 | [タグ入力中の Enter は Card を送信せず下書きを保つ](./card-edit.md#storybook-card-edit-06) |
| STORYBOOK-CARD-EDIT-07 | interaction | 正常系 | [入力直後の候補クリックで対象タグだけを解除する](./card-edit.md#storybook-card-edit-07) |
| STORYBOOK-CARD-EDIT-08 | interaction | 正常系 | [タグ名の前後空白だけを除いて選択順に保存する](./card-edit.md#storybook-card-edit-08) |
| STORYBOOK-CARD-EDIT-09 | interaction | 正常系 | [編集成功の応答後に対象 Card の内容を確認する](./card-edit.md#storybook-card-edit-09) |
| STORYBOOK-CARD-EDIT-10 | interaction | 正常系 | [Card 編集画面の離脱後に保存が完了しても現在の画面を維持する](./card-edit.md#storybook-card-edit-10) |
| STORYBOOK-CARD-EDIT-11 | interaction | 正常系 | [ログアウトを中止して元のアカウントへ戻っても Card の保存成功を通知する](./card-edit.md#storybook-card-edit-11) |
| STORYBOOK-CARD-EDIT-12 | interaction | 正常系 | [保存待ち中に所属 Deck を削除した Card の古い成功を通知しない](./card-edit.md#storybook-card-edit-12) |
| STORYBOOK-CARD-EDIT-13 | interaction | 異常系 | [認証確認中の Card 保存失敗を元のアカウントへの復帰後に通知する](./card-edit.md#storybook-card-edit-13) |
| STORYBOOK-CARD-EDIT-14 | interaction | 正常系 | [通知の表示が変化しても Card の離脱確認を操作できる](./card-edit.md#storybook-card-edit-14) |
| STORYBOOK-CARD-EDIT-15 | interaction | 正常系 | [Card の編集保存中は重ねて操作できない](./card-edit.md#storybook-card-edit-15) |
| STORYBOOK-CARD-EDIT-16 | interaction | 異常系 | [Card の未表示の面にある入力エラーを修正できる](./card-edit.md#storybook-card-edit-16) |
| STORYBOOK-CARD-EDIT-17 | interaction | 正常系 | [未保存のタグ変更を破棄する](./card-edit.md#storybook-card-edit-17) |
| STORYBOOK-CARD-EDIT-18 | interaction | 異常系 | [System の言語変更後も検証エラーと未保存の入力を保つ](./card-edit.md#storybook-card-edit-18) |
| STORYBOOK-CARD-EDIT-19 | interaction | 異常系 | [読めない Card の編集リンクから警告を維持して戻る](./card-edit.md#storybook-card-edit-19) |

## Card 閲覧画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-CARD-VIEW-01 | interaction | 正常系 | [指定した Card の両面を読む](./card-view.md#storybook-card-view-01) |
| STORYBOOK-CARD-VIEW-02 | interaction | 正常系 | [表示している Card を編集する](./card-view.md#storybook-card-view-02) |
| STORYBOOK-CARD-VIEW-03 | render | 異常系 | [存在しない Card を案内する](./card-view.md#storybook-card-view-03) |
| STORYBOOK-CARD-VIEW-04 | interaction | 正常系 | [Card 閲覧画面を直接開ける](./card-view.md#storybook-card-view-04) |
| STORYBOOK-CARD-VIEW-05 | interaction | 正常系 | [Card の閲覧 URL の変更に表示が追従する](./card-view.md#storybook-card-view-05) |
| STORYBOOK-CARD-VIEW-06 | render | 正常系 | [未評価の Card に推定した記憶状態を表示しない](./card-view.md#storybook-card-view-06) |
| STORYBOOK-CARD-VIEW-07 | interaction | 正常系 | [Card の切り替え・再表示で記憶状態を更新する](./card-view.md#storybook-card-view-07) |
| STORYBOOK-CARD-VIEW-08 | interaction | 正常系 | [評価済み Card の記憶状態を現在の基準時刻で表示する](./card-view.md#storybook-card-view-08) |
| STORYBOOK-CARD-VIEW-09 | interaction | 異常系 | [利用できない Card のリンクから警告を保って戻る](./card-view.md#storybook-card-view-09) |
| STORYBOOK-CARD-VIEW-10 | interaction | 異常系 | [存在しない Card から復帰できる](./card-view.md#storybook-card-view-10) |
| STORYBOOK-CARD-VIEW-11 | render | 異常系 | [読み込めない記憶状態を未評価として表示しない](./card-view.md#storybook-card-view-11) |

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
| STORYBOOK-DECK-VIEW-04 | interaction | 正常系 | [閲覧条件を学習条件と Deck ごとに分離する](./deck-view.md#storybook-deck-view-04) |
| STORYBOOK-DECK-VIEW-05 | interaction | 正常系 | [タグと一致条件による同じ閲覧対象を確認する](./deck-view.md#storybook-deck-view-05) |
| STORYBOOK-DECK-VIEW-06 | interaction | 正常系 | [Card 未登録の Deck 閲覧から Deck 一覧へ戻れる](./deck-view.md#storybook-deck-view-06) |
| STORYBOOK-DECK-VIEW-07 | interaction | 正常系 | [フィルター解除の応答後に一覧と閲覧を全件へ戻す](./deck-view.md#storybook-deck-view-07) |
| STORYBOOK-DECK-VIEW-08 | interaction | 異常系 | [全 Card を読めない Deck から警告を維持して戻る](./deck-view.md#storybook-deck-view-08) |
| STORYBOOK-DECK-VIEW-09 | interaction | 正常系 | [閲覧を先頭の表面から開始し端を越えると一覧へ戻る](./deck-view.md#storybook-deck-view-09) |
| STORYBOOK-DECK-VIEW-10 | interaction | 正常系 | [学習の条件に制限されず全 Card を標準順で閲覧する](./deck-view.md#storybook-deck-view-10) |
| STORYBOOK-DECK-VIEW-11 | interaction | 異常系 | [利用できない Deck の閲覧を終了する](./deck-view.md#storybook-deck-view-11) |
| STORYBOOK-DECK-VIEW-12 | interaction | 正常系 | [一枚の長い解答をタッチで読み左右の端から退出する](./deck-view.md#storybook-deck-view-12) |
| STORYBOOK-DECK-VIEW-13 | interaction | 正常系 | [閲覧の再生を明示的に開始して停止と再開を操作する](./deck-view.md#storybook-deck-view-13) |
| STORYBOOK-DECK-VIEW-14 | interaction | 正常系 | [進捗スライダーの標準操作で閲覧位置を選ぶ](./deck-view.md#storybook-deck-view-14) |
| STORYBOOK-DECK-VIEW-15 | interaction | 正常系 | [閲覧の解答に含まれるリンクと入力部品を操作する](./deck-view.md#storybook-deck-view-15) |
| STORYBOOK-DECK-VIEW-16 | interaction | 正常系 | [閲覧の上下キーと上下ドラッグを無効にする](./deck-view.md#storybook-deck-view-16) |
| STORYBOOK-DECK-VIEW-17 | interaction | 正常系 | [閲覧ヘルプを閉じて起動元へ戻る](./deck-view.md#storybook-deck-view-17) |
| STORYBOOK-DECK-VIEW-18 | interaction | 正常系 | [現在の閲覧 Card を編集リンクで開く](./deck-view.md#storybook-deck-view-18) |
| STORYBOOK-DECK-VIEW-19 | interaction | 正常系 | [間隔0の閲覧では再生を開始しない](./deck-view.md#storybook-deck-view-19) |
| STORYBOOK-DECK-VIEW-20 | interaction | 正常系 | [ヘルプの表示中は閲覧の自動送りを止める](./deck-view.md#storybook-deck-view-20) |
| STORYBOOK-DECK-VIEW-21 | interaction | 正常系 | [閲覧モードを保ってボタンまたは自動送りで次へ進む](./deck-view.md#storybook-deck-view-21) |
| STORYBOOK-DECK-VIEW-22 | interaction | 正常系 | [閲覧の表示設定を学習と共有する](./deck-view.md#storybook-deck-view-22) |
| STORYBOOK-DECK-VIEW-23 | interaction | 正常系 | [閲覧モードで長い表面を読み Card 移動を防ぐ](./deck-view.md#storybook-deck-view-23) |
| STORYBOOK-DECK-VIEW-24 | interaction | 正常系 | [閲覧モードを終了して通常の表裏操作へ戻る](./deck-view.md#storybook-deck-view-24) |
| STORYBOOK-DECK-VIEW-25 | interaction | 正常系 | [閲覧のショートカットとフォーカス対象の標準操作を分ける](./deck-view.md#storybook-deck-view-25) |

## 学習開始画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-SESSION-START-01 | interaction | 正常系 | [学習を開始する](./study-session-start.md#storybook-study-session-start-01) |
| STORYBOOK-STUDY-SESSION-START-02 | render | 正常系 | [対象がない場合に理由を示す](./study-session-start.md#storybook-study-session-start-02) |
| STORYBOOK-STUDY-SESSION-START-03 | interaction | 異常系 | [開始に失敗した場合に復旧できる](./study-session-start.md#storybook-study-session-start-03) |
| STORYBOOK-STUDY-SESSION-START-04 | interaction | 正常系 | [学習タグと上限を開始対象へ反映する](./study-session-start.md#storybook-study-session-start-04) |
| STORYBOOK-STUDY-SESSION-START-05 | interaction | 正常系 | [開始操作時点の Card・設定・時刻で選び直す](./study-session-start.md#storybook-study-session-start-05) |
| STORYBOOK-STUDY-SESSION-START-06 | interaction | 正常系 | [復習期限・シャッフル・上限で出題を選ぶ](./study-session-start.md#storybook-study-session-start-06) |
| STORYBOOK-STUDY-SESSION-START-07 | interaction | 正常系 | [期限・画面復帰・状態変更で件数を更新する](./study-session-start.md#storybook-study-session-start-07) |
| STORYBOOK-STUDY-SESSION-START-08 | interaction | 正常系 | [学習用と閲覧用のタグ条件を混ぜない](./study-session-start.md#storybook-study-session-start-08) |
| STORYBOOK-STUDY-SESSION-START-09 | interaction | 正常系 | [アカウント変更後に元の Deck の学習を開始しない](./study-session-start.md#storybook-study-session-start-09) |
| STORYBOOK-STUDY-SESSION-START-10 | interaction | 正常系 | [開始とやり直しの保存待ち中に重ねて開始しない](./study-session-start.md#storybook-study-session-start-10) |
| STORYBOOK-STUDY-SESSION-START-11 | interaction | 正常系 | [Restart から新しい学習の先頭を表示する](./study-session-start.md#storybook-study-session-start-11) |
| STORYBOOK-STUDY-SESSION-START-12 | interaction | 異常系 | [Restart の保存失敗後も以前の学習を保持する](./study-session-start.md#storybook-study-session-start-12) |
| STORYBOOK-STUDY-SESSION-START-13 | render | 異常系 | [学習結果の取得失敗を対象0件と扱わない](./study-session-start.md#storybook-study-session-start-13) |
| STORYBOOK-STUDY-SESSION-START-14 | interaction | 正常系 | [折りたたまれた学習タグを選ぶと自動保存する](./study-session-start.md#storybook-study-session-start-14) |
| STORYBOOK-STUDY-SESSION-START-15 | interaction | 正常系 | [対象0件では開始操作を無効にする](./study-session-start.md#storybook-study-session-start-15) |

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
| STORYBOOK-STUDY-SESSION-05 | interaction | 正常系 | [主ボタンの上ドラッグで一つ先の表面へ進む](./study-session.md#storybook-study-session-05) |
| STORYBOOK-STUDY-SESSION-06 | interaction | 正常系 | [主ボタン以外のドラッグでは進まない](./study-session.md#storybook-study-session-06) |
| STORYBOOK-STUDY-SESSION-07 | interaction | 正常系 | [Help の説明を割り当てとボタン表示に合わせる](./study-session.md#storybook-study-session-07) |
| STORYBOOK-STUDY-SESSION-08 | interaction | 正常系 | [閲覧モードで本文を読む操作を学習操作から分離する](./study-session.md#storybook-study-session-08) |
| STORYBOOK-STUDY-SESSION-09 | interaction | 正常系 | [Space と b の長押しでは一度だけ切り替える](./study-session.md#storybook-study-session-09) |
| STORYBOOK-STUDY-SESSION-10 | interaction | 正常系 | [Help 内の入力と通知変化で背景を操作しない](./study-session.md#storybook-study-session-10) |
| STORYBOOK-STUDY-SESSION-11 | interaction | 正常系 | [閲覧モードのピンチ拡大では学習が進まない](./study-session.md#storybook-study-session-11) |
| STORYBOOK-STUDY-SESSION-12 | interaction | 正常系 | [Help ボタンの表示を切り替える](./study-session.md#storybook-study-session-12) |
| STORYBOOK-STUDY-SESSION-13 | interaction | 正常系 | [閲覧モードを終了する入力で Card を裏返さない](./study-session.md#storybook-study-session-13) |
| STORYBOOK-STUDY-SESSION-14 | interaction | 正常系 | [閲覧モードでも評価と自動再生の移動を利用する](./study-session.md#storybook-study-session-14) |
| STORYBOOK-STUDY-SESSION-15 | interaction | 正常系 | [閲覧モードとボタン表示を閲覧画面と共有する](./study-session.md#storybook-study-session-15) |
| STORYBOOK-STUDY-SESSION-16 | interaction | 正常系 | [短い横向き画面でも本文と各操作へ到達する](./study-session.md#storybook-study-session-16) |
| STORYBOOK-STUDY-SESSION-17 | interaction | 正常系 | [方向ボタンの名前と Help を現在の操作に一致させる](./study-session.md#storybook-study-session-17) |
| STORYBOOK-STUDY-SESSION-18 | interaction | 正常系 | [方向キーを押し続けても次の Card を評価しない](./study-session.md#storybook-study-session-18) |
| STORYBOOK-STUDY-SESSION-19 | interaction | 正常系 | [修飾付き入力を学習ショートカットと扱わない](./study-session.md#storybook-study-session-19) |
| STORYBOOK-STUDY-SESSION-20 | interaction | 正常系 | [Card・表裏・モードの変更でスクロールを戻す](./study-session.md#storybook-study-session-20) |
| STORYBOOK-STUDY-SESSION-21 | interaction | 正常系 | [裏面の表示・文字選択・タップを区別する](./study-session.md#storybook-study-session-21) |
| STORYBOOK-STUDY-SESSION-22 | interaction | 正常系 | [狭い裏面でも操作領域上から本文を読める](./study-session.md#storybook-study-session-22) |
| STORYBOOK-STUDY-SESSION-23 | interaction | 正常系 | [裏面の左右領域で割り当てた操作だけを実行する](./study-session.md#storybook-study-session-23) |
| STORYBOOK-STUDY-SESSION-24 | interaction | 正常系 | [スライダーの後方入力で前の Card へ戻らない](./study-session.md#storybook-study-session-24) |
| STORYBOOK-STUDY-SESSION-25 | interaction | 正常系 | [入力手段と方向の評価を一致させる](./study-session.md#storybook-study-session-25) |
| STORYBOOK-STUDY-SESSION-26 | interaction | 正常系 | [評価以外の操作で回答と記憶状態を変えない](./study-session.md#storybook-study-session-26) |
| STORYBOOK-STUDY-SESSION-27 | interaction | 正常系 | [保存結果の待機中は競合操作を受け付けない](./study-session.md#storybook-study-session-27) |
| STORYBOOK-STUDY-SESSION-28 | interaction | 正常系 | [古い学習の結果で現在の画面を変更しない](./study-session.md#storybook-study-session-28) |
| STORYBOOK-STUDY-SESSION-29 | interaction | 正常系 | [明示的な学習中止の成功で一覧へ戻る](./study-session.md#storybook-study-session-29) |
| STORYBOOK-STUDY-SESSION-30 | interaction | 異常系 | [一部の保存失敗を通知して後続の評価を続ける](./study-session.md#storybook-study-session-30) |
| STORYBOOK-STUDY-SESSION-31 | interaction | 異常系 | [匿名の操作受付後に届く診断で後続操作を妨げない](./study-session.md#storybook-study-session-31) |
| STORYBOOK-STUDY-SESSION-32 | interaction | 異常系 | [同期失敗と復元位置を受け取るとその Card を表示する](./study-session.md#storybook-study-session-32) |
| STORYBOOK-STUDY-SESSION-33 | interaction | 正常系 | [完了時は回答数によらず対象枚数を表示する](./study-session.md#storybook-study-session-33) |
| STORYBOOK-STUDY-SESSION-34 | interaction | 正常系 | [学習 URL の読み込み中と後から届く学習を表示する](./study-session.md#storybook-study-session-34) |
| STORYBOOK-STUDY-SESSION-35 | interaction | 正常系 | [間隔0では自動送りを止めて手動学習を続ける](./study-session.md#storybook-study-session-35) |
| STORYBOOK-STUDY-SESSION-36 | interaction | 正常系 | [間隔を戻して同じ学習の再生を利用する](./study-session.md#storybook-study-session-36) |
| STORYBOOK-STUDY-SESSION-37 | interaction | 異常系 | [狭い画面で復旧警告と正常な Card を操作する](./study-session.md#storybook-study-session-37) |
| STORYBOOK-STUDY-SESSION-38 | interaction | 異常系 | [保存失敗後は巻き戻しを待たず操作待ちを解除する](./study-session.md#storybook-study-session-38) |
| STORYBOOK-STUDY-SESSION-39 | interaction | 異常系 | [学習不在を案内し後から届く学習を表示する](./study-session.md#storybook-study-session-39) |

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
| STORYBOOK-STUDY-HISTORY-10 | interaction | 正常系 | [Deck 選択と URL を履歴移動で一致させる](./study-history.md#storybook-study-history-10) |
| STORYBOOK-STUDY-HISTORY-11 | interaction | 正常系 | [記録がなくても期間と日別表を連動させる](./study-history.md#storybook-study-history-11) |
| STORYBOOK-STUDY-HISTORY-12 | render | 正常系 | [cache の記録を全履歴と区別して案内する](./study-history.md#storybook-study-history-12) |
| STORYBOOK-STUDY-HISTORY-13 | interaction | 正常系 | [暦日の両端を含めて期間と Deck を表示する](./study-history.md#storybook-study-history-13) |
| STORYBOOK-STUDY-HISTORY-14 | interaction | 正常系 | [条件切替後に古い取得結果を表示しない](./study-history.md#storybook-study-history-14) |
| STORYBOOK-STUDY-HISTORY-15 | interaction | 正常系 | [日付変更で相対期間だけを更新する](./study-history.md#storybook-study-history-15) |
| STORYBOOK-STUDY-HISTORY-16 | interaction | 正常系 | [開始と完了の記録を30日分の表示へ反映する](./study-history.md#storybook-study-history-16) |
| STORYBOOK-STUDY-HISTORY-17 | render | 正常系 | [中止と削除済み Deck の記録を完了数へ加えない](./study-history.md#storybook-study-history-17) |
| STORYBOOK-STUDY-HISTORY-18 | interaction | 異常系 | [取得失敗では部分集計を表示せず再試行する](./study-history.md#storybook-study-history-18) |
| STORYBOOK-STUDY-HISTORY-19 | interaction | 異常系 | [無効な日付を適用しても現在の期間を変えない](./study-history.md#storybook-study-history-19) |
| STORYBOOK-STUDY-HISTORY-20 | interaction | 異常系 | [無効な URL 期間を選び直して復帰する](./study-history.md#storybook-study-history-20) |
| STORYBOOK-STUDY-HISTORY-21 | render | 異常系 | [存在しない Deck 指定を全 Deck に読み替えない](./study-history.md#storybook-study-history-21) |

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
| STORYBOOK-SETTINGS-12 | interaction | 正常系 | [詳細設定をキーボードで開閉する](./settings.md#storybook-settings-12) |
| STORYBOOK-SETTINGS-13 | interaction | 正常系 | [配色だけを変更して他の設定を保つ](./settings.md#storybook-settings-13) |
| STORYBOOK-SETTINGS-14 | interaction | 正常系 | [Language の選択を画面とページの言語へ反映する](./settings.md#storybook-settings-14) |
| STORYBOOK-SETTINGS-15 | interaction | 正常系 | [学習条件の変更を次の開始へ渡す](./settings.md#storybook-settings-15) |
| STORYBOOK-SETTINGS-16 | interaction | 正常系 | [間隔スライダーの両端をキーボードで選んでも他の設定を保つ](./settings.md#storybook-settings-16) |

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
| STORYBOOK-ACCOUNT-15 | interaction | 異常系 | [Card 保存結果とログアウト失敗を両方確認する](./account.md#storybook-account-15) |
| STORYBOOK-ACCOUNT-16 | render | 正常系 | [ログイン前に匿名データの引き継ぎ条件を確認する](./account.md#storybook-account-16) |
| STORYBOOK-ACCOUNT-17 | interaction | 正常系 | [認証状態の変更を受けて UID と連携状態を表示する](./account.md#storybook-account-17) |
| STORYBOOK-ACCOUNT-18 | interaction | 正常系 | [認証待機中に変更した言語で完了を通知する](./account.md#storybook-account-18) |
| STORYBOOK-ACCOUNT-19 | interaction | 正常系 | [ログインをキャンセルしても匿名のデータを表示する](./account.md#storybook-account-19) |
| STORYBOOK-ACCOUNT-20 | interaction | 異常系 | [ログイン再試行中もエラー通知の元の期限を保つ](./account.md#storybook-account-20) |
| STORYBOOK-ACCOUNT-21 | interaction | 異常系 | [同期が必要なログアウト拒否を案内する](./account.md#storybook-account-21) |
| STORYBOOK-ACCOUNT-22 | interaction | 正常系 | [通知の言語変更でフォーカスと期限を保つ](./account.md#storybook-account-22) |
| STORYBOOK-ACCOUNT-23 | interaction | 異常系 | [Account を開く認証初期化失敗を現在の言語で案内する](./account.md#storybook-account-23) |
| STORYBOOK-ACCOUNT-24 | interaction | 正常系 | [Account の切り替え中に以前のデータを新しい本人へ表示しない](./account.md#storybook-account-24) |
| STORYBOOK-ACCOUNT-25 | interaction | 異常系 | [アカウント切り替え中断後に現在の本人だけを利用する](./account.md#storybook-account-25) |
| STORYBOOK-ACCOUNT-26 | interaction | 異常系 | [ログイン失敗後も匿名のデータを表示する](./account.md#storybook-account-26) |

## ページ未検出画面

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-NOT-FOUND-01 | render | 異常系 | [未知の URL を案内する](./not-found.md#storybook-not-found-01) |
| STORYBOOK-NOT-FOUND-02 | interaction | 異常系 | [見つからない画面からホームへ戻る](./not-found.md#storybook-not-found-02) |

# ダークモード表示仕様

Shared・Entities・Features・PagesのコンポーネントStoryに共通する配色と操作状態の仕様。暗い背景でも内容と操作を識別でき、テーマの変更で入力や操作の意味が変わらないことを求める。

[一覧・共通前提](../README.md) / [レスポンシブ表示](./responsive.md)

## 適用範囲

アプリが表示する背景、文字、入力欄、境界、アイコン、通知、ダイアログ、コード・数式・図表を対象にする。既存の[共通配色](../../../src/app/styles/calm-focus.css)を使い、新しい配色テーマやテーマ選択方式は追加しない。

この文書は追加する表示の要求仕様であり、既存のDark・LightAndDarkなどのStoryが全項目を実装・自動検証しているという意味ではない。テーマ設定の永続化、OSへの追従方針、保存・認証・ルート遷移の成功は対象外とする。

## 表示条件

[Storybookの共通設定](../../../.storybook/preview.ts)を使い、同じ入力・言語・表示寸法についてlightとdarkを比較する。Storybookの管理画面だけを暗くした状態ではなく、Canvas内の対象部品にテーマが適用されていることを確認する。

コードやプレビューなど、テーマを明示的な入力として受け取る部品は、その入力も表示テーマと合わせる。globalのテーマだけを変え、内部のコード表示はlightのままという条件を、darkの確認済みとは扱わない。

| 条件 | 確認する内容 |
| --- | --- |
| 通常表示 | [レスポンシブ表示の各寸法](./responsive.md#表示条件)で同じ内容をlight・darkの両方で表示する。 |
| 状態の違い | 部品が持つ選択・未選択、入力済み・空、読み取り専用・無効・処理中・エラーを比較する。 |
| 重なりのある表示 | メニュー、削除確認、拡大入力、プレビュー、ヘルプ、通知を開いた状態も確認する。 |
| 言語・長文 | 狭い画面で英語と日本語、長いラベル・名前・通知・コード・数式を確認する。 |
| テーマの切替 | 同じマウントと入力状態を保ち、lightからdark、darkからlightへ切り替える。 |
| OSとの組み合わせ | OS側が明るい場合のdark、OS側が暗い場合のlightを比較し、明示した表示テーマと食い違わないことを確認する。 |

## 共通の期待結果

| 確認対象 | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| 基本の背景 | 通常の領域、カード、ダイアログをdarkで表示する。 | 既存の黒を基調とする背景を維持する。補助領域や選択・強調の背景まで一律に黒くせず、用途を識別できる。 |
| 文字と補足 | 見出し、本文、補足、placeholder、エラーを表示する。 | 主情報と補足の強弱を保ち、背景に埋もれて読めない文字を作らない。長文や日本語でも内容の省略規則はlightと同じにする。 |
| 境界と重なり | 入力欄、カード、開いたメニューやダイアログを表示する。 | 周囲との境界と前面の操作領域を見分けられる。背景色の差や影だけに依存せず、既存の境界・余白などを使って区別する。 |
| 操作の状態 | 通常、選択、無効、処理中、hover、キーボードフォーカスを比較する。 | 現在の状態と操作対象を見分けられる。テーマを変えても有効・無効、選択値、通知する操作の意味は変わらない。 |
| フォーカス | 各操作へキーボードで移動する。 | 暗い背景でも現在位置が分かり、境界やスクロール領域に完全に隠れない。テーマ変更だけでフォーカスを失わない。 |
| 通知・エラー | 成功・警告・エラー、入力エラー、空状態を表示する。 | 色だけでなく文言や既存のアイコン・状態表示で意味を判断できる。エラー内容や読み上げ用の説明を消さない。 |
| テーマ切替 | 入力・選択・ダイアログの開閉状態を用意してlight → dark → lightにする。 | 配色が追従し、下書き、選択、エラー、表示中の内容と開閉状態を保つ。切替だけで送信・削除・学習回答を要求しない。 |
| 表示テーマの優先 | OSの配色設定と異なるテーマを明示する。 | 本文、Markdown、数式、コード、フォームの部品が明示したテーマに揃う。OSの配色だけで一部の領域を逆のテーマにしない。 |

## コンポーネント別の期待結果

各部品が持つ状態だけに適用し、存在しない操作やテーマ専用の機能は要求しない。

| 対象 | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| [Header](./header.md)・[Layout](./layout.md)・[Main](./main.md)・[Outer](./outer.md)・[FullScreen](./full-screen.md)・[Logo](./logo.md) | 通常・固定・全画面の表示を比較する。 | アプリの背景と本文が揃い、ロゴ、Headerの操作、主領域を判別できる。 |
| [Button](./button.md) | primary・secondary・quiet・destructive、無効、処理中を表示する。 | 主操作と破壊的な操作を区別し、ラベルとフォーカスを読める。darkにしても無効・処理中の制限を維持する。 |
| [Input](./input.md)・[Select](./select.md)・[Textarea](./textarea.md)・[FormItem](./form-item.md)・[Upload](./upload.md) | 入力値、未入力、補足、エラー、読み取り専用・無効を表示する。 | 値、placeholder、選択値、ファイル名、エラーを背景と区別でき、ラベルとの対応を保つ。入力値や選択を変更しない。 |
| [Switch](./switch.md)・[Slider](./slider.md)・[Tag](./tag.md)・[TagLabel](./tag-label.md)・[RemovableTag](./removable-tag.md) | オン・オフ、選択・未選択、数値、無効、削除操作を表示する。 | つまみ・トラック、タグの選択状態と削除操作を見分けられる。色が変わっても現在値と読み上げ名を維持する。 |
| [Title](./title.md)・[Description](./description.md)・[Style](./style.md) | 通常、強調、長文、クリック可能な内容を表示する。 | 主情報と補足の強弱を保ち、文字や強調が背景に埋もれない。 |
| [Code](./code.md)・[BackText](../entities/back-text.md)・[CardView](../entities/card-view.md) | 通常テキストと長いコードを表示する。 | コードの背景・構文強調・文字がdarkに揃い、スクロールした先も読める。コード本文、改行、言語の選択はテーマだけで変わらない。 |
| [MathContent](./math.md)・[FrontText](../entities/front-text.md)・[CardFields](../features/card-fields.md) | Markdown、数式、表、引用、リンクを含む本文やプレビューを表示する。 | 本文・数式・表の罫線・引用・リンクが周囲のテーマに揃う。通常表示と拡大プレビューで内容や数式を変えない。 |
| [ActionsMenu](./actions-menu.md)・[DestructiveActionDialog](./destructive-action-dialog.md)・[NavigationGuardDialog](./navigation-guard-dialog.md)・[Overlay](./overlay.md) | 開いたメニュー、確認対象、警告、処理中を表示する。 | 前面の内容と背景、通常操作と破壊的操作を見分けられ、説明と有効な操作を確認できる。 |
| [DeckList](../pages/deck-list.md)・[DeckListCard](../pages/deck-list-card.md)・[CardList](../pages/card-list.md)・[Card](../pages/card.md)・[DeckActionsMenu](../pages/deck-actions-menu.md)・[CardActionsMenu](../pages/card-actions-menu.md) | 一覧、空状態、選択タグ、復習件数、処理中の行、開いたメニューを表示する。 | 行・カードの内容と操作を判別できる。件数、選択、学習位置と処理中の行はlightと同じになる。 |
| [DeckFilterForm](../features/deck-filter-form.md)・[TagFilter](../features/tag-filter.md)・[DeckForm](../features/deck-form.md)・[DeckDeletionDialog](../features/deck-deletion-dialog.md)・[CardCreator](../pages/card-creator.md)・[CardEditor](../pages/card-editor.md) | 選択条件、入力エラー、送信中、詳細設定、削除確認を表示する。 | 条件・入力・エラー・確認対象を判別でき、開いた追加領域もテーマに揃う。保存・削除の制限と入力値は変えない。 |
| [CardPlayer](../features/card-player.md)・[Controller](../features/controller.md)・[SwipeButtonList](../features/swipe-button-list.md)・[CardOverlay](../features/card-overlay.md)・[StudyHelpDialog](../features/study-help-dialog.md) | 表裏、閲覧モード、操作パネル、補足情報、ヘルプを表示する。 | 表裏の内容、方向、再生状態、学習情報を判別できる。表示・非表示の設定や、裏面で隠す操作はテーマにかかわらず同じになる。 |
| [StudySessionStart](../pages/study-session-start.md)・[StudyCompletion](../pages/study-completion.md)・[StudySaveControls](../pages/study-save-controls.md) | 開始前、0件、完了、処理中を表示する。 | 件数、条件、完了案内と操作可否を判別できる。darkにしても学習の開始・回答・スキップは発生しない。 |
| [MemoryState](../pages/memory-state.md)・[StudyHistorySummary](../pages/study-history-summary.md)・[StudyHistoryTable](../pages/study-history-table.md)・[RecentStudySessions](../pages/recent-study-sessions.md)・[StudyHistoryPeriodPicker](../pages/study-history-period-picker.md) | 曲線・時点・目標、合計・日別表・期間・セッション状態を表示する。 | 線、マーカー、軸、ラベル、数値、状態を背景と区別できる。色だけで系列や時点を説明せず、図の説明と数値を保持する。 |
| [SettingsForm](../pages/settings-form.md)・[SettingsSection](../pages/settings-section.md)・[AccountView](../pages/account-view.md)・[DeckImportView](../pages/deck-import-view.md) | 設定値、アカウント情報、例、プレビュー、エラーを表示する。 | 補足情報と主情報を区別でき、エラーや選択状態を保持する。テーマ表示の確認を設定保存・認証・インポート成功とは扱わない。 |
| [ToastViewport](./toast.md)・[RouteFeedback](./route-feedback.md) | 通常・成功・警告・エラー、長い通知、読み込み中を表示する。 | 種別、本文、閉じる・再試行など存在する操作を判別できる。アイコンだけの視覚表示でも、読み上げ用の通知文を保持する。 |

## 確認方法と未検証の扱い

既存のDark・LightAndDark・MobileなどのStoryは表示例として利用するが、lightとdarkで入力値や内容が異なる例だけでテーマ差を判定しない。比較時には同じ内容を用意し、テーマを明示的な入力で受け取る子部品も含めて揃える。

テーマ切替による状態保持は、同じマウントでテーマだけを更新して確認する。Storyの再実行・再マウント・初期化を伴う操作では、その確認ができたとは扱わない。既存Storyで再現できない条件は未確認として扱う。

見た目の比較に加え、フォーカス、読み上げ名、選択値、無効・処理中の操作可否を確認する。テーマだけで入力・表示内容・業務callbackの通知が変わらないことも確認する。ブラウザやOSが描画するファイル選択画面など、アプリのCanvas外の配色は対象外とする。

`npm run test:storybook` の成功やa11y検査だけを、すべての配色・長文・画面寸法の確認とは扱わない。確認したStory、入力、テーマ、言語、寸法を記録し、追加条件の未実施を隠さない。画面を組み合わせたplayによる保証を追加する場合は、[Storybook結合テスト仕様](../../test/integration/storybook/README.md)と併せて管理する。

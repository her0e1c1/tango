# レスポンシブ表示仕様

Shared・Entities・Features・PagesのコンポーネントStoryに共通する表示仕様。画面幅や高さが変わっても、内容を確認し、その状態で有効な操作を選べることを求める。

[一覧・共通前提](../README.md) / [ダークモード](./dark-mode.md)

## 適用範囲

各コンポーネントのStory仕様にある入力・状態を使い、表示寸法に関する期待結果を補う。列数、DOM構造、CSSクラス、内部のブレークポイントは固定しない。部品を実際の利用幅で配置するが、保存・認証・ルート遷移はこの仕様の対象外とする。

以下の寸法と追加条件は確認の基準であり、既存Storyがすべてを再現・自動検証しているという意味ではない。部品が持たない空状態・エラー・メニューなどを、この仕様のためだけに追加しない。

## 表示条件

寸法はStoryのCanvas内の表示領域に対するCSSピクセルで、端末の物理解像度ではない。既存のviewport名だけから実寸を推定せず、実際の幅と高さを確認する。

| 条件 | 幅 × 高さ | 確認する表示 |
| --- | --- | --- |
| 狭い縦画面 | 320 × 568 | 長いラベルと最小幅での配置。 |
| 標準的な縦画面 | 375 × 812 | 通常表示、長文と上下の操作領域。 |
| 高さの低い横画面 | 812 × 375 | 高さ不足、ダイアログと固定操作の到達性。 |
| タブレット相当 | 768 × 1024 | 中間幅の配置と読み取り領域。 |
| デスクトップ相当 | 1280 × 800 | 広い幅での余白、読み取り幅と操作の配置。 |

通常状態は各寸法でlight・darkの両方を確認する。長文・空・処理中・エラー・開いたメニューやダイアログは、所有する部品について320 × 568と812 × 375で両テーマを確認する。翻訳するラベルがある部品は、長い内容を含む320 × 568の条件で英語と日本語も確認する。

## 共通の期待結果

| 確認対象 | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| 横幅 | 各寸法で通常の内容を表示する。 | 部品と操作が利用幅に収まり、内容のはみ出しによってページ全体の不要な横スクロールを発生させない。横並びの維持は要求せず、折り返しや縦配置を許容する。 |
| 長い文言 | 長い名前、説明、日本語のラベル、区切りのない文字列を渡す。 | 操作を押し出さない。折り返し・省略・全文の確認方法は各部品の仕様に従い、表示の省略によって元の値や操作の読み上げ名を失わない。 |
| 高さ不足 | 長い内容を高さ375の領域に表示する。 | 必要な領域を縦にスクロールでき、内容の末尾と有効な操作へ到達できる。固定要素の下に操作を隠したままにしない。 |
| キーボード操作 | 狭い幅でTab移動や各部品が持つキー操作を行う。 | フォーカス位置が分かり、画面外・重なった要素だけに操作を残さない。無効な操作は幅が変わっても有効にならない。 |
| 狭い親領域 | 広いCanvas内で、部品を余白込みの狭い利用領域に配置する。 | viewportだけでなく、与えられた親領域にも収まる。固定配置のメニュー・ダイアログは表示領域からはみ出さない。 |
| 表示中のリサイズ | 同じStoryを再読込せず、375 × 812から812 × 375へ変更して戻す。 | 配置を追従させ、入力値・選択値・表示中のカード内容を変更しない。幅の変更だけで送信や削除などの業務操作を要求しない。 |
| 拡大 | デスクトップ相当の画面をブラウザで200%に拡大する。 | 文字と操作が重ならず、必要なスクロールで内容と操作へ到達できる。Story内の見た目の拡大だけを、ブラウザの拡大確認とは扱わない。 |

## コンポーネント別の期待結果

以下は各部品が持つ表示責務に適用する。Story名・入力値・操作の意味は、リンク先の部品仕様を引き続き使う。

| 対象 | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| [Header](./header.md)・[Layout](./layout.md)・[Main](./main.md)・[Outer](./outer.md) | 固定Headerと長い本文、固定しない通常表示をそれぞれ確認する。 | 本文の先頭をHeaderの下に配置し、固定時はスクロール中もHeaderと本文の操作が重ならない。広い画面でも本文を際限なく引き延ばさない。 |
| [FullScreen](./full-screen.md)・[Overlay](./overlay.md) | 全画面の長い内容、低い横画面を表示する。 | 表示領域に合わせて高さを扱い、スクロールを許可した領域では末尾まで読める。閉じる操作を持つ利用側では、その操作へ到達できる。 |
| [Button](./button.md)・[FormItem](./form-item.md)・[Input](./input.md)・[Select](./select.md)・[Textarea](./textarea.md)・[Upload](./upload.md) | 長いラベル、入力値、選択値、ファイル名、補足とエラーを表示する。 | ラベルと入力欄の対応を保ち、入力欄やボタンが互いに重ならない。長い値を表示のために切り詰めて保存値へ反映しない。 |
| [Switch](./switch.md)・[Slider](./slider.md)・[Tag](./tag.md) | 選択・未選択・無効を表示する。 | 小さい画面でも操作領域を重ねず、現在値と操作可否を判別できる。 |
| [Title](./title.md)・[Description](./description.md)・[Style](./style.md)・[Logo](./logo.md) | 長い見出しや説明、強調、文字付き・マークのみのロゴを表示する。 | 各部品の表示規則に従って幅内に配置し、隣接する内容を押し出さない。文字やロゴを縦横比の変更で無理に収めない。 |
| [Code](./code.md)・[MathContent](./math.md)・[CardView](../entities/card-view.md)・[BackText](../entities/back-text.md) | 横長のコード・数式、長い本文を表示する。 | コード・数式など折り返しに適さない内容は、その読み取り領域内の横スクロールを許容する。末尾を確認でき、ページ全体を横に押し広げない。 |
| [TagLabel](./tag-label.md)・[RemovableTag](./removable-tag.md)・[TagFilter](../features/tag-filter.md)・[DeckFilterForm](../features/deck-filter-form.md) | 長いタグ、多数の候補、選択済み・候補外のタグを表示する。 | 候補は折り返しや定義済みのスクロール領域に収まり、選択状態と解除・展開操作を確認できる。省略したタグも読み上げ名から対象を識別できる。 |
| [ActionsMenu](./actions-menu.md)・[DeckActionsMenu](../pages/deck-actions-menu.md)・[CardActionsMenu](../pages/card-actions-menu.md) | 画面端にある起点からメニューを開く。 | 項目が画面外にはみ出さず、選択・閉じる操作へ到達できる。シート表示を使う場合も、項目の意味と操作可否を変えない。 |
| [DestructiveActionDialog](./destructive-action-dialog.md)・[NavigationGuardDialog](./navigation-guard-dialog.md)・[DeckDeletionDialog](../features/deck-deletion-dialog.md)・[StudyHelpDialog](../features/study-help-dialog.md) | 長い対象名や説明、処理中を含むダイアログを開く。 | 内容を読め、確認・取消・閉じるなど存在する操作へ到達できる。画面が低くてもフォーカスを背景へ逃がさず、処理中の操作制限を保つ。 |
| [DeckList](../pages/deck-list.md)・[DeckListCard](../pages/deck-list-card.md)・[CardList](../pages/card-list.md)・[Card](../pages/card.md) | 多数の項目、長い名前・タグ、空状態、開いたメニューを表示する。 | 名前、件数、学習位置と操作を重ねない。空状態の追加・条件解除などの有効な導線も狭い幅で確認できる。列数や横並びの固定は要求しない。 |
| [DeckForm](../features/deck-form.md)・[CardFields](../features/card-fields.md)・[CardCreator](../pages/card-creator.md)・[CardEditor](../pages/card-editor.md) | 長文、入力エラー、詳細設定、拡大入力、解答プレビューを表示する。 | 入力・エラーと対象の対応を保ち、フォームの送信・取消とダイアログの操作へ到達できる。幅の変更だけで下書きや選択タブを失わない。 |
| [CardPlayer](../features/card-player.md)・[FrontText](../entities/front-text.md)・[Controller](../features/controller.md)・[SwipeButtonList](../features/swipe-button-list.md)・[CardOverlay](../features/card-overlay.md) | 表面、長文の閲覧モード、裏面、開いた操作パネルを切り替える。 | 通常の問題文は各表示条件に応じた中央配置を保つ。長文の閲覧領域と操作領域を重ねず、裏面や操作パネルで隠す要素は部品仕様どおりに隠す。 |
| [StudySessionStart](../pages/study-session-start.md)・[StudyCompletion](../pages/study-completion.md)・[StudySaveControls](../pages/study-save-controls.md) | 長いデッキ名、件数、多数の条件、開始不可・処理中を表示する。 | 件数と条件を確認でき、開始・戻る・スキップなど存在する操作を押し出さない。件数や幅の変化を混同して操作可否を変えない。 |
| [SettingsForm](../pages/settings-form.md)・[SettingsSection](../pages/settings-section.md)・[AccountView](../pages/account-view.md)・[DeckImportView](../pages/deck-import-view.md) | 長い説明・バージョン・UID・ファイル名、解析結果とエラーを表示する。 | ラベルと値、診断と対象を対応付けて読め、設定・認証要求・インポート確認の操作へ到達できる。 |
| [MemoryState](../pages/memory-state.md)・[StudyHistorySummary](../pages/study-history-summary.md)・[StudyHistoryTable](../pages/study-history-table.md)・[RecentStudySessions](../pages/recent-study-sessions.md)・[StudyHistoryPeriodPicker](../pages/study-history-period-picker.md) | 図表、期間入力、長いデッキ名、全件表示を確認する。 | 図の説明・軸・時点と数値を識別でき、表の列の対応を失わない。必要なら表の領域内で横スクロールでき、期間・ページ切替の操作は画面内に収まる。 |
| [ToastViewport](./toast.md)・[RouteFeedback](./route-feedback.md) | 長い通知、読み込み中・エラー・対象なしの案内を表示する。 | メッセージを確認でき、閉じる・再試行など存在する操作が画面外へ押し出されない。 |

## 確認方法と未検証の扱い

各部品の既存Storyを使い、[Storybookの共通設定](../../../.storybook/preview.ts)のviewportとテーマを選ぶ。必要な寸法が既存の選択肢にない場合は、ブラウザの表示領域を調整する。Canvasの見た目を縮小しただけの表示を、狭いviewportでの確認と扱わない。

画面端・スクロール末尾・開いたメニューやダイアログを含めて、表示と操作結果を確認する。リサイズは同じマウントで行い、Storyの再実行による初期化と区別する。実際の画面幅・高さ・言語・テーマと確認したStoryを記録し、未実施の寸法や状態まで検証済みにしない。

セーフエリアは、対応する既存Storyで余白を模擬した確認と、実端末の縦横表示での確認を区別する。ブラウザのツールバーやソフトウェアキーボードの影響は、通常のviewport変更だけでは保証しない。

`npm run test:storybook` の成功だけでは、ここに追加した全寸法・テーマ・見た目の条件を保証しない。画面を組み合わせたplayで保証する場合は、[Storybook結合テスト仕様](../../test/integration/storybook/README.md)の境界と記述規約に従って、観測可能な結果を別途対応付ける。

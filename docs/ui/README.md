# UI Story仕様書

コンポーネント単位のStoryで再現する入力・表示状態と、期待するUIをまとめる。Shared・Entities・Features・Pagesの表示部品を対象とし、既存のStoryファイルごとに仕様書を置く。

仕様書は `docs/ui/<group>/` に配置し、`shared`・`entities`・`features`・`pages` に分ける。索引と共通前提はこのREADMEにまとめる。

## 読み方と境界

各仕様書の表は、Storyのnamed export、入力・表示条件、期待する表示・操作の対応を示す。Story側の入力補助や公開callbackまでを含むが、実際の認証・保存・ルート遷移の成功は保証しない。

ここはStoryの表示仕様であり、テストの検証済み一覧ではない。表の期待結果が既存のplayですべて自動検証されていることを意味しない。表示準備のためにダイアログを開くだけのplayも、動作検証済みとは数えない。

画面単位のplayや、保存・認証・独立したUI間の連携まで含むplayの検証契約は、[Storybook結合テスト仕様](../test/integration/storybook/README.md)で扱う。既存の結合テスト仕様は移動・変更しない。Appのルート・レイアウト結合Storyはこの一覧の対象外とする。部品のStoryファイルに結合用Storyが混在する場合は、各仕様書の別表で区別する。

仕様にはDOM構造、CSSクラス、内部関数、mockの呼出回数を固定せず、見た目・入力値・操作可否・読み上げ名・フォーカス・公開callbackの通知を書く。既存Storyにない状態は、この一覧で網羅済みとはみなさない。

## 共通表示条件

[Storybookの共通設定](../../.storybook/preview.ts)とアプリのCSS・翻訳を使う。既定は英語・明るいテーマで、日本語、暗いテーマ、viewportの指定は各Storyに従う。「モバイル」の幅は一律ではなく、該当Storyの設定を参照する。

フォーム値、エラー、選択状態、スロット、callbackの通知先はStory側で用意する。日時や記憶状態は既存Storyの固定値・判定時刻を使い、現在の実データで補完しない。表の操作が状態を更新する例では、既存Storyの入力補助も含めて再現する。

## 一覧

### Shared

| 仕様書 | Storybook上の分類 |
| --- | --- |
| [Button](./shared/button.md) | `Shared/Forms/Button` |
| [Input](./shared/input.md) | `Shared/Forms/Input` |
| [Select](./shared/select.md) | `Shared/Forms/Select` |
| [Textarea](./shared/textarea.md) | `Shared/Forms/Textarea` |
| [Switch](./shared/switch.md) | `Shared/Forms/Switch` |
| [Slider](./shared/slider.md) | `Shared/Forms/Slider` |
| [Tag](./shared/tag.md) | `Shared/Forms/Tag` |
| [Upload](./shared/upload.md) | `Shared/Forms/Upload` |
| [FormItem](./shared/form-item.md) | `Shared/Forms/FormItem` |
| [Code](./shared/code.md) | `Shared/Content/Code` |
| [MathContent](./shared/math.md) | `Shared/Content/Math` |
| [Style](./shared/style.md) | `Shared/Content/Style` |
| [Title](./shared/title.md) | `Shared/Content/Title` |
| [Description](./shared/description.md) | `Shared/Content/Description` |
| [TagLabel](./shared/tag-label.md) | `Shared/Content/TagLabel` |
| [RemovableTag](./shared/removable-tag.md) | `Shared/Content/RemovableTag` |
| [Main](./shared/main.md) | `Shared/Layout/Main` |
| [Outer](./shared/outer.md) | `Shared/Layout/Outer` |
| [Header](./shared/header.md) | `Shared/Layout/Header` |
| [Layout](./shared/layout.md) | `Shared/Layout/Layout` |
| [FullScreen](./shared/full-screen.md) | `Shared/Layout/FullScreen` |
| [Logo](./shared/logo.md) | `Shared/Content/Logo` |
| [Overlay](./shared/overlay.md) | `Shared/Feedback/Overlay` |
| [ActionsMenu](./shared/actions-menu.md) | `Shared/Navigation/ActionsMenu` |
| [DestructiveActionDialog](./shared/destructive-action-dialog.md) | `Shared/Feedback/DestructiveActionDialog` |
| [NavigationGuardDialog](./shared/navigation-guard-dialog.md) | `Shared/Router/NavigationGuardDialog` |
| [RouteFeedback](./shared/route-feedback.md) | `Shared/Feedback/RouteFeedback` |
| [ToastViewport](./shared/toast.md) | `Shared/Feedback/Toast` |

### Entities

| 仕様書 | Storybook上の分類 |
| --- | --- |
| [FrontText](./entities/front-text.md) | `Entities/Card/FrontText` |
| [BackText](./entities/back-text.md) | `Entities/Card/BackText` |
| [CardView](./entities/card-view.md) | `Entities/Card/CardView` |

### Features

| 仕様書 | Storybook上の分類 |
| --- | --- |
| [TagFilter](./features/tag-filter.md) | `Features/Deck Filter/TagFilter` |
| [DeckFilterForm](./features/deck-filter-form.md) | `Features/Deck Filter/DeckFilterForm` |
| [DeckForm](./features/deck-form.md) | `Features/Deck Form/DeckForm` |
| [CardFields](./features/card-fields.md) | `Features/Card Form/CardFields` |
| [DeckDeletionDialog](./features/deck-deletion-dialog.md) | `Features/Deck Deletion/DeckDeletionDialog` |
| [CardOverlay](./features/card-overlay.md) | `Features/Card Player/CardOverlay` |
| [Controller](./features/controller.md) | `Features/Card Player/Controller` |
| [SwipeButtonList](./features/swipe-button-list.md) | `Features/Card Player/SwipeButtonList` |
| [StudyHelpDialog](./features/study-help-dialog.md) | `Features/Card Player/StudyHelpDialog` |
| [CardPlayer](./features/card-player.md) | `Features/Card Player/CardPlayer` |

### Pages

| 仕様書 | Storybook上の分類 |
| --- | --- |
| [Card](./pages/card.md) | `Pages/Card List/Card` |
| [CardActionsMenu](./pages/card-actions-menu.md) | `Pages/Card List/CardActionsMenu` |
| [CardList](./pages/card-list.md) | `Pages/Card List/CardList` |
| [DeckListCard](./pages/deck-list-card.md) | `Pages/Deck List/DeckListCard` |
| [DeckActionsMenu](./pages/deck-actions-menu.md) | `Pages/Deck List/DeckActionsMenu` |
| [DeckList](./pages/deck-list.md) | `Pages/Deck List/DeckList` |
| [CardCreator](./pages/card-creator.md) | `Pages/Card Create/CardCreator` |
| [CardEditor](./pages/card-editor.md) | `Pages/Card Edit/CardEditor` |
| [SettingsForm](./pages/settings-form.md) | `Pages/Settings/SettingsForm` |
| [SettingsSection / SettingsRow](./pages/settings-section.md) | `Pages/Settings/SettingsSection` |
| [DeckImportView](./pages/deck-import-view.md) | `Pages/Deck Import/DeckImportView` |
| [AccountView](./pages/account-view.md) | `Pages/Account/AccountView` |
| [MemoryState](./pages/memory-state.md) | `Pages/CardView/MemoryState` |
| [StudyCompletion](./pages/study-completion.md) | `Pages/Study Session/StudyCompletion` |
| [StudySaveControls](./pages/study-save-controls.md) | `Pages/Study Session/StudySaveControls` |
| [StudySessionStart](./pages/study-session-start.md) | `Pages/Study Session Start/StudySessionStart` |
| [StudyHistorySummary](./pages/study-history-summary.md) | `Pages/Study History/Summary` |
| [StudyHistoryTable](./pages/study-history-table.md) | `Pages/Study History/Daily table` |
| [RecentStudySessions](./pages/recent-study-sessions.md) | `Pages/Study History/Recent sessions` |
| [StudyHistoryPeriodPicker](./pages/study-history-period-picker.md) | `Pages/Study History/Period picker` |

## 確認方法

`npm run storybook` で起動し、各仕様書の分類とStory名から対象を開く。指定したテーマ・画面幅・言語と、表示準備の操作後の状態を確認する。

Markdownの形式は `npm run lint:markdown` で確認する。playの自動検証は `npm run test:storybook` と結合テスト仕様で別に確認する。Storyのビルド成功だけで、ここに記載した表示や操作が検証済みになったとは扱わない。

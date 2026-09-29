# StudyHelpDialog

渡された操作と割当の一覧を説明するヘルプ。実際のキー割当や学習操作の実行は扱わない。

Storybook: `Features/Card Player/StudyHelpDialog`。

[コンポーネント](../../../src/features/card-player/ui/StudyHelpDialog.tsx) / [Story](../../../src/features/card-player/ui/StudyHelpDialog.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `English` | 方向、表裏切替、再生、表示切替、終了の説明行を渡す。 | 英語の操作説明と閉じる操作を表示する。 |
| `Japanese` | 同じ説明行を日本語で表示する。 | 操作と割当を日本語で説明する。 |
| `UnavailableControls` | 自動再生と再生コントロールが利用不可の説明行を渡す。 | 利用できない操作であることを説明する。 |
| `Mobile` | 狭い画面で説明一覧を表示する。 | 説明と閉じる操作を確認できる。 |
| `Dark` | 暗いテーマで説明一覧を表示する。 | 説明と操作を判別できる。 |

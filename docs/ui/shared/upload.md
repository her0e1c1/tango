# Upload

ファイル選択の入口と選択名の表示。内容の読み取り・送信・保存は扱わない。

Storybook: `Shared/Forms/Upload`。

[コンポーネント](../../../src/shared/ui/forms/Upload.tsx) / [Story](../../../src/shared/ui/forms/Upload.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | ファイル未選択で変更通知先を渡す。 | ファイル選択の入口を表示する。 |
| `FileChosen` | ファイル名 biology-cards.csv を渡す。 | 選択済みのファイル名を表示する。 |
| `Disabled` | 無効にする。 | ファイル選択を操作できない状態を表示する。 |
| `LightAndDark` | 明暗それぞれの背景で選択済み名を表示する。 | 両方の背景で選択操作とファイル名を判別できる。 |
| `NarrowViewport` | 狭いモバイル画面で長いファイル名を表示する。 | ファイル名によって画面全体が横に広がらない。 |

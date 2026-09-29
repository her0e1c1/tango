# SettingsSection / SettingsRow

設定の区分と設定行。同じファイルで公開するSettingsRowも、このStory仕様に含める。

Storybook: `Pages/Settings/SettingsSection`。

[コンポーネント](../../../src/pages/settings/ui/SettingsSection.tsx) / [Story](../../../src/pages/settings/ui/SettingsSection.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 見出し、説明、アイコンと設定行1件を渡す。 | 区分と設定行を表示する。 |
| `MultipleRows` | オンとオフの設定行を並べる。 | 複数行のラベル、説明、選択状態を確認できる。 |
| `Row` | SettingsRowだけにダークモードのラベル・説明とスイッチを渡す。 | 単独の設定行を表示する。 |
| `Interaction` | 表示設定のスイッチをオンからオフにする。 | 変更を通知し、オフの表示に更新する。 |
| `LongContent` | 長い区分名、説明、行ラベルを渡す。 | 文字が折り返され、操作を押し出さない。 |
| `Mobile` | 狭い画面で長い内容を表示する。 | ラベル・説明・操作が画面幅内に収まる。 |
| `Dark` | 暗いテーマで複数行を表示する。 | 区分名・行ラベル・説明・オンとオフ・フォーカスを判別できる。 |
| `Tablet` | 768×1024の画面で長い区分名と複数の設定行を表示する。 | 見出しと説明が折り返され、設定コントロールを押し出さない。 |
| `Desktop` | 1280×800の画面で区分と単独のSettingsRowを表示する。 | ラベル・説明・コントロールの対応と配置を保つ。 |
| `MobileDark` | 320×568の暗い画面で長い区分名と説明、オン・オフの行を表示する。 | 説明と選択状態・フォーカスを読め、長文がスイッチに重ならない。 |

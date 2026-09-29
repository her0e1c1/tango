# StudySessionStart

学習開始前の名前・件数・条件入力と開始操作。対象件数はpropsで渡し、条件変更による再計算やセッション作成は扱わない。

Storybook: `Pages/Study Session Start/StudySessionStart`。

[コンポーネント](../../src/pages/study-session-start/ui/StudySessionStart.tsx) / [Story](../../src/pages/study-session-start/ui/StudySessionStart.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 対象123枚、最大24枚、通常のデッキ名と条件領域を渡す。 | 名前、件数、条件と開始操作を表示する。 |
| `Long` | 長いデッキ名を渡す。 | 名前が開始操作や条件を押し出さない。 |
| `ManyCardsAndCombinedFilters` | 対象1247枚、最大数0、多数の選択タグとAll条件を渡す。 | 多数の条件と、全対象を学習する設定を表示する。 |
| `DisabledStart` | 対象0枚と選択条件を渡す。 | 条件を確認でき、開始は無効になる。 |
| `Dark` | 暗いテーマで多数の条件を表示する。 | 名前、件数、条件、開始操作を判別できる。 |
| `Mobile320LongDeck` | 320幅で長い名前と多数の条件を表示する。 | 名前と条件が画面を押し広げない。 |
| `Mobile375SafeArea` | モバイル幅で多数の条件を表示する。 | 開始操作と条件の配置を確認できる。実端末のセーフエリア検証ではない。 |
| `Mobile375DarkEmpty` | モバイル幅、暗いテーマ、長い名前と多数の条件、対象0枚。 | 条件を確認でき、開始の無効状態を判別できる。 |

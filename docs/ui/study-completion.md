# StudyCompletion

学習完了の案内と件数、戻る操作。セッションの完了判定や保存は扱わない。

Storybook: `Pages/Study Session/StudyCompletion`。

[コンポーネント](../../src/pages/study-session/ui/StudyCompletion.tsx) / [Story](../../src/pages/study-session/ui/StudyCompletion.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | カード数12と戻る操作を渡す。 | 完了の案内、12枚の件数、戻る操作を表示する。 |
| `SingleCard` | カード数1を渡す。 | 1枚に対応した完了の案内を表示する。 |

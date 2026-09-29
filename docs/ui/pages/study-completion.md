# StudyCompletion

学習完了の案内と件数、戻る操作。セッションの完了判定や保存は扱わない。

Storybook: `Pages/Study Session/StudyCompletion`。

[コンポーネント](../../../src/pages/study-session/ui/StudyCompletion.tsx) / [Story](../../../src/pages/study-session/ui/StudyCompletion.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | カード数12と戻る操作を渡す。 | 完了の案内、12枚の件数、戻る操作を表示する。 |
| `SingleCard` | カード数1を渡す。 | 1枚に対応した完了の案内を表示する。 |
| `Mobile` | 320×568の明るい画面で日本語の完了案内を表示する。 | 案内と件数が画面幅内に収まり、戻る操作に到達できる。 |
| `Tablet` | 768×1024の画面でカード数12の完了案内を表示する。 | 案内・件数・戻る操作の間隔を保って表示する。 |
| `Desktop` | 1280×800の画面で完了案内を表示する。 | 内容が広がりすぎず、件数と戻る操作を一緒に確認できる。 |
| `Dark` | 暗いテーマで完了案内を表示する。 | 完了の文言・件数・戻る操作・フォーカスを判別できる。 |
| `MobileDark` | 320×568の暗い画面で日本語の完了案内を表示する。 | 案内と件数が読め、戻る操作とフォーカスが画面内に収まる。 |

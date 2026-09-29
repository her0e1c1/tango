# CardOverlay

カードに重ねる補足情報の表示。渡された難易度と最終学習日時を使い、FSRSの計算は扱わない。

Storybook: `Features/Card Player/CardOverlay`。

[コンポーネント](../../src/features/card-player/ui/CardOverlay.tsx) / [Story](../../src/features/card-player/ui/CardOverlay.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 難易度4と固定した最終学習日時を渡す。 | 受け取った学習情報を表示する。 |
| `Mobile` | 同じ情報を狭い画面で表示する。 | 補足情報の収まりを確認できる。 |
| `Dark` | 同じ情報を暗いテーマで表示する。 | 補足情報を判別できる。 |

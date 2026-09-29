# CardOverlay

カードに重ねる補足情報の表示。渡された難易度と最終学習日時を使い、FSRSの計算は扱わない。

Storybook: `Features/Card Player/CardOverlay`。

[コンポーネント](../../../src/features/card-player/ui/CardOverlay.tsx) / [Story](../../../src/features/card-player/ui/CardOverlay.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Default` | 難易度4と固定した最終学習日時を渡す。 | 受け取った学習情報を表示する。 |
| `Mobile` | 同じ情報を狭い画面で表示する。 | 補足情報の収まりを確認できる。 |
| `Dark` | 同じ情報を暗いテーマで表示する。 | 難易度と日時の文字を暗い背景から判別できる。 |
| [TODO] `Tablet` | 768×1024の画面で固定した難易度と最終学習日時を表示する。 | 数値と日時が重ならず、表示領域内で読める。 |
| [TODO] `Desktop` | 1280×800の画面で学習済みと未学習の情報を切り替える。 | 補足情報の配置を保ち、未学習と難易度・日時の表示を区別できる。 |
| [TODO] `MobileDark` | 320×568の暗い画面で日本語の学習済み・未学習の情報を表示する。 | 文字と数値が背景に埋もれず、画面幅内で状態を区別できる。 |

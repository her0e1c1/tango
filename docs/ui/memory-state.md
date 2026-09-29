# MemoryState

渡された記憶状態の確率、日時、曲線と目標の表示。判定時刻はStory内で固定し、FSRSの計算精度や現在時刻の追従は扱わない。

Storybook: `Pages/CardView/MemoryState`。

[コンポーネント](../../src/pages/card-view/ui/MemoryState.tsx) / [Story](../../src/pages/card-view/ui/MemoryState.stories.tsx) / [一覧・共通前提](./README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `ShortTerm` | 短期の学習状態と最終学習から1分後の判定時刻を使う。 | 短い時間軸で確率、判定時点、次回復習と目標を表示する。 |
| `Empty` | 記憶状態なし。 | 状態がない旨を案内し、架空の確率や曲線を表示しない。 |
| `LongTerm` | 長期の学習状態と翌日の判定時刻を使う。 | 長期の曲線と各日時・確率を表示する。 |
| `Overdue` | 同じ学習状態の30日後を判定時刻にする。 | 復習期限を過ぎた状態と対応する曲線を表示する。 |
| `CoincidentMarkers` | 判定時刻を次回復習時刻と一致させる。 | 時点が一致しても判定時点と次回復習を識別できる。 |
| `MobileJapanese` | モバイル幅で日本語にする。 | 説明、日時、確率と図を画面幅内で確認できる。 |
| `Dark` | 期限超過を暗いテーマで表示する。 | 曲線、目標、各時点と本文を判別できる。 |

# エラー復旧画面を通常のアプリから独立させる

Status: Accepted

## Decision

単一の React root で、Provider・Router の外側に `AppErrorBoundary` を置く。`main.tsx` で App と Router を直接構成し、専用 bootstrap・起動前のリセット要求・DOM fallback は持たない。Service Worker は `injectRegister: "script"` で登録する。

- Data Router の root route にも `errorElement` を置き、route・root 描画エラーで同じ復旧画面を使う。認証エラーも通常の制御フローを保って同じ `AppErrorFallback` を使う。
- 復旧画面は Shared の表示 UI、Provider 外で使える i18n、復旧文言、明示的なキャッシュ削除だけに依存する。Auth・Firestore・永続化設定・Router は読み込まない。言語同期前は英語、同期後は保持した言語を使い、`html[lang]` と一致させる。
- Boundary 一か所で Window の `error`・`unhandledrejection` を監視し、unmount で解除する。未処理エラーを復旧状態へ渡すが、resource load error や処理済みの失敗は対象にせず、ブラウザー本来の診断も消さない。
- 復旧はページ全体の再読み込み、またはキャッシュ削除後の再読み込みとする。壊れた React 部分だけを作り直して、不完全な実行状態を継続しない。検証・保存・認証など想定内の失敗は、通常のエラー処理で扱う。
- キャッシュ削除は利用者の操作から直接実行する。Tango と同じ scope の Service Worker と、その scope を名前の末尾に持つ Workbox cache だけを削除し、現在の URL を再読み込みする。Firestore の保存・未同期書き込み・認証・設定・他アプリの保存領域は残す。
- 削除失敗時は通知して復旧画面に留まり、自動再試行しない。エラーを検知しただけではキャッシュを削除しない。

React・復旧画面自体の失敗、ブラウザーが通知しない失敗、永久に処理中の状態、entry module の読み込みや React root 成立前の初期化失敗は保証対象外とする。

## Context

通常の Provider や Page が壊れても復旧手段を表示する必要がある。route と React root ではエラーの境界が違うため、同じ復旧画面を両方で使う。

関連PR: [#1330](https://github.com/her0e1c1/tango/pull/1330)、[#1374](https://github.com/her0e1c1/tango/pull/1374)

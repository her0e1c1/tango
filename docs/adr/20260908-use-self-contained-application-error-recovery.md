単一 React root の Provider・Router 外に AppErrorBoundary を置き、route・認証エラーと独立した復旧 UI を共有する。専用 bootstrap は作らず、Service Worker は script 登録する。
Boundary は未処理の error・unhandledrejection を監視し、想定内の失敗は通常処理する。復旧 UI は Auth・Firestore・Router に依存せず、Provider 外 i18n を使う。
復旧は全体再読込か利用者操作による同一 scope の SW・Workbox キャッシュ削除後の再読込とし、利用者データは残す。削除失敗時は留まり、自動再試行しない。

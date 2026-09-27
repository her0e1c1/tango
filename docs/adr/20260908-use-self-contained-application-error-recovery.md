単一 React root の Provider・Router 外に AppErrorBoundary を置き、route・認証エラーと独立した復旧 UI を共有する。専用 bootstrap は作らず、Service Worker は script 登録する。
Boundary は未処理の error・unhandledrejection を監視し、想定内の失敗は通常処理する。復旧 UI は Auth・Firestore・Router に依存せず、Provider 外 i18n を使う。
復旧操作はデータを保持する Reload のみ提供する。解決しない場合はブラウザーのサイト設定から Tango のサイトデータを削除するよう案内し、ログアウト・端末内データの消失・匿名データを復元できないことを明示する。アプリによる削除処理や復旧専用 backend は持たない。

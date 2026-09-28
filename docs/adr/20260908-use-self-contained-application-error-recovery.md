単一 React root の Provider・Router 外に AppErrorBoundary を置き、route・認証エラーと独立した復旧 UI を共有する。Service Worker の script 登録と Cache Storage は変更しない。
Boundary は未処理の error・unhandledrejection を監視し、想定内の失敗は通常処理する。復旧 UI は Auth・Firestore・Router に依存せず、Provider 外 i18n を使う。
通常の Reload はデータを保持する。Firestore 初期化・購読開始の失敗時には、ログアウト・設定初期化・匿名データと未同期変更の消失を警告して削除操作を提供する。明示的な削除要求を保存して再読み込みし、Firebase 起動前に全 IndexedDB（Card replica を含む）・localStorage・sessionStorage を削除する。失敗時は起動せず再試行を案内し、Service Worker と PWA キャッシュは保持する。

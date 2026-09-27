単一 React root の Provider・Router 外に AppErrorBoundary を置き、route・認証エラーと独立した復旧 UI を共有する。専用 bootstrap は作らず、Service Worker は script 登録する。
Boundary は未処理の error・unhandledrejection を監視し、想定内の失敗は通常処理する。復旧 UI は Auth・Firestore・Router に依存せず、Provider 外 i18n を使う。
通常の Reload はデータを保持する。ローカル DB の削除操作は Firestore 初期化・購読開始の失敗時だけ表示し、描画・ルート・認証自体の失敗では Reload のみを提供する。削除では匿名データ・未同期の変更が失われることを警告し、Firestore の terminate → clearIndexedDbPersistence → Reload の順で実行する。認証・設定・PWA キャッシュを保持し、削除失敗時は復旧画面から再試行する。

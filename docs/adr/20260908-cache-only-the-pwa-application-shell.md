通常の Vite ビルドと vite-plugin-pwa で、ルートスコープの manifest・Service Worker を生成する。Storybook には含めない。
Workbox はビルド済みアプリと指定静的ファイルだけを事前キャッシュし、API 応答や利用者データを実行時キャッシュしない。
リモートのオフライン保存は Firestore、ローカル専用データは Entity Store が担い、標準生成物の独自検査は作らない。

通常の Vite ビルドと vite-plugin-pwa で、ルートスコープの manifest・Service Worker を生成する。Storybook には含めない。
Workbox はビルド済みアプリと指定静的ファイルだけを事前キャッシュし、API 応答や利用者データを実行時キャッシュしない。
当初の Entity Store によるローカル専用保存は、[同期 ADR](20260924-use-incremental-firestore-synchronization.md) の匿名 UID の SDK キャッシュ・通常アカウントの SDK キャッシュと Card 確定 replica・checkpoint へ置き換えられた。利用者データの保存は PWA キャッシュから分離し、標準生成物の独自検査は作らない。

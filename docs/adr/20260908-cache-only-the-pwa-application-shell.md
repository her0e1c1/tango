現在、Deck・Card・学習データは Firestore SDK の永続キャッシュとして IndexedDB に保存し、通常アカウントの Card replica・checkpoint は SDK キャッシュと別の IndexedDB データベースに保存する。PWA の Workbox は HTML・JS・CSS と指定静的ファイルのみを事前キャッシュし、API 応答・利用者データは実行時キャッシュしない。
通常の Vite ビルドと vite-plugin-pwa で、ルートスコープの manifest・Service Worker を生成する。Storybook には含めず、標準生成物の独自検査は作らない。
当初の Entity Store によるローカル専用保存は、[同期 ADR](20260924-use-incremental-firestore-synchronization.md) の方式に置き換えられた。

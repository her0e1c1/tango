# PWA ではアプリの静的ファイルだけをキャッシュする

Status: Accepted

## Decision

`vite-plugin-pwa` でルートスコープの manifest と Service Worker を生成し、アプリをインストール可能にする。

- Workbox で事前キャッシュするのは、ビルド済みの HTML・CSS・JavaScript と指定した静的ファイルだけとする。
- Firebase・API の応答、Deck・Card・学習データなどの利用者データは、Service Worker の実行時キャッシュに保存しない。
- リモートデータのオフライン保存は Firestore の永続キャッシュ、ローカル専用データは Entity Store のブラウザー保存が担う。
- Storybook のビルドには PWA plugin を含めない。

PWA の生成は通常の Vite ビルドに任せ、標準ツールが保証する生成物の独自検査は作らない。

## Context

Service Worker に利用者データも保存すると、保存責任が重複し、ログアウトや利用者切替後に古いデータを表示する恐れがある。静的ファイルのキャッシュは、インストールとオフライン起動に使う。

関連PR: [#333](https://github.com/her0e1c1/tango/pull/333)、[#452](https://github.com/her0e1c1/tango/pull/452)

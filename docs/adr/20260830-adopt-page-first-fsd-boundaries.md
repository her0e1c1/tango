# Page-first FSD の責務境界を採用する

Status: Accepted

## Decision

FSD v2.1 の Page-first 方針に従い、画面固有の表示・状態接続・処理・構成はその Page に置く。

- Features: 複数 Page で再利用する独立したユーザー操作。
- Entities: 再利用するドメイン状態とルール。
- Shared: 汎用的な技術機能・UI 部品。
- App: アプリの起動とライフサイクルの調整。

Page model の値と callback を UI へ接続するのは `*Page` と `*Container` だけとし、その他の UI は props で値を受け取る。

更新・非同期処理は個別の action、読み取りは query、React state・form・ref・cleanup は state hook が担う。Page model hook はこれらを接続し、値と呼び出し用 callback を Page・Container に渡す。

依存方向は Steiger の推奨ルールで検証する。

## Context

画面固有の部品を置くためだけに Feature を作ると、責務が曖昧になり、再利用されないスライスや迂回した依存が増える。

関連PR: [#1199](https://github.com/her0e1c1/tango/pull/1199)、[#1200](https://github.com/her0e1c1/tango/pull/1200)、[#1435](https://github.com/her0e1c1/tango/pull/1435)

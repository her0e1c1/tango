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

ドメイン固有の読み書き・購読・保存形式の変換は、利用する Page の数によらず `entities/<entity>/api` に置く。`pages/**/api` は作らない。これは FSD 自体の禁止ではなく、このリポジトリの配置方針とする。

Page は Entity の Public API を使い、画面固有の処理順序・navigation・通知は Page model に残す。API を移すために Entity 間の処理調整や汎用的な API 置き場を作らず、ドメイン非依存の通信処理だけを Shared に置く。

依存方向は Steiger の推奨ルールで検証する。

## Context

画面固有の部品を置くためだけに Feature を作ると、責務が曖昧になり、再利用されないスライスや迂回した依存が増える。

画面ごとに同じドメインの保存処理が散らばらないよう、Page-first と API の所有責任は分けて判断する。

関連PR: [#1199](https://github.com/her0e1c1/tango/pull/1199)、[#1200](https://github.com/her0e1c1/tango/pull/1200)、[#1435](https://github.com/her0e1c1/tango/pull/1435)、[#1688](https://github.com/her0e1c1/tango/pull/1688)、[#1739](https://github.com/her0e1c1/tango/pull/1739)

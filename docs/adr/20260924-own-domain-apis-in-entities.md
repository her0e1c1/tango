# ドメイン API は利用箇所数によらず Entity に置く

Status: Accepted

## Decision

ドメイン固有の通信・永続化は、所有する `entities/<entity>/api/` に置く。HTTP メソッドや利用する Page の数では配置を変えない。

- Firestore の読み書き・購読・保存データの検証と変換も Entity が担う。`src/pages` 以下に `api/` を作らず、別の segment に隠さない。
- Page 固有の処理順序・状態・画面遷移・通知は Page model に残し、Entity の公開 API を呼ぶ。複数 Page で再利用する処理だけを Feature に移す。
- ドメインに依存しないクライアントや保存の共通処理は Shared に置く。Entity 間の依存制約を守り、画面名の Entity や汎用の `entities/api` は作らない。

これは [Page-first 方針](./20260830-adopt-page-first-fsd-boundaries.md)に対する API 配置の補足であり、Page の API segment 禁止を FSD 自体の制約とは扱わない。

## Context

画面の利用数で保存処理の所有者を変えると、同じドメインの操作が Page と Entity に分散する。保存の責務は Entity、画面の処理順序は Page と分け、認証 API もこの境界にそろえた。

関連PR: [#1675](https://github.com/her0e1c1/tango/pull/1675)、[#1688](https://github.com/her0e1c1/tango/pull/1688)、[#1739](https://github.com/her0e1c1/tango/pull/1739)

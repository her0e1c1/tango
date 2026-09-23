# サーバー状態に TanStack Query を使う

Status: Superseded

後継: [Firestore の購読をリモート状態の正とする](./20260830-use-firestore-subscriptions-as-remote-state-source.md)

## Decision

サーバー状態は TanStack Query で管理する。残るローカルの Redux 状態には直接アクセスし、`src/selector` は削除する。

## Context

Deck と Card のサーバー状態に Redux selector を併用すると、TanStack Query と責務が重複する。

関連PR: [#278](https://github.com/her0e1c1/tango/pull/278)

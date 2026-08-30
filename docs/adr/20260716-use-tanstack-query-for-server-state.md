# サーバー状態にTanStack Queryを使用する

Status: Superseded

## Context

TanStack Queryはサーバー状態を管理するため、DeckとCardのデータにRedux selectorを併用すると責務が重複する。

## Decision

サーバー状態にはTanStack Queryを使用し、残るローカルRedux状態へは直接アクセスする。`src/selector`は削除する。[PR #278](https://github.com/her0e1c1/tango/pull/278)を参照する。

この決定は、[Firestoreの購読をリモート状態の正とする](./20260830-use-firestore-subscriptions-as-remote-state-source.md)により置き換えられた。

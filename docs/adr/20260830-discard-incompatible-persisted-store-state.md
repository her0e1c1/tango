# 互換性のない永続Store状態を破棄する

Status: Accepted

## Context

開発中のStore shapeに対して継続的にmigrationとlegacy formatの読み取りを追加すると、現在の設計より互換性layerの保守が大きくなる。現段階では、client-sideの永続Store shapeを安定した公開互換性契約として扱っていない。

## Decision

プロダクトがactive development中である間、互換性のないclient-side persisted Store stateを維持するためのmigrationやlegacy readerを原則追加しない。

互換性のない変更ではpersist versionを更新し、古いstateを破棄してvalidated default stateへ戻す。

特定の永続データについて互換性維持が明示的に要求された場合だけ例外とする。永続Storeをstable compatibility contractにするときは、この決定を再評価する。[PR #993](https://github.com/her0e1c1/tango/pull/993)を参照する。

# Firestore SDK に同期と永続キャッシュを委ねる

Status: Accepted

## Context

取得量を減らすための独自 cursor・checkpoint は、Firestore SDK と重複する状態管理や復旧処理を必要とする。tango では、未確認の read cost 最適化より同期処理の単純さを優先する。snapshot の全件表示は、通知のたびに全 document をネットワークから取得するという意味ではない。

この決定は [Firestore の購読をリモート状態の正とする](./20260830-use-firestore-subscriptions-as-remote-state-source.md) を更新する。

## Decision

- リモート状態は Firestore snapshot を正とし、書き込み処理から Store を直接変更しない。SDK が通知する現在の query 結果を検証して Store へ反映する。
- 永続キャッシュ、オフライン書き込み、未送信状態、rollback、再接続は Firestore SDK に委ねる。独自の replica、同期位置、保存 DB、差分バッファは持たない。再開時の全件再取得を避ける保証は設けない。
- Deck・Card は論理削除し、削除済み状態を保持する。物理削除と削除状態の解除は Rules で拒否する。
- `updatedAt` はサーバー時刻とし、回答日時や `lastStudiedAt` など業務上の日時と分離する。
- 学習履歴は App が購読する StudySession の状態を共有する。回答履歴は期間・Deck・表示上限に対応した通常の Firestore listener で取得する。
- query・解析・購読は各 Entity が直接所有する。購読のためだけの共通 adapter は作らず、Store は表示状態を保持する。

既存データの移行は行わず、新しい保存形式だけを対象とする。切替前に対応する Rules と必要な index を確認する。Emulator の成功は本番 index の準備完了や read cost を保証しない。

参考: [Firestore realtime listeners](https://firebase.google.com/docs/firestore/query-data/listen)、[Firestore offline persistence](https://firebase.google.com/docs/firestore/manage-data/enable-offline)。

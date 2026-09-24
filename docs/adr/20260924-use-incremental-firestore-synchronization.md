# Firestore の差分同期と取得済みデータの永続化

Status: Accepted

## Context

全 document を毎回取得して Store を置き換えると、保存件数に比例して転送量と解析量が増える。SDK の永続 cache は削除され得るため、取得位置だけを別に保存すると欠落した document を復元できない。

この決定は [Firestore の購読をリモート状態の正とする](./20260830-use-firestore-subscriptions-as-remote-state-source.md) の全体置換方針を更新する。

## Decision

サーバーを正とし、書き込み後の表示更新は Firestore snapshot からだけ行う。Deck・Card・StudySession・回答履歴の取得済み document と `lastUpdatedAt` を Entity の Zustand Store に持ち、`persist` を使って IndexedDB の一つのレコードへ原子的に保存する。Preferences へは追加しない。表示用の状態には未確定のローカル snapshot も重ねるが、永続化する同期位置は確定済みデータと対にする。

同期位置は Firebase project・UID・コレクション単位とし、回答履歴ではさらに期間の開始・終了、Deck、要求件数で分離する。Firestore Timestamp の秒とナノ秒を保存し、端末時計を同期位置に使わない。初回は全件、以降は `updatedAt` 順の `startAt(lastUpdatedAt)` で境界も再取得する。同一時刻の document を欠落させず、document ID と時刻で重複を統合する。通常の通知は `docChanges()` を適用し、再購読は最新の保存済み位置から始める。

全 document の `updatedAt` は本文、FSRS、学習進行、削除を含めて `serverTimestamp()` で更新し、Rules は `request.time` との一致を要求する。回答日時や学習開始・終了日時は発生時刻のまま保持する。StudySession の `lastStudiedAt` を独立した数値として保存し、同期時刻と画面に出す学習日時を混同しない。UI に渡す日時は従来どおり数値に変換する。

同期位置は `fromCache: false` かつ `hasPendingWrites: false` の結果を正常に解析した後だけ進める。未確定 server timestamp は SDK の推定値として表示へ取り込み、同期位置には使わない。書込キュー・再送・rollback は SDK に委ねる。独自 outbox は設けない。timestamp の範囲条件では未確定の値が除外されるため、境界指定には cursor を使う。停止後と UID 切替後の古い非同期通知は破棄する。

保存失敗時は古いデータと古い同期位置の組を残す。復元時に形や件数が一致しないスコープ、解析不能な保存データは破棄して初回取得から再構築する。SDK cache と保存済みの replica により、再読み込み・オフライン表示・匿名利用を維持する。cache のみの結果をサーバーとの同期完了とは扱わない。

Deck・Card は `deletedAt` による論理削除に統一し、tombstone を同期・保存する。Rules は本人を含め物理削除を拒否する。停止中の削除も再開時の差分に現れるため、サーバー側で tombstone を削除する運用は行わない。

StudySession は終了済みも保持し、同じ UID の学習再開と学習履歴は一つの購読を共有する。最新セッションが終了したときに古い未終了セッションを復活させない。

回答履歴は初回に対象範囲のサーバー確定した更新境界を取得してから、回答日時・ID の降順で要求件数＋1件を読む。その境界以降を件数制限なしで重ね、初回取得中の追加や過去日時の回答も拾う。保存する表示候補は要求件数＋1件に限定し、期間・Deck・件数上限ごとに独立して保持する。表示上限1000件、超過判定、不正件数、取得元と未送信状態を維持する。期間内の `answeredAt` 範囲と `updatedAt` 順の cursor を併用する query には非 null の更新時刻条件と複合 index を用意する。

ドメイン固有のクエリ・解析は Entity の `api/`、差分の状態反映は `model/actions/`、汎用の購読と永続化は Shared に置く。既存の購読関数の公開シグネチャを維持する。

既存 Firestore document の移行や旧形式への fallback は実装しない。切替時は新形式で作成されたデータだけを使用し、旧クライアントの書き込みは新 Rules で拒否する。アプリと Rules を切り替える前に追加 index の作成完了を確認する。Emulator の query 成功は本番 index の利用可能性を保証しない。

参考: [Firestore server timestamp](https://firebase.google.com/docs/firestore/manage-data/add-data#server_timestamp)、[query cursor](https://firebase.google.com/docs/firestore/query-data/query-cursors)、[snapshot metadata](https://firebase.google.com/docs/firestore/query-data/listen)、[Zustand persist](https://zustand.docs.pmnd.rs/reference/integrations/persisting-store-data)。

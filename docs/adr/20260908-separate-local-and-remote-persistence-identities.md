現在、匿名・通常アカウントの Deck・Card・学習データは UID に紐づく Firestore SDK の永続キャッシュとして IndexedDB に保存する。通常アカウントの Card は、確定済みの写し（replica）と差分同期の再開位置（checkpoint）を SDK キャッシュとは別の IndexedDB データベースに保存し、匿名は持たない。
所有者は Form 外で導出・検証し、インポート再試行時も UID 変更を拒否する。Deck・Card の編集・削除は所有者不一致を拒否する。完了条件は [書き込み ADR](20260924-propagate-firestore-write-errors.md) に従い、通信停止中の匿名のローカル完了と通常アカウントのサーバー応答を区別する。
当初の UID なしローカル保存・Deck モードによる子 Card の保存先選択・同じ ID を保ち親子保存成功までローカルを残す明示的なローカル→リモート移行は、[同期 ADR](20260924-use-incremental-firestore-synchronization.md) の方式と旧データを移行しない決定に置き換えられた。

当初の UID なしローカル保存と Deck モードによる子 Card の保存先選択は、[同期 ADR](20260924-use-incremental-firestore-synchronization.md) に置き換えられた。匿名・通常アカウントとも UID に紐づく SDK キャッシュを使い、確定 replica・checkpoint は通常アカウントの Card だけが持つ。
所有者は Form 外で導出・検証し、インポート再試行時も UID 変更を拒否する。Deck・Card の編集・削除は所有者不一致を拒否する。
当初の同じ ID を保ち親子の保存成功までローカルを残す明示的なローカル→リモート移行は、[同期 ADR](20260924-use-incremental-firestore-synchronization.md) の旧データを移行しない決定に置き換えられた。完了条件は [書き込み ADR](20260924-propagate-firestore-write-errors.md) に従い、通信停止中の匿名のローカル完了と通常アカウントのサーバー応答を区別する。

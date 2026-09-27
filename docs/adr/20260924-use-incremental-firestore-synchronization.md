各 Entity が query・検証・購読を所有する。Card は大量同期に備え、ID 単位の確定済み replica と UID・version・updatedAt checkpoint を IndexedDB の同一 transaction で保存し、再開時は updatedAt >= checkpoint で差分取得する。
Deck・Card は論理削除し、Rules で物理削除・復元を拒否する。未送信・rollback・再接続は SDK が担い、Card の pending 値と query の removed は replica に反映しない。破損・UID/version 不一致では全件取得する。
学習履歴は App の StudySession 購読を共有し、回答履歴は条件付き listener で取得する。旧データは移行せず、切替前に Rules・index を確認する。

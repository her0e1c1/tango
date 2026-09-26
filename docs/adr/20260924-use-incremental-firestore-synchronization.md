各 Entity が query・検証・購読を所有し、現在の snapshot だけを Store に反映する。キャッシュ・未送信・rollback・再接続は SDK に委ね、独自同期状態を持たない。
Deck・Card は論理削除し、Rules で物理削除・復元を拒否する。updatedAt はサーバー時刻とし、業務日時から分離する。
学習履歴は App の StudySession 購読を共有し、回答履歴は条件付き listener で取得する。旧データは移行せず、切替前に Rules・index を確認する。

Auth の利用者更新は Firebase Auth observer だけが行い、App が購読・匿名認証・利用者切替時の cleanup を管理する。
匿名認証前に保存済み Session を消し、UID・スコープ変更で旧 Firestore listener とリモート Card・Deck を片付ける。認証状態と実行 ID で古い完了を拒否する。
匿名利用者も認証済みとし、action は実行時 query、描画と effect は購読 hook で利用者を取得する。

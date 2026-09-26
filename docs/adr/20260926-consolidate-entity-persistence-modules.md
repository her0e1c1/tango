Entity の api は document.ts と firestore.ts に集約し、保存文書の定義・読み取り時の検証・変換は前者、操作入力の検証・Firestore アクセス・部分更新は後者が担う。
Auth の外部サインイン・サインアウト処理だけを追加ファイルの例外とし、Page 固有の処理順序は Page model に残す。
api 配下に単体テストを置かず、永続化の公開契約は Firestore 結合テストで検証する。

ドメイン固有の通信・永続化・検証・変換は利用箇所数によらず所有 Entity の api に置き、Page に api を作ったり別 segment に隠したりしない。
画面固有の処理順序・状態・遷移・通知は Page model が Entity の公開 API を使って担い、複数 Page で再利用する処理だけ Features に移す。
汎用クライアントは Shared に置き、Entity の独立性を守る。Page の api 禁止はリポジトリ固有の方針とする。

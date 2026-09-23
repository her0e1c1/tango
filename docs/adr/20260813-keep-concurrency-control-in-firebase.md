# データの整合性は Firebase 側で保証する

Status: Accepted

## Decision

Firebase 上のデータに原子性や排他制御が必要な場合は、Firestore のトランザクション・一括書き込み・Cloud Functions などを使う。整合性の保証を目的に、クライアント側へロックや書き込みキューを実装しない。

ただし、同じクライアント内の操作を守る制御は許容する。二重操作の無効化、画面遷移をまたぐ操作ロック、書き込み順序や最新の下書きを守る直列化が該当する。

これらはタブ間・端末間の排他制御にはならず、Firebase の認可・トランザクション・サーバー側の整合性保証を代替しない。

## Context

クライアントのロックは状態と複雑さを増やす一方、他のタブや端末からの書き込みを制御できない。

関連PR: [#1433](https://github.com/her0e1c1/tango/pull/1433)、[#1444](https://github.com/her0e1c1/tango/pull/1444)、[#1459](https://github.com/her0e1c1/tango/pull/1459)、[#1465](https://github.com/her0e1c1/tango/pull/1465)

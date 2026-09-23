# StudySession を Deck ごとにブラウザーへ保存する

Status: Superseded

後継: [StudySession の Firestore 永続化](./20260924-persist-study-session-lifecycle-in-firestore.md)

## Decision

再開可能な Session は StudySession Entity が管理する。Deck ID ごとに現在の Session を最大一つ持ち、他の Deck の Session と共存させる。

- 学習の開始・再開始で新しい Session 識別子を発行する。Card ID の順序・現在位置・最終学習時刻は Session が保持し、呼び出し元の配列変更や後からの Card の並べ替えに追従しない。
- Store はスキーマで検証・整形してブラウザーに保存する。Firestore でのアカウント同期は行わず、別ブラウザー・端末での再開位置は保証しない。
- Public API には個別の query・action・型・純粋なルールを公開する。Zustand Store や永続化 middleware は公開しない。
- Deck 削除処理が同じ Deck ID の Session も削除する。Page ごとの cleanup に任せず、リモート削除に失敗した場合は Session を残す。

現在位置と利用可能な Card の解決は Entity、画面固有の一時的な表示状態との接続は Page が担う。進行順序は[保存してから Session を進める決定](./20260908-persist-study-progress-before-session-advancement.md)に従う。

## Context

Session は学習画面以外からも参照される。Feature やコンポーネント内だけで管理すると、複数 Deck の共存・再読み込み後の再開・責務分離が難しい。再開位置のブラウザー保存は、アカウント同期する StudyProgress と分ける。

関連PR: [#990](https://github.com/her0e1c1/tango/pull/990)、[#1067](https://github.com/her0e1c1/tango/pull/1067)、[#1113](https://github.com/her0e1c1/tango/pull/1113)、[#1132](https://github.com/her0e1c1/tango/pull/1132)、[#1435](https://github.com/her0e1c1/tango/pull/1435)

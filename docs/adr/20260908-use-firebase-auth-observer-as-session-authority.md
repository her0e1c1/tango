# 認証ユーザーの反映元を Firebase Auth observer に一本化する

Status: Accepted

## Decision

Auth Entity の認証ユーザーを更新するのは Firebase Auth observer だけとする。サインイン・サインアウト処理や Page・route から直接反映しない。

- App は observer の開始・停止、匿名認証の初期化、利用者の切替時の cleanup を担う。
- 認証の初期化では、匿名認証の開始前に保存済み StudySession を消す。Firestore の購読は UID 変更または購読スコープ終了時に旧 listener を止め、リモートの Card・Deck を消す。
- Auth Entity は初期化中・未認証・認証処理中・認証済みの状態と実行識別子を持ち、古い完了や重複した完了を無効にする。Firebase の匿名ユーザーも認証済みとする。
- action が現在の利用者を必要とする場合は、実行時に Entity の非リアクティブな query を読む。描画時の getter の値を保持して渡さない。

描画値と effect の依存には、変更を購読する Entity hook を使う。getter を購読の代わりにしない。

## Context

認証ユーザーを複数の経路で反映すると observer と手動更新が競合し、古い利用者情報や利用者別の状態が残る。

関連PR: [#782](https://github.com/her0e1c1/tango/pull/782)、[#792](https://github.com/her0e1c1/tango/pull/792)、[#803](https://github.com/her0e1c1/tango/pull/803)、[#875](https://github.com/her0e1c1/tango/pull/875)、[#1467](https://github.com/her0e1c1/tango/pull/1467)、[#1469](https://github.com/her0e1c1/tango/pull/1469)

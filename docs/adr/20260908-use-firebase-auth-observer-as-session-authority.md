# Firebase Auth observerをSessionのauthorityとする

Status: Accepted

## Context

sign-in、sign-out、route、Pageなど複数の経路から認証Sessionをpublishすると、Firebaseのobserver eventと手動更新が競合し、古いidentityやuser-scoped stateが残る可能性がある。

## Decision

Firebase Auth observerを、認証UserをAuth Entityへpublishする唯一のauthorityとする。sign-in、sign-out、Page、routeから認証Userを直接publishしない。

Appのauth lifecycleはobserverの開始と停止、anonymous bootstrap、およびidentity切替前のuser-scoped state cleanupを所有する。Auth Entityはinitializing、unauthenticated、authenticating、authenticatedなどのSession状態とattempt identityを保持し、staleまたは重複した完了を無効化する。Firebaseのanonymous userもauthenticated Sessionとして扱う。

Action実行時に現在のidentityが必要な場合は、Actionの実行時点で非reactiveなEntity queryを読む。render中にgetterの結果を捕捉してActionへ渡さない。render値とeffect dependencyにはreactiveなEntity hookを使い、getterをsubscriptionの代わりにしない。

[PR #782](https://github.com/her0e1c1/tango/pull/782)、[PR #792](https://github.com/her0e1c1/tango/pull/792)、[PR #803](https://github.com/her0e1c1/tango/pull/803)、[PR #875](https://github.com/her0e1c1/tango/pull/875)、[PR #1467](https://github.com/her0e1c1/tango/pull/1467)、[PR #1469](https://github.com/her0e1c1/tango/pull/1469)を参照する。

# Data Router で画面離脱を制御する

Status: Accepted

## Decision

App は React Router の Data Router とルートツリーを管理する。Shared はルートパターン・遷移先の生成・共通の離脱ガードを持つ。Page は Router の hook を直接使い、名前を変えるだけのラッパーを作らない。

変更済み、または保存中の Form は、アプリ内遷移とブラウザーの離脱をガードする。保存成功後の遷移を許可する場合は、遷移先と history action が一致する一回限りの操作だけを通す。全体のガードは無効化しない。

ルートの照合と遷移先の生成には、同じ Shared の定義を使う。

## Context

クリックだけを防いでも、戻る・進む・直接遷移・ブラウザー離脱を一貫して扱えない。全体のガード解除は、無関係な遷移まで通してしまう。

関連PR: [#1213](https://github.com/her0e1c1/tango/pull/1213)、[#1374](https://github.com/her0e1c1/tango/pull/1374)

# Testの依存置換をproduction interfaceへ持ち込まない

Status: Accepted

## Context

ID generator、clock、callback、factoryなどをtestから差し替えるためだけにproduction functionへ注入すると、実行時には不要なparameterやdependency objectが公開interfaceへ残り、callerと実装の責務が広がる。testabilityのための抽象化がproduction requirementとして誤認される。

## Decision

production function、hook、component、およびmoduleのinterfaceは、production use caseだけから設計する。testまたはmockの都合だけでparameter、dependency object、callback、factory、optional override、exportを追加または変更しない。

production codeは実際の依存を直接importする。testで置換が必要な場合は、既存のproduction interfaceを維持したままtest側のmodule mockまたはspyを使用する。

複数のruntime adapter、configuration、lifecycle ownershipなどproduction上の要件がある場合は、その要件に基づくabstractionまたはdependency injectionを導入できる。test convenienceだけを根拠にはしない。

Testは既存のpublic boundaryからobservable behaviorを検証し、test-only seamをproductionへ作らない。[PR #454](https://github.com/her0e1c1/tango/pull/454)、[PR #1178](https://github.com/her0e1c1/tango/pull/1178)、[PR #1471](https://github.com/her0e1c1/tango/pull/1471)を参照する。

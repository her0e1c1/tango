# 文書化したE2Eケースをテスト契約の正とする

Status: Accepted

## Context

Playwright testだけをE2E仕様として扱うと、期待する利用者向け振る舞いとtest codeが分離されず、仕様の欠落や不要なtestを判断しにくい。また、共有する永続データを使うE2Eを並列実行すると、test間やretry間のidentity衝突によって結果が不安定になる。

## Decision

`docs/e2e/**`をE2Eで保証する利用者向け振る舞いの正とする。

各文書化test case IDはexactly one Playwright testに対応し、各Playwright testもexactly one文書化IDに対応させる。文書化されていないE2E testは追加しない。

各testはsame-categoryのYAML fixtureをexactly one参照する。fixtureはseed前にschemaと参照整合性をすべて検証し、UID、document ID、session IDなどのidentityをtest caseとretry単位で分離する。

fixtureの具体的なschema、継承、merge、命名規則は`docs/e2e/AGENTS.md`と`test/e2e/AGENTS.md`で管理する。[PR #1256](https://github.com/her0e1c1/tango/pull/1256)、[PR #1260](https://github.com/her0e1c1/tango/pull/1260)、[PR #1299](https://github.com/her0e1c1/tango/pull/1299)を参照する。

# 本番デプロイにWorkload Identity Federationを使用する

Status: Accepted

## Context

長期間有効なFirebase CLI tokenやservice-account JSON keyをGitHubへ保存すると、漏えい時の影響が長く続き、production deploymentが個人credentialへ依存する。production deployは検証済みのdefault branchと明示したenvironmentだけから実行する必要がある。

## Decision

GitHub ActionsからGoogle Cloudへのproduction deploymentには、GitHub OIDCとGoogle Workload Identity Federationによる短期credentialを使用する。

`main`へのpushでproduction Deploy workflowを開始し、canonicalなreusable `Test` workflowが成功した後だけFirebase HostingとFirestore Rulesをdeployする。target Firebase projectとdeploy対象をworkflowで明示する。

長期のFirebase CLI tokenまたはservice-account JSON keyをdeployment credentialとして使用しない。federated identityはimmutable repository identity、`refs/heads/main`、およびGitHubの`production` Environmentへ制限する。production deploy専用のleast-privilege service accountを使用し、`id-token: write`はdeployment jobだけに与える。

Google authentication actionを含むthird-party Actionsはimmutable commit SHAで固定する。generated ADC credentialをsource control、cache、artifactへ保存しない。具体的なresource ID、IAM role、setup手順はsetup scriptとworkflowで管理する。[PR #1238](https://github.com/her0e1c1/tango/pull/1238)、[PR #1259](https://github.com/her0e1c1/tango/pull/1259)、[PR #1341](https://github.com/her0e1c1/tango/pull/1341)を参照する。

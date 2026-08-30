# 本番デプロイにWorkload Identity Federationを使用する

Status: Accepted

## Context

長期間有効なFirebase CLI tokenやservice-account JSON keyをGitHubへ保存すると、漏えい時の影響が長く続き、production deploymentが個人credentialへ依存する。

## Decision

GitHub ActionsからGoogle Cloudへのproduction deploymentには、GitHub OIDCとGoogle Workload Identity Federationによる短期credentialを使用する。

長期のFirebase CLI tokenまたはservice-account JSON keyをdeployment credentialとして使用しない。

federated identityはimmutable repository identity、`main` branch、およびGitHubの`production` Environmentへ制限する。production deploy専用のleast-privilege service accountを使用し、OIDC token発行権限はdeployment jobだけに与える。

具体的なresource ID、IAM role、setup手順はsetup scriptとworkflowで管理する。[PR #1238](https://github.com/her0e1c1/tango/pull/1238)と[PR #1259](https://github.com/her0e1c1/tango/pull/1259)を参照する。

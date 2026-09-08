# GitHub OIDCでFirebase productionへdeployする

Status: Accepted

## Context

long-lived Firebase CLI tokenやservice-account JSON keyをrepository secretとして保持すると、credential rotation、漏えい時の影響範囲、利用主体の追跡に継続的な負担がある。production deployは検証済みのdefault branchと明示したenvironmentだけから実行する必要がある。

## Decision

`main`へのpushでproduction Deploy workflowを開始し、canonicalなreusable `Test` workflowが成功した後だけFirebase HostingとFirestore Rulesをdeployする。target Firebase projectとdeploy対象をworkflowで明示する。

production deploy jobだけに`id-token: write`を付与し、GitHub `production` environmentのWorkload Identity Federation providerとdeploy service accountを通じてshort-lived ADC credentialを取得する。legacy Firebase CLI tokenやuser-managed service-account JSON keyをdeploy credentialとして使用しない。

OIDC trust conditionはrepository identity、`refs/heads/main`、production environmentへ限定する。Google authentication actionを含むthird-party Actionsはimmutable commit SHAで固定し、generated ADC credentialをsource control、cache、artifactへ保存しない。[PR #1238](https://github.com/her0e1c1/tango/pull/1238)、[PR #1259](https://github.com/her0e1c1/tango/pull/1259)を参照する。

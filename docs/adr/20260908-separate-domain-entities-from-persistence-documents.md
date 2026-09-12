# Domain Entityとpersistence documentを分離する

Status: Accepted

## Context

1つのFirestore documentが複数のdomain conceptを保存している場合、physical documentをそのまま1つのEntityとすると、異なるrule、read model、write ownershipが同じmodelへ混在する。

## Decision

Entity境界はdomain behaviorとownershipで決め、Firestore document境界とは一致させなくてよい。複数Entityが1つのphysical documentを共有することを許可する。

raw document schemaはpersistence境界で一度validateし、各Entityへ必要なfieldだけを独立してmapする。storage上の同居だけを理由に、Entity model同士を依存させない。

既存documentの更新では、各persistence APIが対象domain conceptのfieldだけをpatchし、共有document内の他conceptのfieldを上書きしない。document作成時は、同居するconceptに必要なdefaultを含むphysical document全体を初期化できる。`updatedAt`などdocument共通のpersistence metadataはphysical documentの変更に合わせて更新する。

Card contentとStudyProgressはこの方針で同じCard documentを共有する。[PR #613](https://github.com/her0e1c1/tango/pull/613)、[PR #905](https://github.com/her0e1c1/tango/pull/905)、[PR #1123](https://github.com/her0e1c1/tango/pull/1123)を参照する。

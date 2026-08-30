# Page-first FSDの責務境界を採用する

Status: Accepted

## Context

画面固有の表示コンポーネントを置くためだけにFeature sliceを作ると、Featureが独立したユーザー機能ではなく、技術的な置き場になる。その結果、Page、Feature、Entityの所有責務が曖昧になり、再利用されないsliceや迂回した依存が増える。

## Decision

FSD v2.1のPage-first方針を採用し、画面固有の表示、状態接続、ワークフロー、構成は、その画面を所有するPage sliceに置く。

複数のPageから再利用される独立したユーザーワークフローだけをFeaturesに置く。再利用可能なドメイン状態とルールはEntities、広く再利用する技術・UI primitiveはShared、アプリケーションの起動とlifecycleの調停はAppに置く。

Page UIでアプリケーション、Feature、Entityの状態へ接続できる境界は`*Page`と`*Container`に限定し、それ以外のUIコンポーネントはprops-drivenとする。

FSDの依存方向はSteigerの推奨ルールで検証する。[PR #1199](https://github.com/her0e1c1/tango/pull/1199)と[PR #1200](https://github.com/her0e1c1/tango/pull/1200)を参照する。

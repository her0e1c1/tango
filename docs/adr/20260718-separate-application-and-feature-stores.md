# アプリケーション状態とFeature状態のStoreを分ける

Status: Superseded

## Context

永続化された設定は`App`と複数のFeatureから使用される。設定Featureの配下に置くと、アプリケーション全体の利用側がFeature実装へ依存する。

## Decision

アプリケーション全体で使用するStoreは`src/store`、共有hookは`src/hooks`に置く。study StoreのようなFeature固有のStoreは、singletonであっても所有するFeature内に置く。[PR #312](https://github.com/her0e1c1/tango/pull/312)を参照する。

この決定は、[Page-first FSDの責務境界を採用する](./20260830-adopt-page-first-fsd-boundaries.md)により置き換えられた。

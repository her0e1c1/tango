# Feature-Sliced Design を採用する

Status: Accepted

## Decision

フロントエンドの設計基準に [Feature-Sliced Design（FSD）](https://feature-sliced.design/) を採用する。

- レイヤー構造と依存方向の原則に従う。責務が明確になる独自のセグメント名・規約は許容し、意図的な差異では ADR に記録したルールを優先する。
- レイヤー・スライスの外からは、所有スライスの Public API を使う。
- アプリの型は明示的に import する。アンビエント宣言は Vite 環境変数やコンパイル時定数など、環境との取り決めに限る。
- 本番コードのレイヤーは `src` に置く。複数レイヤーを組み合わせる Storybook・テストのサポートコードは `src` の外に置き、Shared の本番コードとして扱わない。
- 依存方向・スライスの独立性・Public API は Steiger で検証し、汎用 lint で重複管理しない。

## Context

コードが増えても、配置と依存関係を同じ基準で判断できるようにする。

関連PR: [#542](https://github.com/her0e1c1/tango/pull/542)、[#550](https://github.com/her0e1c1/tango/pull/550)、[#617](https://github.com/her0e1c1/tango/pull/617)、[#623](https://github.com/her0e1c1/tango/pull/623)

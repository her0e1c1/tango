# 開発ツールを責務ごとに管理する

Status: Accepted

## Decision

- `devDependencies`: TypeScript、Biome、ESLint、Vitest、Playwright、Storybook、Knip など、ビルドや検証の再現に必要な Node.js 系ツール。
- `mise.toml`: Node.js、npm、Hadolint など、npm の外で配布されるランタイム・パッケージマネージャー・CLI。
- コンテナ環境: コンテナ内だけで使うツール。他の管理方法と重複させない。
- 個人環境: React Developer Tools など任意の対話ツール。プロジェクトの依存関係に含めない。

Node.js 系の検証処理は npm scripts に集約する。mise はランタイム管理・依存関係の準備・タスクの組み合わせを担い、CI は npm scripts を直接、または薄い mise タスク経由で呼ぶ。

Firestore エミュレータなどの外部サービスは、利用するワークフローかコンテナで準備する。環境ごとに起動方法が違っても、実行する検証コマンドは共通にする。

公式の配布元を優先し、再現性のために必要な場合を除いて同じツールを複数箇所で管理しない。

## Context

すべてを npm で管理すると、ツールの管理責任が曖昧になり、不要な依存関係が増える。

関連PR: [#449](https://github.com/her0e1c1/tango/pull/449)、[#662](https://github.com/her0e1c1/tango/pull/662)

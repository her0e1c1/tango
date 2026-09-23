# Calm Focus の共通デザイントークンを使う

Status: Accepted

## Decision

アプリ全体の見た目は Calm Focus に統一する。色・文字・余白・角丸・影・フォーカス・動きを、用途に名前を付けた CSS custom property で定義する。

- Tailwind theme は共通トークンを参照し、コンポーネントは用途に対応する utility を使う。
- ダークテーマはトークンの上書きで表し、コンポーネントごとに配色を作らない。Markdown など外部コンテンツのテーマ変数も共通トークンに対応させる。
- focus-visible・reduced motion・safe area・dynamic viewport・タッチ領域の共通基準は、アプリのスタイルと Shared UI が担う。
- 操作状態と振る舞いはコンポーネント、状態の見た目と遷移は共通トークンを使う CSS が担う。

## Context

値を各コンポーネントへ直書きすると、テーマやレスポンシブ表示、アクセシビリティの基準が画面間でずれる。外部スタイルの独自テーマとも競合する。

関連PR: [#256](https://github.com/her0e1c1/tango/pull/256)、[#291](https://github.com/her0e1c1/tango/pull/291)、[#1231](https://github.com/her0e1c1/tango/pull/1231)

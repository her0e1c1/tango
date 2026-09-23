# 独自実装より標準ツールを優先する

Status: Accepted

## Decision

- 別の方針が明示されない限り、公式 API・標準コマンド・通常のビルド機能を使う。
- API の名前を変えるだけのラッパー、標準ツールの生成物を再検査する処理、非公開実装に依存するチェックは作らない。
- 標準機能で必要な要件を満たせない場合だけ独自ツールを追加し、不足する機能を文書化する。

型検査などには `tsc` と Biome、PWA の生成には通常の Vite ビルド、永続化には Firebase の公開 API、画面遷移には React Router の hook を使う。専用のカバレッジスクリプトや Workbox 出力検査で置き換えない。

## Context

標準ツールが担う処理を独自コードでも実装すると、重複と保守コストが増える。

関連PR: [#452](https://github.com/her0e1c1/tango/pull/452)、[#777](https://github.com/her0e1c1/tango/pull/777)、[#1213](https://github.com/her0e1c1/tango/pull/1213)

# Biomeを採用する

Status: Superseded

## Context

ESLintとPrettierは、依存関係と設定を別々に管理する必要がある。Biomeはformatとlintを1つにまとめ、依存関係を減らせる。また、Rustで実装されており高速で、広く採用されている。

## Decision

ESLintとPrettierをBiomeに置き換える。[PR #223](https://github.com/her0e1c1/tango/pull/223)を参照する。

この決定は、[静的解析の責務をツールごとに分担する](./20260830-divide-static-analysis-responsibilities.md)により置き換えられた。

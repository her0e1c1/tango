# 同じ意味の Entity データは一つの型で表す

Status: Accepted

## Decision

同じ意味・形式の Entity データには、原則として一つの基本型を使う。

- 作成・編集・インポートで意味が同じ入力は、Entity model のスキーマと型を共有する。
- Form には利用者が編集する値だけを含める。ID・UID・所有者・時刻などは Form の外で組み合わせる。
- 生の保存ドキュメントなど、形式が実際に異なる境界だけに専用スキーマと mapper を置く。
- Domain・DTO・Store・View・Command・Repository・Value Object などは、異なる振る舞い・制約・形式を表す必要がある場合だけ導入する。

FSD や DDD の役割を埋めるだけの型・ラッパー・サービス・ディレクトリは作らない。抽象化を足す前に、既存コードを削除または直接再利用できないか確認する。

## Context

ほぼ同じデータを複数の型で表すと、項目の変更が型・スキーマ・mapper・テストへ波及し、型安全性以上に保守コストが増える。

関連PR: [#1047](https://github.com/her0e1c1/tango/pull/1047)、[#1048](https://github.com/her0e1c1/tango/pull/1048)、[#1191](https://github.com/her0e1c1/tango/pull/1191)、[#1461](https://github.com/her0e1c1/tango/pull/1461)

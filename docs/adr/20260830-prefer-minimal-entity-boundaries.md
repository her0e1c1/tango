# Entity境界では重複したデータ表現を作らない

Status: Accepted

## Context

同じEntityデータをDomain、DTO、Store、Viewなど複数のほぼ同一な型で表現すると、型を分けたこと自体を理由とするmapperやwrapperが増える。その結果、項目の追加や変更が複数の型、schema、mapper、testへ波及し、型安全性以上に理解と保守のコストが増える。

## Decision

アプリケーション内で同じ意味と形式を持つEntityデータには、原則として1つの基本型を使用する。

Domain、DTO、Store、View、Command、Repository、Value Objectなどの概念は、異なる振る舞い、制約、またはデータ形式を表現する必要がある場合だけ導入する。

mapperは入力と出力の形式が実際に異なる境界だけに置き、その境界の近くで管理する。FSDやDDDの役割を埋めるためだけの型、wrapper、service、directoryは追加しない。

新しい抽象化を追加する前に、既存の型や処理を削除または直接再利用できないか確認する。[PR #1191](https://github.com/her0e1c1/tango/pull/1191)を参照する。

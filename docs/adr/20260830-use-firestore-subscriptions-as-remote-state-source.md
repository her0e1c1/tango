# Firestore の購読をリモート状態の正とする

Status: Accepted

## Decision

リモート Entity の状態は `onSnapshot` だけから更新する。

- Shared は Firebase の汎用初期化、Entity は自身のスキーマ・解析・CRUD・クエリ・購読処理・リモート Store、App は認証に応じた購読の開始・停止を担う。CRUD のためだけに Feature を作らない。
- snapshot 全体を検証し、正常な場合だけコレクション全体を置き換える。`documentChanges()` による差分ミラーや、更新操作のメタデータ用 Store は作らない。不正なドキュメントが一件でもあれば部分反映せず、購読のエラー callback に渡す。
- 現行のエラー処理は console への記録のみで、利用者には表示しない。次の正常な snapshot か購読スコープの cleanup まで、直前の値が残り得る。将来のエラー表示を禁止するものではない。
- Firestore の公開 SDK の永続キャッシュを使う。非公開 API の検査や独自の準備完了管理は作らず、初期化を待ってアプリ表示を止めない。
- 書き込みは Entity の Firestore API から行う。リモート Store は楽観的更新や書き込み完了時に直接更新せず、snapshot を待つ。ローカル専用 Entity のブラウザー Store は対象外とする。
- 個別のリモート Card 削除は `deletedAt` を持つ削除済みデータとして保存し、購読側で表示対象から除外する。Deck 全体の削除では、子 Card を物理削除してから Deck を削除できる。削除方針は Entity の永続化 API、Store への反映は listener が担う。

この一方向の更新経路に例外を設ける場合は、別の ADR に記録する。

## Context

複数の経路から同じ状態を更新すると、反映順序や同期元が食い違う。不正なデータを黙って除外した不完全なコレクションも、正常な取得結果として公開しない。そのため、一件の不正データで正常な項目の更新も止まることを受け入れる。

関連PR: [#616](https://github.com/her0e1c1/tango/pull/616)、[#759](https://github.com/her0e1c1/tango/pull/759)、[#777](https://github.com/her0e1c1/tango/pull/777)、[#833](https://github.com/her0e1c1/tango/pull/833)、[#839](https://github.com/her0e1c1/tango/pull/839)、[#1200](https://github.com/her0e1c1/tango/pull/1200)

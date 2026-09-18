# Untrusted dataをruntime境界で検証する

Status: Accepted

## Context

TypeScriptの型はruntime dataを検証しない。Firestore document、browser persisted state、CSVなどのimport data、およびdomain dataになるform inputをcastだけで受け入れると、malformed dataがmapperやUIの内部で失敗し、partial stateや不明確なerrorを生む。

## Decision

externalまたはpersistence境界からdomain operationやStoreへ入るstructured dataは、Zod schemaを標準としてruntime validationする。format固有のsyntax parserやprimitiveなpresence checkは、その境界のcontractに応じて使用できる。`unknown`を型assertionだけでtrusted application dataへ変換しない。

Entityのuser inputとdomain invariantは`model/schema.ts`、raw persistence documentはparserに隣接する`api/document.ts`、CSVなどformat固有のsyntaxとerror contextはそのimport境界が所有する。schemaから型を推論し、同じ意味のvalidationをPage、Feature、Entityへ複製しない。

Firestore collection snapshotはatomicにparseする。1 documentでもinvalidならpartial collectionをpublishせず、document identityとfield pathを含むcontrolled errorとして既存のread error flowへ渡す。

legacy formatを受け入れる場合は互換性要件を明示し、現在のschemaへ正規化する。互換性のないpersisted Store stateは別のpersisted-state Decisionに従って破棄する。[PR #394](https://github.com/her0e1c1/tango/pull/394)、[PR #798](https://github.com/her0e1c1/tango/pull/798)、[PR #1047](https://github.com/her0e1c1/tango/pull/1047)、[PR #1048](https://github.com/her0e1c1/tango/pull/1048)、[PR #1150](https://github.com/her0e1c1/tango/pull/1150)を参照する。

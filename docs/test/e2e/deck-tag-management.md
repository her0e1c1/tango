# Deck Tag Management E2E テスト仕様書

## 目的

Deck ごとにタグを一覧表示・追加・名称変更・削除できることを確認する。
空の名前や同じ Deck 内の重複を拒否し、他の Deck のタグには影響しない。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| DECK-TAG-MANAGEMENT-01 | read | 正常系 | [Deck のタグを一覧表示できる](#deck-tag-management-01) |
| DECK-TAG-MANAGEMENT-02 | read | 正常系 | [タグがない場合は0件表示になる](#deck-tag-management-02) |
| DECK-TAG-MANAGEMENT-03 | write | 正常系 | [タグを追加できる](#deck-tag-management-03) |
| DECK-TAG-MANAGEMENT-04 | read | 異常系 | [空の名前ではタグを追加できない](#deck-tag-management-04) |
| DECK-TAG-MANAGEMENT-05 | read | 異常系 | [同じ Deck に同名のタグを追加できない](#deck-tag-management-05) |
| DECK-TAG-MANAGEMENT-06 | batch | 正常系 | [タグの名前を変更できる](#deck-tag-management-06) |
| DECK-TAG-MANAGEMENT-07 | read | 異常系 | [タグの名前を空に変更できない](#deck-tag-management-07) |
| DECK-TAG-MANAGEMENT-08 | read | 異常系 | [同じ Deck の別タグと同じ名前に変更できない](#deck-tag-management-08) |
| DECK-TAG-MANAGEMENT-09 | batch | 正常系 | [タグを削除できる](#deck-tag-management-09) |
| DECK-TAG-MANAGEMENT-10 | read | 正常系 | [タグの削除をキャンセルできる](#deck-tag-management-10) |

<a id="deck-tag-management-01"></a>

### DECK-TAG-MANAGEMENT-01 [TODO] Deck のタグを一覧表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck に複数のタグがあり、同じタグが複数の Card に付いている。
- 別の Deck にだけ存在するタグもある。

When:

- 対象 Deck のタグ管理を開く。

Then:

- 対象 Deck のタグが重複なく一覧表示される。
- 他の Deck にしかないタグは表示されない。

<a id="deck-tag-management-02"></a>

### DECK-TAG-MANAGEMENT-02 [TODO] タグがない場合は0件表示になる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck にはタグがなく、別の Deck にはタグがある。

When:

- 対象 Deck のタグ管理を開く。

Then:

- タグが0件であることが分かり、追加操作を利用できる。
- 他の Deck のタグは表示されない。

<a id="deck-tag-management-03"></a>

### DECK-TAG-MANAGEMENT-03 [TODO] タグを追加できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck には Card もタグもなく、別の Deck にはタグがある。

When:

- 対象 Deck に、別の Deck のタグと同じ名前のタグを追加し、リロードする。

Then:

- 入力した名前のタグが対象 Deck に一つ表示される。
- Card がなくてもタグを保持できる。
- 別の Deck のタグは変更されない。

<a id="deck-tag-management-04"></a>

### DECK-TAG-MANAGEMENT-04 [TODO] 空の名前ではタグを追加できない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck のタグ管理を開いている。

When:

- 未入力、または空白だけの名前でタグの追加を試みる。

Then:

- 名前が必要であることが分かり、入力を修正できる。
- タグは追加されず、既存のタグは変わらない。

<a id="deck-tag-management-05"></a>

### DECK-TAG-MANAGEMENT-05 [TODO] 同じ Deck に同名のタグを追加できない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck にタグが登録されている。

When:

- 対象 Deck の既存タグと同じ名前で追加を試みる。

Then:

- 同じ名前のタグが既にあることが分かり、入力を修正できる。
- 既存のタグが一つだけ残り、Card に付いているタグも変わらない。

<a id="deck-tag-management-06"></a>

### DECK-TAG-MANAGEMENT-06 [TODO] タグの名前を変更できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck の複数の Card に、変更対象のタグが付いている。
- 別の Deck にも同じ名前のタグがある。

When:

- 対象のタグを、その Deck にまだ存在しない名前に変更して保存し、リロードする。

Then:

- 対象 Deck の一覧と、そのタグが付いていた Card に新しい名前が表示され、元の名前は残らない。
- 他のタグと Card の本文・件数は変わらない。
- 別の Deck の同名タグは元の名前のままである。

<a id="deck-tag-management-07"></a>

### DECK-TAG-MANAGEMENT-07 [TODO] タグの名前を空に変更できない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck に名前を変更できるタグがある。

When:

- 変更後の名前を未入力、または空白だけにして保存を試みる。

Then:

- 名前が必要であることが分かり、入力を修正できる。
- 一覧と Card に付いているタグは元の名前のままである。

<a id="deck-tag-management-08"></a>

### DECK-TAG-MANAGEMENT-08 [TODO] 同じ Deck の別タグと同じ名前に変更できない

カテゴリ: `read`

区分: 異常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck に名前の異なるタグが二つある。

When:

- 一方のタグを、もう一方と同じ名前に変更して保存を試みる。

Then:

- 同じ名前のタグが既にあることが分かり、入力を修正できる。
- どちらのタグも元の名前のままで、Card に付いているタグも変わらない。

<a id="deck-tag-management-09"></a>

### DECK-TAG-MANAGEMENT-09 [TODO] タグを削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck の複数の Card に、削除対象のタグが付いている。
- 別の Deck にも同じ名前のタグがある。

When:

- 対象のタグの削除を選び、確認して削除を確定し、リロードする。

Then:

- 対象 Deck の一覧からタグが消え、その Deck の Card からも対象タグだけが外れる。
- 他のタグと Card 自体は残り、Card の本文・件数は変わらない。
- 別の Deck の同名タグは削除されない。

<a id="deck-tag-management-10"></a>

### DECK-TAG-MANAGEMENT-10 [TODO] タグの削除をキャンセルできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象タグの削除確認を表示している。

When:

- 削除をキャンセルする。

Then:

- 削除確認が閉じ、対象タグが一覧に残る。
- Card に付いているタグも変わらない。

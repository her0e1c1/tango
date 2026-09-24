# Deck Tag Management E2E テスト仕様書

## 目的

Deck ごとにタグを一覧表示・追加・名称変更・削除できることを確認する。
空の名前や同じ Deck 内の重複を拒否し、他の Deck のタグには影響しない。
登録したタグを同じ Deck の Card に設定し、そのタグで Card 一覧と Deck 閲覧を絞り込めることも確認する。
AND / OR、フィルター解除、条件の保存は [Card Filter の仕様](./card-filter.md) に従う。

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
| DECK-TAG-MANAGEMENT-11 | write | 正常系 | [登録したタグを Card に設定できる](#deck-tag-management-11) |
| DECK-TAG-MANAGEMENT-12 | write | 正常系 | [Card に設定したタグで絞り込める](#deck-tag-management-12) |
| DECK-TAG-MANAGEMENT-13 | batch | 正常系 | [オフラインでタグを管理して再接続後に同期できる](#deck-tag-management-13) |
| DECK-TAG-MANAGEMENT-14 | batch | 正常系 | [保留中の Card 編集後もタグ変更が維持される](#deck-tag-management-14) |
| DECK-TAG-MANAGEMENT-15 | batch | 正常系 | [匿名モードでもタグを管理して再読み込みできる](#deck-tag-management-15) |
| DECK-TAG-MANAGEMENT-16 | batch | 正常系 | [同じ名前の保存ではタグを更新しない](#deck-tag-management-16) |
| DECK-TAG-MANAGEMENT-17 | write | 正常系 | [Card からタグを外しても登録タグと他の Card を維持する](#deck-tag-management-17) |
| DECK-TAG-MANAGEMENT-18 | batch | 正常系 | [操作中のタグが消えてもタグ管理を続けられる](#deck-tag-management-18) |

<a id="deck-tag-management-01"></a>

### DECK-TAG-MANAGEMENT-01 Deck のタグを一覧表示できる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck に複数のタグがあり、同じタグが複数の Card に付いている。
- 別の Deck にだけ存在するタグもある。表示の入力例として、使用中の Card がない長い登録タグと幅320pxの画面を含む。

When:

- 対象 Deck のタグ管理を開く。

Then:

- 対象 Deck のタグが重複なく一覧表示され、各タグを使う Card の枚数が分かる。登録のみのタグは0枚と表示される。
- 幅320pxの画面でも長いタグ名が折り返され、行右端の名前変更・削除アイコンをメニューなしで直接押せる。各操作のタップ領域は48px以上で、読み上げ名には対象タグ名が含まれる。
- 名前変更を選ぶと同じ行の入力欄にフォーカスが移り、キャンセルすると元の名前変更アイコンへ戻る。
- 他の Deck にしかないタグは表示されない。

<a id="deck-tag-management-02"></a>

### DECK-TAG-MANAGEMENT-02 タグがない場合は0件表示になる

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

### DECK-TAG-MANAGEMENT-03 タグを追加できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck には Card もタグもなく、別の Deck にはタグがある。
- Deck 名に未保存の入力がある。

When:

- 対象 Deck に、別の Deck のタグと同じ名前のタグを追加する。
- Deck の変更を保存するかキャンセルしてから、リロードしてタグ管理を開く。

Then:

- 入力した名前のタグが対象 Deck に一つ表示される。
- Card がなくてもタグを保持できる。
- タグの追加では Deck 名の未保存入力を変えず、Deck の保存・キャンセル後も追加済みタグが残る。
- 未確定のタグ入力がある間は Deck の保存を実行できず、タグ入力が失われない。
- 別の Deck のタグは変更されない。

<a id="deck-tag-management-04"></a>

### DECK-TAG-MANAGEMENT-04 空の名前ではタグを追加できない

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

### DECK-TAG-MANAGEMENT-05 同じ Deck に同名のタグを追加できない

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

### DECK-TAG-MANAGEMENT-06 タグの名前を変更できる

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

### DECK-TAG-MANAGEMENT-07 タグの名前を空に変更できない

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

### DECK-TAG-MANAGEMENT-08 同じ Deck の別タグと同じ名前に変更できない

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

### DECK-TAG-MANAGEMENT-09 タグを削除できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck の複数の Card に、削除対象のタグが付いている。
- 別の Deck にも同じ名前のタグがある。

When:

- 対象のタグの削除アイコンを押し、同じ行に表示される確認で削除を確定し、リロードする。

Then:

- 削除確認は対象行に表示され、最初にキャンセルへフォーカスが移る。
- 確定後は対象 Deck の一覧からタグが消え、その Deck の Card からも対象タグだけが外れる。
- 他のタグと Card 自体は残り、Card の本文・件数は変わらない。
- 別の Deck の同名タグは削除されない。

<a id="deck-tag-management-10"></a>

### DECK-TAG-MANAGEMENT-10 タグの削除をキャンセルできる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象タグの削除確認を表示している。

When:

- 削除をキャンセルする。

Then:

- 行内の削除確認が閉じ、対象タグが一覧に残り、削除アイコンへフォーカスが戻る。
- Card に付いているタグも変わらない。

<a id="deck-tag-management-11"></a>

### DECK-TAG-MANAGEMENT-11 [TODO] 登録したタグを Card に設定できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck のタグ管理に登録済みのタグがあり、対象 Card にはまだ付いていない。
- 別の Deck にだけ登録されているタグもある。

When:

- 対象 Card の編集画面で、登録済みのタグを候補から選択して保存し、リロードして編集画面を開き直す。

Then:

- 選択したタグが対象 Card に表示され、編集画面でも選択されている。
- タグの候補には対象 Deck の登録済みタグが含まれ、他の Deck にだけ登録されたタグは含まれない。
- Card の本文・既存のタグと、他の Card のタグは変わらない。

<a id="deck-tag-management-12"></a>

### DECK-TAG-MANAGEMENT-12 Card に設定したタグで絞り込める

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck に、登録したタグを設定済みの Card と、そのタグを設定していない Card がある。
- Card 一覧は絞り込みなしで表示されており、別の Deck にも Card がある。

When:

- 対象 Deck の Card 一覧でそのタグをフィルター条件に選び、同じ Deck の閲覧画面も開く。

Then:

- 両画面とも選択したタグを持つ Card だけが表示され、件数は一致する Card 数となる。
- 選択したタグを持たない Card と、他の Deck の Card は表示されない。
- 絞り込みによって Card の本文や設定したタグは変わらない。

<a id="deck-tag-management-13"></a>

### DECK-TAG-MANAGEMENT-13 オフラインでタグを管理して再接続後に同期できる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck と Card が端末に読み込み済みである。

When:

- 通信を切り、タグの追加・改名・削除を行って再読み込みし、再接続する。

Then:

- 通信がない間も変更を保持し、再接続後も旧タグが復活しない。他のタグ・Card の本文・別 Deck は保持する。

<a id="deck-tag-management-14"></a>

### DECK-TAG-MANAGEMENT-14 保留中の Card 編集後もタグ変更が維持される

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- タグ付き Card と対象 Deck が端末に読み込み済みである。

When:

- 通信を切って Card の本文を保存し、直後に Deck 編集でそのタグを改名または削除してから再接続する。

Then:

- 先行する本文変更と後続のタグ変更が両方とも同期され、旧タグが復活しない。

<a id="deck-tag-management-15"></a>

### DECK-TAG-MANAGEMENT-15 匿名モードでもタグを管理して再読み込みできる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 匿名モードで作成した Deck と、その Deck に登録したタグを設定した Card が端末にある。

When:

- タグの追加・改名・削除を行い、通信がない状態で再読み込みする。

Then:

- 変更が端末内に保持され、Card の本文と他のタグは残る。匿名データをクラウドへ送信しない。
- 改名前のタグと削除したタグは、Card のタグ選択候補に表示されない。

<a id="deck-tag-management-16"></a>

### DECK-TAG-MANAGEMENT-16 同じ名前の保存ではタグを更新しない

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck の Card にタグが付いている。

When:

- タグ名の編集を開き、名前を変えずに保存する。

Then:

- タグ名・Card の本文・更新日時は変わらない。

<a id="deck-tag-management-17"></a>

### DECK-TAG-MANAGEMENT-17 [TODO] Card からタグを外しても登録タグと他の Card を維持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 対象 Deck のタグ管理で、解除対象のタグをその Deck にまだ存在しない名前へ変更して保存済みである。対象タグは Card の表示だけでなく Deck の登録タグとして保持されている。
- 次の各状態を独立した入力例とする。別の Deck にもタグ付き Card がある。

| 対象 Card のタグ | 同じ Deck の別 Card にも解除対象が付いているか | 解除後の対象 Card のタグ |
| --- | --- | --- |
| 解除対象だけ | はい | タグなし |
| 解除対象と別のタグ | はい | 別のタグだけ |
| 解除対象と別のタグ | いいえ。対象 Card が最後の割り当てである | 別のタグだけ |

When:

- 対象 Card の編集画面で対象タグを外して保存し、リロードして編集画面と Deck のタグ管理を開き直す。

Then:

- 対象 Card のタグは表の結果となり、解除したタグが再び付かない。
- Deck の登録タグと選択候補には対象タグが残る。最後の割り当てを外して使用中の Card が0件になっても、登録タグ自体は削除されない。
- 同じ Deck の他の Card に付いたタグは変更されない。
- 別の Deck のタグと Card への設定は変更されない。
- Card の本文・件数は変わらない。

<a id="deck-tag-management-18"></a>

### DECK-TAG-MANAGEMENT-18 操作中のタグが消えてもタグ管理を続けられる

カテゴリ: `batch`

区分: 正常系

Given:

- Fixture: [`deck-tag-management`](./fixture/deck-tag-management.yaml)
- 複数の Card が共有するタグと、それ以外のタグがある。
- 共有するタグは Card に付いているだけで、Deck の登録タグとしては保持されていない。

When:

- 共有するタグの名前変更または削除確認を開く。それぞれを独立した入力例とする。
- データ更新によってすべての Card から対象タグが外れ、表示中の一覧から対象タグが消える。
- 画面に残ったキャンセル操作を選ぶ。

Then:

- 対象タグが消えるとキャンセルへフォーカスが移り、ページを開き直さず操作を終了できる。
- 他のタグの名前変更と、新しいタグの追加を続けられる。

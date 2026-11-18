# Card Tag Management E2E テスト仕様書

## 目的

Card のタグと本文の保存、オフラインの変更の再接続、匿名データの保持を確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-TAG-MANAGEMENT-01 | write | 正常系 | [タグと両面の本文を Card 保存時にまとめて反映する](#card-tag-management-01) |
| CARD-TAG-MANAGEMENT-05 | write | 正常系 | [オフラインで保留したタグの変更を再接続後に利用できる](#card-tag-management-05) |
| CARD-TAG-MANAGEMENT-06 | write | 正常系 | [匿名のタグ編集を再読み込みと再接続後もローカルに保持する](#card-tag-management-06) |

<a id="card-tag-management-01"></a>

### CARD-TAG-MANAGEMENT-01 タグと両面の本文を Card 保存時にまとめて反映する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じタグを持つ複数の Card と、別 Deck の Card がある。
- 編集対象の Card には shared と kept が保存されている。

When:

- 一枚の Card の両面を変更し、shared を renamed に変え、kept を解除して new tag を追加する。Card を保存して再読み込みし、編集画面を開き直す。

Then:

- 変更したタグと両面の本文をまとめて保存し、再読み込み後も同じ内容を表示する。
- 編集した Card だけが変更され、他の Card と学習状態は維持される。

<a id="card-tag-management-05"></a>

### CARD-TAG-MANAGEMENT-05 オフラインで保留したタグの変更を再接続後に利用できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 連携済みアカウントで対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを変更して Card を保存し、再読み込みする。
- 再接続して保存を完了し、同じ Card を再び開く。

Then:

- オフライン中は保存中のまま編集画面に留まり、成功後の遷移を行わない。
- 保存を確定する前に再読み込みした編集画面では、最後にサーバーで確定したタグを表示する。
- 再接続して保存した後は変更したタグを表示し、他の Card のタグは変更しない。

<a id="card-tag-management-06"></a>

### CARD-TAG-MANAGEMENT-06 匿名のタグ編集を再読み込みと再接続後もローカルに保持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 匿名で Card を作成し、対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを追加・変更して Card を保存し、編集画面を開き直して再読み込みする。
- 再接続する。

Then:

- サーバー応答を待たずに保存でき、再読み込み後も変更したタグを表示する。
- Deck と Card は同じ匿名アカウントのブラウザーだけに保持され、クラウドへ送信されない。

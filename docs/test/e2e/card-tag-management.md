# Card Tag Management E2E テスト仕様書

## 目的

Card フォームでのタグ編集、保存境界、候補の集約と絞り込みを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-TAG-MANAGEMENT-01 | write | 正常系 | [確認なしのタグ編集を Card 保存時に反映する](#card-tag-management-01) |
| CARD-TAG-MANAGEMENT-02 | read | 正常系 | [未保存のタグ変更を破棄する](#card-tag-management-02) |
| CARD-TAG-MANAGEMENT-03 | write | 異常系 | [空名と重複を修正して保存する](#card-tag-management-03) |
| CARD-TAG-MANAGEMENT-04 | write | 正常系 | [Card のタグ集合で絞り込み最終割り当ての解除に追従する](#card-tag-management-04) |
| CARD-TAG-MANAGEMENT-05 | write | 正常系 | [オフラインで編集したタグを再接続後に同期する](#card-tag-management-05) |
| CARD-TAG-MANAGEMENT-06 | write | 正常系 | [匿名のタグ編集をローカルで保持する](#card-tag-management-06) |

<a id="card-tag-management-01"></a>

### CARD-TAG-MANAGEMENT-01 確認なしのタグ編集を Card 保存時に反映する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じタグを持つ複数の Card と、別 Deck の Card がある。

When:

- 一枚の Card でタグ名を直接入力し、別のタグを解除して新しいタグを追加し、Card を保存して再読込する。

Then:

- 入力と解除は確認・OK 操作なしに即時反映され、名前の入力中もフォーカスを保つ。保存前は元の内容を保持し、保存後は編集した Card だけが変更される。他の Card・本文・学習状態は維持される。
- browser error が発生しない。

<a id="card-tag-management-02"></a>

### CARD-TAG-MANAGEMENT-02 未保存のタグ変更を破棄する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 編集対象の Card にタグがある。

When:

- タグを追加・改名・解除した後、Card の未保存変更を破棄して再度編集画面を開く。

Then:

- 保存済みタグは操作前のままであり、下書きの変更は残らない。
- browser error が発生しない。

<a id="card-tag-management-03"></a>

### CARD-TAG-MANAGEMENT-03 空名と重複を修正して保存する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 編集中の Card に異なる名前のタグが二つある。

When:

- タグ名を空白だけ、または同じ Card の別タグと同じ名前に変更して保存を試みる。それぞれ独立した入力例とし、エラー後に有効な名前へ修正して保存する。

Then:

- エラーが入力欄に関連付けて表示され、不正な内容は保存できない。追加の確認画面は出ず、修正後は保存できる。
- browser error が発生しない。

<a id="card-tag-management-04"></a>

### CARD-TAG-MANAGEMENT-04 Card のタグ集合で絞り込み最終割り当ての解除に追従する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じ Deck の複数 Card が一つのタグを共有し、うち一枚だけに別のタグがある。

When:

- 共有タグの候補を確認し、一枚だけのタグで絞り込む。その Card から対象タグを外して保存し、残った選択条件を解除する。

Then:

- 候補は重複せず、別 Deck のタグを含まない。保存前の絞り込みは一枚に一致する。最後の割り当てを外した選択済みタグも解除でき、解除後は候補から消えて全 Card が表示される。Deck 閲覧も同じ条件を使用する。
- browser error が発生しない。

<a id="card-tag-management-05"></a>

### CARD-TAG-MANAGEMENT-05 オフラインで編集したタグを再接続後に同期する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 連携済みアカウントで対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを変更して Card を保存し、再読込してから再接続する。

Then:

- オフラインの保存・再読込後も編集内容を表示し、再接続後に同じ内容を保持する。他の Card のタグは変更されない。
- browser error が発生しない。

<a id="card-tag-management-06"></a>

### CARD-TAG-MANAGEMENT-06 匿名のタグ編集をローカルで保持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 匿名で Card を作成し、対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを追加・変更して Card を保存し、再読込して再接続する。

Then:

- 再読込後もタグが保持され、再接続後も匿名データはローカルに留まる。
- browser error が発生しない。

# Card Tag Management E2E テスト仕様書

## 目的

Card フォームでのタグ編集、保存境界、候補の集約と絞り込みを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-TAG-MANAGEMENT-01 | write | 正常系 | [タグと両面の本文を Card 保存時にまとめて反映する](#card-tag-management-01) |
| CARD-TAG-MANAGEMENT-02 | read | 正常系 | [未保存のタグ変更を破棄する](#card-tag-management-02) |
| CARD-TAG-MANAGEMENT-03 | write | 異常系 | [空のタグ名を修正して保存する](#card-tag-management-03) |
| CARD-TAG-MANAGEMENT-04 | write | 正常系 | [Card のタグで一覧と Deck 閲覧を絞り込む](#card-tag-management-04) |
| CARD-TAG-MANAGEMENT-05 | write | 正常系 | [オフラインのタグ保存は成功を待つ](#card-tag-management-05) |
| CARD-TAG-MANAGEMENT-06 | write | 正常系 | [匿名のタグ編集を再読込後もローカルで保持する](#card-tag-management-06) |
| CARD-TAG-MANAGEMENT-07 | read | 正常系 | [タグ入力中の Enter は Card を送信せず下書きを保つ](#card-tag-management-07) |
| CARD-TAG-MANAGEMENT-08 | write | 正常系 | [タグ名の前後空白だけを除いて選択順に保存する](#card-tag-management-08) |
| CARD-TAG-MANAGEMENT-09 | read | 正常系 | [入力直後の候補クリックで対象タグだけを解除する](#card-tag-management-09) |
| CARD-TAG-MANAGEMENT-10 | write | 異常系 | [重複するタグ名を修正して保存する](#card-tag-management-10) |
| CARD-TAG-MANAGEMENT-11 | read | 正常系 | [絞り込み候補は同じ Deck のタグを重複なく表示する](#card-tag-management-11) |
| CARD-TAG-MANAGEMENT-12 | write | 正常系 | [最終割り当てを外したタグの絞り込みを解除する](#card-tag-management-12) |
| CARD-TAG-MANAGEMENT-13 | read | 正常系 | [タグのオフライン保存中に再読込すると最後の確定内容を表示する](#card-tag-management-13) |
| CARD-TAG-MANAGEMENT-14 | write | 正常系 | [保留中のタグ変更を再接続後に同期する](#card-tag-management-14) |
| CARD-TAG-MANAGEMENT-15 | read | 正常系 | [再接続後も匿名のタグ編集はローカルに留まる](#card-tag-management-15) |

<a id="card-tag-management-01"></a>

### CARD-TAG-MANAGEMENT-01 タグと両面の本文を Card 保存時にまとめて反映する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じタグを持つ複数の Card と、別 Deck の Card がある。
- 一枚の Card の両面の本文とタグ名を変更し、別のタグを解除して新しいタグを追加している。

When:

- Card を保存して再読込し、編集画面を開き直す。

Then:

- 変更したタグと両面の本文をまとめて保存し、再読込後も同じ内容を表示する。
- 編集した Card だけが変更され、他の Card と学習状態は維持される。

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

<a id="card-tag-management-03"></a>

### CARD-TAG-MANAGEMENT-03 空のタグ名を修正して保存する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 編集中の Card に異なる名前のタグが二つある。

When:

- タグ名を空白だけに変更して保存を試み、エラー後に有効な名前へ修正して保存する。

Then:

- 空名のエラーが入力欄に関連付けて表示され、不正な内容は保存できない。
- 追加の確認画面は出ず、修正後は保存できる。

<a id="card-tag-management-04"></a>

### CARD-TAG-MANAGEMENT-04 Card のタグで一覧と Deck 閲覧を絞り込む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じ Deck の複数 Card が一つのタグを共有し、うち一枚だけに別のタグがある。

When:

- 一枚だけにあるタグを選択して絞り込み、Deck 閲覧を開く。

Then:

- 一覧は対象の一枚に一致し、Deck 閲覧も同じ絞り込み条件で対象の一枚だけを表示する。

<a id="card-tag-management-05"></a>

### CARD-TAG-MANAGEMENT-05 オフラインのタグ保存は成功を待つ

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 連携済みアカウントで対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを変更して Card を保存する。

Then:

- オフライン中は保存中のまま編集画面に留まり、成功後の遷移を行わない。

<a id="card-tag-management-06"></a>

### CARD-TAG-MANAGEMENT-06 匿名のタグ編集を再読込後もローカルで保持する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 匿名で Card を作成し、対象 Card とアプリを読み込み済みである。

When:

- オフラインでタグを追加・変更して Card を保存し、一覧の操作メニューから同じ Card の編集画面を開き直して再読込する。

Then:

- サーバー応答を待たずに保存でき、再読込後も変更したタグが保持される。

<a id="card-tag-management-07"></a>

### CARD-TAG-MANAGEMENT-07 タグ入力中の Enter は Card を送信せず下書きを保つ

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- Card の両面の本文を編集し、タグ編集を開いている。

When:

- タグ名を直接入力し、入力中に Enter を押してからタグ編集を閉じ、両面の本文を確認する。

Then:

- 名前の入力中と Enter を押した後もタグ名のフォーカスと入力値を保つ。
- Enter を押しても Card は送信されず、タグと両面の本文の下書きおよび保存前の元の内容を維持する。

<a id="card-tag-management-08"></a>

### CARD-TAG-MANAGEMENT-08 タグ名の前後空白だけを除いて選択順に保存する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- Card のタグ編集を開き、既存のタグ名を変更して新しいタグを追加できる。

When:

- 前後に空白のあるタグ名と内部に空白のある新しいタグ名を入力し、入力欄を離れるかタグ編集を閉じて Card を保存する。

Then:

- 入力欄を離れるかタグ編集を閉じると、入力した名前の前後空白だけを除き、名前の内部の空白を保つ。
- 選択順を保ち、新しいタグは末尾に追加して保存する。

<a id="card-tag-management-09"></a>

### CARD-TAG-MANAGEMENT-09 入力直後の候補クリックで対象タグだけを解除する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- Card のタグ編集を開いており、既存名と重複する行や新しいタグを追加できる。

When:

- 前後に空白のある既存名の重複行と新しいタグ名をそれぞれ入力した直後、入力欄から別の場所へ移動せずにその候補をクリックして解除する。

Then:

- 入力と解除は確認・OK 操作なしに即時反映される。
- 候補へのクリックは前後空白の除去によって失われず、クリックしたタグが一度の操作で解除される。
- 前後空白付きの重複行を候補から解除した場合は、その行だけが消え、元のタグは残る。

<a id="card-tag-management-10"></a>

### CARD-TAG-MANAGEMENT-10 重複するタグ名を修正して保存する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 編集中の Card に異なる名前のタグが二つある。

When:

- タグ名を同じ Card の別タグと同じ名前、または前後空白を除くと同じになる名前に変更して保存を試みる。それぞれ独立した入力例とし、エラー後に有効な名前へ修正して保存する。

Then:

- 重複のエラーが入力欄に関連付けて表示され、不正な内容は保存できない。
- 追加の確認画面は出ず、修正後は保存できる。

<a id="card-tag-management-11"></a>

### CARD-TAG-MANAGEMENT-11 絞り込み候補は同じ Deck のタグを重複なく表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じ Deck の複数 Card が一つのタグを共有し、別 Deck に固有のタグがある。

When:

- 対象 Deck の絞り込み候補を開く。

Then:

- 候補は同じ Deck の Card のタグを重複なく表示し、別 Deck のタグを含まない。

<a id="card-tag-management-12"></a>

### CARD-TAG-MANAGEMENT-12 最終割り当てを外したタグの絞り込みを解除する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 同じ Deck の一枚だけにあるタグで絞り込んでいる。

When:

- その Card から対象タグを外して保存し、残った選択条件を解除して Deck 閲覧を開く。

Then:

- 最後の割り当てを外した選択済みタグも解除でき、解除後は候補から消えて全 Card が表示される。
- Deck 閲覧も同じ条件を使用し、解除後は全 Card を表示する。

<a id="card-tag-management-13"></a>

### CARD-TAG-MANAGEMENT-13 タグのオフライン保存中に再読込すると最後の確定内容を表示する

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 連携済みアカウントで対象 Card とアプリを読み込み済みである。
- オフラインでタグを変更して Card を保存し、保存結果を待っている。

When:

- オフラインのまま保存中の編集画面を再読込してタグ編集を開く。

Then:

- 最後にサーバーで確定したタグを表示する。

<a id="card-tag-management-14"></a>

### CARD-TAG-MANAGEMENT-14 保留中のタグ変更を再接続後に同期する

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 連携済みアカウントで対象 Card とアプリを読み込み済みである。
- オフラインで変更したタグの保存結果を待っている間に、編集画面を再読込している。

When:

- 再接続し、同期後に Card の編集画面を再読込する。

Then:

- 保留中の変更は再接続後に同期し、再読込後は変更したタグを表示する。
- 他の Card のタグは変更されない。

<a id="card-tag-management-15"></a>

### CARD-TAG-MANAGEMENT-15 再接続後も匿名のタグ編集はローカルに留まる

カテゴリ: `read`

区分: 正常系

Given:

- Fixture: [deck-tag-management](./fixture/deck-tag-management.yaml)
- 匿名で作成した Card のタグをオフラインで追加・変更して保存し、編集画面を開き直して再読込している。

When:

- 再接続する。

Then:

- 匿名データは引き続きローカルに留まる。

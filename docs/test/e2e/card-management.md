# Card Management E2E テスト仕様書

## 目的

Card の作成・編集・削除が再読み込み後も反映され、保存を拒否された後も内容を失わず再試行できることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| CARD-MANAGEMENT-05 | write | 正常系 | [ログイン中の Deck に Card を作成できる](#card-management-05) |
| CARD-MANAGEMENT-06 | write | 正常系 | [匿名で利用中の Deck に Card を作成できる](#card-management-06) |
| CARD-MANAGEMENT-01 | write | 正常系 | [Card 編集内容を保存して再読み込み後も確認できる](#card-management-01) |
| CARD-MANAGEMENT-02 | write | 正常系 | [Card を削除できる](#card-management-02) |
| CARD-MANAGEMENT-07 | write | 異常系 | [Card の作成拒否後に重複なく再試行できる](#card-management-07) |
| CARD-MANAGEMENT-04 | write | 異常系 | [Card の編集失敗後に再試行できる](#card-management-04) |
| CARD-MANAGEMENT-08 | write | 異常系 | [Card の削除失敗後に再試行できる](#card-management-08) |

<a id="card-management-05"></a>

### CARD-MANAGEMENT-05 ログイン中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントでログインし、所有する Deck に Card がある。

When:

- Card 一覧の Actions → Add card を開き、Front / Back とタグを入力して Card を作成し、再読み込みする。

Then:

- 作成成功を通知する。
- 再読み込み・同期後も、同じアカウントの同じ Deck に1件だけ表示し、選択タグを保持する。別 Deck への追加や複製は起こらない。

<a id="card-management-06"></a>

### CARD-MANAGEMENT-06 匿名で利用中の Deck に Card を作成できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`local-deck-with-cards`](./fixture/local-deck-with-cards.yaml)
- 匿名ユーザーがこのブラウザーで利用できる Deck が存在する。

When:

- Card 一覧の Actions の Add card から約1,748文字の通常の段落の表面の本文と有効な裏面の本文を入力して Card を作成する。
- 作成後に画面を再読み込みする。

Then:

- Card の作成成功を通知する。
- 作成した Card が再読み込み後も同じ Deck の Card 一覧に表示され、表面の本文の全文と裏面の本文が切り詰められずに保存される。
- 作成した Card はこのブラウザーだけで一つ利用でき、クラウドには追加されない。

<a id="card-management-01"></a>

### CARD-MANAGEMENT-01 Card 編集内容を保存して再読み込み後も確認できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に編集対象の Card があり、同じ Deck の Card が選択用のタグを持つ。

When:

- 両面の本文とタグを変更して保存し、再読み込み後に編集画面を開く。

Then:

- 保存成功時だけ所属 Deck の Card 一覧へ戻り、更新成功を通知する。
- 再表示した編集画面に変更後の本文とタグを表示する。
- 元の Card を更新し、所属 Deck・学習結果・未変更の独自タグは保つ。

<a id="card-management-02"></a>

### CARD-MANAGEMENT-02 Card を削除できる

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- ログイン中のアカウントが所有する Deck には、削除対象の Card が1件だけある。

When:

- 一覧で削除を確定し、再読み込みする。

Then:

- 削除成功を通知し、一覧の Card 件数は0になる。再読み込み後も削除した Card を閲覧・学習できない。

<a id="card-management-07"></a>

### CARD-MANAGEMENT-07 Card の作成拒否後に重複なく再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- Google アカウントでログインし、所有する Deck の Card 作成がクラウドに拒否される。次の作成は成功する。
- 保存結果が不明な通信失敗は対象外とし、その状態からの再試行の重複防止は保証しない。

When:

- 拒否後に作成画面を開き直して同じ内容を入力し、再試行後に Card 一覧を再読み込みする。

Then:

- 作成成功を通知し、失敗通知は残らない。
- 同じアカウントの同じ Deck に、最初に入力した両面の本文を持つ Card が1件だけある。再読み込み・同期後も複製は増えない。

<a id="card-management-04"></a>

### CARD-MANAGEMENT-04 Card の編集失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-cards`](./fixture/remote-deck-with-cards.yaml)
- ログイン中のアカウントが所有する Deck に編集対象の Card がある。
- 初回の編集保存に失敗している。ブラウザー内の失敗では入力が残り、ローカル反映後の拒否では保存済みの内容に戻っている。次の編集は成功する。

When:

- 必要なら編集画面を開き直して同じ変更を入力し、再試行後に一覧を再読み込みする。

Then:

- 更新成功を通知して一覧へ戻り、再読み込み後も変更内容を表示する。

<a id="card-management-08"></a>

### CARD-MANAGEMENT-08 Card の削除失敗後に再試行できる

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`remote-deck-with-card`](./fixture/remote-deck-with-card.yaml)
- ログイン中のアカウントが所有する Card の初回削除がクラウドに拒否されている。
- Card は再び利用でき、削除ダイアログは閉じている。次の削除は成功する。

When:

- 削除ダイアログを開き直して再試行し、一覧を再読み込みする。

Then:

- ダイアログが閉じ、一覧から対象 Card が消える。再読み込み後も閲覧・学習できない。

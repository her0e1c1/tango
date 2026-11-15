# 学習開始画面 Storybook 結合テスト仕様書

## 目的

学習開始画面を入口とした `play` で、対象 Deck と学習条件に基づく開始、対象なしと開始失敗の案内を確認する。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STORYBOOK-STUDY-SESSION-START-01 | interaction | 正常系 | [学習を開始する](#storybook-study-session-start-01) |
| STORYBOOK-STUDY-SESSION-START-02 | render | 正常系 | [対象がない場合に理由を示す](#storybook-study-session-start-02) |
| STORYBOOK-STUDY-SESSION-START-03 | interaction | 異常系 | [開始に失敗した場合に復旧できる](#storybook-study-session-start-03) |
| STORYBOOK-STUDY-SESSION-START-04 | interaction | 正常系 | [学習タグと上限を開始対象へ反映する](#storybook-study-session-start-04) |
| STORYBOOK-STUDY-SESSION-START-05 | interaction | 正常系 | [開始操作時点の Card・設定・時刻で選び直す](#storybook-study-session-start-05) |
| STORYBOOK-STUDY-SESSION-START-06 | interaction | 正常系 | [復習期限・シャッフル・上限で出題を選ぶ](#storybook-study-session-start-06) |
| STORYBOOK-STUDY-SESSION-START-07 | interaction | 正常系 | [期限・画面復帰・状態変更で件数を更新する](#storybook-study-session-start-07) |
| STORYBOOK-STUDY-SESSION-START-08 | interaction | 正常系 | [学習用と閲覧用のタグ条件を混ぜない](#storybook-study-session-start-08) |
| STORYBOOK-STUDY-SESSION-START-09 | interaction | 正常系 | [アカウント変更後に元の Deck の学習を開始しない](#storybook-study-session-start-09) |
| STORYBOOK-STUDY-SESSION-START-10 | interaction | 正常系 | [開始とやり直しの保存待ち中に重ねて開始しない](#storybook-study-session-start-10) |
| STORYBOOK-STUDY-SESSION-START-11 | interaction | 正常系 | [Restart から新しい学習の先頭を表示する](#storybook-study-session-start-11) |
| STORYBOOK-STUDY-SESSION-START-12 | interaction | 異常系 | [Restart の保存失敗後も以前の学習を保持する](#storybook-study-session-start-12) |
| STORYBOOK-STUDY-SESSION-START-13 | render | 異常系 | [学習結果の取得失敗を対象0件と扱わない](#storybook-study-session-start-13) |
| STORYBOOK-STUDY-SESSION-START-14 | interaction | 正常系 | [折りたたまれた学習タグを選ぶと自動保存する](#storybook-study-session-start-14) |
| STORYBOOK-STUDY-SESSION-START-15 | interaction | 正常系 | [対象0件では開始操作を無効にする](#storybook-study-session-start-15) |

<a id="storybook-study-session-start-01"></a>

### STORYBOOK-STUDY-SESSION-START-01 学習を開始する

カテゴリ: `interaction`

区分: 正常系

Given:

- 対象 Deck に学習対象の Card があり、開始に必要な処理は成功する。

When:

- 学習開始画面で開始を選ぶ。

Then:

- 同じ Deck の最初の学習対象が学習画面に表示される。

<a id="storybook-study-session-start-02"></a>

### STORYBOOK-STUDY-SESSION-START-02 対象がない場合に理由を示す

カテゴリ: `render`

区分: 正常系

Given:

- 対象 Deck に Card はあるが、選んだ学習条件に一致する対象はない。

When:

- 学習開始画面を開く。

Then:

- 学習対象がないことを表示し、対象のないセッションを開始したかのように表示しない。

<a id="storybook-study-session-start-03"></a>

### STORYBOOK-STUDY-SESSION-START-03 開始に失敗した場合に復旧できる

カテゴリ: `interaction`

区分: 異常系

Given:

- 学習対象はあるが、開始に必要な処理が失敗する。

When:

- 学習開始画面で開始を選ぶ。

Then:

- 失敗と復旧のための操作が表示され、学習が始まったと誤認させない。

<a id="storybook-study-session-start-04"></a>

### STORYBOOK-STUDY-SESSION-START-04 [TODO] 学習タグと上限を開始対象へ反映する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面に、タグが異なる Card と選択中の学習タグがあり、選択に一致する Card は正の上限より多い。
- 学習上限は正の値・0・1 の各条件で確認し、開始の保存先は成功を返す。

When:

- 選択中の条件で学習を開始する。

Then:

- 選択した学習タグに一致する Card だけを出題する。正の上限では設定枚数、0では条件に合う全 Card、1では先頭の Card だけを対象にする。
- 開始画面の件数と始まった学習の Card 数が一致し、先頭 Card の表面を表示する。

<a id="storybook-study-session-start-05"></a>

### STORYBOOK-STUDY-SESSION-START-05 [TODO] 開始操作時点の Card・設定・時刻で選び直す

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面を表示した後に Card、設定、時刻のいずれかが変わり、学習対象条件が変化している。開始の保存先は成功を返す。

When:

- 現在選択中の学習タグで開始する。

Then:

- 表示を開いた時点の古い条件ではなく、開始した時点の Card・設定・時刻と選択中のタグで出題する。

<a id="storybook-study-session-start-06"></a>

### STORYBOOK-STUDY-SESSION-START-06 [TODO] 復習期限・シャッフル・上限で出題を選ぶ

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面に、期限が過去・現在・未来の Card と未評価 Card があり、判定時刻は既知である。
- 間隔反復とシャッフルの ON / OFF、学習上限の各条件を選べ、開始の保存先は成功を返す。

When:

- 選択した条件で新しい学習を開始する。

Then:

- 間隔反復 ON では期限が現在以前の Card を古い期限順に優先し、次に未評価 Card を選ぶ。同順位は標準順を維持し、未来期限は除外する。
- 間隔反復 ON のシャッフルは上限内に選んだ Card だけを並べ替える。
- 間隔反復 OFF では未来期限も含む全候補を標準順で選ぶ。シャッフル ON では全候補を並べ替えてから上限を適用する。

<a id="storybook-study-session-start-07"></a>

### STORYBOOK-STUDY-SESSION-START-07 [TODO] 期限・画面復帰・状態変更で件数を更新する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面に復習期限が既知の Card と設定があり、間隔反復は ON である。匿名・通常アカウントのそれぞれで確認する。

When:

- 期限到来、画面復帰、Card または設定の変更を迎える。時計の前進・後退も確認する。

Then:

- その時点の Card・設定・時刻で対象件数を更新する。期限前は対象外の評価済み Card が期限到来時に対象に戻る。

<a id="storybook-study-session-start-08"></a>

### STORYBOOK-STUDY-SESSION-START-08 [TODO] 学習用と閲覧用のタグ条件を混ぜない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面にタグが異なる Card があり、学習条件と Card 一覧・Deck 閲覧の条件は異なる。

When:

- 学習対象を確認してから Card 一覧と Deck 閲覧を開く。

Then:

- 学習対象件数には学習条件を使い、一覧と閲覧には独立した Card フィルターを使う。画面移動で両方の条件を上書きしない。

<a id="storybook-study-session-start-09"></a>

### STORYBOOK-STUDY-SESSION-START-09 [TODO] アカウント変更後に元の Deck の学習を開始しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面を開いた後にアカウントが切り替わり、元の Deck は現在のアカウントの対象ではない。

When:

- 元の Deck の開始操作を試みる。

Then:

- 元の Deck の学習画面へ進まず、元のアカウント向けの新しい学習を開始しない。

<a id="storybook-study-session-start-10"></a>

### STORYBOOK-STUDY-SESSION-START-10 [TODO] 開始とやり直しの保存待ち中に重ねて開始しない

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面に学習対象があり、開始またはやり直しの保存先は未完了の後に成功を返す。

When:

- 開始し、結果を待つ間に同じ開始操作を重ね、その後に成功結果が届く。

Then:

- 待機中は学習画面へ進まず、重ねた操作で別の学習を作り始めない。成功後に対象学習の先頭へ進む。

<a id="storybook-study-session-start-11"></a>

### STORYBOOK-STUDY-SESSION-START-11 [TODO] Restart から新しい学習の先頭を表示する

カテゴリ: `interaction`

区分: 正常系

Given:

- 以前の学習が途中まで進んだ Deck の Restart から学習開始画面を開き、開始の保存先は成功を返す。

When:

- 新しい学習を開始する。

Then:

- 以前の位置へ Continue せず、新しく選んだ対象の先頭 Card の表面を表示する。

<a id="storybook-study-session-start-12"></a>

### STORYBOOK-STUDY-SESSION-START-12 [TODO] Restart の保存失敗後も以前の学習を保持する

カテゴリ: `interaction`

区分: 異常系

Given:

- 以前の学習が途中まで進んだ Deck の Restart から学習開始画面を開いている。新しい学習の保存先は一度失敗し、再試行では成功する。

When:

- 新しい学習を開始し、失敗後に再試行する。

Then:

- 失敗を通知して再試行でき、失敗時点では以前の学習の Card・順序・現在位置を失わない。成功後に新しい学習へ進む。

<a id="storybook-study-session-start-13"></a>

### STORYBOOK-STUDY-SESSION-START-13 [TODO] 学習結果の取得失敗を対象0件と扱わない

カテゴリ: `render`

区分: 異常系

Given:

- 学習開始画面の対象 Deck に Card があるが、復習予定の判定に必要な学習結果は取得失敗を返す。

When:

- 学習開始画面を表示する。

Then:

- 取得できない旨を表示し、未評価または対象0件の正常な結果として表示しない。

<a id="storybook-study-session-start-14"></a>

### STORYBOOK-STUDY-SESSION-START-14 [TODO] 折りたたまれた学習タグを選ぶと自動保存する

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面の対象 Deck に複数のタグがあり、未選択の対象タグは折りたたまれている。タグ条件の保存先は成功を返す。

When:

- 追加のタグを展開し、対象タグを選ぶ。

Then:

- 選んだタグと対象件数を表示し、保存ボタンを使わず条件を保存する。実保存からの再読み込みはこの境界では確認しない。

<a id="storybook-study-session-start-15"></a>

### STORYBOOK-STUDY-SESSION-START-15 [TODO] 対象0件では開始操作を無効にする

カテゴリ: `interaction`

区分: 正常系

Given:

- 学習開始画面の対象 Deck に Card はあるが、学習タグに一致する Card はない。

When:

- 学習開始画面を表示し、開始操作を試みる。

Then:

- 対象0件を表示して開始ボタンを無効にする。新しい学習や再開対象は追加せず、学習画面へ進まない。

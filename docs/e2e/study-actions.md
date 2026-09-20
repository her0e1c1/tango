# Study Actions E2E テスト仕様書

## 目的

学習中の Card に対する mastered、non-mastered、移動 action が、学習結果と session 位置へ一度だけ反映されることを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-02 | write | [mastered action で学習結果を保存して次の Card へ進める](#swipe-02) |
| SWIPE-03 | write | [non-mastered action で学習結果を保存して次の Card へ進める](#swipe-03) |
| SWIPE-04 | write | [next-card action で次の Card へ進める](#swipe-04) |
| SWIPE-05 | write | [previous-card action で前の Card へ戻れる](#swipe-05) |
| SWIPE-12 | write | [学習結果の保存失敗後に同じ Card から再試行できる](#swipe-12) |
| SWIPE-28 | write | [オフラインの評価を reload 後に明示的に再試行できる](#swipe-28) |
| SWIPE-27 | batch | [同じ Card への同時評価をそれぞれ一度保存できる](#swipe-27) |

<a id="swipe-02"></a>

### SWIPE-02 mastered action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。
- swipe feedback が有効である。

When:

- 現在の Card に mastered action を実行する。

Then:

- 現在だった Card の difficulty が 1 下がり、学習回数が 1 増える。good の Attempt と Progress が原子的に保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- 実行した swipe 方向が、言語に依存しないアイコンとして共通 toast で短時間表示される。
- browser error が発生しない。

<a id="swipe-03"></a>

### SWIPE-03 non-mastered action で学習結果を保存して次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に non-mastered action を実行する。

Then:

- 現在だった Card の difficulty が 1 上がり、学習回数が 1 増える。again の Attempt と Progress が原子的に保存される。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-04"></a>

### SWIPE-04 next-card action で次の Card へ進める

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card に next-card action を実行する。

Then:

- 現在だった Card の difficulty・学習回数・最終学習時刻は変わらず、Attempt は作成されない。
- session の位置が次の Card へ進む。
- 次の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-05"></a>

### SWIPE-05 previous-card action で前の Card へ戻れる

カテゴリ: `write`

Given:

- Fixture: [`study-session-middle`](./fixture/study-session-middle.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- 現在の Card の前に別の Card がある。

When:

- 現在の Card に previous-card action を実行する。

Then:

- 現在だった Card の difficulty・学習回数・最終学習時刻は変わらず、Attempt は作成されない。
- session の位置が前の Card へ戻る。
- 前の Card の front text が表示される。
- browser error が発生しない。

<a id="swipe-12"></a>

### SWIPE-12 学習結果の保存失敗後に同じ Card から再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に、複数の Card を含む進行中の学習 session が存在する。
- swipe feedback が有効である。
- 前回の学習結果の保存要求が失敗し、同じ Card と session の位置が維持されている。
- 次の学習結果の保存要求は成功できる。

When:

- 現在の Card に同じ学習 action を再度実行する。

Then:

- 失敗した試行では swipe feedback が表示されず、成功した再試行だけ共通 toast が表示される。
- 保存前に保持した同じ操作 ID・評価・回答時刻・localDate・timeZone・session を使い、再試行した学習結果が一度だけ保存される。
- 保存失敗は通知され、未解決の評価がある間は別の評価や位置変更を受け付けない。保存中はボタンが無効になり、再試行は明示的に行う。
- session の位置が次の Card へ一度だけ進む。
- 次の Card の front text が表示される。
- 最初の保存失敗に伴う未処理の browser error が発生しない。

<a id="swipe-27"></a>

### SWIPE-27 同じ Card への同時評価をそれぞれ一度保存できる

カテゴリ: `batch`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session がある。
- 同じ所有者の2クライアントが同じ Card を学習している。同一ブラウザーの別タブでも、それぞれの未解決操作を保持する。

When:

- 両方のクライアントで同時に評価する。保存結果を確認できない場合は、保持した同じ操作を明示的に再試行する。

Then:

- 異なる操作 ID の評価がそれぞれ一度反映され、Attempt が2件残る。
- good / again は transaction の確定順で最新 Progress に適用する。同一クライアントが受け付けた別操作も失わない。
- 同じ ID・同じ入力の再試行は追加更新なしで成功し、異なる入力は拒否する。
- 遅延した古い操作と同時刻の操作も一度適用する。lastSeenAt は逆行せず、Attempt の answeredAt は元の時刻を保つ。
- Progress / Attempt は両方確定または両方未確定である。異なる Card に共通のロックを追加しない。

<a id="swipe-28"></a>

### SWIPE-28 オフラインの評価を reload 後に明示的に再試行できる

カテゴリ: `write`

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- 認証済みユーザーが所有する Deck に進行中の学習 session がある。
- 現在の Card の評価がオフラインで失敗し、元の操作がそのタブの sessionStorage に保持されている。

When:

- オンラインに戻して reload し、保持した評価を明示的に再試行する。

Then:

- 再接続・reload・再表示だけでは自動送信しない。成功するまで Card と session の位置は変わらない。
- 同じ ID・入力を復元し、Progress と Attempt を一度だけ保存してから一度だけ進む。
- 応答消失後も同じ入力で結果を確認できる。保持済み Attempt は Card / Deck の削除後も所有者が確認できるが、対象不在への新規書き込みは拒否する。
- 認証・session・Card・位置が変わった後の古い結果は現在の session を進めない。
- 他ユーザー・未認証・不正データ・不正な参照先・Attempt の変更や削除は拒否する。

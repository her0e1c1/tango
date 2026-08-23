# Swipe E2E テスト仕様書

## 目的

Deck の学習画面で swipe 操作が、表面・裏面表示、学習結果の保存、次 card への遷移まで破綻しないことを確認する。

## テストケース

| ID | カテゴリ | テストケース |
| --- | --- | --- |
| SWIPE-01 | read | [Deck 学習画面で card の表面と裏面を表示できる](#swipe-01) |
| SWIPE-02 | write | [Deck 学習画面で mastered swipe を実行できる](#swipe-02) |

<a id="swipe-01"></a>
### SWIPE-01 Deck 学習画面で card の表面と裏面を表示できる

**カテゴリ:** `read`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存され、Deck に学習順が設定されている。

**When**

- 対象 deck の学習画面を開く。

**Then**

- 現在の card の front text が表示される。

**When**

- 裏面表示を切り替える。

**Then**

- 現在の card の back text が表示される。
- browser error が発生しない。

<a id="swipe-02"></a>
### SWIPE-02 Deck 学習画面で mastered swipe を実行できる

**カテゴリ:** `write`

**Given**

- `docs/e2e/seed.md` の Deck/Card が localStorage に保存され、Deck に複数 card の学習順が設定されている。

**When**

- 対象 deck の学習画面を開く。
- mastered に対応する swipe 操作を実行する。

**Then**

- swipe した card の score が増える。
- swipe した card の学習回数が増える。
- 次の card の front text が表示される。
- browser error が発生しない。

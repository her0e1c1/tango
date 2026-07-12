# Swipe E2E テスト仕様書

## 目的

Deck の学習画面で swipe 操作が、表面・裏面表示、学習結果の保存、次 card への遷移まで破綻しないことを確認する。

## テストケース

### 1. Deck 学習画面で card の表面と裏面を表示できる

| 項目     | 内容                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| カテゴリ | read                                                                                        |
| 目的     | Deck 学習画面で現在の card の表面を表示し、裏面表示を切り替えられることを確認する。         |
| Given    | `docs/e2e/seed.md` の Deck/Card が localStorage に保存され、Deck に学習順が設定されている。 |
| When     | 対象 deck の学習画面を開く。                                                                |
| Then     | 現在の card の front text が表示される。                                                    |
| When     | 裏面表示を切り替える。                                                                      |
| Then     | 現在の card の back text が表示される。                                                     |
| Then     | browser error が発生しない。                                                                |

### 2. Deck 学習画面で mastered swipe を実行できる

| 項目     | 内容                                                                                                          |
| -------- | ------------------------------------------------------------------------------------------------------------- |
| カテゴリ | write                                                                                                         |
| 目的     | mastered に対応する swipe 操作で、現在の card の score と学習回数が更新され、次の card に進むことを確認する。 |
| Given    | `docs/e2e/seed.md` の Deck/Card が localStorage に保存され、Deck に複数 card の学習順が設定されている。       |
| When     | 対象 deck の学習画面を開く。                                                                                  |
| When     | mastered に対応する swipe 操作を実行する。                                                                    |
| Then     | swipe した card の score が増える。                                                                           |
| Then     | swipe した card の学習回数が増える。                                                                          |
| Then     | 次の card の front text が表示される。                                                                        |
| Then     | browser error が発生しない。                                                                                  |

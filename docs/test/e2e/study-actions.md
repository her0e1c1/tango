# Study Actions E2E テスト仕様書

## 目的

回答と学習位置が保存され、一部の保存に失敗しても保存済みの位置から学習を続けられることを確認する。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| STUDY-ACTIONS-01 | write | 正常系 | [good で評価して次の Card へ進む](#study-actions-01) |
| STUDY-ACTIONS-11 | write | 正常系 | [オフライン中の保存は再接続後に一度だけ反映される](#study-actions-11) |
| STUDY-ACTIONS-05 | write | 異常系 | [回答履歴の保存失敗でも学習状態と位置を維持する](#study-actions-05) |

<a id="study-actions-01"></a>

### STUDY-ACTIONS-01 good で評価して次の Card へ進む

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- 現在の Card の次に別の Card がある。

When:

- 現在の Card を good で評価する。

Then:

- 現在の Card に good の評価が一度だけ記録され、記憶状態と復習予定が更新される。
- Card の本文、タグ、所属 Deck、作成日時は変わらず、今回の評価が最終復習として反映される。
- 評価の保存後、次の Card の表面へ進む。

<a id="study-actions-11"></a>

### STUDY-ACTIONS-11 [TODO] オフライン中の保存は再接続後に一度だけ反映される

カテゴリ: `write`

区分: 正常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck を学習中で、初回認証と対象 Card の読み込みが完了している。
- 通信が切れており、評価後の保存が保留される。

When:

- Card を評価し、保存待ちの間に追加の評価を試みる。再接続して保存後に再読み込みする。

Then:

- オフライン中は保存が保留され、再接続後の保存成功まで追加の評価を受け付けない。
- 再読み込み後も学習結果と現在位置を復元できる。
- 再接続だけでは新しい回答として再登録されない。

<a id="study-actions-05"></a>

### STUDY-ACTIONS-05 回答履歴の保存失敗でも学習状態と位置を維持する

カテゴリ: `write`

区分: 異常系

Given:

- Fixture: [`study-session-start`](./fixture/study-session-start.yaml)
- ログイン中のアカウントの Deck で複数の Card を学習中である。
- スワイプ通知が有効である。
- 現在の Card の後に、さらに2枚以上の Card がある。
- 現在の評価では回答履歴の保存だけが失敗し、学習状態と位置は保存できる。次の Card の評価は保存できる。

When:

- 現在の Card を評価して保存失敗を確認し、画面を再読み込みする。その後、次の Card を評価する。

Then:

- 最初の評価では保存失敗を通知し、スワイプ通知は表示しない。次の評価ではスワイプ通知を表示する。
- 最初の評価では学習状態と次の位置だけが保存される。再読み込み後も次の Card を表示し、失敗した回答履歴を自動で再登録しない。
- 次の評価は一度だけ保存され、さらに次の Card の表面へ進む。回答履歴には成功した評価だけを記録する。

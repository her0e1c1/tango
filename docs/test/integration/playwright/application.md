# アプリ起動・復旧 Playwright 結合テスト仕様書

## 目的

実際の App 境界と画面を結合し、外部 I/O の待機・成功・失敗に対する起動案内、共通復旧、言語と操作を確認する。実際の保存領域の削除・再読み込み・PWA cache の復元は E2E に残す。検証境界と実行前提は [AGENTS.md](./AGENTS.md) に従う。

## テストケース

| ID | カテゴリ | 区分 | テストケース |
| --- | --- | --- | --- |
| PLAYWRIGHT-APPLICATION-01 | interaction | 異常系 | [共通エラーを現在の言語と元の理由で案内する](#playwright-application-01) |
| PLAYWRIGHT-APPLICATION-02 | interaction | 異常系 | [予期しない障害では最初の理由と一つの復旧操作を保つ](#playwright-application-02) |
| PLAYWRIGHT-APPLICATION-03 | interaction | 異常系 | [起動失敗時に手動削除と消失を案内する](#playwright-application-03) |
| PLAYWRIGHT-APPLICATION-04 | interaction | 異常系 | [保存データの初期化失敗では消失警告と起動待ちを表示する](#playwright-application-04) |
| PLAYWRIGHT-APPLICATION-05 | render | 異常系 | [保存済み言語を利用できない障害を英語で案内する](#playwright-application-05) |
| PLAYWRIGHT-APPLICATION-06 | interaction | 異常系 | [個別に処理された失敗では共通復旧画面に置き換えない](#playwright-application-06) |
| PLAYWRIGHT-APPLICATION-07 | interaction | 異常系 | [ローカルデータの削除失敗を案内して再試行を促す](#playwright-application-07) |
| PLAYWRIGHT-APPLICATION-08 | interaction | 異常系 | [ローカルデータ削除後の起動失敗を復旧画面に表示する](#playwright-application-08) |

<a id="playwright-application-01"></a>

### PLAYWRIGHT-APPLICATION-01 [TODO] 共通エラーを現在の言語と元の理由で案内する

カテゴリ: `interaction`

区分: 異常系

Given:

- 匿名ユーザーが日本語の Settings を利用できる。描画・ルート・認証の一時的な失敗を独立した状態例とし、元の失敗理由がある場合も確認する。
- 再読み込みの外部処理は受け付けるが、この境界では実際の保存領域の復元を検証しない。

When:

- 障害を発生させ、共通エラー画面の Reload を選択する。

Then:

- 見出し・説明・Reload を日本語で表示し、ページの言語も日本語にする。描画・ルート・認証の失敗にはローカルデータの削除操作を表示しない。
- 元の失敗理由があれば再読み込みの案内とともに表示する。Reload では元の URL の再読み込みを要求し、データ削除やログアウトを要求しない。

<a id="playwright-application-02"></a>

### PLAYWRIGHT-APPLICATION-02 [TODO] 予期しない障害では最初の理由と一つの復旧操作を保つ

カテゴリ: `interaction`

区分: 異常系

Given:

- 認証済みユーザーが Settings を利用している。予期しない実行時エラーと未処理の Promise の失敗を独立した状態例とする。
- 失敗の詳細がある場合とない場合があり、復旧操作の外部処理は受け付ける。

When:

- 障害と後続の障害を通知し、共通の復旧画面で Reload を選択する。

Then:

- 詳細の有無にかかわらず共通の復旧画面を表示し、ローカルデータの削除操作は表示しない。障害が重ねて通知されても復旧画面と操作を重複させない。
- 最初の障害にメッセージがあれば表示し、後続の障害で上書きしない。元のブラウザー診断は保持し、それ以外の予期しない診断を残さない。
- Reload で再読み込みを一度だけ要求する。データ削除・ログアウト・自動遷移は行わない。

<a id="playwright-application-03"></a>

### PLAYWRIGHT-APPLICATION-03 [TODO] 起動失敗時に手動削除と消失を案内する

カテゴリ: `interaction`

区分: 異常系

Given:

- 保存データと認証を変更せずに復旧画面を表示できるが、アプリ読み込みの外部処理は失敗を返す。再読み込み後も同じ失敗を返す。

When:

- 起動を試み、起動エラー画面の Reload を選択する。

Then:

- 共通の復旧画面を表示し、Reload の後も失敗を案内する。
- サイト設定からの手動削除とデータ消失を案内し、ローカルデータの削除操作を表示しない。自動で保存領域や設定を消去しない。

<a id="playwright-application-04"></a>

### PLAYWRIGHT-APPLICATION-04 [TODO] 保存データの初期化失敗では消失警告と起動待ちを表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 保存データの初期化または購読開始の外部処理が失敗し、ローカルデータを削除できる復旧画面を表示している。
- ローカルデータの削除と、その後のアプリ読み込みを待機から成功へ進められる。

When:

- 消失の警告を読んでローカルデータの削除を選択し、削除とアプリ読み込みの結果を順に受け取る。

Then:

- 削除前にログアウト、設定初期化、保存データと未同期変更の消失、匿名データを復元できないことを警告する。
- 削除と読み込みを待つ間は起動中表示にし、復旧操作を重ねて実行できない。アプリ読み込み成功後にアプリの画面へ切り替える。

<a id="playwright-application-05"></a>

### PLAYWRIGHT-APPLICATION-05 [TODO] 保存済み言語を利用できない障害を英語で案内する

カテゴリ: `render`

区分: 異常系

Given:

- 起動時の共通エラー画面で、保存済みの言語をまだ利用できない。

When:

- 障害が発生し、共通エラー画面を表示する。

Then:

- 英語のエラー画面を表示する。

<a id="playwright-application-06"></a>

### PLAYWRIGHT-APPLICATION-06 [TODO] 個別に処理された失敗では共通復旧画面に置き換えない

カテゴリ: `interaction`

区分: 異常系

Given:

- ユーザーがアプリの画面を利用している。画像などの個別リソースと、画面内で案内する操作の外部処理が失敗する条件を独立した状態例とする。

When:

- それぞれの失敗を発生させる。

Then:

- 画面全体を共通の復旧画面に置き換えず、利用中の画面と個別の失敗案内を維持する。

<a id="playwright-application-07"></a>

### PLAYWRIGHT-APPLICATION-07 [TODO] ローカルデータの削除失敗を案内して再試行を促す

カテゴリ: `interaction`

区分: 異常系

Given:

- 保存データの初期化失敗による復旧画面を表示しており、削除の外部処理は待機後に失敗を返す。

When:

- ローカルデータの削除を選択し、削除失敗の結果を受け取る。

Then:

- 削除を待つ間は起動中表示にし、復旧操作を重ねて実行できない。失敗後は復旧画面に戻る。
- アプリ読み込みを始めず、他の Tango のタブを閉じて再試行するよう案内する。

<a id="playwright-application-08"></a>

### PLAYWRIGHT-APPLICATION-08 [TODO] ローカルデータ削除後の起動失敗を復旧画面に表示する

カテゴリ: `interaction`

区分: 異常系

Given:

- 保存データの初期化失敗による復旧画面を表示している。削除の外部処理は成功し、その後のアプリ読み込みは待機後に失敗を返す。

When:

- ローカルデータの削除を選択し、削除とアプリ読み込みの結果を順に受け取る。

Then:

- 削除とアプリ読み込みを待つ間は起動中表示にし、失敗後は復旧画面へ切り替える。

Entity の async 書き込みは通常アカウントでサーバー応答を待ち、検証・保存失敗を reject で伝える。Page・Feature が結果を待って showToast で通知し、オフライン保留中は成功扱いしない。
匿名利用は通信停止のまま応答を待たず、遅延エラーを reportError に渡す。Store は snapshot だけで更新し、キュー・再送・rollback は SDK に委ねる。
操作は二重実行と古い通知・画面更新を防ぎ、保存結果でロックを解除する。Deck 削除後の Session 終了は独立した後処理とし、失敗は専用 toast で通知する。

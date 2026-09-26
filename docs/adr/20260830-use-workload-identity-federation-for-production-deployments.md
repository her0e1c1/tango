本番デプロイは main への push と共通 Test の成功を条件に、GitHub OIDC・Workload Identity Federation の短期認証で行う。
連携元をリポジトリ ID・main・production Environment に限定し、最小権限の専用アカウントとデプロイジョブだけの id-token 権限を使う。
長期キーを使わず、Actions は SHA 固定、ADC は保存しない。対象・IAM・設定手順はワークフローとセットアップスクリプトで管理する。

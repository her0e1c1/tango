# 本番デプロイに Workload Identity Federation を使う

Status: Accepted

## Decision

GitHub Actions から Google Cloud への認証は、GitHub OIDC と Workload Identity Federation による短期認証情報を使う。

- `main` への push で Deploy を開始し、共通の再利用可能な `Test` ワークフローが成功した後だけ Firebase Hosting と Firestore Rules をデプロイする。対象プロジェクトとデプロイ対象は明記する。
- 長期の Firebase CLI token やサービスアカウント JSON キーは使わない。連携元を不変のリポジトリ識別子・`refs/heads/main`・GitHub の `production` Environment に制限する。
- 本番デプロイ専用の最小権限のサービスアカウントを使い、`id-token: write` はデプロイジョブだけに与える。
- Google 認証を含むサードパーティー Actions はコミット SHA で固定する。生成した ADC 認証情報は Git・キャッシュ・成果物に保存しない。

リソース ID・IAM ロール・設定手順は、セットアップスクリプトとワークフローで管理する。

## Context

長期認証情報を GitHub に保存すると、漏えいの影響が長く続き、個人の認証情報にも依存する。本番デプロイは検証済みの既定ブランチと指定環境に限定する。

関連PR: [#1238](https://github.com/her0e1c1/tango/pull/1238)、[#1259](https://github.com/her0e1c1/tango/pull/1259)、[#1341](https://github.com/her0e1c1/tango/pull/1341)

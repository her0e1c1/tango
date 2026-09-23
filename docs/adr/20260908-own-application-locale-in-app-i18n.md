# アプリの表示言語を app/i18n で管理する

Status: Accepted

## Decision

`app/i18n` が i18next instance・React Provider・同梱の日英リソースを管理する。Provider はルートツリーを包み、言語変更で現在のルートやマウント済みの状態を作り直さない。

- 保存する言語設定は `system`・`en`・`ja` とする。
- `system` はブラウザーの優先言語を使い、その選択中だけ `languagechange` に追従する。未対応の言語は英語にする。
- リソースは同期的に初期化し、描画前に表示言語と `html[lang]` を一致させる。
- テスト・Storybook・E2E は実行環境の言語に依存せず、必要な言語を明示する。

## Context

Page ごとに言語を解決すると、文言とアクセシビリティ情報がずれたり、画面の状態が失われたりする。翻訳のリモート取得も初期表示やテストを不安定にする。

関連PR: [#1365](https://github.com/her0e1c1/tango/pull/1365)

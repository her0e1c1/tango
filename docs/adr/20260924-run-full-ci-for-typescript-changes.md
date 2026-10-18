E2E は変更ファイル種別によらず実行し、PR・push は dorny/paths-filter で ts・tsx・`eslint.config.mjs` の変更時だけビルド・単体テスト・Integration・Storybook・全コードチェックを実行する。
それ以外のコードチェックは Markdown・テスト仕様参照だけとし、手動と PR・push 以外はフルチェック、Dependency Review は全 PR で実行する。
最終 Test は E2E・変更判定・必要なチェックの成功を要求し、失敗・キャンセル・想定外のスキップを拒否する。

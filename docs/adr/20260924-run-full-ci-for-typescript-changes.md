PR・push は dorny/paths-filter で ts・tsx の変更を検出し、変更時だけビルド・テスト・全コードチェックを実行する。
それ以外は Markdown・テスト仕様参照だけを確認し、手動と PR・push 以外はフルチェック、Dependency Review は全 PR で実行する。
最終 Test は変更判定と必要なチェックの成功を要求し、失敗・キャンセル・想定外のスキップを拒否する。

公開境界の振る舞いを docs/test に Given / When / Then で記述し、E2E・Firestore・Storybook・専用単体仕様を Test ID で実装と結ぶ。専用仕様のない単体・結合テストは E2E を参照する。
E2E は仕様と同名ファイルを一対一にし、手順・前提は AGENTS.md、索引は README に置く。実装対応表や内部構造・カバレッジだけに基づくケースは作らない。
未実装 ID は [TODO] を付け、実装後に外す。lint:test-specs は簡易な ID 参照チェックに限り、空・skip テストや参照の存在を検証済みの証拠にしない。

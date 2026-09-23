# Store 単体テスト仕様書の記述規約

## 検証境界

- このディレクトリは、利用側から観測できる Entity の状態遷移、参照結果、設定の保存・復元を扱う。内部のオブジェクト形状、配列の参照同一性、Zustand の通知回数、フックの再レンダリング回数、JSON の構造だけを目的としたケースは作らない。
- Given は業務上の状態・入力、When は対象境界への操作またはイベント、Then は利用側が取得できる結果と維持される条件として書く。具体的な操作との対応は下表で示し、テスト手順やライブラリー呼び出しを振る舞いの代わりにしない。
- 同じ振る舞いの正常値・空・境界値・互換データは、入力と期待結果を列挙して同じケースのパラメーターにまとめる。関数や設定項目ごとの機械的なケース追加はしない。
- 初期状態は期待値を事前に書き込んで確認しない。復元は変更後のメモリ状態を引き継がず、保存データだけから確認する。更新・削除では、影響を受けてはいけないデータも非既定の値で用意する。
- 外部境界だけをテスト側で置き換え、検証する操作・参照・保存復元ロジックは実物を使う。Card の参照可能デックと設定の保存先は外部境界として用意してよい。テスト専用の本番インターフェースは追加しない。

| 対象 | 操作境界 | 観測境界 |
| --- | --- | --- |
| Auth | [`replaceAuthSession`](../../../../src/entities/auth/model/actions/replaceAuthSession.ts) | [`getAuthSession`](../../../../src/entities/auth/model/queries/getAuthSession.ts)、[`useAuthSession`](../../../../src/entities/auth/model/queries/useAuthSession.ts) の返す現在の認証状態 |
| Card | [`replaceRemoteCards`](../../../../src/entities/card/model/actions/replaceRemoteCards.ts)、[`clearRemoteCards`](../../../../src/entities/card/model/actions/clearRemoteCards.ts) | [`getCards`](../../../../src/entities/card/model/queries/getCards.ts)、[`useCards`](../../../../src/entities/card/model/queries/useCards.ts) の返すカード |
| Deck | [`replaceRemoteDecks`](../../../../src/entities/deck/model/actions/replaceRemoteDecks.ts)、[`clearRemoteDecks`](../../../../src/entities/deck/model/actions/clearRemoteDecks.ts) | [`getDecks`](../../../../src/entities/deck/model/queries/getDecks.ts)、[`useDecks`](../../../../src/entities/deck/model/queries/useDecks.ts) の返すデック |
| Preference | [`updatePreferences`](../../../../src/entities/preference/model/actions/updatePreferences.ts) と設定切り替え操作、保存設定の読み込み | [`preferencesStore`](../../../../src/entities/preference/model/store.ts) が提供する現在の設定値。内部のラッパー構造や保存形式では判定しない |
| Study Session | [`removeStudySession`](../../../../src/entities/study-session/model/actions/removeStudySession.ts)、[`clearStudySessions`](../../../../src/entities/study-session/model/actions/clearStudySessions.ts)、[`setStudySessionOwner`](../../../../src/entities/study-session/model/actions/setStudySessionOwner.ts)、[`replaceRemoteStudySessions`](../../../../src/entities/study-session/model/actions/replaceRemoteStudySessions.ts)、[`finishStudySessionLoading`](../../../../src/entities/study-session/model/actions/finishStudySessionLoading.ts) | [`getStudySession`](../../../../src/entities/study-session/model/queries/getStudySession.ts) と [`useRemoteStudySessionsLoading`](../../../../src/entities/study-session/model/queries/useRemoteStudySessionsLoading.ts) の返すセッション・取得待ち |

## 他のテストとの役割分担

- Firebase Auth の認証処理、過去の認証試行や購読からの遅延通知、認証変更時の各 Entity の消去はアプリケーションの結合テストで扱う。クリア操作単独の確認を、サインアウト全体の検証と表現しない。
- Firestore の document 検証、論理削除、購読・通信エラー、Rules の認可、リモート保存は [Firestore 結合テスト仕様書](../../integration/firestore/) で扱う。SDK をモックした既存の購読テストは参考として区別し、実通信の検証済み証拠にはしない。
- 画面の表示と操作は [Storybook 結合テスト仕様書](../../integration/storybook/)、ユーザーの一連の操作は [E2E テスト仕様書](../../e2e/) で扱う。同じ保証を既存の結合テストが十分に検証している場合は、その対応を記録し、同じ内容の単体テストを増やさない。
- カード選定、FSRS、保存失敗からの再試行など、別の規則・ワークフローはこの仕様書へ追加しない。

## ケースと既存テストの対応

- ID は既存の `UNIT-STORE-<AUTH|CARD|DECK|PREF|STUDY>-<NN>` を使い、各ファイル内で `01` から文書順の欠番なしとする。索引、アンカー、見出しをそろえる。README.md は全ケースの索引だけを記載する。
- 各ケースにカテゴリ、識別可能な既存テスト名、Given / When / Then を各 1 組記載する。準備は本文内に書き、専用 fixture ファイルは作らない。
- 「既存対応」は記載された期待値のアサーションを静的に照合できた場合、「要補完」は関連テストがあるが記載された入力や期待値の一部が未検証の場合とする。「未検証」はこの PR の参照テストに対応する検証がないことを示し、リポジトリ全体にテストがないと断定するものではない。
- アクションの実装が存在すること、describe 名だけの一致、テストの準備処理だけを対応済みの根拠にしない。対応状況はテスト実行の成功を意味しない。
- この変更は仕様書の見直しであり、未検証のケースをテスト実装済みとして扱わない。実行テストを追加・変更するときは既存の E2E ID 参照規約にも従い、期待仕様を本番実装の変更で黙って合わせない。

# 学習回答の単体テスト仕様

## 目的

学習回答 document が受け入れる評価と必須情報を確認する。回答した時刻と、保存の作成・更新時刻を区別して保持する。

共通の対象・書式・実行前提は [AGENTS.md](./AGENTS.md) を参照する。

## ケース一覧

| ID | カテゴリ | 振る舞い |
| --- | --- | --- |
| [UNIT-STUDY-ANSWER-01](#unit-study-answer-01) | `read` | 4種類の評価と独立した時刻を保持する |
| [UNIT-STUDY-ANSWER-02](#unit-study-answer-02) | `read` | 未対応・不完全な回答を拒否する |
| [UNIT-STUDY-ANSWER-03](#unit-study-answer-03) | `read` | 回答の識別情報と全時刻を必須にする |
| [UNIT-STUDY-ANSWER-04](#unit-study-answer-04) | `read` | 未確定の保存時刻と余分な採点項目を拒否する |

## ケース詳細

<a id="unit-study-answer-01"></a>

### UNIT-STUDY-ANSWER-01: 4種類の評価と独立した時刻を保持する

カテゴリ: `read`

対応テスト: [api/studyAnswerDocument.spec.ts][document] — `preserves the accepted %s rating and separate domain and persistence timestamps`

**Given**: UID `learner`、セッション・Deck・Card の ID、回答時刻 `1000`、作成・更新時刻 `2000` の document がある。時刻は Firebase Timestamp とする。

**When**: 回答を `{ type: "rating", rating }` とし、`again`、`hard`、`good`、`easy` のそれぞれで検証する。

**Then**: 全種類を受け入れ、指定した評価、ID、回答時刻、保存時刻を変更せず保持する。

<a id="unit-study-answer-02"></a>

### UNIT-STUDY-ANSWER-02: 未対応・不完全な回答を拒否する

カテゴリ: `read`

対応テスト: [api/studyAnswerDocument.spec.ts][document] — `rejects unsupported or incomplete answers %j`

**Given**: 回答以外の必須情報は有効である。

**When**: 次の回答を一つずつ検証する。

**Then**: すべて検証失敗となる。将来の回答形式を暗黙に受け入れない。

| 不正な回答 |
| --- |
| 文字列 `good` |
| `type=rating` だけで rating がない |
| `rating=mastered`、`not-mastered`、`unrated` |
| `type=text` と本文 |
| `type=choice` と選択肢 ID |
| 有効な rating に余分な `isCorrect=true` を加える |

<a id="unit-study-answer-03"></a>

### UNIT-STUDY-ANSWER-03: 回答の識別情報と全時刻を必須にする

カテゴリ: `read`

対応テスト: [api/studyAnswerDocument.spec.ts][document] — `requires %s`

**Given**: 有効な評価回答 document がある。

**When**: `uid`、`sessionId`、`deckId`、`cardId`、`answer`、`answeredAt`、`createdAt`、`updatedAt` のいずれか一つを削除して検証する。

**Then**: どの項目の欠落も検証失敗となる。

<a id="unit-study-answer-04"></a>

### UNIT-STUDY-ANSWER-04: 未確定の保存時刻と余分な採点項目を拒否する

カテゴリ: `read`

対応テスト: [api/studyAnswerDocument.spec.ts][document] — `rejects unsettled timestamps and fields reserved for future grading`

**Given**: 有効な評価回答 document がある。

**When**: 作成時刻を `null` にする、または document 直下に `isCorrect=null` を追加して検証する。

**Then**: どちらも検証失敗となる。

## 検証範囲の注意

document の schema を直接検証する。Firebase Timestamp 値は使うが、Firestore には接続しない。回答の保存、重複防止、回答履歴の取得、FSRS の更新はこの仕様の検証範囲ではない。

[document]: ../../src/entities/study-answer/api/studyAnswerDocument.spec.ts

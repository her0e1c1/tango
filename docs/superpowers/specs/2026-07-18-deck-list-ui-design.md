# デッキ一覧UI改善デザイン

## 背景

現行のデッキ一覧は、デッキごとに大きなカードを表示し、Study、Restart、Download、Edit、Deleteを同程度の強さで並べている。スマートフォンでは1画面に表示できるデッキ数が少なく、10件未満でも名前を見比べにくい。

また、学習状態はZustandのstudy storeに単一の`session`として保存されているため、あるデッキの学習を開始すると別デッキの進捗を保持できない。改善後は複数デッキの学習を並行して保持し、一覧からそれぞれ再開できるようにする。

## 目的

- スマートフォンで10件未満のデッキを素早く見つけられるようにする。
- 複数の学習中デッキを一覧上部にまとめ、各デッキを直接再開できるようにする。
- デッキ名を縦に読みやすくし、管理操作の視覚的な優先度を下げる。
- 既存の学習セッションを失わず、新しい複数セッション形式へ移行する。
- 現行のCalm Focusトークン、ダークモード、レスポンシブ設計を維持する。

## 非目標

- 検索、フィルター、タブを追加しない。対象件数が10件未満のため、常設コントロールは過剰である。
- 学習セッションをFirestoreへ同期しない。現行どおり端末内のLocalStorageだけに保存する。
- Header、Import、Settings、デッキ内カード一覧の情報設計は変更しない。
- 現在無効になっているReimport操作は有効化しない。

## 採用したUI

### ページ構成

デッキをカードグリッドではなく、スマートフォンで読みやすい1列のコンパクトリストとして表示する。

```text
Decks                                      7 decks

STUDYING                       3 decks · recent first
┌──────────────────────────────────────────────┐
│ Design Systems       Design  9 / 42 · 5m  ▶ ⋯│
│ English Phrasal...   English 27 / 64 · 1d ▶ ⋯│
│ AWS Certification   Tech   38 / 120 · 3d  ▶ ⋯│
└──────────────────────────────────────────────┘

OTHER DECKS                         4 decks · A–Z
┌──────────────────────────────────────────────┐
│ French Vocabulary   French  52 cards  Study ⋯│
│ Japanese History    History 38 cards  Study ⋯│
│ Mathematics Basics  Math    24 cards  Study ⋯│
└──────────────────────────────────────────────┘
```

### Studyingセクション

- 現在セッションを持つデッキを表示する。
- `lastStudiedAt`の降順で並べる。
- デッキ名、カテゴリ、`currentIndex + 1 / cardOrderIds.length`、最終学習時刻、進捗バーを表示する。
- Continueボタンから対象デッキの既存セッションを再開する。
- 0件の場合は見出しを含めて表示しない。

### Other decksセクション

- 現在セッションを持たないデッキを表示する。過去に学習済みでも、現在セッションがなければこのセクションに含める。
- デッキ名の昇順で並べる。
- デッキ名、カテゴリ、デッキ内のカード総数を表示する。
- Studyボタンから既存の開始設定画面へ移動する。
- 0件の場合は見出しを含めて表示しない。

### 操作

- デッキ名または行の主領域を押すと、既存のカード一覧へ移動する。
- Continueは既存セッションの学習画面へ移動し、対象セッションの`lastStudiedAt`を更新する。
- Studyは開始設定画面へ移動する。
- 各行の「…」は`DeckActionsMenu`を開く。
- メニューにはDownload、Edit、Deleteを表示する。
- 学習中デッキだけRestartを追加し、開始設定画面から新しいセッションを作り直せるようにする。
- Deleteは既存の確認を維持し、削除成功後に対象デッキのセッションも除去する。

Headerのロゴ、ダークモード、Import、Settingsは現行どおり維持する。新しいフローティングボタンは追加しない。

## 学習状態モデル

### 永続化する状態

単一の`session`を、デッキIDをキーにした`sessionsByDeckId`へ変更する。

```ts
interface StudySession {
  deckId: DeckId;
  cardOrderIds: CardId[];
  currentIndex: number;
  lastStudiedAt: number;
}

interface PersistedStudyState {
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>;
}
```

`showBackText`、`autoPlay`、`lastSwipe`は現在表示中の学習画面だけが使う一時的なUI状態として、従来どおり永続化対象外にする。

### Store操作

- `startStudy(deckId, cardOrderIds)`は対象デッキのセッションだけをindex 0で作成または置換し、`lastStudiedAt`を現在時刻にする。
- `touchStudy(deckId)`はContinueまたは直接の学習画面表示時に対象セッションの`lastStudiedAt`だけを更新する。
- `setCurrentIndex(deckId, currentIndex)`は対象セッションのindexと`lastStudiedAt`だけを更新する。
- `removeStudy(deckId)`は対象デッキのセッションだけを削除する。
- 認証解除などアプリ全体のリセットでは、すべてのセッションと一時UI状態を削除する。
- route用selectorは`deckId`で該当セッションを直接返す。

セッション完了時は対象デッキのセッションだけを削除し、ほかのデッキの進捗を維持する。

### LocalStorage移行

study storeの永続化versionを2から3へ上げる。

- version 2の有効な単一`session`は、同じ`deckId`をキーにした` sessionsByDeckId`へ移す。
- 移行したセッションの`lastStudiedAt`は`0`にする。移行直後は最大1件のため並び順に影響せず、次回のStartまたはContinueで実時刻へ更新される。
- version 1も既存のsanitizerを経由して同じversion 3形式へ移す。
- 不正なセッションはその要素だけを破棄し、有効な別セッションを巻き込まない。
- 有効条件は、`deckId`と全card IDが文字列、`cardOrderIds`が空でない、`currentIndex`が0以上かつ配列長未満、`lastStudiedAt`が有限の非負数であることとする。

## コンポーネント境界

### `studyStore`

複数セッションの保存、対象デッキだけの更新、永続化移行、入力値のsanitizationを担当する。画面遷移やデッキ表示順は担当しない。

### `DeckListContainer`

remote collectionのデッキ・カードと、hydration済みの` sessionsByDeckId`を結合する。表示用データをStudyingとOther decksへ分割し、Studyingは最終学習時刻降順、Other decksは名前昇順にする。各デッキのカード総数もここで算出する。

LocalStorageのhydrationが終わるまではセクションを確定せず、全デッキが一度Other decksへ表示された後に移動するちらつきを防ぐ。

### `DeckListTemplate`

受け取った2セクションを描画する。store、remote collection、画面遷移には依存しない。空のセクションは描画しない。

### `DeckCard`

既存の大きなカードをコンパクトな行へ変更する。表示データとcallbackだけを受け取り、学習状態の取得や並び替えは行わない。長いデッキ名は1行で省略し、主操作のタッチ領域を44px以上にする。

### `DeckActionsMenu`

管理操作をまとめる独立コンポーネントとする。トリガーに対象デッキ名を含むaria-labelを付け、キーボードで開閉・選択・終了できるようにする。Deleteはdanger表現を維持する。

## データフロー

1. Remote collectionからデッキとカードが読み込まれる。
2. study storeのLocalStorage hydrationが完了する。
3. `DeckListContainer`が各デッキにセッションとカード数を結合する。
4. セッションありをStudying、なしをOther decksへ分割し、それぞれソートする。
5. Continue時は対象セッションをtouchして`/deck/:id/study`へ移動する。
6. StudyまたはRestart時は`/deck/:id/start`へ移動し、Start確定時に対象デッキのセッションだけを作成または置換する。
7. swipe、controller、auto playはrouteの`deckId`に対応するセッションだけを更新する。
8. 学習完了時は対象セッションを削除して一覧へ戻す。

## エラーと整合性

- persisted stateはセッション単位で検証し、壊れた要素だけを除去する。
- Remote collection読込後に存在しないデッキのセッションを除去する。
- セッションの現在カードが削除済みなどで学習を継続できない場合は、対象セッションだけを終了して一覧へ戻す。
- card mutation失敗時のoptimistic rollbackは、対象デッキのindexと`lastStudiedAt`および既存の一時UI状態だけを戻す。別デッキのセッションは変更しない。
- deck mutationのpending/error表示には既存の`RemoteMutationNotice`を使う。
- 全デッキがない場合は既存の`RemoteReadBoundary`のempty表示を維持する。

## アクセシビリティ

- Continue、Study、メニュー、全メニュー項目をbuttonとして実装する。
- アイコンだけの操作には対象デッキ名を含むaria-labelを付ける。
- 行全体をクリック可能にする場合も、内部buttonの操作がカード一覧遷移を発火しないようイベントを分離する。
- focus ring、色、danger表現は既存のCalm Focus tokenを使う。
- 進捗は文字情報でも示し、色やバーだけに依存しない。
- 44px以上のタッチ領域と、長いデッキ名でも操作を押し出さないレイアウトを維持する。

## テスト方針

### State unit tests

- 2つ以上のセッションを開始し、両方が保持される。
- index更新、touch、完了、削除が対象デッキだけに作用する。
- version 1と2の有効な単一セッションがversion 3へ移行する。
- 複数のpersisted sessionのうち、不正な要素だけが除去される。
- store全体のclearだけが全セッションを削除する。

### Presentation unit tests

- Studyingが`lastStudiedAt`降順になる。
- Other decksがデッキ名昇順になる。
- セッション有無でデッキが正しいセクションへ一度だけ表示される。
- 0件のセクション見出しを表示しない。
- Continue、Study、Restart、Download、Edit、Deleteが正しいdeck IDを渡す。
- 長い名前、進捗、カード数、相対時刻を表示する。
- 操作メニューのaria-label、キーボード操作、focus、Deleteのdanger表現を検証する。

### Stories and visual coverage

- モバイル、デスクトップ、ダークモードを用意する。
- すべてOther decks、すべてStudying、両方混在、長い名前、空一覧を用意する。

### E2E

- デッキAを開始し、別のデッキBを開始してもAの進捗が残る。
- 一覧のStudyingにAとBが表示される。
- Continueで各デッキの正しいカードとindexを再開する。
- 一方を完了しても他方がStudyingに残る。

実装完了前に`make check`を実行する。

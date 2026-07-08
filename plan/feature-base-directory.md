# feature-base ディレクトリ構成への移行計画

作成日: 2026-07-08

## 背景

現在のディレクトリ構成はレイヤーベース（技術的な役割ごとにファイルを配置）になっている。  
feature-base 構成に変更することで、関連するコードをドメイン（機能）単位にまとめ、可読性・保守性を向上させる。

## 現在の構成（レイヤーベース）

```
src/
  action/
    card.ts / card.spec.ts
    config.ts / config.spec.ts
    deck.ts / deck.spec.ts
    event.ts / event.spec.ts
    firestore/
      card.ts / card.spec.ts
      deck.ts / deck.spec.ts
      event.ts / event.spec.ts
      index.ts / init.ts / mocked.ts / rule/
    index.ts
    type.ts
  component/
    Atom/         # Button, Code, Input, Select, ... (汎用UI部品)
    Molecule/     # Card, Form, FormItem, List, Overlay, ... (複合UI部品)
    Organism/     # CardForm, DeckForm, Controller, ... (機能寄りUI)
    Template/     # CardForm, DeckList, DeckSwiper, ... (ページ構成テンプレート)
    Decorator.tsx
    fixture.ts
    storybookViewports.ts
  page/
    CardFormPage.tsx / CardList.tsx / CardViewPage.tsx
    DeckFormPage.tsx / DeckImportPage.tsx / DeckList.tsx
    DeckStartPage.tsx / DeckSwiperPage.tsx
    ConfigPage.tsx
    hooks.ts / index.ts
  selector/
    card.ts / card.spec.ts
    config.ts
    deck.ts / deck.spec.ts
    index.ts
  store/
    index.ts / reducer.ts
  App.tsx / constant.ts / firebase.ts / util.ts / ...
```

## 目標とする構成（feature-base）

```
src/
  features/
    card/
      actions.ts          # src/action/card.ts を移動
      actions.spec.ts     # src/action/card.spec.ts を移動
      selectors.ts        # src/selector/card.ts を移動
      selectors.spec.ts   # src/selector/card.spec.ts を移動
      components/
        BackText.tsx              # src/component/Organism/BackText.tsx を移動
        Card.tsx                  # src/component/Organism/Card.tsx を移動
        CardForm.tsx              # src/component/Organism/CardForm.tsx を移動
        CardForm.spec.tsx
        CardOverlay.tsx           # src/component/Organism/CardOverlay.tsx を移動
        Controller.tsx            # src/component/Organism/Controller.tsx を移動
        Controller.spec.tsx
        FrontText.tsx             # src/component/Organism/FrontText.tsx を移動
        FrontText.spec.tsx
        SwipeButtonList.tsx       # src/component/Organism/SwipeButtonList.tsx を移動
      templates/
        CardForm.tsx              # src/component/Template/CardForm.tsx を移動
        CardList.tsx              # src/component/Template/CardList.tsx を移動
        CardView.tsx              # src/component/Template/CardView.tsx を移動
      pages/
        CardFormPage.tsx          # src/page/CardFormPage.tsx を移動
        CardListPage.tsx          # src/page/CardList.tsx を移動 (リネーム)
        CardViewPage.tsx          # src/page/CardViewPage.tsx を移動
      index.ts                    # public API のエクスポート
    deck/
      actions.ts          # src/action/deck.ts を移動
      actions.spec.ts     # src/action/deck.spec.ts を移動
      selectors.ts        # src/selector/deck.ts を移動
      selectors.spec.ts   # src/selector/deck.spec.ts を移動
      components/
        Deck.tsx                  # src/component/Organism/Deck.tsx を移動
        DeckForm.tsx              # src/component/Organism/DeckForm.tsx を移動
        DeckForm.spec.tsx
        DeckStartForm.tsx         # src/component/Organism/DeckStartForm.tsx を移動
        DeckStartForm.spec.tsx
        TagFilter.tsx             # src/component/Organism/TagFilter.tsx を移動
      templates/
        DeckForm.tsx              # src/component/Template/DeckForm.tsx を移動
        DeckImport.tsx            # src/component/Template/DeckImport.tsx を移動
        DeckList.tsx              # src/component/Template/DeckList.tsx を移動
        DeckStart.tsx             # src/component/Template/DeckStart.tsx を移動
        DeckSwiper.tsx            # src/component/Template/DeckSwiper.tsx を移動
      pages/
        DeckFormPage.tsx          # src/page/DeckFormPage.tsx を移動
        DeckImportPage.tsx        # src/page/DeckImportPage.tsx を移動
        DeckListPage.tsx          # src/page/DeckList.tsx を移動 (リネーム)
        DeckStartPage.tsx         # src/page/DeckStartPage.tsx を移動
        DeckSwiperPage.tsx        # src/page/DeckSwiperPage.tsx を移動
      index.ts
    config/
      actions.ts          # src/action/config.ts を移動 (存在すれば)
      actions.spec.ts
      selectors.ts        # src/selector/config.ts を移動
      components/
        ConfigForm.tsx            # src/component/Organism/ConfigForm.tsx を移動
        ConfigForm.spec.tsx
      templates/
        ConfigForm.tsx            # src/component/Template/ConfigForm.tsx を移動
      pages/
        ConfigPage.tsx            # src/page/ConfigPage.tsx を移動
      index.ts
    auth/
      actions.ts          # src/action/event.ts を移動 (login/logout/subscribe)
      actions.spec.ts     # src/action/event.spec.ts を移動
      firestore/
        event.ts          # src/action/firestore/event.ts を移動
        event.spec.ts
      index.ts
  shared/
    actions/
      types.ts            # src/action/type.ts を移動
    components/
      Atom/               # src/component/Atom/ をそのまま移動
      Molecule/           # src/component/Molecule/ をそのまま移動
      Header.tsx          # src/component/Organism/Header.tsx を移動
      Layout.tsx          # src/component/Organism/Layout.tsx を移動
      Decorator.tsx       # src/component/Decorator.tsx を移動
      fixture.ts          # src/component/fixture.ts を移動
      storybookViewports.ts
    firestore/
      card.ts             # src/action/firestore/card.ts を移動
      card.spec.ts
      deck.ts             # src/action/firestore/deck.ts を移動
      deck.spec.ts
      index.ts
      init.ts
      mocked.ts
      rule/
    hooks/
      useActions.ts       # src/page/hooks.ts を移動 (リネーム)
    store/
      index.ts            # src/store/index.ts を移動
      reducer.ts          # src/store/reducer.ts を移動
    constant.ts           # src/constant.ts を移動
    firebase.ts           # src/firebase.ts を移動
    util.ts               # src/util.ts を移動
  App.tsx
  index.css
  main.tsx
  vite-env.d.ts
```

## 移行手順

### フェーズ 1: shared ディレクトリの整備

1. `src/shared/` ディレクトリを作成
2. `src/constant.ts` → `src/shared/constant.ts` に移動してインポートパスを更新
3. `src/util.ts` → `src/shared/util.ts` に移動してインポートパスを更新
4. `src/firebase.ts` → `src/shared/firebase.ts` に移動してインポートパスを更新
5. `src/action/type.ts` → `src/shared/actions/types.ts` に移動してインポートパスを更新
6. `src/action/firestore/` → `src/shared/firestore/` に移動してインポートパスを更新
7. `src/store/` → `src/shared/store/` に移動してインポートパスを更新
8. `src/component/Atom/` → `src/shared/components/Atom/` に移動
9. `src/component/Molecule/` → `src/shared/components/Molecule/` に移動
10. `src/component/Organism/Header.tsx` と `Layout.tsx` → `src/shared/components/` に移動
11. `src/page/hooks.ts` → `src/shared/hooks/useActions.ts` に移動

### フェーズ 2: card feature の作成

1. `src/features/card/` ディレクトリを作成
2. `src/action/card.ts` → `src/features/card/actions.ts` に移動
3. `src/action/card.spec.ts` → `src/features/card/actions.spec.ts` に移動
4. `src/selector/card.ts` → `src/features/card/selectors.ts` に移動
5. `src/selector/card.spec.ts` → `src/features/card/selectors.spec.ts` に移動
6. Card 関連の Organism コンポーネントを `src/features/card/components/` に移動
7. Card 関連の Template を `src/features/card/templates/` に移動
8. Card 関連の Page を `src/features/card/pages/` に移動
9. `src/features/card/index.ts` を作成して public API をエクスポート
10. インポートパスを全ファイルで更新

### フェーズ 3: deck feature の作成

1. `src/features/deck/` ディレクトリを作成
2. `src/action/deck.ts` → `src/features/deck/actions.ts` に移動
3. `src/action/deck.spec.ts` → `src/features/deck/actions.spec.ts` に移動
4. `src/selector/deck.ts` → `src/features/deck/selectors.ts` に移動
5. `src/selector/deck.spec.ts` → `src/features/deck/selectors.spec.ts` に移動
6. Deck 関連の Organism コンポーネントを `src/features/deck/components/` に移動
7. Deck 関連の Template を `src/features/deck/templates/` に移動
8. Deck 関連の Page を `src/features/deck/pages/` に移動
9. `src/features/deck/index.ts` を作成
10. インポートパスを全ファイルで更新

### フェーズ 4: config feature の作成

1. `src/features/config/` ディレクトリを作成
2. `src/selector/config.ts` → `src/features/config/selectors.ts` に移動
3. ConfigForm 関連の Organism コンポーネントを `src/features/config/components/` に移動
4. ConfigForm Template を `src/features/config/templates/` に移動
5. `src/page/ConfigPage.tsx` → `src/features/config/pages/ConfigPage.tsx` に移動
6. `src/features/config/index.ts` を作成
7. インポートパスを全ファイルで更新

### フェーズ 5: auth feature の作成

1. `src/features/auth/` ディレクトリを作成
2. `src/action/event.ts` → `src/features/auth/actions.ts` に移動（ファイル名は `actions.ts` に統一）
3. `src/action/event.spec.ts` → `src/features/auth/actions.spec.ts` に移動
4. `src/action/firestore/event.ts` → `src/features/auth/firestore/event.ts` に移動
5. `src/features/auth/index.ts` を作成
6. インポートパスを全ファイルで更新

### フェーズ 6: App.tsx とエントリーポイントの更新

1. `App.tsx` のインポートを新しい feature パスに更新
2. `src/store/index.ts` が移動している場合は `src/main.tsx` のインポートを更新

### フェーズ 7: Storybook 設定の更新

1. `.storybook/` の設定ファイルを確認し、ストーリーファイルの検索パターンを更新

### フェーズ 8: 旧ディレクトリの削除

1. `src/action/` ディレクトリを削除（空になったら）
2. `src/component/` ディレクトリを削除（空になったら）
3. `src/page/` ディレクトリを削除（空になったら）
4. `src/selector/` ディレクトリを削除（空になったら）
5. `src/store/` ディレクトリを削除（空になったら）

## インポートパスの変更ルール

| 旧パス | 新パス |
| --- | --- |
| `src/action` | `src/features/card/actions`, `src/features/deck/actions`, etc. |
| `src/action/type` | `src/shared/actions/types` |
| `src/action/firestore` | `src/shared/firestore` |
| `src/selector` | `src/features/card/selectors`, `src/features/deck/selectors`, etc. |
| `src/store` | `src/shared/store` |
| `src/component/Atom` | `src/shared/components/Atom` |
| `src/component/Molecule` | `src/shared/components/Molecule` |
| `src/component/Organism` | `src/features/{feature}/components` or `src/shared/components` |
| `src/component/Template` | `src/features/{feature}/templates` |
| `src/page` | `src/features/{feature}/pages` |
| `src/constant` | `src/shared/constant` |
| `src/util` | `src/shared/util` |
| `src/firebase` | `src/shared/firebase` |

## 注意事項

- 各フェーズは独立したPRとして実施することを推奨する（差分の把握と安全性のため）
- `tsconfig.json` の `paths` エイリアスを活用して移行期間中の互換性を保つことを検討する
- 移行後にビルド（`npm run build`）とテスト（`npm run test`）を実行して動作確認する
- `sample/generate.py` の実行が `src/store/reducer.ts` と `src/action/deck.ts`（移動後はそれぞれ `src/shared/store/reducer.ts` と `src/features/deck/actions.ts`）のビルドに必要なため、移行後も実行順序を維持する

# Feature-based Component Architecture Design

## 背景

現在の UI は `src/component/Atom`、`Molecule`、`Organism`、`Template` という技術レイヤー単位で配置され、route に対応する機能の実装が複数ディレクトリへ分散している。また、`src/page` が route entry と hooks・Redux・router の接続を同時に担当し、一部の Organism と Template も form、overlay、auto play などの state を所有している。

本変更では、UI をプロダクト機能単位に再配置し、表示と state 接続の責務を明確にする。対象機能は既存の機能一覧と route に合わせて `deck`、`card`、`study`、`import`、`settings` とする。

## 目標

- UI を feature-based なディレクトリ構成へ移行する。
- `components` と `components/templates` を stateless な表示層にする。
- hooks、Redux、router、form state、画面固有の UI state を `containers` に集約する。
- `src/page` は route entry として残し、対応する container のみに依存させる。
- 現在の URL、表示、操作、Redux action/selector/store の挙動を維持する。
- Storybook stories と tests を対象 component、template、container と同じ feature に配置する。

## 非目標

- `src/action`、`src/selector`、`src/store`、Firestore 実装の feature 移行
- domain model と `src/vite-env.d.ts` の型定義再設計
- UI デザイン、文言、route、永続化形式の変更
- 旧 `src/component` path を残す互換 re-export facade
- TanStack Query など新しい state management の導入

## 依存方向

画面の依存方向を次に固定する。

```text
App -> Page -> Container -> Template -> Component
                           \-> Component
```

- `App` は既存どおり route と application bootstrap を担当する。
- `Page` は対応する page container を render するだけの薄い route entry とする。
- `Container` は state と副作用を取得・更新し、template/component に props を渡す。
- `Template` は複数の stateless component を画面単位に組み立てる。
- `Component` は props から表示と callback を組み立てる。

`Page`、`Template`、`Component` から Redux、router、project hooks、form state hooks を直接参照しない。feature 間の調整が必要な場合は container が行い、feature の component/template から別 feature を直接 import しない。`shared` はどの feature にも依存しない。

再利用する hook の定義は `shared/hooks` または feature の `containers` 配下に置けるが、それらは container 専用の support module とする。hook を呼び出して state や副作用へ接続するのは container だけであり、Page、Template、Component からの import は architecture test で禁止する。

## Stateless と Stateful の境界

ここでの stateless は、domain data や変更可能な UI state を component 自身が所有せず、値と更新 callback を props で受け取ることを意味する。DOM 表示だけに閉じた integration hook は許容するが、次の責務は container に置く。

- `useSelector`、`useDispatch`、`useNavigate`、`useParams`、`useKey`
- `useActions`、`useDeckActions` など application hooks
- `react-hook-form` による form state
- overlay の開閉、tag selection、auto play などの `useState`
- timer、navigation guard、Redux 更新などの副作用
- route parameter の検証と、無効な id に対する既存 error

この境界に合わせ、現在 state を持つ `CardForm`、`DeckForm`、`DeckStartForm`、`ConfigForm`、`TagFilter`、`Controller`、`Template/CardList` の stateful 部分を container へ移す。表示部分は props-driven component/template として残す。

## 目標ディレクトリ構成

```text
src/
  shared/
    components/
      Button.tsx
      Card.tsx
      Code.tsx
      Code.scss
      Form.tsx
      Header.tsx
      Layout.tsx
      ...
    forms/
      renameKey.ts
    hooks/
      useActions.ts
    storybook/
      Decorator.tsx
      fixture.ts
      storybookViewports.ts
  features/
    deck/
      components/
        DeckCard.tsx
        DeckForm.tsx
        DeckStartForm.tsx
        TagFilter.tsx
        templates/
          DeckListTemplate.tsx
          DeckFormTemplate.tsx
      containers/
        DeckListContainer.tsx
        DeckFormContainer.tsx
        useDeckActions.ts
        useDeckFilterState.ts
    card/
      components/
        Card.tsx
        CardForm.tsx
        CardOverlay.tsx
        FrontText.tsx
        BackText.tsx
        templates/
          CardListTemplate.tsx
          CardFormTemplate.tsx
          CardViewTemplate.tsx
      containers/
        CardListContainer.tsx
        CardFormContainer.tsx
        CardViewContainer.tsx
    study/
      components/
        Controller.tsx
        SwipeButtonList.tsx
        templates/
          DeckStartTemplate.tsx
          DeckSwiperTemplate.tsx
      containers/
        DeckStartContainer.tsx
        DeckSwiperContainer.tsx
    import/
      components/
        templates/
          DeckImportTemplate.tsx
      containers/
        DeckImportContainer.tsx
    settings/
      components/
        ConfigForm.tsx
        templates/
          ConfigFormTemplate.tsx
      containers/
        ConfigContainer.tsx
  page/
    DeckList.tsx
    DeckFormPage.tsx
    DeckStartPage.tsx
    DeckSwiperPage.tsx
    CardList.tsx
    CardFormPage.tsx
    CardViewPage.tsx
    DeckImportPage.tsx
    ConfigPage.tsx
    index.ts
```

空ディレクトリを維持する必要はない。上記は現在存在する UI の配置先を示す。

## 配置ルール

### Shared

- 旧 Atom と汎用 Molecule は Atomic Design の階層を外し、`src/shared/components` に置く。
- `Header` と `Layout` は全 route で使うため shared component とする。
- `Decorator`、fixture、viewport は production component から分離して `src/shared/storybook` に置く。
- 複数 feature の form container から使う `renameKey` は `src/shared/forms` に置く。
- 現在の `src/page/hooks.ts` は Page から切り離す。汎用 action/navigation hook は container 専用 module として `src/shared/hooks`、deck 固有 hook は deck の `containers` 配下に置く。これらを呼び出せるのは container だけとする。

### Features

- `deck`: deck 一覧・編集と、複数画面から再利用される deck filter UI
- `card`: card 一覧・編集・詳細と card text 表示
- `study`: 学習開始・swipe・controller UI
- `import`: CSV import 画面
- `settings`: application settings 画面

CardList と Study が deck filter や card display を利用する場合、component/template 同士を直接結合しない。`CardListContainer` と `DeckStartContainer` は deck の container 専用 `useDeckFilterState` hook を呼び、返された値と callback を stateless な `DeckStartForm` に渡す。stateful Container component 同士は nest せず、呼び出し側の route container が必要な component と template slot を組み立てる。Container から別 feature の component または container 専用 hook への依存は許可し、component/template 層の feature 間循環を防ぐ。

## Page と Container

各 Page は hooks を呼ばず、対応する container のみを render する。

```tsx
export const DeckListPage: React.FC = () => <DeckListContainer />;
```

現在 Page にある selector、action、router parameter、keyboard shortcut、navigation guard の処理は同名画面の container に移す。既存の Page export 名と `src/page/index.ts` は維持するため、`App.tsx` の route API は変えない。

## Template と Component

- 旧 Template は `components/templates` に移し、export/file 名へ `Template` suffix を付けて同名 component との衝突を避ける。
- Template は state を持たず、表示に必要な props と callback/render slot のみを受け取る。
- 旧 Organism のうち domain 固有の表示は対応 feature の `components` に移す。
- stateful Organism は表示部分と state 接続を分離し、表示部分を component、接続部分を container とする。
- Storybook は component/template を対象とし、Redux/router に接続する container story は追加しない。

## Import と Public API

- source-local import は `@src/...` を使い、最新の `src/lib/importPath.spec.ts` に従う。
- module 内部では同じ barrel を経由せず、aliased leaf path を直接 import して循環を避ける。
- Page 向けには feature ごとの `containers/index.ts` を public API として用意する。
- shared component barrel を設ける場合も、shared component 自身は barrel から import しない。
- 旧 `src/component/Atom`、`Molecule`、`Organism`、`Template` は移行完了時に削除する。

## Error Handling と挙動維持

- route id がない場合の既存 error は Page ではなく container で同じ条件・message を維持する。
- deck/card が無効な場合の redirect、browser back 制御、confirmation dialog は container/application hook へ移し、挙動を変えない。
- form submit、auto save、auto play、swipe、overlay の状態遷移は既存 tests と E2E の期待値を維持する。
- component/template は error recovery や data fetching を行わず、container が渡した状態を表示する。

## Testing

1. feature-based path と依存方向を検証する architecture test を先に追加し、現行構成で失敗することを確認する。
2. 既存 component specs を対応する component/container と一緒に移す。
3. form state、tag filter、CardList overlay、Controller auto play は container の behavior test として維持または追加する。
4. stateless component/template は props と callback に対する rendering test、既存 Storybook story で確認する。
5. TypeScript、ESLint、Prettier、unit tests、app build、Storybook build を段階的に実行する。
6. 完了前にユーザー指定の `make ci` を実行し、Firestore、sample、Playwright を含む全 CI を通す。

## Documentation

実装と同じ PR で少なくとも次を新しい構成へ更新する。

- `docs/architecture.md`
- `docs/summary/module-map.md`
- component path を直接記載しているその他の repository documentation

## Delivery

設計書、implementation plan、source、tests、stories、documentation の変更は、`origin/main` から作成した現在の branch に積み、分割せず 1 件の pull request として公開する。

## 完了条件

- `App -> Page -> Container -> Template -> Component` の依存方向になっている。
- Page は container のみに依存し、application hooks を直接使わない。
- component/template は mutable UI/application state を所有しない。
- shared component は feature に依存しない。
- 旧 Atomic Design component directories と互換 facade が残っていない。
- UI、route、Redux/Firestore の外部挙動が変わっていない。
- stories/specs が移動先と同じ feature/shared 配下で discovery される。
- 設計から実装までの変更が 1 件の pull request にまとまっている。
- architecture test と `make ci` が成功する。

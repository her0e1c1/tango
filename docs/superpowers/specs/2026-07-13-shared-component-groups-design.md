# Shared Component Groups Design

## 背景

`src/shared/components` には 28 個の production component と、それぞれの stories・style がフラットに配置されている。Atomic Design の `Atom` / `Molecule` は廃止できた一方、現在は用途の異なる component が同じ階層に並び、一覧性が下がっている。

本変更では Atomic Design を再導入せず、component の大きさではなく責務で `shared/components` を分類する。

## 目標

- `src/shared/components` を浅い責務別 directory に分ける。
- `Atom` / `Molecule` のような粒度による分類は作らない。
- component 名、props、表示、Storybook title、外部向け import API を維持する。
- 新しい shared component がフラットな root に追加されないよう architecture test で守る。

## ディレクトリ構成

```text
src/shared/components/
  index.ts
  layout/
    FullScreen.tsx
    Header.tsx
    Layout.tsx
    List.tsx
    Main.tsx
    Outer.tsx
  forms/
    Button.tsx
    Form.tsx
    FormItem.tsx
    Input.tsx
    Select.tsx
    Slider.tsx
    Switch.tsx
    Tag.tsx
    Textarea.tsx
    Upload.tsx
  content/
    Card.tsx
    Code.tsx
    Code.scss
    Description.tsx
    Logo.tsx
    Math.tsx
    Score.tsx
    Section.tsx
    Style.tsx
    TagList.tsx
    Title.tsx
  feedback/
    Feedback.tsx
    Overlay.tsx
```

各 story は対象 component と同じ directory に置く。group ごとの `index.ts` は作らず、公開 barrel は既存の `src/shared/components/index.ts` だけとする。

## 分類ルール

- `layout`: page shell や children の配置・枠組みを作る component
- `forms`: value と入力 event を扱う form control
- `content`: text、code、math、tag、card など内容を表示する component
- `feedback`: overlay や操作結果など一時的な UI feedback を表示する component

分類は再利用範囲や component の大きさでは決めない。迷う場合は次の優先順で判断する。

1. native input と `value` / `checked` / `onChange` を主要 API に持つ場合は `forms`。
2. children の grid/flex 配置または application shell を主要 API に持つ場合は `layout`。
3. 現在の content の上に一時的な状態・操作面を重ねる場合は `feedback`。
4. それ以外の semantic content 表示は `content`。

この基準により、checkbox control である `Tag` は `forms`、grid/flex wrapper である `List` は `layout`、title text を表示する `Section` は `content`、既存 content の上に操作領域を重ねる `Overlay` は `feedback` とする。

`src/shared/forms/renameKey.ts` は React Hook Form と props の変換 support module であり、presentation component ではないため移動しない。`src/shared/components/forms` とは責務が異なる。

## Import と Public API

サポートする shared component の public API は root barrel の `@src/shared/components` とする。ここから公開している28個の component symbol と `HeaderProps`、`LayoutProps`、`Option` の型名を維持する。

```ts
import { Button, Layout } from "@src/shared/components";
```

現在の `@src/shared/components/Layout`、`@src/shared/components/Select` などの deep import は public API として維持せず、grouped leaf path へ更新する。旧 deep path の互換 facade は作らない。

root barrel は新しい leaf path から同じ symbol と型を re-exportする。型を直接 importする箇所と shared component 同士の依存は、循環を避けるため grouped leaf path を使う。

```ts
import type { Option } from "@src/shared/components/forms/Select";
import { Header } from "@src/shared/components/layout/Header";
```

## Architecture Guard

既存の presentation boundary に加え、`src/shared/components` root の immediate entry が `index.ts`、`layout`、`forms`、`content`、`feedback` だけであることを検証する。想定外の第5 group、root 直下の component、story、stylesheet を許可しない。

production component、`*.stories.tsx`、component stylesheet が4 group のいずれかに配置されていることも検証する。

既存どおり shared presentation から feature、Redux、router、form connector、container hook への依存は禁止する。group 間の presentation import は許可する。

## Testing と Delivery

この変更は file move と import update に限定し、component の振る舞いは変えない。

- architecture test を先に更新し、フラット配置を検出して RED を確認する。
- `git mv` で production files、stories、SCSS を同時に移す。
- import path と root barrel を更新する。
- public API test で root barrel から28個の component symbol と `HeaderProps`、`LayoutProps`、`Option` を importし、symbol の runtime export と型の compile-time compatibility を検証する。
- focused architecture/import tests、format、lint、unit tests、app/Storybook build を実行する。
- PR 公開前に `make ci` を再実行する。

変更は既存の `codex/feature-based-components` branch と draft PR #200 に追加する。

## 完了条件

- shared component が4つの責務 directory に分類されている。
- `src/shared/components` root 直下に component/story/style が残っていない。
- Atomic Design の directory 名が復活していない。
- `@src/shared/components` の28 component symbols と3 named types が維持され、旧 deep import consumer が grouped leaf path へ移行している。
- stories、tests、build、`make ci` が成功する。

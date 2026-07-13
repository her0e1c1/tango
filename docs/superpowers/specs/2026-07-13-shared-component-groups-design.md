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
    Main.tsx
    Outer.tsx
    Section.tsx
  forms/
    Button.tsx
    Form.tsx
    FormItem.tsx
    Input.tsx
    Select.tsx
    Slider.tsx
    Switch.tsx
    Textarea.tsx
    Upload.tsx
  content/
    Card.tsx
    Code.tsx
    Code.scss
    Description.tsx
    List.tsx
    Logo.tsx
    Math.tsx
    Score.tsx
    Style.tsx
    Tag.tsx
    TagList.tsx
    Title.tsx
  feedback/
    Feedback.tsx
    Overlay.tsx
```

各 story は対象 component と同じ directory に置く。group ごとの `index.ts` は作らず、公開 barrel は既存の `src/shared/components/index.ts` だけとする。

## 分類ルール

- `layout`: page や領域の配置・枠組みを作る component
- `forms`: 入力、選択、送信などユーザー操作を受ける component
- `content`: text、code、math、tag、card など内容を表示する component
- `feedback`: overlay や操作結果など一時的な UI feedback を表示する component

分類は再利用範囲や component の大きさでは決めない。迷う場合は、その component の主要な責務と主要な利用方法で判断する。

`src/shared/forms/renameKey.ts` は React Hook Form と props の変換 support module であり、presentation component ではないため移動しない。`src/shared/components/forms` とは責務が異なる。

## Import と Public API

feature 側の既存 public import は維持する。

```ts
import { Button, Layout } from "@src/shared/components";
```

root barrel は新しい leaf path から同じ symbol を re-exportする。型を直接 importする箇所と shared component 同士の依存は、循環を避けるため grouped leaf path を使う。

```ts
import type { Option } from "@src/shared/components/forms/Select";
import { Header } from "@src/shared/components/layout/Header";
```

## Architecture Guard

既存の presentation boundary に加え、`src/shared/components` root 直下の production source は `index.ts` だけであることを検証する。production component と stories は `layout`、`forms`、`content`、`feedback` のいずれかに配置する。

既存どおり shared presentation から feature、Redux、router、form connector、container hook への依存は禁止する。group 間の presentation import は許可する。

## Testing と Delivery

この変更は file move と import update に限定し、component の振る舞いは変えない。

- architecture test を先に更新し、フラット配置を検出して RED を確認する。
- `git mv` で production files、stories、SCSS を同時に移す。
- import path と root barrel を更新する。
- focused architecture/import tests、format、lint、unit tests、app/Storybook build を実行する。
- PR 公開前に `make ci` を再実行する。

変更は既存の `codex/feature-based-components` branch と draft PR #200 に追加する。

## 完了条件

- shared component が4つの責務 directory に分類されている。
- `src/shared/components` root 直下に component/story/style が残っていない。
- Atomic Design の directory 名が復活していない。
- `@src/shared/components` の既存 public API が維持されている。
- stories、tests、build、`make ci` が成功する。

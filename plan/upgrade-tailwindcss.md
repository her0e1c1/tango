# TailwindCSS v3 → v4 アップグレード計画

## 背景

現在 `tailwindcss@^3.4.1` を使用している。TailwindCSS v4 は設定方法・ビルドパイプラインが大幅に刷新されており、計画的な移行が必要。

## 現状

| 項目 | 現在の状態 |
| --- | --- |
| tailwindcss バージョン | `^3.4.1` |
| 設定ファイル | `tailwind.config.js`（JS ベース） |
| PostCSS 設定 | `postcss.config.js`（`tailwindcss` プラグイン経由） |
| CSS エントリポイント | `tailwindcss/tailwind.css` を `src/main.tsx` と `.storybook/preview.ts` でインポート |
| darkMode | `class` ベース（`tailwind.config.js` で設定） |

## v4 での主な変更点

1. **CSS ファースト設定**: `tailwind.config.js` を廃止し、CSS ファイル内の `@import "tailwindcss"` と `@theme` ブロックで設定する
2. **PostCSS プラグイン名変更**: `tailwindcss` → `@tailwindcss/postcss`
3. **`tailwindcss/tailwind.css` の廃止**: CSS ファイルに `@import "tailwindcss"` を直接記述する
4. **`variants` キーの廃止**: `tailwind.config.js` の `variants.extend` は v4 では不要
5. **`content` 自動検出**: コンテンツパスを明示指定する必要がなくなる（自動検出）
6. **darkMode 設定の変更**: CSS 変数で制御する方式に変わる

## 移行手順

### Step 1: 依存パッケージの更新

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
npm uninstall autoprefixer  # v4 では autoprefixer が不要になる
```

> **注意**: v4 安定版リリース後は `@next` を外して正式バージョンを指定する。

### Step 2: PostCSS 設定の更新

`postcss.config.js` を以下のように変更する。

```js
// 変更前
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}

// 変更後
module.exports = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
}
```

### Step 3: CSS エントリポイントの作成

`src/index.css`（新規作成）に以下を記述する。

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
```

`src/main.tsx` のインポートを変更する。

```tsx
// 変更前
import "tailwindcss/tailwind.css";

// 変更後
import "./index.css";
```

`.storybook/preview.ts` も同様に変更する。

```ts
// 変更前
import 'tailwindcss/tailwind.css'

// 変更後
import '../src/index.css'
```

### Step 4: `tailwind.config.js` の削除

v4 では JS 設定ファイルは不要になる。`darkMode: 'class'` は Step 3 で CSS 内の `@custom-variant dark` として移行済みのため、`tailwind.config.js` を削除する。

### Step 5: 動作確認

- `npm start` でローカル開発サーバーを起動し、ダークモード含む UI を目視確認する
- `npm run storybook` で Storybook を起動し、コンポーネントの表示崩れがないか確認する
- `npm run build` でビルドが通ることを確認する

## 完了条件

- `tailwindcss@4.x` が依存関係に入っている
- `tailwind.config.js` と `postcss.config.js` の `autoprefixer` 設定が削除されている
- `npm start` / `npm run build` / `npm run storybook` がすべて成功する
- ダークモード切り替えが正常に動作する

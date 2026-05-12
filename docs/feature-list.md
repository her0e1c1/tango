# 機能一覧

## 1. デッキ管理
- デッキ一覧の表示
- デッキ新規作成・編集
- デッキの学習開始

## 2. カード管理
- デッキ配下のカード一覧表示
- カード詳細の表示
- カード新規作成・編集

## 3. 学習
- スワイプUIでの学習（カード送り）
- 学習開始前のスタート画面

## 4. インポート
- デッキデータのインポート

## 5. 設定
- アプリ設定画面
- ダークモード切り替え

---

## ユースケース図（Mermaid）

```mermaid
flowchart LR
    user[利用者]

    subgraph deck[デッキ管理]
      uc1[デッキ一覧を見る]
      uc2[デッキを作成/編集する]
      uc3[デッキの学習を開始する]
    end

    subgraph card[カード管理]
      uc4[カード一覧を見る]
      uc5[カード詳細を見る]
      uc6[カードを作成/編集する]
    end

    subgraph study[学習]
      uc7[スタート画面を確認する]
      uc8[スワイプで学習する]
    end

    subgraph other[その他]
      uc9[デッキをインポートする]
      uc10[設定を変更する]
      uc11[ダークモードを切り替える]
    end

    user --> uc1
    user --> uc2
    user --> uc3
    user --> uc4
    user --> uc5
    user --> uc6
    user --> uc7
    user --> uc8
    user --> uc9
    user --> uc10
    user --> uc11

    uc3 --> uc7
    uc7 --> uc8
```

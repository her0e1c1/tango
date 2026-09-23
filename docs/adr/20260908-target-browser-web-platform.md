# ブラウザー向け Web アプリに対象を絞る

Status: Accepted

## Decision

Tango のクライアントはブラウザー向け Web アプリとする。Expo・React Native の互換性は維持せず、モバイルはレスポンシブ UI と PWA で対応する。

ネイティブアプリを再導入する場合は、共有範囲とリリース責務を別の ADR に記録する。

## Context

Web とネイティブを同じフロントエンドで維持すると、実行環境・画面遷移・保存・UI・リリースの分岐が増える。

関連PR: [#76](https://github.com/her0e1c1/tango/pull/76)

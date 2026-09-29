# AccountView

認証状態、表示名、UIDとログイン・ログアウトの操作。認証結果はpropsで渡し、実際の認証は対象外。

Storybook: `Pages/Account/AccountView`。

[コンポーネント](../../../src/pages/account/ui/AccountView.tsx) / [Story](../../../src/pages/account/ui/AccountView.stories.tsx) / [一覧・共通前提](../README.md)

## Story仕様

| Story | 入力・表示条件 | 期待する表示・操作 |
| --- | --- | --- |
| `Anonymous` | 匿名、表示名なしの状態を渡す。 | 匿名と利用できない表示名を案内し、Googleへのログイン要求を通知できる。 |
| `SignedIn` | Googleログイン済み、表示名とUIDを渡す。 | アカウント情報を表示し、ログアウト要求を通知できる。 |
| `SigningIn` | ログイン処理中にする。 | ログインボタンを無効にし、処理中であることを伝える。 |
| `SigningOut` | ログイン済みでログアウト処理中にする。 | ログアウトボタンを無効にし、処理中であることを伝える。 |
| `NoDisplayName` | ログイン済みだが表示名なし。 | 名前なしを案内し、ログイン状態を匿名と混同しない。 |
| `LongIdentity` | 長い表示名と区切りのない長いUIDを渡す。 | アカウント情報が操作領域を押し出さない。 |
| `Japanese` | ログイン済みの状態を日本語で表示する。 | 見出しと操作を翻訳し、表示名を保持する。 |
| `Dark` | 暗いテーマでログイン済みを表示する。 | 情報と操作を判別できる。 |
| `Mobile` | 320幅で長い名前とUIDを表示する。 | 情報と操作が画面幅に収まる。 |

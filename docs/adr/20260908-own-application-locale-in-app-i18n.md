# Application localeをApp i18nで管理する

Status: Accepted

## Context

application copy、`html[lang]`、browser languageの解決をPageごとに行うと、表示言語とaccessibility metadataがずれ、locale変更でroute stateやmounted UIを不要に作り直す可能性がある。remote resource loadingへ依存すると、初期表示とtest環境も不安定になる。

## Decision

`app/i18n`をapplication localeのownerとし、i18next instance、React Provider、およびbundled English/Japanese resourcesを管理する。Providerはroute treeを包み、locale変更ではcurrent routeやmounted application stateを置き換えずに表示を更新する。

persisted language preferenceは`system`、`en`、`ja`とする。`system`ではbrowserのprimary languageを解決し、System選択中だけ`languagechange`へ追従する。unsupported browser localeはEnglishへfallbackする。

resourcesをsynchronousに初期化し、effective localeと`html[lang]`をpaint前に同期する。host environmentのlocaleへ暗黙に依存せず、test、Storybook、E2Eは必要なlocaleを明示する。[PR #1365](https://github.com/her0e1c1/tango/pull/1365)を参照する。

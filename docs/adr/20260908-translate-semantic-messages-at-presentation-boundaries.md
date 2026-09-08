# Semantic messageをpresentation境界で翻訳する

Status: Accepted

## Context

Operation開始時に翻訳済み文字列を作ると、完了までにlocaleが変わった場合に古い言語で通知される。domainやActionが表示文言を所有すると、localeとpresentationへの依存も広がる。

## Decision

application固定文言とOperation feedbackは、semantic message keyとparameterで表現する。UI componentおよびToast viewportが、表示時点のlocaleで翻訳する。

非同期Operationの完了通知は完了時点のlocaleを使用する。表示中の通知はlocale変更に追従して再翻訳するが、notification identity、focus、timeoutは作り直さない。

user-authored contentとraw persisted valueは翻訳しない。日付、数値などlocale依存のformatはpresentation境界で行う。[PR #1365](https://github.com/her0e1c1/tango/pull/1365)、[PR #1410](https://github.com/her0e1c1/tango/pull/1410)、[PR #1446](https://github.com/her0e1c1/tango/pull/1446)を参照する。

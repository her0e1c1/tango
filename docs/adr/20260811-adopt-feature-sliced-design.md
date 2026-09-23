# Feature-Sliced Design を採用する

Status: Accepted

## Context

フロントエンドは明示的なアーキテクチャ境界に基づいて整理されつつある。コードベースの進化に伴い、ディレクトリの配置や依存関係の決定を常に一貫させるため、共通のアーキテクチャのベースラインが必要とされている。

## Decision

フロントエンドのベースラインアーキテクチャ手法として [Feature-Sliced Design (FSD)](https://feature-sliced.design/) を採用する。

FSD のコアとなるレイヤリングおよび依存関係の原則に従う。ただし、責務がより明確になる場合はプロジェクト固有のセグメント名や規約を許容する。従来の FSD 構造と意図的に異なる場合は、ADR に文書化されたプロジェクト固有のルールを優先する。

レイヤー間およびスライス間の利用者は、所有するスライスの Public API を使用する。アプリケーション所有の型契約には、アンビエント宣言ではなく明示的なモジュールインポートを使用する。アンビエント宣言は、Vite 環境変数やコンパイル時定数など、ビルドおよびランタイムの環境契約に限定する。プロダクションの FSD レイヤーには `src` を維持し、複数のプロダクションレイヤーにまたがって構成する必要のある Storybook やテストサポートは `src` の外に配置し、Shared プロダクションコードとはみなさない。

依存方向、スライスの独立性、および Public API へのアクセス制御は、汎用リンターで FSD ルールを重複管理するのではなく Steiger で強制する。[PR #542](https://github.com/her0e1c1/tango/pull/542)、[PR #550](https://github.com/her0e1c1/tango/pull/550)、[PR #617](https://github.com/her0e1c1/tango/pull/617)、[PR #623](https://github.com/her0e1c1/tango/pull/623)を参照する。

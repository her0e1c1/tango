# Entity と保存ドキュメントの境界を分ける

Status: Accepted

Card と学習状態を分ける個別の判断は、[Card.fsrs への統合](./20260924-keep-fsrs-state-in-card.md)で変更した。この文書の一般原則は維持する。

## Decision

Entity はドメインの振る舞いと責務で分ける。Firestore のドキュメント境界と一致させる必要はなく、複数 Entity が一つのドキュメントを共有してよい。

- 保存データは永続化の境界で一度検証し、Entity ごとに必要な項目を取り出す。同じ場所に保存する理由だけで Entity model 同士を依存させない。
- 更新 API は担当する概念の項目だけを部分更新し、他の概念の項目を上書きしない。
- 作成時は、同居する概念の初期値を含めてドキュメント全体を初期化してよい。`updatedAt` など共通の保存メタデータはドキュメントの変更に合わせて更新する。

Card の内容と StudyProgress は、この方針で同じ Card ドキュメントを共有する。

## Context

保存単位をそのまま Entity にすると、異なるルール・読み取りモデル・書き込み責務が一つの model に混ざる。

関連PR: [#613](https://github.com/her0e1c1/tango/pull/613)、[#905](https://github.com/her0e1c1/tango/pull/905)、[#1123](https://github.com/her0e1c1/tango/pull/1123)

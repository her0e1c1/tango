FSD v2.1 の Page-first に従い、画面固有の責務は Page、複数 Page で再利用する操作は Features、ドメインは Entities、汎用部品は Shared、起動は App に置く。
Page・Feature の更新は個別の action、読み取りは query、React state・form・ref・cleanup は state hook が担い、Page model hook は接続だけを行う。
モデルを UI に接続するのは Page・Container に限り、他の UI は props を受け取る。依存方向は Steiger の推奨ルールで検証する。

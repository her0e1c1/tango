# Store 単体テスト仕様書

| ID | 対象 | 区分 | テストケース |
| --- | --- | --- | --- |
| UNIT-STORE-AUTH-01 | Auth | 正常系 | [本人確認が終わるまでは利用者を確定しない](./auth.md#unit-store-auth-01) |
| UNIT-STORE-AUTH-02 | Auth | 正常系 / 異常系 | [認証完了後は今回の利用者情報だけを提供する](./auth.md#unit-store-auth-02) |
| UNIT-STORE-AUTH-03 | Auth | 正常系 / 異常系 | [認証未完了の状態へ変わったら古い本人情報を提供しない](./auth.md#unit-store-auth-03) |
| UNIT-STORE-CARD-01 | Card | 正常系 | [最新の取得結果だけをカード一覧として提供する](./card.md#unit-store-card-01) |
| UNIT-STORE-CARD-02 | Card | 正常系 | [カードのクリア後は以前のカードを参照できない](./card.md#unit-store-card-02) |
| UNIT-STORE-CARD-03 | Card | 正常系 | [所属デックと所有者が一致するカードだけを提供する](./card.md#unit-store-card-03) |
| UNIT-STORE-CARD-04 | Card | 正常系 | [作成したカードは購読通知を受けて一覧に加わる](./card.md#unit-store-card-04) |
| UNIT-STORE-CARD-05 | Card | 異常系 | [購読エラーでも取得済みのカード一覧を維持する](./card.md#unit-store-card-05) |
| UNIT-STORE-CARD-06 | Card | 正常系 | [編集したカードは購読通知を受けて内容が変わる](./card.md#unit-store-card-06) |
| UNIT-STORE-CARD-07 | Card | 正常系 | [削除したカードは購読通知を受けて一覧から外れる](./card.md#unit-store-card-07) |
| UNIT-STORE-DECK-01 | Deck | 正常系 | [最新の取得結果だけをデック一覧として提供する](./deck.md#unit-store-deck-01) |
| UNIT-STORE-DECK-02 | Deck | 正常系 | [デックのクリア後は以前のデックを参照できない](./deck.md#unit-store-deck-02) |
| UNIT-STORE-DECK-03 | Deck | 正常系 | [作成したデックは購読通知を受けて一覧に加わる](./deck.md#unit-store-deck-03) |
| UNIT-STORE-DECK-04 | Deck | 異常系 | [購読エラーでも取得済みのデック一覧を維持する](./deck.md#unit-store-deck-04) |
| UNIT-STORE-DECK-05 | Deck | 正常系 | [編集したデックは購読通知を受けて内容が変わる](./deck.md#unit-store-deck-05) |
| UNIT-STORE-DECK-06 | Deck | 正常系 | [削除したデックは購読通知を受けて一覧から外れる](./deck.md#unit-store-deck-06) |
| UNIT-STORE-PREF-01 | Preference | 正常系 | [保存設定がない初回利用では標準の設定を提供する](./preference.md#unit-store-pref-01) |
| UNIT-STORE-PREF-02 | Preference | 正常系 | [一部の設定を変更しても未指定の設定を維持する](./preference.md#unit-store-pref-02) |
| UNIT-STORE-PREF-03 | Preference | 正常系 | [切り替え操作は対象設定だけをオン・オフする](./preference.md#unit-store-pref-03) |
| UNIT-STORE-PREF-04 | Preference | 正常系 | [変更した設定を再起動後も利用できる](./preference.md#unit-store-pref-04) |
| UNIT-STORE-PREF-05 | Preference | 正常系 / 異常系 | [数値設定の境界を受け付け、不正値だけを既定値へ戻す](./preference.md#unit-store-pref-05) |
| UNIT-STORE-PREF-06 | Preference | 正常系 / 異常系 | [互換性のある保存設定は不足・不正な項目だけを補完する](./preference.md#unit-store-pref-06) |
| UNIT-STORE-PREF-07 | Preference | 正常系 | [旧標準スワイプ配置を更新し、利用者の有効な割り当ては維持する](./preference.md#unit-store-pref-07) |
| UNIT-STORE-PREF-08 | Preference | 異常系 | [読み込めない保存設定でも初期設定で利用を開始できる](./preference.md#unit-store-pref-08) |
| UNIT-STORE-PREF-09 | Preference | 正常系 | [確定したタグ選択は入力元の後編集で変わらない](./preference.md#unit-store-pref-09) |
| UNIT-STORE-STUDY-01 | Study Session | 正常系 | [デックごとの学習の続きが互いに混ざらない](./study-session.md#unit-store-study-01) |
| UNIT-STORE-STUDY-02 | Study Session | 正常系 | [最新の取得結果にないデックを学習の続きから除外する](./study-session.md#unit-store-study-02) |
| UNIT-STORE-STUDY-03 | Study Session | 正常系 | [学習中の情報をクリアしても旧バックアップを失わない](./study-session.md#unit-store-study-03) |
| UNIT-STORE-STUDY-04 | Study Session | 正常系 | [所有者を変更したら一致しない学習の続きを提供しない](./study-session.md#unit-store-study-04) |
| UNIT-STORE-STUDY-05 | Study Session | 正常系 | [最新の取得結果に学習の続きを切り替えて取得待ちを終了する](./study-session.md#unit-store-study-05) |
| UNIT-STORE-STUDY-06 | Study Session | 正常系 | [取得待ちだけを終了すると保持済みの学習の続きは変わらない](./study-session.md#unit-store-study-06) |
| UNIT-STORE-STUDY-07 | Study Session | 正常系 | [初めて始めた学習は購読通知を受けて再開対象に加わる](./study-session.md#unit-store-study-07) |
| UNIT-STORE-STUDY-08 | Study Session | 正常系 | [次へ進んだ学習は購読通知を受けて次の位置になる](./study-session.md#unit-store-study-08) |
| UNIT-STORE-STUDY-09 | Study Session | 正常系 | [やり直した学習は購読通知を受けて新しい学習に切り替わる](./study-session.md#unit-store-study-09) |
| UNIT-STORE-STUDY-10 | Study Session | 正常系 | [購読開始から初回の結果通知まで取得待ちになる](./study-session.md#unit-store-study-10) |
| UNIT-STORE-STUDY-11 | Study Session | 異常系 | [購読エラーで取得待ちを終えて取得済みの続きを維持する](./study-session.md#unit-store-study-11) |
| UNIT-STORE-STUDY-12 | Study Session | 正常系 | [指定した学習位置は購読通知を受けて参照できる](./study-session.md#unit-store-study-12) |
| UNIT-STORE-STUDY-13 | Study Session | 正常系 | [学習を再開した時刻は購読通知を受けて更新される](./study-session.md#unit-store-study-13) |
| UNIT-STORE-STUDY-14 | Study Session | 正常系 | [完了した学習は購読通知を受けて再開対象から外れる](./study-session.md#unit-store-study-14) |
| UNIT-STORE-STUDY-15 | Study Session | 正常系 | [中断した学習は購読通知を受けて再開対象から外れる](./study-session.md#unit-store-study-15) |

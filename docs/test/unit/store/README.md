# Store 単体テスト仕様書

| ID | 対象 | テストケース |
| --- | --- | --- |
| UNIT-STORE-AUTH-01 | Auth | [本人確認が終わるまでは利用者を確定しない](./auth.md#unit-store-auth-01) |
| UNIT-STORE-AUTH-02 | Auth | [認証完了後は今回の利用者情報だけを提供する](./auth.md#unit-store-auth-02) |
| UNIT-STORE-AUTH-03 | Auth | [認証未完了の状態へ変わったら古い本人情報を提供しない](./auth.md#unit-store-auth-03) |
| UNIT-STORE-CARD-01 | Card | [最新の取得結果だけをカード一覧として提供する](./card.md#unit-store-card-01) |
| UNIT-STORE-CARD-02 | Card | [カードのクリア後は以前のカードを参照できない](./card.md#unit-store-card-02) |
| UNIT-STORE-CARD-03 | Card | [所属デックと所有者が一致するカードだけを提供する](./card.md#unit-store-card-03) |
| UNIT-STORE-DECK-01 | Deck | [最新の取得結果だけをデック一覧として提供する](./deck.md#unit-store-deck-01) |
| UNIT-STORE-DECK-02 | Deck | [デックのクリア後は以前のデックを参照できない](./deck.md#unit-store-deck-02) |
| UNIT-STORE-PREF-01 | Preference | [保存設定がない初回利用では標準の設定を提供する](./preference.md#unit-store-pref-01) |
| UNIT-STORE-PREF-02 | Preference | [一部の設定を変更しても未指定の設定を維持する](./preference.md#unit-store-pref-02) |
| UNIT-STORE-PREF-03 | Preference | [切り替え操作は対象設定だけをオン・オフする](./preference.md#unit-store-pref-03) |
| UNIT-STORE-PREF-04 | Preference | [変更した設定を再起動後も利用できる](./preference.md#unit-store-pref-04) |
| UNIT-STORE-PREF-05 | Preference | [数値設定の境界を受け付け、不正値だけを既定値へ戻す](./preference.md#unit-store-pref-05) |
| UNIT-STORE-PREF-06 | Preference | [互換性のある保存設定は不足・不正な項目だけを補完する](./preference.md#unit-store-pref-06) |
| UNIT-STORE-PREF-07 | Preference | [旧標準スワイプ配置を更新し、利用者の有効な割り当ては維持する](./preference.md#unit-store-pref-07) |
| UNIT-STORE-PREF-08 | Preference | [読み込めない保存設定でも初期設定で利用を開始できる](./preference.md#unit-store-pref-08) |
| UNIT-STORE-PREF-09 | Preference | [確定したタグ選択は入力元の後編集で変わらない](./preference.md#unit-store-pref-09) |
| UNIT-STORE-STUDY-01 | Study Session | [デックごとの学習の続きが互いに混ざらない](./study-session.md#unit-store-study-01) |
| UNIT-STORE-STUDY-02 | Study Session | [指定したデックだけ学習の続きから除外する](./study-session.md#unit-store-study-02) |
| UNIT-STORE-STUDY-03 | Study Session | [学習中の情報をクリアしても旧バックアップを失わない](./study-session.md#unit-store-study-03) |
| UNIT-STORE-STUDY-04 | Study Session | [所有者を変更したら一致しない学習の続きを提供しない](./study-session.md#unit-store-study-04) |
| UNIT-STORE-STUDY-05 | Study Session | [最新の取得結果に学習の続きを切り替えて取得待ちを終了する](./study-session.md#unit-store-study-05) |
| UNIT-STORE-STUDY-06 | Study Session | [取得待ちだけを終了すると保持済みの学習の続きは変わらない](./study-session.md#unit-store-study-06) |

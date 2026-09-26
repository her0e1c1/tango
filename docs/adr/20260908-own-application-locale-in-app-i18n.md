app/i18n が i18next・ルート Provider・日英リソースを所有し、言語変更でルートやマウント済み状態を作り直さない。
言語設定は system・en・ja とし、system の間だけブラウザーの言語変更に追従する。未対応言語は英語にする。
描画前に同期初期化して html[lang] を合わせ、テスト・Storybook・E2E は言語を明示する。

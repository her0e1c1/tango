# E2E テスト仕様書

## 前提

- Playwright で実行する。
- 実行コマンドは `make e2e`。
- テストデータは localStorage に seed し、Firebase 実環境には依存しない。
- 並列実行時のデータ競合を避けるため、read のテストと write のテストは分ける。

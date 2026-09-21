// Keep startup recovery independent of React, i18n initialization, and persisted application state.
const messages = {
  en: {
    language: "en",
    title: "Unable to start Tango",
    description:
      "Reload to try again, or clear the cache and reset Tango. If resetting fails, close other Tango tabs and check your browser's storage permissions.",
    reload: "Reload",
    reset: "Clear cache and reset",
    resetting: "Resetting Tango…",
    confirm:
      "This deletes this browser's decks, cards, study records, unsynced changes, and settings, and signs you out. Data already synced to the cloud is kept. An internet connection is needed to restart. Continue?",
    resetFailed: "Unable to request a reset. Check your browser's storage permissions and try again.",
  },
  ja: {
    language: "ja",
    title: "Tangoを起動できません",
    description:
      "再読み込みするか、キャッシュを削除して初期化してください。初期化に失敗する場合は、他のTangoのタブを閉じ、ブラウザーのストレージ設定を確認してください。",
    reload: "再読み込み",
    reset: "キャッシュを削除して初期化",
    resetting: "Tangoを初期化しています…",
    confirm:
      "このブラウザーのデッキ・カード・学習記録・未同期の変更・設定を削除し、ログアウトします。同期済みのクラウドデータは削除しません。再起動にはインターネット接続が必要です。続けますか？",
    resetFailed: "初期化を開始できません。ブラウザーのストレージ設定を確認して、もう一度お試しください。",
  },
};

export function getRecoveryMessages(language: string = navigator.language) {
  return language.startsWith("ja") ? messages.ja : messages.en;
}

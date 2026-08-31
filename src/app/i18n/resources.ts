/** Static application copy bundled for every supported language. */
export const resources = {
  en: {
    translation: {
      header: {
        switchToLightMode: "Switch to light mode",
        switchToDarkMode: "Switch to dark mode",
        importDecks: "Import decks",
        openAccount: "Open account",
        openSettings: "Open settings",
      },
      card: {
        answerAria: "Card answer",
      },
      deckImport: {
        uploadPrompt: "Upload a csv file",
      },
      navigationGuard: {
        title: "Discard unsaved changes?",
        description: "Your changes will be lost if you leave this page.",
        keepEditing: "Keep editing",
        discard: "Discard changes",
      },
      destructiveDialog: {
        cancel: "Cancel",
        close: "Close",
      },
      notFound: {
        page: "Page not found",
        goHome: "Go home",
        goBack: "Go back",
      },
      score: {
        aria: "Score {{score}}, {{cue}}",
        positive: "positive",
        negative: "negative",
        neutral: "neutral",
      },
      tag: {
        removeFilter: "Remove {{label}} filter",
      },
      settings: {
        title: "Settings",
        autoSave: "Changes are saved automatically",
        language: {
          title: "Language",
          description: "Language used throughout Tango",
          label: "Language",
          help: "Use your system language or choose one explicitly",
          system: "System",
          english: "English",
          japanese: "日本語",
        },
        appearance: {
          title: "Appearance",
          description: "Study controls and visual feedback",
          showSwipeControls: {
            label: "Show swipe controls",
            help: "Display study swipe action controls",
          },
          showBackTextSwipeOverlays: {
            label: "Show back text swipe overlays",
            help: "Display left and right study actions while viewing an answer",
          },
          showPlaybackControls: {
            label: "Show playback controls",
            help: "Display autoplay and progress controls",
          },
          showCardDetails: {
            label: "Show card details",
            help: "Display score and study history during a session",
          },
          showSwipeFeedback: {
            label: "Show swipe feedback",
            help: "Confirm each study action on screen",
          },
          darkMode: {
            label: "Dark mode",
            help: "Use the darker Calm Focus palette",
          },
        },
        study: {
          title: "Study",
          description: "Card order, session size, and autoplay",
          shuffleCards: {
            label: "Shuffle cards",
            help: "Randomize each study session",
          },
          maximumCards: {
            label: "Maximum cards",
            help: "Limit the size of a study session",
            value_one: "{{count}} card",
            value_other: "{{count}} cards",
          },
          respectReviewSchedule: {
            label: "Respect review schedule",
            help: "Hide cards until their next review time",
          },
          startAutoplay: {
            label: "Start autoplay",
            help: "Begin playback when study opens",
          },
          autoplayInterval: {
            label: "Autoplay interval",
            help: "Seconds between cards",
            value_one: "{{count}} second",
            value_other: "{{count}} seconds",
            shortValue: "{{count}}s",
          },
        },
        advanced: {
          title: "Advanced",
          description: "Application version and commit",
          version: "Version",
          commitHash: "Commit hash",
        },
      },
    },
  },
  ja: {
    translation: {
      header: {
        switchToLightMode: "ライトモードに切り替える",
        switchToDarkMode: "ダークモードに切り替える",
        importDecks: "デッキをインポート",
        openAccount: "アカウントを開く",
        openSettings: "設定を開く",
      },
      card: {
        answerAria: "カードの回答",
      },
      deckImport: {
        uploadPrompt: "CSVファイルをアップロード",
      },
      navigationGuard: {
        title: "未保存の変更を破棄しますか？",
        description: "このページを離れると変更内容は失われます。",
        keepEditing: "編集を続ける",
        discard: "変更を破棄",
      },
      destructiveDialog: {
        cancel: "キャンセル",
        close: "閉じる",
      },
      notFound: {
        page: "ページが見つかりません",
        goHome: "ホームへ",
        goBack: "戻る",
      },
      score: {
        aria: "スコア {{score}}、{{cue}}",
        positive: "正",
        negative: "負",
        neutral: "中立",
      },
      tag: {
        removeFilter: "{{label}}フィルターを削除",
      },
      settings: {
        title: "設定",
        autoSave: "変更は自動的に保存されます",
        language: {
          title: "言語",
          description: "Tango全体で使用する言語",
          label: "言語",
          help: "システムの言語を使用するか、言語を選択します",
          system: "System",
          english: "English",
          japanese: "日本語",
        },
        appearance: {
          title: "外観",
          description: "学習コントロールと視覚的なフィードバック",
          showSwipeControls: {
            label: "スワイプ操作を表示",
            help: "学習時のスワイプ操作ボタンを表示します",
          },
          showBackTextSwipeOverlays: {
            label: "裏面のスワイプ操作を表示",
            help: "回答の表示中に左右の学習操作を表示します",
          },
          showPlaybackControls: {
            label: "再生コントロールを表示",
            help: "自動再生と進捗のコントロールを表示します",
          },
          showCardDetails: {
            label: "カードの詳細を表示",
            help: "セッション中にスコアと学習履歴を表示します",
          },
          showSwipeFeedback: {
            label: "スワイプ結果を表示",
            help: "学習操作の結果を画面上で確認します",
          },
          darkMode: {
            label: "ダークモード",
            help: "落ち着いた暗いカラーパレットを使用します",
          },
        },
        study: {
          title: "学習",
          description: "カードの順序、セッションのカード数、自動再生",
          shuffleCards: {
            label: "カードをシャッフル",
            help: "学習セッションごとにカードの順序をランダム化します",
          },
          maximumCards: {
            label: "最大カード数",
            help: "1回の学習セッションのカード数を制限します",
            value_other: "{{count}}枚",
          },
          respectReviewSchedule: {
            label: "復習スケジュールに従う",
            help: "次の復習時刻までカードを非表示にします",
          },
          startAutoplay: {
            label: "自動再生で開始",
            help: "学習画面を開いたときに再生を開始します",
          },
          autoplayInterval: {
            label: "自動再生の間隔",
            help: "カードを切り替えるまでの秒数",
            value_other: "{{count}}秒",
            shortValue: "{{count}}秒",
          },
        },
        advanced: {
          title: "詳細設定",
          description: "アプリのバージョンとコミット",
          version: "バージョン",
          commitHash: "コミットハッシュ",
        },
      },
    },
  },
} as const;

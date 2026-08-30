import type { Preferences, SwipeDirection } from "@/entities/preference";

type SwipeAction = Preferences["controls"][SwipeDirection];

interface StudyHelpRow {
  control: string;
  action: string;
}

export interface StudyHelpContent {
  triggerLabel: string;
  title: string;
  description: string;
  closeLabel: string;
  rows: readonly StudyHelpRow[];
}

interface StudyHelpResources {
  triggerLabel: string;
  title: string;
  description: string;
  closeLabel: string;
  directions: Record<SwipeDirection, string>;
  actions: Record<SwipeAction, string>;
  controls: {
    flip: string;
    flipAction: string;
    autoPlay: string;
    autoPlayAction: string;
    autoPlayUnavailable: string;
    swipeButtons: string;
    swipeButtonsVisible: string;
    swipeButtonsHidden: string;
    playbackControls: string;
    playbackControlsVisible: string;
    playbackControlsHidden: string;
    playbackControlsUnavailable: string;
    cardDetails: string;
    cardDetailsAction: string;
    exit: string;
    exitAction: string;
  };
}

const resources = {
  en: {
    triggerLabel: "Open study help",
    title: "Study controls",
    description: "Review the controls available for this study session and their current actions.",
    closeLabel: "Close help",
    directions: {
      cardSwipeUp: "Arrow Up / Swipe Up",
      cardSwipeDown: "Arrow Down / Swipe Down",
      cardSwipeLeft: "Arrow Left / Swipe Left",
      cardSwipeRight: "Arrow Right / Swipe Right",
    },
    actions: {
      DoNothing: "No action",
      GoBack: "End the current session and return to the deck list",
      GoToPrevCard: "Go to the previous card",
      GoToNextCard: "Go to the next card",
      GoToNextCardMastered: "Mark mastered and go to the next card",
      GoToNextCardNotMastered: "Mark not mastered and go to the next card",
      GoToNextCardToggleMastered: "Toggle mastered and go to the next card",
    },
    controls: {
      flip: "Enter / Select Card",
      flipAction: "Flip or reveal the current card",
      autoPlay: "Space / Play or Pause button",
      autoPlayAction: "Play or pause autoplay",
      autoPlayUnavailable: "Autoplay is unavailable while the card interval is 0",
      swipeButtons: "B / Swipe controls button",
      swipeButtonsVisible: "Hide the currently visible swipe buttons",
      swipeButtonsHidden: "Show the currently hidden swipe buttons",
      playbackControls: "Playback controls button",
      playbackControlsVisible: "Hide the currently visible playback controls",
      playbackControlsHidden: "Show the currently hidden playback controls",
      playbackControlsUnavailable: "Playback controls are unavailable while the card interval is 0",
      cardDetails: "Card details button",
      cardDetailsAction: "Show or hide score and study history",
      exit: "Back to deck list button",
      exitAction: "Exit without ending the current study session",
    },
  },
  ja: {
    triggerLabel: "学習ヘルプを開く",
    title: "学習画面の操作",
    description: "この学習セッションで利用できる操作と、現在割り当てられている動作を確認できます。",
    closeLabel: "ヘルプを閉じる",
    directions: {
      cardSwipeUp: "上矢印 / 上へスワイプ",
      cardSwipeDown: "下矢印 / 下へスワイプ",
      cardSwipeLeft: "左矢印 / 左へスワイプ",
      cardSwipeRight: "右矢印 / 右へスワイプ",
    },
    actions: {
      DoNothing: "何もしない",
      GoBack: "現在の学習セッションを終了してデッキ一覧へ戻る",
      GoToPrevCard: "前のカードへ移動",
      GoToNextCard: "次のカードへ移動",
      GoToNextCardMastered: "習得済みにして次のカードへ移動",
      GoToNextCardNotMastered: "未習得にして次のカードへ移動",
      GoToNextCardToggleMastered: "習得状態を切り替えて次のカードへ移動",
    },
    controls: {
      flip: "Enter / カードを選択",
      flipAction: "現在のカードを裏返す、または答えを表示する",
      autoPlay: "Space / 再生・一時停止ボタン",
      autoPlayAction: "自動再生を開始または一時停止する",
      autoPlayUnavailable: "カード間隔が0のため自動再生は利用できません",
      swipeButtons: "B / スワイプ操作ボタン",
      swipeButtonsVisible: "表示中のスワイプ操作ボタンを隠す",
      swipeButtonsHidden: "非表示のスワイプ操作ボタンを表示する",
      playbackControls: "再生コントロールボタン",
      playbackControlsVisible: "表示中の再生コントロールを隠す",
      playbackControlsHidden: "非表示の再生コントロールを表示する",
      playbackControlsUnavailable: "カード間隔が0のため再生コントロールは利用できません",
      cardDetails: "カード詳細ボタン",
      cardDetailsAction: "スコアと学習履歴を表示または非表示にする",
      exit: "デッキ一覧へ戻るボタン",
      exitAction: "現在の学習セッションを終了せずに画面を離れる",
    },
  },
} satisfies Record<"en" | "ja", StudyHelpResources>;

const directionOrder: readonly SwipeDirection[] = ["cardSwipeUp", "cardSwipeDown", "cardSwipeLeft", "cardSwipeRight"];

const resolveResources = (locale: string): StudyHelpResources =>
  locale.toLowerCase().startsWith("ja") ? resources.ja : resources.en;

export const buildStudyHelpContent = (preferences: Preferences, locale: string): StudyHelpContent => {
  const copy = resolveResources(locale);
  const playbackAvailable = preferences.study.cardInterval > 0;
  const rows: StudyHelpRow[] = directionOrder.map((direction) => ({
    control: copy.directions[direction],
    action: copy.actions[preferences.controls[direction]],
  }));

  rows.push(
    { control: copy.controls.flip, action: copy.controls.flipAction },
    {
      control: copy.controls.autoPlay,
      action: playbackAvailable ? copy.controls.autoPlayAction : copy.controls.autoPlayUnavailable,
    },
    {
      control: copy.controls.swipeButtons,
      action: preferences.controls.showSwipeButtonList
        ? copy.controls.swipeButtonsVisible
        : copy.controls.swipeButtonsHidden,
    },
    {
      control: copy.controls.playbackControls,
      action: playbackAvailable
        ? preferences.controls.showPlaybackControls
          ? copy.controls.playbackControlsVisible
          : copy.controls.playbackControlsHidden
        : copy.controls.playbackControlsUnavailable,
    },
    { control: copy.controls.cardDetails, action: copy.controls.cardDetailsAction },
    { control: copy.controls.exit, action: copy.controls.exitAction }
  );

  return {
    triggerLabel: copy.triggerLabel,
    title: copy.title,
    description: copy.description,
    closeLabel: copy.closeLabel,
    rows,
  };
};

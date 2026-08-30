import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "storybook/test";

import { StudyHelpDialog } from "./StudyHelpDialog";

const englishRows = [
  { control: "Arrow Up / Swipe Up", action: "Mark mastered and go to the next card" },
  { control: "Arrow Down / Swipe Down", action: "Mark not mastered and go to the next card" },
  { control: "Arrow Left / Swipe Left", action: "Go to the previous card" },
  { control: "Arrow Right / Swipe Right", action: "Go to the next card" },
  { control: "Enter / Select Card", action: "Flip or reveal the current card" },
  { control: "Space / Play or Pause button", action: "Play or pause autoplay" },
  { control: "B / Swipe controls button", action: "Hide the currently visible swipe buttons" },
  { control: "Playback controls button", action: "Hide the currently visible playback controls" },
  { control: "Card details button", action: "Show or hide score and study history" },
  { control: "Back to deck list button", action: "Exit without ending the current study session" },
];

const meta = {
  title: "Pages/Study Session/StudyHelpDialog",
  component: StudyHelpDialog,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  args: {
    title: "Study controls",
    description: "Review the controls available for this study session and their current actions.",
    closeLabel: "Close help",
    rows: englishRows,
    onClose: fn(),
  },
} satisfies Meta<typeof StudyHelpDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {};

export const Japanese: Story = {
  args: {
    title: "学習画面の操作",
    description: "この学習セッションで利用できる操作と、現在割り当てられている動作を確認できます。",
    closeLabel: "ヘルプを閉じる",
    rows: [
      { control: "上矢印 / 上へスワイプ", action: "習得済みにして次のカードへ移動" },
      { control: "下矢印 / 下へスワイプ", action: "未習得にして次のカードへ移動" },
      { control: "左矢印 / 左へスワイプ", action: "前のカードへ移動" },
      { control: "右矢印 / 右へスワイプ", action: "次のカードへ移動" },
      { control: "Enter / カードを選択", action: "現在のカードを裏返す、または答えを表示する" },
      { control: "Space / 再生・一時停止ボタン", action: "自動再生を開始または一時停止する" },
    ],
  },
};

export const LongLabels: Story = {
  args: {
    rows: englishRows.map((row) => ({ ...row, action: `${row.action}. ${row.action}.` })),
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { RecentStudySessions } from "./RecentStudySessions";

const meta = {
  title: "Pages/Study History/Recent sessions",
  component: RecentStudySessions,
  args: {
    sessions: (["completed", "abandoned", null] as const).map((endReason, index) => ({
      sessionId: String(index),
      deckName: "A long deck name for studying vocabulary across multiple languages 日本語の単語帳",
      startedAt: new Date(2026, 8, 21, 10).getTime(),
      endedAt: endReason === null ? null : new Date(2026, 8, 21, 11).getTime(),
      endReason,
      cardCount: 1234,
    })),
  },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-3xl p-4">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof RecentStudySessions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    await expect(canvas.getByText("Unfinished")).toBeVisible();
    await expect(canvas.getByText("Completed")).toBeVisible();
    await expect(canvas.getByText("Abandoned")).toBeVisible();
    await expect(canvas.getByText("—")).toBeVisible();
  },
};
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "最近のセッション" })).toBeVisible();
    await expect(canvas.getByText("未完了")).toBeVisible();
    await expect(canvas.getByText("完了", { exact: true })).toBeVisible();
    await expect(canvas.getByText("中止")).toBeVisible();
  },
};
export const Dark: Story = { globals: { theme: "dark" } };

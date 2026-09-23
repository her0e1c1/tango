import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { StudyHistoryTable } from "./StudyHistoryTable";

const days = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(2026, 6, index + 1).getTime(),
  started: 1,
  completed: 1,
}));
const meta = {
  title: "Pages/Study History/Daily table",
  component: StudyHistoryTable,
  args: { days },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-3xl p-4">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof StudyHistoryTable>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-03 Expand daily counts", async () => {
      await expect(canvas.getByRole("table", { hidden: true })).not.toBeVisible();
      await userEvent.click(canvas.getByText("Show daily counts · 90 days"));
      await expect(canvas.getAllByRole("row")).toHaveLength(31);
    });
    await step("STORYBOOK-STUDY-HISTORY-04 Show older dates", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Older dates" }));
      await expect(canvas.getByText("31–60 of 90 days")).toBeVisible();
    });
  },
};
export const Empty: Story = { args: { days: days.slice(0, 7).map((day) => ({ ...day, started: 0, completed: 0 })) } };
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("日別の数値を表示 · 90日分"));
  },
};
export const Dark: Story = { globals: { theme: "dark" } };

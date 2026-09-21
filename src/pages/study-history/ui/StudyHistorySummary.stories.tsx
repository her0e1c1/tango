import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { StudyHistorySummary } from "./StudyHistorySummary";

const days = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(2026, 8, index + 1).getTime(),
  started: index === 29 ? 2 : 0,
  completed: index === 29 ? 3 : 0,
}));
const meta = {
  title: "Pages/Study History/Summary",
  component: StudyHistorySummary,
  args: { days, started: 2, completed: 3 },
  decorators: [
    (Story) => (
      <main className="mx-auto flex max-w-3xl flex-col gap-4 p-4">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof StudyHistorySummary>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("row")).toHaveLength(31);
  },
};
export const Empty: Story = {
  args: { days: days.map((day) => ({ ...day, started: 0, completed: 0 })), started: 0, completed: 0 },
};
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };

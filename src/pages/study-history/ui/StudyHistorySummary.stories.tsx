import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";
import { getStudyHistoryChart } from "../model/queries/getStudyHistoryChart";
import { StudyHistorySummary } from "./StudyHistorySummary";

const days = Array.from({ length: 30 }, (_, index) => ({
  date: new Date(2026, 8, index + 1).getTime(),
  started: index === 29 ? 2 : 0,
  completed: index === 29 ? 3 : 0,
}));
const meta = {
  title: "Pages/Study History/Summary",
  component: StudyHistorySummary,
  args: { chart: getStudyHistoryChart(days), started: 2, completed: 3 },
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
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-08 Render summary chart", async () => {
      await expect(canvas.getByRole("img")).toBeVisible();
    });
  },
};
export const Empty: Story = {
  args: {
    chart: getStudyHistoryChart(days.map((day) => ({ ...day, started: 0, completed: 0 }))),
    started: 0,
    completed: 0,
  },
};
export const NinetyDays: Story = {
  args: {
    chart: getStudyHistoryChart(
      Array.from({ length: 90 }, (_, index) => ({
        date: new Date(2026, 6, index + 1).getTime(),
        started: index % 3,
        completed: index % 2,
      }))
    ),
    started: 90,
    completed: 45,
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-09 Show aggregation unit", async () => {
      await expect(canvas.getByText("Study counts per 7 days")).toBeVisible();
    });
  },
};
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };

import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, mocked, within } from "storybook/test";
import { subscribeStudyHistory, type StudyHistoryRecord } from "@/entities/study-session";
import { routeMeta, state, deck, now, prepareWith } from "./support";

const records = Array.from({ length: 11 }, (_, index): StudyHistoryRecord => {
  const startedAt = now - (index === 10 ? 80 : index) * 86_400_000;
  const endReason = (["completed", "abandoned", null] as const)[index % 3]!;
  return {
    sessionId: `history-${index}`,
    deckId: deck.id,
    startedAt,
    endedAt: endReason === null ? null : startedAt + 1000,
    endReason,
    cardCount: index + 1,
    occurredAt: startedAt,
  };
});
const meta = {
  ...routeMeta,
  title: "Integration/Study history",
  parameters: { ...routeMeta.parameters, page: { ...state, path: "/study-history" } },
  beforeEach: prepareWith(() => {
    mocked(subscribeStudyHistory).mockImplementation(({ period, metric, deckId }, receive) => {
      const selected = records.filter(
        (record) =>
          (deckId === null || record.deckId === deckId) && (metric === "started" || record.endReason === "completed")
      );
      receive(
        selected
          .map((record) => ({ ...record, occurredAt: metric === "started" ? record.startedAt : record.endedAt! }))
          .filter((record) => record.occurredAt >= period.start && record.occurredAt < period.end),
        false
      );
      return () => undefined;
    });
  }),
};
export default meta;
type Story = StoryObj<typeof meta>;

export const Periods: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-08 Explain the 30-day chart and scale", async () => {
      await expect(await canvas.findByText("Daily study counts")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "30 days" })).toHaveAttribute("aria-pressed", "true");
      await expect(canvas.getByRole("img", { name: /Starts and completions in the selected period/ })).toBeVisible();
      await expect(canvas.getByText(/Jun 2, 2026 – Jul 1, 2026/)).toBeVisible();
      await expect(canvas.getByText(/Scale: 0–/)).toBeInTheDocument();
      await expect(
        within(canvas.getByText("Sessions started").parentElement!).getByRole("definition")
      ).toHaveTextContent("10");
    });
    await step("STORYBOOK-STUDY-HISTORY-01 Change the preset and its aggregate", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "7 days" }));
      await expect(canvas.getByRole("button", { name: "7 days" })).toHaveAttribute("aria-pressed", "true");
      await expect(await canvas.findByText(/Jun 25, 2026 – Jul 1, 2026/)).toBeVisible();
      await expect(
        within(canvas.getByText("Sessions started").parentElement!).getByRole("definition")
      ).toHaveTextContent("7");
      await expect(
        within(canvas.getByText("Sessions completed").parentElement!).getByRole("definition")
      ).toHaveTextContent("3");
    });
    await step("STORYBOOK-STUDY-HISTORY-02 Apply an explicit inclusive date range", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Custom range" }));
      await fireEvent.change(canvas.getByLabelText("Start date"), { target: { value: "2026-06-29" } });
      await fireEvent.change(canvas.getByLabelText("End date"), { target: { value: "2026-06-30" } });
      await userEvent.click(canvas.getByRole("button", { name: "Apply" }));
      await expect(await canvas.findByText("Jun 29, 2026 – Jun 30, 2026")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Custom range" })).toHaveAttribute("aria-pressed", "true");
      await expect(
        within(canvas.getByText("Sessions started").parentElement!).getByRole("definition")
      ).toHaveTextContent("2");
    });
  },
};
export const DailyPages: Story = {
  parameters: { page: { ...state, path: "/study-history?days=90" } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-09 Distinguish grouped 90-day counts", async () => {
      await expect(await canvas.findByText("Study counts per 7 days")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "90 days" })).toHaveAttribute("aria-pressed", "true");
      await expect(
        within(canvas.getByText("Sessions started").parentElement!).getByRole("definition")
      ).toHaveTextContent("11");
    });
    await step("STORYBOOK-STUDY-HISTORY-03 Expand the first 30 daily rows", async () => {
      await userEvent.click(canvas.getByText("Show daily counts · 90 days"));
      const table = canvas.getByRole("table", { name: "Daily counts" });
      await expect(within(table).getAllByRole("row")).toHaveLength(31);
      await expect(canvas.getByText("1–30 of 90 days")).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Older dates" })).toBeEnabled();
      await expect(within(table).getByRole("row", { name: "Jul 1, 2026 1 1" })).toBeVisible();
    });
    await step("STORYBOOK-STUDY-HISTORY-04 Page to older dates with their counts", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Older dates" }));
      const table = canvas.getByRole("table", { name: "Daily counts" });
      await expect(canvas.getByText("31–60 of 90 days")).toBeVisible();
      await expect(within(table).queryByRole("row", { name: /Jul 1, 2026/ })).not.toBeInTheDocument();
      await expect(within(table).getByRole("row", { name: "Jun 1, 2026 0 0" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Newer dates" })).toBeEnabled();
    });
  },
};
export const Sessions: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-05 Display distinct session outcomes", async () => {
      await expect((await canvas.findAllByText("Completed", { exact: true }))[0]).toBeVisible();
      await expect(canvas.getByText("Abandoned")).toBeVisible();
      await expect(canvas.getByText("Unfinished")).toBeVisible();
      await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
    });
    await step("STORYBOOK-STUDY-HISTORY-07 Expand every recent session", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Show all 10 sessions" }));
      await expect(canvas.getAllByRole("listitem")).toHaveLength(10);
      await expect(canvas.getByRole("button", { name: "Show fewer sessions" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      for (const item of canvas.getAllByRole("listitem")) {
        await expect(within(item).getByRole("heading", { name: deck.name })).toBeVisible();
        await expect(within(item).getByText("Target cards")).toBeVisible();
      }
    });
  },
};
export const JapaneseSessions: Story = {
  parameters: { locale: "ja" },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-STUDY-HISTORY-06 Translate outcomes while preserving deck names", async () => {
      await expect((await canvas.findAllByText("完了", { exact: true }))[0]).toBeVisible();
      await expect(canvas.getByText("中止")).toBeVisible();
      await expect(canvas.getByText("未完了")).toBeVisible();
      await expect(canvas.getAllByRole("heading", { name: deck.name })).toHaveLength(3);
    });
  },
};

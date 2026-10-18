import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { RecentStudySessions } from "./RecentStudySessions";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Pages/Study History/Recent sessions",
  component: RecentStudySessions,
  tags: ["autodocs"],
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
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-HISTORY-05 Session statuses", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
      await expect(canvas.getByText("Unfinished")).toBeVisible();
      await expect(canvas.getByText("Completed")).toBeVisible();
      await expect(canvas.getByText("Abandoned")).toBeVisible();
      await expect(canvas.getByText("—")).toBeVisible();
    });
  },
};
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-HISTORY-06 Japanese session statuses", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("heading", { name: "最近のセッション" })).toBeVisible();
      await expect(canvas.getByText("未完了")).toBeVisible();
      await expect(canvas.getByText("完了", { exact: true })).toBeVisible();
      await expect(canvas.getByText("中止")).toBeVisible();
    });
  },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Empty: Story = { args: { sessions: [] } };
export const MoreSessions: Story = {
  args: {
    sessions: Array.from({ length: 10 }, (_, index) => ({
      sessionId: String(index),
      deckName: `Deck ${String(index + 1)}`,
      startedAt: new Date(2026, 8, 21, 10).getTime(),
      endedAt: new Date(2026, 8, 21, 11).getTime(),
      endReason: "completed" as const,
      cardCount: 20,
    })),
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-HISTORY-07 Expand all sessions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getAllByRole("listitem")).toHaveLength(3);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Show all 10 sessions", expanded: false }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Show fewer sessions", expanded: true })).toHaveAttribute(
        "aria-controls",
        canvas.getByRole("list").id
      );
      await expect(canvas.getAllByRole("listitem")).toHaveLength(10);
    });
  },
};

export const Tablet: Story = {
  args: {
    sessions: Array.from({ length: 10 }, (_, index) => ({
      ...meta.args.sessions[index % 3]!,
      sessionId: String(index),
    })),
  },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByRole("button", { name: "Show all 10 sessions" }));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: meta.args,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: meta.args,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

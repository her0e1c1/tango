import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { StudyHistoryTable } from "./StudyHistoryTable";

const days = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(2026, 6, index + 1).getTime(),
  started: 1,
  completed: 1,
}));
// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Pages/Study History/Daily table",
  component: StudyHistoryTable,
  tags: ["autodocs"],
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-HISTORY-03 Expand daily counts", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByRole("table", { hidden: true })).not.toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Show daily counts · 90 days"));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("row")).toHaveLength(31);
    });
    await step("STORYBOOK-STUDY-HISTORY-04 Show older dates", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Older dates" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("31–60 of 90 days")).toBeVisible();
    });
  },
};
export const Empty: Story = { args: { days: days.slice(0, 7).map((day) => ({ ...day, started: 0, completed: 0 })) } };
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByText("日別の数値を表示 · 90日分"));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
};
export const Dark: Story = { globals: { theme: "dark" } };

export const Tablet: Story = {
  play: async ({ canvas, userEvent }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(canvas.getByText("Show daily counts · 90 days"));
    // Then: This play prepares a visual state; it declares no behavioral assertions.
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Tablet,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...MobileJapanese,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

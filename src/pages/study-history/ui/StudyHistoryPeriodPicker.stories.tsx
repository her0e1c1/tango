import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
import { expect, fn } from "storybook/test";
import { StudyHistoryPeriodPicker } from "./StudyHistoryPeriodPicker";

function PeriodPickerStory(args: ComponentProps<typeof StudyHistoryPeriodPicker>) {
  const form = useForm({ defaultValues: { startDate: "2026-09-01", endDate: "2026-09-22" } });
  return (
    <StudyHistoryPeriodPicker
      {...args}
      startDateInput={form.register("startDate")}
      endDateInput={form.register("endDate")}
      onSubmit={(event) => {
        event.preventDefault();
        void args.onSubmit(event);
      }}
    />
  );
}

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Pages/Study History/Period picker",
  component: StudyHistoryPeriodPicker,
  tags: ["autodocs"],
  args: {
    preset: 30,
    maxDate: "2026-09-22",
    onSelectPeriod: fn(),
    onSubmit: fn(),
    startDateInput: { name: "startDate", ref: fn(), onChange: fn(), onBlur: fn() },
    endDateInput: { name: "endDate", ref: fn(), onChange: fn(), onBlur: fn() },
  },
  render: (args) => <PeriodPickerStory {...args} />,
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-3xl p-4">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof StudyHistoryPeriodPicker>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {
  play: async ({ canvas, userEvent, args, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-STUDY-HISTORY-01 Select a preset", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getByRole("button", { name: "30 days" })).toHaveAttribute("aria-pressed", "true");
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "7 days" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onSelectPeriod).toHaveBeenCalledWith(7);
    });
    await step("STORYBOOK-STUDY-HISTORY-02 Open custom range", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Custom range" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByLabelText("Start date")).toBeVisible();
    });
  },
};
export const Custom: Story = { args: { preset: "custom" } };
export const Invalid: Story = { args: { preset: "custom", endDateError: "studyHistory.invalidRange" } };
export const MobileJapanese: Story = {
  args: { preset: "custom" },
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { args: { preset: "custom" }, globals: { theme: "dark" } };

export const Tablet: Story = {
  ...Custom,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Custom,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Invalid,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

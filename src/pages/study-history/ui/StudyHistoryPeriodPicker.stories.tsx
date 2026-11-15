import { fn } from "storybook/test";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ComponentProps } from "react";
import { useForm } from "react-hook-form";
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

const meta = {
  title: "Pages/Study History/Period picker",
  component: StudyHistoryPeriodPicker,
  tags: ["autodocs"],
  args: {
    preset: 30,
    maxDate: "2026-09-22",
    onSelectPeriod: fn(),
    onSubmit: fn(),
    startDateInput: {
      name: "startDate",
      ref: fn(),
      onChange: fn(),
      onBlur: fn(),
    },
    endDateInput: {
      name: "endDate",
      ref: fn(),
      onChange: fn(),
      onBlur: fn(),
    },
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
export const Default: Story = {};
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

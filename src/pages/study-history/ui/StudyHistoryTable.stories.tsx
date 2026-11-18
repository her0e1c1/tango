import type { Meta, StoryObj } from "@storybook/react-vite";
import { StudyHistoryTable } from "./StudyHistoryTable";

const days = Array.from({ length: 90 }, (_, index) => ({
  date: new Date(2026, 6, index + 1).getTime(),
  started: 1,
  completed: 1,
}));
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
export const Default: Story = {};
export const Empty: Story = { args: { days: days.slice(0, 7).map((day) => ({ ...day, started: 0, completed: 0 })) } };
export const MobileJapanese: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("summary")?.click();
  },
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };

export const Tablet: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>("summary")?.click();
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

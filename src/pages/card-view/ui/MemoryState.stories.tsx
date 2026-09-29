import type { Meta, StoryObj } from "@storybook/react-vite";
import { calculateFsrsState } from "@/entities/card";
import { getMemoryState } from "../model/queries/getMemoryState";
import { MemoryState } from "./MemoryState";

const at = Date.UTC(2026, 8, 21, 12);
const short = calculateFsrsState(null, "good", at);
const long = calculateFsrsState(null, "easy", at);
const meta = {
  title: "Pages/CardView/MemoryState",
  component: MemoryState,
  tags: ["autodocs"],
  args: { memory: getMemoryState(short, at + 60_000) },
} satisfies Meta<typeof MemoryState>;
export default meta;
type Story = StoryObj<typeof meta>;
export const ShortTerm: Story = {};
export const Empty: Story = { args: { memory: undefined } };
export const LongTerm: Story = { args: { memory: getMemoryState(long, at + 86_400_000) } };
export const Overdue: Story = { args: { memory: getMemoryState(long, at + 30 * 86_400_000) } };
export const CoincidentMarkers: Story = { args: { memory: getMemoryState(short, short.dueAt) } };
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { ...Overdue, globals: { theme: "dark" } };

export const Tablet: Story = {
  ...ShortTerm,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-2xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Overdue,
  decorators: [
    (StoryComponent) => (
      <div className="max-w-2xl min-w-0">
        <StoryComponent />
      </div>
    ),
  ],
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...CoincidentMarkers,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

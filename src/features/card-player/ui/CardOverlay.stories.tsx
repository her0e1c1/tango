import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import * as fixture from "@/storybook/fixture";

import { CardOverlay } from "./CardOverlay";

const meta = {
  title: "Features/Card Player/CardOverlay",
  component: CardOverlay,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    fsrs: { difficulty: 4, lastReviewedAt: fixture.timestamp },
  },
} satisfies Meta<typeof CardOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
export const Mobile: Story = { globals: { viewport: { value: "iphonex", isRotated: false } } };
export const Dark: Story = { globals: { theme: "dark" } };

function OverlayStates(args: ComponentProps<typeof CardOverlay>) {
  const [studied, setStudied] = useState(true);
  return (
    <div className="p-4 text-ink">
      <label>
        <input type="checkbox" checked={studied} onChange={(event) => setStudied(event.target.checked)} /> Studied card
      </label>
      <div className="relative mt-4 h-24">
        <CardOverlay {...args} fsrs={studied ? args.fsrs : null} />
      </div>
    </div>
  );
}

export const Tablet: Story = {
  ...Default,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  render: (args) => <OverlayStates {...args} />,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  parameters: { locale: "ja" },
  render: (args) => <OverlayStates {...args} />,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

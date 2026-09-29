import type { Meta, StoryObj } from "@storybook/react-vite";

import { Overlay } from "./Overlay";

const meta = {
  title: "Shared/Feedback/Overlay",
  component: Overlay,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: { children: "Overlay content" },
} satisfies Meta<typeof Overlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Center: Story = {
  args: {
    position: "center",
  },
};

export const Left: Story = {
  args: {
    position: "left",
  },
};

export const Right: Story = {
  args: {
    position: "right",
  },
};

export const Top: Story = {
  args: {
    position: "top",
  },
};

export const Bottom: Story = {
  args: {
    position: "bottom",
  },
};

export const Transparent: Story = {
  args: {
    position: "center",
    variant: "transparent",
    children: "Content remains visible beneath this overlay",
  },
};

export const LongMobile: Story = {
  args: {
    position: "center",
    children: "Long overlay content remains readable and scrollable. ".repeat(80),
  },
  globals: { viewport: { value: "iphone5", isRotated: false } },
};

export const Dark: Story = {
  args: { position: "center", children: "Dark-mode overlay surface" },
  globals: { theme: "dark" },
};

export const Tablet: Story = {
  ...Center,
  render: (args) => (
    <div className="grid grid-cols-2 gap-4 p-4">
      {(["center", "top", "bottom", "left", "right"] as const).map((position) => (
        <section
          key={position}
          aria-label={`${position} overlay example`}
          className="relative h-40 border border-border"
        >
          <Overlay {...args} position={position}>
            {position} content
          </Overlay>
        </section>
      ))}
    </div>
  ),
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...LongMobile,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...LongMobile,
  args: { ...LongMobile.args, variant: "surface" },
  argTypes: { variant: { control: "radio", options: ["surface", "transparent"] } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...LongMobile,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};

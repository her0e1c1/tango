import type { Meta, StoryObj } from "@storybook/react-vite";

import { FullScreen } from "./FullScreen";
import { Container } from "@/storybook/Decorator";

const meta = {
  title: "Shared/Layout/FullScreen",
  component: FullScreen,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    className: "bg-surface-muted text-ink",
  },
} satisfies Meta<typeof FullScreen>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: <div className="p-shell-gutter">Exact dynamic viewport surface</div> },
  globals: {
    theme: "light",
  },
};

export const Center: Story = {
  args: {
    center: true,
    children: "this text should be displayed in center",
  },
};

export const InContainer: Story = {
  args: { children: "text" },
  decorators: [
    (Story) => (
      <Container>
        <Story />
      </Container>
    ),
  ],
};

export const ScrollableMobileDark: Story = {
  args: {
    flex: true,
    scroll: true,
    children: (
      <div className="space-y-section-gap p-shell-gutter">
        {[1, 2, 3, 4, 5, 6, 7].map((section) => (
          <section key={section} className="rounded-surface bg-surface p-shell-gutter shadow-surface">
            <h2 className="font-semibold">Fullscreen section {section}</h2>
            <p className="mt-2 text-ink-muted">Only the vertical axis scrolls when content exceeds the viewport.</p>
          </section>
        ))}
      </div>
    ),
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};

export const Mobile: Story = {
  ...Center,
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...ScrollableMobileDark,
  args: {
    ...ScrollableMobileDark.args,
    children: (
      <div className="space-y-6 p-4">
        {Array.from({ length: 20 }, (_, index) => (
          <section key={index}>
            <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
            <p>{"Readable text within the available content surface. ".repeat(12)}</p>
          </section>
        ))}
      </div>
    ),
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Center,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...Tablet,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};

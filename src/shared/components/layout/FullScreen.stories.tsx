import type { Meta, StoryObj } from "@storybook/react";

import { FullScreen as Template } from "@/shared/components/layout/FullScreen";
import { Container } from "@/shared/storybook/Decorator";

const meta = {
  title: "Shared/FullScreen",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    className: "bg-surface-muted text-ink",
  },
} satisfies Meta<typeof Template>;

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

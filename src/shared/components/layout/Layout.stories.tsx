import type { Meta, StoryObj } from "@storybook/react";

import { Layout as Template } from "@/shared/components/layout/Layout";

const meta = {
  title: "Shared/Layout",
  component: Template,
  tags: ["autodocs"],
  args: {
    showHeader: true,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: <p className="text-ink-muted">Standard layout with a header, bounded main surface, and bottom space.</p>,
  },
  globals: {
    theme: "light",
  },
};

export const FixedHeaderLongContent: Story = {
  args: {
    fixedHeader: true,
    children: [1, 2, 3, 4, 5, 6, 7, 8].map((section) => (
      <section key={section} className="rounded-control bg-surface-muted p-shell-gutter">
        <h2 className="font-semibold text-ink">Section {section}</h2>
        <p className="mt-2 text-ink-muted">Scroll to observe the elevated header remain fixed above long content.</p>
      </section>
    )),
  },
};

export const MobileDarkFullscreen: Story = {
  args: {
    fullscreen: true,
    scroll: true,
    headerProps: { dark: true },
    children: (
      <div className="space-y-section-gap p-shell-gutter">
        {[1, 2, 3, 4, 5, 6].map((section) => (
          <section key={section} className="rounded-surface bg-surface p-shell-gutter shadow-surface">
            Fullscreen section {section}
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

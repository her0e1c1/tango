import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";

import { Layout } from "./Layout";

const meta = {
  title: "Shared/Layout/Layout",
  component: Layout,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    showHeader: true,
  },
} satisfies Meta<typeof Layout>;

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
  play: async ({ canvas }) => {
    const shell = canvas.getByRole("region", { name: "Application shell" });
    const header = canvas.getByRole("banner");
    const firstSection = canvas.getByRole("heading", { name: "Section 1" }).closest("section");

    await expect(firstSection).not.toBeNull();
    if (firstSection === null) return;

    const initialHeaderTop = header.getBoundingClientRect().top;
    await expect(firstSection.getBoundingClientRect().top).toBeGreaterThanOrEqual(
      header.getBoundingClientRect().bottom
    );

    shell.scrollTop = shell.scrollHeight;

    await expect(shell.scrollTop).toBeGreaterThan(0);
    await expect(header.getBoundingClientRect().top).toBe(initialHeaderTop);
    shell.scrollTop = 0;
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

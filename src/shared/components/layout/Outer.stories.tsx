import type { Meta, StoryObj } from "@storybook/react";

import { Outer as Template } from "@/shared/components/layout/Outer";

const meta = {
  title: "Shared/Layout/Outer",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <section className="m-shell-gutter rounded-surface bg-surface p-shell-gutter text-ink shadow-surface">
        Outer owns the application canvas and standard page scrolling.
      </section>
    ),
  },
  globals: {
    theme: "light",
  },
};

export const MobileDarkLongContent: Story = {
  args: {
    children: (
      <div className="space-y-section-gap p-shell-gutter">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((section) => (
          <section key={section} className="rounded-surface bg-surface-elevated p-shell-gutter text-ink shadow-surface">
            <h2 className="text-title font-semibold">Section {section}</h2>
            <p className="mt-2 text-ink-muted">
              Long content demonstrates that the outer canvas remains the vertical scroll owner on a narrow screen.
            </p>
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

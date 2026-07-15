import type { Meta, StoryObj } from "@storybook/react";

import { Main as Template } from "@/shared/components/layout/Main";

const meta = {
  title: "Shared/Main",
  component: Template,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <h1 className="text-title font-semibold">Focused content surface</h1>
        <p className="text-ink-muted">Main keeps application content readable within a bounded measure.</p>
      </>
    ),
  },
  globals: {
    theme: "light",
  },
};

export const NarrowDarkReadingSurface: Story = {
  args: {
    children: [1, 2, 3, 4].map((section) => (
      <section key={section} className="rounded-control bg-surface-muted p-shell-gutter">
        <h2 className="font-semibold text-ink">Reading section {section}</h2>
        <p className="mt-2 text-ink-muted">
          Calm spacing, a clear surface, and readable text remain coherent on a narrow display.
        </p>
      </section>
    )),
  },
  globals: {
    theme: "dark",
    viewport: { value: "iphonex", isRotated: false },
  },
};

import { useState, type ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Outer } from "./Outer";

const meta = {
  title: "Shared/Layout/Outer",
  component: Outer,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Outer>;

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

function OuterLengths(args: ComponentProps<typeof Outer>) {
  const [long, setLong] = useState(false);
  return (
    <Outer {...args}>
      <div className="p-4 text-ink">
        <label>
          <input type="checkbox" checked={long} onChange={(event) => setLong(event.target.checked)} /> Long content
        </label>
        {long ? args.children : <p>Short content on the application canvas.</p>}
      </div>
    </Outer>
  );
}

export const Mobile: Story = {
  ...MobileDarkLongContent,
  args: {
    children: (
      <div className="space-y-6 p-4 text-ink">
        {Array.from({ length: 20 }, (_, index) => (
          <section key={index}>
            <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
            <p>{"Readable text within the available content surface. ".repeat(12)}</p>
          </section>
        ))}
      </div>
    ),
  },
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Mobile,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Mobile,
  render: (args) => <OuterLengths {...args} />,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

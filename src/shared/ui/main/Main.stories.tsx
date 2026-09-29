import type { Meta, StoryObj } from "@storybook/react-vite";

import { Main } from "./Main";

const meta = {
  title: "Shared/Layout/Main",
  component: Main,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Main>;

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

export const Canvas: Story = { ...Default, args: { ...Default.args, surface: "canvas" } };

export const Mobile: Story = {
  args: {
    children: Array.from({ length: 20 }, (_, index) => (
      <section key={index}>
        <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
        <p>{"Readable text within the available content surface. ".repeat(12)}</p>
      </section>
    )),
  },
  globals: { theme: "light", viewport: { value: "iphone5", isRotated: false } },
};

export const Tablet: Story = {
  ...Mobile,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Mobile,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Mobile,
  render: (args) => (
    <>
      <Main {...args} />
      <Main {...args} surface="canvas" />
    </>
  ),
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

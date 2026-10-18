import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { Layout } from "./Layout";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
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
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const shell = canvas.getByRole("region", { name: "Application shell" });
    const header = canvas.getByRole("banner");
    const firstSection = canvas.getByRole("heading", { name: "Section 1" }).closest("section");

    // When: Storybook renders this scenario with its configured args and parameters.
    // Then: Verify the expected result in the assertions below.
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

export const Mobile: Story = {
  args: {
    ...FixedHeaderLongContent.args,
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
  args: {
    ...FixedHeaderLongContent.args,
    children: Array.from({ length: 20 }, (_, index) => (
      <section key={index}>
        <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
        <p>{"Readable text within the available content surface. ".repeat(12)}</p>
      </section>
    )),
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: {
    ...FixedHeaderLongContent.args,
    children: Array.from({ length: 20 }, (_, index) => (
      <section key={index}>
        <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
        <p>{"Readable text within the available content surface. ".repeat(12)}</p>
      </section>
    )),
  },
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: {
    ...FixedHeaderLongContent.args,
    children: Array.from({ length: 20 }, (_, index) => (
      <section key={index}>
        <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
        <p>{"Readable text within the available content surface. ".repeat(12)}</p>
      </section>
    )),
  },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  args: {
    ...FixedHeaderLongContent.args,
    children: Array.from({ length: 20 }, (_, index) => (
      <section key={index}>
        <h2 className="text-title font-semibold">A long heading for reading section {index + 1}</h2>
        <p>{"Readable text within the available content surface. ".repeat(12)}</p>
      </section>
    )),
  },
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};

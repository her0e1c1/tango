import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";

import { type AppStoryParameters, prepareAppStory, withPageStory } from "@/storybook/appStory";
import { AppLayout } from "@/widgets/app-layout";

const meta = {
  title: "Integration/AppLayout",
  component: AppLayout,
  decorators: [withPageStory],
  beforeEach: prepareAppStory,
  parameters: {
    layout: "fullscreen",
    page: { path: "/" } satisfies AppStoryParameters,
  },
  args: {
    showHeader: true,
  },
} satisfies Meta<typeof AppLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

export const FixedByDefault: Story = {
  args: {
    children: [1, 2, 3, 4, 5, 6, 7, 8].map((section) => (
      <section key={section} className="rounded-control bg-surface-muted p-shell-gutter">
        <h2 className="font-semibold text-ink">Application section {section}</h2>
        <p className="mt-2 text-ink-muted">Application navigation remains available while this content scrolls.</p>
      </section>
    )),
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-APP-LAYOUT-01 Fixed header", async () => {
      const shell = canvas.getByRole("region", { name: "Application shell" });
      const header = canvas.getByRole("banner");
      const firstSection = canvas.getByRole("heading", { name: "Application section 1" }).closest("section");

      await expect(firstSection).not.toBeNull();
      if (firstSection === null) return;

      await expect(getComputedStyle(header).position).toBe("fixed");
      const initialHeaderTop = header.getBoundingClientRect().top;
      await expect(firstSection.getBoundingClientRect().top).toBeGreaterThanOrEqual(
        header.getBoundingClientRect().bottom
      );

      shell.scrollTop = shell.scrollHeight;

      await expect(shell.scrollTop).toBeGreaterThan(0);
      await expect(header.getBoundingClientRect().top).toBe(initialHeaderTop);
      shell.scrollTop = 0;
    });
  },
};

export const FixedHeaderDisabled: Story = {
  args: {
    fixedHeader: false,
    children: <h1 className="text-title font-bold text-ink">Non-fixed application content</h1>,
  },
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-APP-LAYOUT-02 Non-fixed header", async () => {
      const header = canvas.getByRole("banner");
      const content = canvas.getByRole("heading", { name: "Non-fixed application content" });

      await expect(getComputedStyle(header).position).toBe("static");
      await expect(content.getBoundingClientRect().top).toBeGreaterThanOrEqual(header.getBoundingClientRect().bottom);
    });
  },
};

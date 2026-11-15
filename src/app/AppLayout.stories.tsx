import type { Meta, StoryObj } from "@storybook/react-vite";

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
};

export const FixedHeaderDisabled: Story = {
  args: {
    fixedHeader: false,
    children: <h1 className="text-title font-bold text-ink">Non-fixed application content</h1>,
  },
};

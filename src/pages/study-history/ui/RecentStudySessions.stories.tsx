import type { Meta, StoryObj } from "@storybook/react-vite";
import { RecentStudySessions } from "./RecentStudySessions";

const meta = {
  title: "Pages/Study History/Recent sessions",
  component: RecentStudySessions,
  tags: ["autodocs"],
  args: {
    sessions: (["completed", "abandoned", null] as const).map((endReason, index) => ({
      sessionId: String(index),
      deckName: "A long deck name for studying vocabulary across multiple languages 日本語の単語帳",
      startedAt: new Date(2026, 8, 21, 10).getTime(),
      endedAt: endReason === null ? null : new Date(2026, 8, 21, 11).getTime(),
      endReason,
      cardCount: 1234,
    })),
  },
  decorators: [
    (Story) => (
      <main className="mx-auto max-w-3xl p-4">
        <Story />
      </main>
    ),
  ],
} satisfies Meta<typeof RecentStudySessions>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
export const MobileJapanese: Story = {
  parameters: { locale: "ja" },
  globals: { viewport: { value: "iphonex", isRotated: false } },
};
export const Dark: Story = { globals: { theme: "dark" } };
export const Empty: Story = { args: { sessions: [] } };
export const MoreSessions: Story = {
  args: {
    sessions: Array.from({ length: 10 }, (_, index) => ({
      sessionId: String(index),
      deckName: `Deck ${String(index + 1)}`,
      startedAt: new Date(2026, 8, 21, 10).getTime(),
      endedAt: new Date(2026, 8, 21, 11).getTime(),
      endReason: "completed" as const,
      cardCount: 20,
    })),
  },
};

export const Tablet: Story = {
  play: ({ canvasElement }) => {
    canvasElement.querySelector<HTMLElement>('button[aria-expanded="false"]')?.click();
  },
  args: {
    sessions: Array.from({ length: 10 }, (_, index) => ({
      ...meta.args.sessions[index % 3]!,
      sessionId: String(index),
    })),
  },
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  args: meta.args,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  args: meta.args,
  parameters: { locale: "ja" },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

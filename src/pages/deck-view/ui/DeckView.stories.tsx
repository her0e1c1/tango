import type { Meta, StoryObj } from "@storybook/react";
import { expect, fn, userEvent, within } from "storybook/test";

import { CardView, FrontText } from "@/entities/card";
import * as fixture from "@/storybook/fixture";
import { Layout } from "@/shared/ui/layout";

import { DeckView } from "./DeckView";

const meta = {
  title: "Pages/Deck View/DeckView",
  component: DeckView,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <Layout fullscreen>
        <Story />
      </Layout>
    ),
  ],
  parameters: { layout: "fullscreen" },
  args: {
    deckName: "Everyday English",
    current: 2,
    total: 24,
    showBackText: false,
    onBack: fn(),
    onPrevious: fn(),
    onNext: fn(),
    onFlip: fn(),
    front: <FrontText text={fixture.card.default.frontText} />,
    back: <CardView text={fixture.card.default.backText} variant="bare" />,
  },
} satisfies Meta<typeof DeckView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading", { name: "Everyday English" })).toBeVisible();
    await expect(canvas.getByRole("status", { name: "Viewing progress" })).toHaveTextContent("2 / 24");
    await userEvent.click(canvas.getByRole("button", { name: "Card front" }));
    await expect(args.onFlip).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Previous card" }));
    await expect(args.onPrevious).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Next card" }));
    await expect(args.onNext).toHaveBeenCalledOnce();
    await userEvent.click(canvas.getByRole("button", { name: "Back to decks" }));
    await expect(args.onBack).toHaveBeenCalledOnce();
  },
};

export const Answer: Story = {
  args: { showBackText: true },
  play: async ({ args, canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("region", { name: "Card answer" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Previous card" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Next card" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Flip card" }));
    await expect(args.onFlip).toHaveBeenCalledOnce();
  },
};

export const LongAnswer: Story = {
  args: {
    showBackText: true,
    back: <CardView text={fixture.card.long.backText.repeat(20)} variant="bare" />,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const answer = canvas.getByRole("region", { name: "Card answer" });
    await expect(answer.scrollHeight).toBeGreaterThan(answer.clientHeight);
    await expect(getComputedStyle(answer).overflowY).toBe("auto");
    await expect(canvas.getByRole("button", { name: "Flip card" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Back to decks" })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { current: 0, total: 0 },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByText("No cards match the current filters.")).toBeVisible();
    await expect(canvas.queryByRole("button", { name: "Previous card" })).not.toBeInTheDocument();
    await expect(canvas.queryByRole("button", { name: "Next card" })).not.toBeInTheDocument();
  },
};

export const Mobile: Story = {
  globals: { viewport: { value: "iphone5", isRotated: false } },
  args: { deckName: "A long deck name that remains readable on small screens" },
};

export const MobileLongAnswer: Story = {
  ...LongAnswer,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const CodeAnswer: Story = {
  args: {
    showBackText: true,
    back: <CardView text={fixture.code.default.repeat(20)} category="python" code variant="bare" />,
  },
};

export const MathAnswer: Story = {
  args: {
    showBackText: true,
    back: <CardView text={`${fixture.math.markdown}\n${fixture.math.block}`} category="math" variant="bare" />,
  },
};

export const Dark: Story = {
  globals: { theme: "dark" },
};

export const Japanese: Story = {
  parameters: { locale: "ja" },
};

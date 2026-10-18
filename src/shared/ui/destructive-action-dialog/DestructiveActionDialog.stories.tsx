import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";

import { DestructiveActionDialog } from "./DestructiveActionDialog";

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Shared/Feedback/DestructiveActionDialog",
  component: DestructiveActionDialog,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    title: "Delete deck?",
    targetLabel: "Deck",
    targetName: "Japanese verbs",
    description: (
      <>
        <p>This permanently deletes 24 cards.</p>
        <p>Any in-progress study session for this deck will also end. This action cannot be undone.</p>
      </>
    ),
    confirmLabel: "Delete deck",
    onCancel: fn(),
    onConfirm: fn(),
  },
} satisfies Meta<typeof DestructiveActionDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Deck: Story = {};

export const Card: Story = {
  args: {
    title: "Delete card?",
    targetLabel: "Card front",
    targetName:
      "A long card front remains available to assistive technology and scrolls instead of overflowing the dialog on small screens.",
    description: <p>This permanently deletes this card. This action cannot be undone.</p>,
    confirmLabel: "Delete card",
  },
};

export const Pending: Story = { args: { pending: true } };

export const Mobile: Story = {
  ...Card,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = { globals: { theme: "dark" } };

export const Tablet: Story = {
  ...Card,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Deck,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Card,
  args: { ...Card.args, pending: false },
  argTypes: { pending: { control: "boolean" } },
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...Card,
  args: { ...Card.args, targetName: String(Card.args?.targetName).repeat(5) },
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};

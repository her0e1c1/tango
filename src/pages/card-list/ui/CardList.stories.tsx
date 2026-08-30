import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";
import { BackText } from "@/features/card-view";
import { withPageLayout } from "@/storybook/PageLayoutDecorator";
import * as fixture from "@/storybook/fixture";

import { CardList } from "./CardList";

const activeFilter = { scoreMax: 1, scoreMin: -1, selectedTags: ["tag 1", "tag 2"] };
const longUnbrokenTag =
  "tag_this_is_one_genuinely_long_unbroken_value_that_must_never_force_the_mobile_card_list_beyond_the_viewport_width_even_when_it_keeps_going_0123456789";
const longUnbrokenCards = fixture.cards.long.map((card, index) =>
  index === 0 ? { ...card, tags: [longUnbrokenTag] } : card
);
const cardViewOverlay = (dark: boolean) => ({
  content: <BackText text={fixture.code.default} category="python" code dark={dark} />,
  onClose: fn(),
});

const RemovableSelectedTagsExample: React.FC<{
  onRemoveTag: React.ComponentProps<typeof CardList>["onRemoveTag"];
}> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
  return (
    <CardList
      cards={fixture.cards.default}
      filter={{ scoreMin: null, scoreMax: null, selectedTags }}
      onRemoveTag={(tag) => {
        props.onRemoveTag?.(tag);
        setSelectedTags((values) => values.filter((value) => value !== tag));
      }}
    />
  );
};

const ClosableCardViewExample: React.FC<React.ComponentProps<typeof CardList>> = (props) => {
  const { overlay: initialOverlay, ...rest } = props;
  const [overlay, setOverlay] = React.useState(initialOverlay);

  return (
    <CardList
      {...rest}
      {...(overlay !== undefined
        ? {
            overlay: {
              ...overlay,
              onClose: () => {
                overlay.onClose?.();
                setOverlay(undefined);
              },
            },
          }
        : {})}
    />
  );
};

const meta = {
  title: "Pages/Card List/CardList",
  component: CardList,
  tags: ["autodocs"],
  decorators: [withPageLayout],
  parameters: {
    layout: "fullscreen",
  },
  args: {
    cards: fixture.cards.default,
    filter: activeFilter,
    filterSlot: <div>Filter controls</div>,
  },
} satisfies Meta<typeof CardList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AddCard: Story = {
  args: { onAddCard: fn() },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Add card" }));
    await expect(args.onAddCard).toHaveBeenCalledOnce();
  },
};

export const Empty: Story = {
  args: {
    cards: [],
    filter: { scoreMax: null, scoreMin: null, selectedTags: [] },
  },
};

export const ViewCard: Story = {
  args: { onShowCard: fn() },
  play: async ({ args, canvas, userEvent }) => {
    const [viewButton] = canvas.getAllByRole("button", { name: /^View / });
    const [firstCard] = fixture.cards.default;
    if (viewButton == null || firstCard == null) throw new Error("ViewCard requires at least one Card");

    await userEvent.click(viewButton);

    await expect(args.onShowCard).toHaveBeenCalledWith(firstCard.id);
  },
};

export const RemovableSelectedTags: Story = {
  args: { onRemoveTag: fn() },
  render: (args) => <RemovableSelectedTagsExample onRemoveTag={args.onRemoveTag} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Remove TypeScript filter" }));
    await expect(args.onRemoveTag).toHaveBeenCalledWith("TypeScript");
    await expect(canvas.queryByRole("button", { name: "Remove TypeScript filter" })).not.toBeInTheDocument();
  },
};

export const Long: Story = {
  args: {
    filterSlot: <div>Many filter controls</div>,
    cards: fixture.cards.long,
  },
};

export const CardView: Story = {
  args: { overlay: cardViewOverlay(false) },
};

export const DarkCardView: Story = {
  args: { overlay: cardViewOverlay(true) },
  globals: { theme: "dark" },
};

export const CardViewInteraction: Story = {
  args: { overlay: cardViewOverlay(false) },
  render: (args) => <ClosableCardViewExample {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Close card" }));
    await expect(args.overlay?.onClose).toHaveBeenCalledOnce();
    await expect(canvas.queryByRole("button", { name: "Close card" })).not.toBeInTheDocument();
  },
};

export const Dark: Story = { globals: { theme: "dark" } };

export const IphoneX: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const IphoneXLong: Story = {
  globals: { viewport: { value: "iphonex", isRotated: false } },
  args: {
    filterSlot: <div>Many filter controls</div>,
    filter: { scoreMax: 1, scoreMin: -1, selectedTags: [longUnbrokenTag] },
    cards: longUnbrokenCards,
  },
};

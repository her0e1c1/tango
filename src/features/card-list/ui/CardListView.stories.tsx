/**
 * @file Defines Storybook examples for the Card List feature view.
 * These isolated scenarios show developers how the component looks, which props it accepts, and
 * how it responds to interaction.
 */

import type { Meta, StoryObj } from "@storybook/react";
import * as React from "react";
import { expect, fn } from "storybook/test";
import * as fixture from "@/storybook/fixture";
import { INITIAL_VIEWPORTS } from "@/storybook/storybookViewports";

import { CardListView as Template } from "./CardListView";

const activeFilter = { scoreMax: 1, scoreMin: -1, selectedTags: ["tag 1", "tag 2"] };
const longUnbrokenTag =
  "tag_this_is_one_genuinely_long_unbroken_value_that_must_never_force_the_mobile_card_list_beyond_the_viewport_width_even_when_it_keeps_going_0123456789";
const longUnbrokenCards = fixture.studyCards.long.map((studyCard, index) =>
  index === 0 ? { ...studyCard, card: { ...studyCard.card, tags: [longUnbrokenTag] } } : studyCard
);

/**
 * Renders the Removable Selected Tags Example Storybook example with local interactive state.
 * Local state lets readers try the component without connecting it to the full application.
 */
const RemovableSelectedTagsExample: React.FC<{
  onRemoveTag: React.ComponentProps<typeof Template>["onRemoveTag"];
}> = (props) => {
  const [selectedTags, setSelectedTags] = React.useState(["TypeScript", "Accessibility"]);
  return (
    <Template
      cards={fixture.studyCards.default}
      filter={{ scoreMin: null, scoreMax: null, selectedTags }}
      onRemoveTag={(tag) => {
        props.onRemoveTag?.(tag);
        setSelectedTags((values) => values.filter((value) => value !== tag));
      }}
    />
  );
};

/**
 * Renders the Closable Card View Example Storybook example with local interactive state.
 * Local state lets readers try the component without connecting it to the full application.
 */
const ClosableCardViewExample: React.FC<React.ComponentProps<typeof Template>> = (props) => {
  const { overlay: initialOverlay, ...rest } = props;
  const [overlay, setOverlay] = React.useState(initialOverlay);

  return (
    <Template
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
  title: "Features/Card List",
  component: Template,
  tags: ["autodocs"],
  parameters: {
    layout: "fullscreen",
    viewport: {
      viewports: INITIAL_VIEWPORTS,
      defaultViewport: "desktop",
    },
  },
  args: {
    cards: fixture.studyCards.default,
    filter: activeFilter,
    filterSlot: <div>Filter controls</div>,
  },
} satisfies Meta<typeof Template>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const HoverHighlight: Story = {
  play: async ({ canvas, userEvent }) => {
    const firstCard = canvas.getAllByRole("button", { name: /^View / })[0];
    if (firstCard == null) throw new Error("HoverHighlight requires at least one card");
    await userEvent.hover(firstCard);
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
    cards: fixture.studyCards.long,
  },
};

export const CardView: Story = {
  args: {
    overlay: {
      content: <div>{fixture.card.default.backText}</div>,
      onClose: fn(),
    },
  },
  render: (args) => <ClosableCardViewExample {...args} />,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Close card" }));
    await expect(args.overlay?.onClose).toHaveBeenCalledOnce();
    await expect(canvas.queryByText(fixture.card.default.backText)).not.toBeInTheDocument();
  },
};

export const DarkCardView: Story = { ...CardView, globals: { theme: "dark" } };

export const Dark: Story = { globals: { theme: "dark" } };

export const IphoneX: Story = {
  parameters: { viewport: { defaultViewport: "iphonex" } },
};

export const IphoneXLong: Story = {
  parameters: { viewport: { defaultViewport: "iphonex" } },
  args: {
    filterSlot: <div>Many filter controls</div>,
    filter: { scoreMax: 1, scoreMin: -1, selectedTags: [longUnbrokenTag] },
    cards: longUnbrokenCards,
  },
};

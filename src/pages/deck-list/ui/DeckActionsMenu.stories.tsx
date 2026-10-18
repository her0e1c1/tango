import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { expect, fn, waitFor } from "storybook/test";

import { withPageLayout } from "@/storybook/PageLayoutDecorator";

import { DeckActionsMenu, type DeckActionsMenuProps } from "./DeckActionsMenu";

const DeckActionsMenuStory = (args: DeckActionsMenuProps) => {
  const [open, setOpen] = useState(args.open);

  return (
    <DeckActionsMenu
      {...args}
      open={open}
      onToggle={() => {
        args.onToggle();
        setOpen((current) => !current);
      }}
      onClose={() => {
        args.onClose();
        setOpen(false);
      }}
    />
  );
};

// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = {
  title: "Pages/Deck List/DeckActionsMenu",
  component: DeckActionsMenu,
  tags: ["autodocs"],
  parameters: { layout: "fullscreen" },
  decorators: [
    (StoryComponent) => (
      <div className="flex min-h-20 items-center justify-end rounded-surface border border-border bg-surface px-3 shadow-surface">
        <StoryComponent />
      </div>
    ),
    withPageLayout,
  ],
  args: {
    deckName: "Japanese verbs",
    open: false,
    onToggle: fn(),
    onClose: fn(),
    onDownload: fn(),
    onHistory: fn(),
    onEdit: fn(),
    onDelete: fn(),
  },
} satisfies Meta<typeof DeckActionsMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Open: Story = {
  args: { open: true },
};

export const WithStudySession: Story = {
  args: { open: true, onRestart: fn() },
};

export const Disabled: Story = {
  args: { open: true, disabled: true },
};

export const LongDeckName: Story = {
  args: {
    deckName:
      "A very long deck name remains available in every accessible action label without widening the row".repeat(2),
    open: true,
  },
};

export const Interaction: Story = {
  render: (args) => <DeckActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-07 Download from menu", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.deckName}` }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("menu", { name: `Actions for ${args.deckName}` })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("menuitem", { name: "Download" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onDownload).toHaveBeenCalledOnce();
      await expect(canvas.queryByRole("menu", { name: `Actions for ${args.deckName}` })).not.toBeInTheDocument();
    });
  },
};

export const Mobile: Story = {
  ...Open,
  globals: { viewport: { value: "iphonex", isRotated: false } },
};

export const Dark: Story = {
  ...Open,
  globals: { theme: "dark" },
};

export const History: Story = {
  render: (args) => <DeckActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-08 Open study history", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.deckName}` }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "Study history" }));
      // Then: Verify the expected result in the assertions below.
      await expect(args.onHistory).toHaveBeenCalledOnce();
    });
  },
};

export const UnstartedMenu: Story = {
  args: { open: true },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-22 Omit restart without an active session", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
        "View",
        "Download",
        "Edit",
        "Study history",
        "Delete",
      ]);
      await expect(canvas.queryByRole("menuitem", { name: "Restart" })).not.toBeInTheDocument();
    });
  },
};

export const KeyboardMenu: Story = {
  args: { onRestart: fn() },
  render: (args) => <DeckActionsMenuStory {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-23 Navigate the menu with arrow keys", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const trigger = canvas.getByRole("button", { name: `Open actions for ${args.deckName}` });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(trigger);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("menuitem", { name: "View" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{ArrowDown}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("menuitem", { name: "Restart" })).toHaveFocus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Escape}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      await expect(trigger).toHaveFocus();
    });
  },
};

export const OutsideFocus: Story = {
  render: (args) => (
    <>
      <button type="button">Outside menu</button>
      <DeckActionsMenuStory {...args} />
    </>
  ),
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-25 Preserve focus moved outside the menu", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.deckName}` }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("menuitem", { name: "View" })).toHaveFocus();
      // When: Exercise `canvas.getByRole("button", { name: "Outside menu" }).focus` with the prepared inputs.
      canvas.getByRole("button", { name: "Outside menu" }).focus();
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.queryByRole("menu")).not.toBeInTheDocument());
      await expect(canvas.getByRole("button", { name: "Outside menu" })).toHaveFocus();
    });
  },
};

function refocusStory(name: string, callback: "onDownload" | "onEdit" | "onDelete"): Story {
  return {
    render: (args) => <DeckActionsMenuStory {...args} />,
    play: async ({ args, canvas, userEvent, step }) => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await step("STORYBOOK-DECK-LIST-24 Keep actions available across transient blur", async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: `Open actions for ${args.deckName}` }));
        const view = canvas.getByRole("menuitem", { name: "View" });
        // Then: Verify the expected result in the assertions below.
        await expect(view).toHaveFocus();
        // When: Exercise `view.blur` with the prepared inputs.
        view.blur();
        canvas.getByRole("menuitem", { name }).focus();
        await userEvent.keyboard("{Enter}");
        // Then: Verify the expected result in the assertions below.
        await expect(args[callback]).toHaveBeenCalledOnce();
      });
    },
  };
}
export const RefocusDownload = refocusStory("Download", "onDownload");
export const RefocusEdit = refocusStory("Edit", "onEdit");
export const RefocusDelete = refocusStory("Delete", "onDelete");

function PendingMenuExample(args: DeckActionsMenuProps) {
  const [disabled, setDisabled] = useState(false);
  return (
    <>
      <button type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => setDisabled(!disabled)}>
        Toggle pending
      </button>
      <DeckActionsMenuStory {...args} disabled={disabled} />
    </>
  );
}
export const PendingCycle: Story = {
  render: (args) => <PendingMenuExample {...args} />,
  play: async ({ args, canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-LIST-26 Keep menu closed after pending work", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const trigger = canvas.getByRole("button", { name: `Open actions for ${args.deckName}` });
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(trigger);
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("menu")).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Toggle pending" }));
      // Then: Verify the expected result in the assertions below.
      await expect(trigger).toBeDisabled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Toggle pending" }));
      // Then: Verify the expected result in the assertions below.
      await expect(trigger).toBeEnabled();
      await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
    });
  },
};

export const Tablet: Story = {
  args: { ...LongDeckName.args, onRestart: fn() },
  render: (args) => <DeckActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "ipad", isRotated: false } },
};

export const Desktop: Story = {
  ...Open,
  render: (args) => <DeckActionsMenuStory {...args} />,
  globals: { theme: "light", viewport: { value: "desktop1280", isRotated: false } },
};

export const MobileDark: Story = {
  ...Tablet,
  globals: { theme: "dark", viewport: { value: "iphone5", isRotated: false } },
};

export const Landscape: Story = {
  ...Tablet,
  globals: { theme: "light", viewport: { value: "landscape812", isRotated: false } },
};

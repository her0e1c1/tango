import type { StoryObj } from "@storybook/react-vite";
import { expect, mocked, screen, within } from "storybook/test";
import { deleteDeck, editDeck } from "@/entities/deck";
import { routeMeta, state, deck, cards } from "./support";

const meta = {
  ...routeMeta,
  title: "Integration/Deck edit",
  parameters: { ...routeMeta.parameters, page: { ...state, path: `/deck/${deck.id}/edit` } },
};
export default meta;
type Story = StoryObj<typeof meta>;

export const SavedValues: Story = {
  play: async ({ canvas, step }) => {
    await step("STORYBOOK-DECK-EDIT-01 Read only the selected deck's saved values", async () => {
      await expect(await canvas.findByRole("textbox", { name: "Name" })).toHaveValue("Japanese verbs");
      await expect(canvas.getByRole("combobox", { name: "Display format" })).toHaveValue("math");
      await expect(canvas.queryByDisplayValue("Other deck")).not.toBeInTheDocument();
    });
  },
};
export const Save: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-EDIT-02 Reflect the saved name in the deck list", async () => {
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "Renamed deck");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Renamed deck" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Study Other deck" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Study Japanese verbs" })).not.toBeInTheDocument();
    });
  },
};
export const Failure: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-EDIT-03 Keep the failed edit available for retry", async () => {
      mocked(editDeck).mockRejectedValueOnce(new Error("Storage unavailable"));
      const name = await canvas.findByRole("textbox", { name: "Name" });
      await userEvent.clear(name);
      await userEvent.type(name, "Renamed deck");
      await userEvent.click(canvas.getByRole("button", { name: "Save changes" }));
      await expect(await canvas.findByRole("alert")).toHaveTextContent("Unable to save changes. Try again.");
      await expect(name).toHaveValue("Renamed deck");
      await expect(canvas.getByRole("button", { name: "Save changes" })).toBeEnabled();
    });
  },
};
export const Delete: Story = {
  parameters: {
    page: {
      ...state,
      path: `/deck/${deck.id}/edit`,
      cards: Array.from({ length: 24 }, (_, index) => ({
        ...cards[0]!,
        id: `delete-card-${index}`,
        uniqueKey: `delete-key-${index}`,
      })),
    },
  },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-04 Confirm deletion and retain the other deck", async () => {
      await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
      const dialog = within(await screen.findByRole("alertdialog", { name: "Delete deck?" }));
      await expect(dialog.getByText("Japanese verbs", { exact: true })).toBeVisible();
      await expect(dialog.getByText("This permanently deletes 24 cards in this deck.")).toBeVisible();
      await userEvent.click(dialog.getByRole("button", { name: "Delete deck" }));
      await expect(await canvas.findByRole("heading", { name: "Decks" })).toBeVisible();
      await expect(canvas.queryByRole("button", { name: "Study Japanese verbs" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "Study Other deck" })).toBeVisible();
    });
  },
};
function cancelStory(escape: boolean): Story {
  return {
    play: async ({ canvas, userEvent, step }) => {
      await step("STORYBOOK-DECK-FORM-05 Cancel deletion and preserve the editor", async () => {
        await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
        if (escape) await userEvent.keyboard("{Escape}");
        else
          await userEvent.click(within(await screen.findByRole("alertdialog")).getByRole("button", { name: "Cancel" }));
        await expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
        await expect(canvas.getByRole("textbox", { name: "Name" })).toHaveValue("Japanese verbs");
        await expect(canvas.queryByText(/Deleted deck/)).not.toBeInTheDocument();
      });
    },
  };
}
export const Cancel = cancelStory(false);
export const Escape = cancelStory(true);
export const PendingDeletion: Story = {
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-DECK-FORM-06 Keep deletion confirmation locked while pending", async () => {
      const pending = Promise.withResolvers<void>();
      mocked(deleteDeck).mockImplementationOnce(() => pending.promise);
      try {
        await userEvent.click(await canvas.findByRole("button", { name: "Delete deck" }));
        const dialog = within(await screen.findByRole("alertdialog"));
        await userEvent.click(dialog.getByRole("button", { name: "Delete deck" }));
        await expect(dialog.getByRole("button", { name: "Delete deck" })).toBeDisabled();
        await expect(dialog.getByRole("button", { name: "Cancel" })).toBeDisabled();
        await userEvent.keyboard("{Escape}");
        await expect(screen.getByRole("alertdialog")).toBeVisible();
      } finally {
        pending.resolve();
      }
    });
  },
};

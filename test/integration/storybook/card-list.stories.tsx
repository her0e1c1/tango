import type { StoryObj } from "@storybook/react-vite";
import { expect, fireEvent, mocked, screen, waitFor, within } from "storybook/test";
import { appI18n } from "@/app/i18n/instance";
import { calculateFsrsState, deleteCard } from "@/entities/card";
import { replaceRemoteCards } from "@/test/utils/entityFixtures";
import { routeMeta, state, deck, cards, now } from "./support";

function page(selectedTags: string[] = [], tagAndFilter = false, values = cards) {
  return {
    ...state,
    cards: values,
    decks: [{ ...deck, cardFilter: { selectedTags, tagAndFilter } }],
    path: `/deck/${deck.id}`,
  };
}
// Given: Story args and parameters define the render scenarios below.
// When: Storybook renders each exported variant and runs its play when present.
// Then: Assertions are in the relevant plays; rendering alone adds no behavioral checks.
const meta = { ...routeMeta, title: "Integration/Card list", parameters: { ...routeMeta.parameters, page: page() } };
export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-01 Open creation for the same deck", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Actions" }));
      await userEvent.click(canvas.getByRole("menuitem", { name: "Add card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Create card" })).toBeVisible();
      await expect(canvas.getByText(`Add a card to ${deck.name}.`)).toBeVisible();
    });
  },
};
export const NoCards: Story = {
  parameters: { page: page([], false, []) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-02 Explain cards that have not been created", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "No cards yet" })).toBeVisible();
      await expect(canvas.getByRole("button", { name: "Add card" })).toBeEnabled();
    });
    await step("STORYBOOK-CARD-LIST-17 Start card creation from the empty-state action", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Add card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "Create card" })).toBeVisible();
      await expect(canvas.getByText(`Add a card to ${deck.name}.`)).toBeVisible();
    });
  },
};
export const NoMatches: Story = {
  parameters: { page: page(["missing"]) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-03 Explain zero matches separately from no cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("heading", { name: "No cards match the active filters" })).toBeVisible();
      await expect(canvas.queryByRole("heading", { name: "No cards yet" })).not.toBeInTheDocument();
    });
    await step("STORYBOOK-CARD-LIST-18 Clear the zero-result filter and show the deck cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "View Hello" })).toBeVisible();
      await expect(canvas.getAllByRole("article")).toHaveLength(5);
      await expect(canvas.queryByRole("list", { name: "Selected tags" })).not.toBeInTheDocument();
    });
  },
};
export const FutureCards: Story = {
  parameters: {
    page: {
      ...page(
        [],
        false,
        cards.map((card) => ({ ...card, fsrs: { ...calculateFsrsState(null, "good", now), dueAt: now + 86_400_000 } }))
      ),
      preferences: { ...state.preferences, study: { ...state.preferences.study, useCardInterval: true } },
    },
  },
  play: async ({ canvas, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-04 Keep future review cards available for browsing", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("button", { name: "View Hello" })).toBeVisible();
      await expect(canvas.getAllByRole("article")).toHaveLength(5);
      await expect(canvas.queryByRole("heading", { name: "No cards due for review" })).not.toBeInTheDocument();
    });
  },
};
export const ViewAndClose: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-05 Open the selected card without mixing its content", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "View Second" }));
      const overlay = canvas.getByRole("button", { name: "Close card" });
      // Then: Verify the expected result in the assertions below.
      await expect(within(overlay).getByRole("heading", { name: "Second" })).toBeVisible();
      await expect(overlay).toHaveTextContent("Second answer");
      await expect(within(overlay).queryByText("Hello")).not.toBeInTheDocument();
    });
    await step("STORYBOOK-CARD-LIST-07 Close the enlarged card and operate the list again", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "Close card" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("button", { name: "Close card" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("button", { name: "View Hello" })).toBeEnabled();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("button", { name: "View Hello" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "Close card" })).toHaveTextContent("Hola");
    });
  },
};
export const SelectedFocus: Story = {
  parameters: { page: page(["A", "B"], true) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step(
      "STORYBOOK-CARD-LIST-06 STORYBOOK-CARD-LIST-12 Remove a selected tag and focus the remaining removal action",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const remove = await canvas.findByRole("button", { name: "Remove A filter" });
        remove.focus();
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard("{Enter}");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("button", { name: "Remove A filter" })).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "Remove B filter" })).toHaveFocus();
        await expect(canvas.getAllByRole("article")).toHaveLength(4);
        await expect(canvas.queryByRole("button", { name: "View Hello" })).not.toBeInTheDocument();
      }
    );
    await step("STORYBOOK-CARD-LIST-13 Return focus to Filters after removing the final tag", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard("{Enter}");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("list", { name: "Selected tags" })).not.toBeInTheDocument();
      await expect(canvas.getByText("Filters", { exact: true }).closest("summary")).toHaveFocus();
      await expect(canvas.getAllByRole("article")).toHaveLength(5);
    });
  },
};
export const SortAndEdit: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-08 Restore the standard card order", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const select = await canvas.findByRole("combobox", { name: "Sort order" });
      // When: Exercise `userEvent.selectOptions` with the prepared inputs.
      await userEvent.selectOptions(select, "newest");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("article")[0]).toHaveTextContent("Fifth");
      // When: Exercise `userEvent.selectOptions` with the prepared inputs.
      await userEvent.selectOptions(select, "standard");
      // Then: Verify the expected result in the assertions below.
      await expect(select).toHaveDisplayValue("Standard");
      await expect(
        canvas.getAllByRole("article").map((row) =>
          within(row)
            .getByRole("button", { name: /^View / })
            .getAttribute("aria-label")
        )
      ).toEqual(cards.map((card) => `View ${card.frontText}`));
    });
    await step(
      "STORYBOOK-CARD-LIST-09 STORYBOOK-CARD-LIST-19 Open the identified card editor from its row menu",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("button", { name: "Open actions for Second" }));
        await userEvent.click(canvas.getByRole("menuitem", { name: "Edit" }));
        // Then: Verify the expected result in the assertions below.
        await expect(await canvas.findByRole("heading", { name: "Edit card" })).toBeVisible();
        await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
        await expect(canvas.getByRole("textbox", { name: "Front text" })).toHaveValue("Second");
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("tab", { name: "Back" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("textbox", { name: "Back text" })).toHaveValue("Second answer");
      }
    );
  },
};
export const MenuUpdates: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-15 Keep one menu and close it when its card disappears", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByRole("button", { name: "Open actions for Hello" }));
      await userEvent.click(canvas.getByRole("button", { name: "Open actions for Second" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("menu")).toHaveLength(1);
      await expect(canvas.getByRole("menu", { name: "Actions for Second" })).toBeVisible();
      // When: Exercise `replaceRemoteCards` with the prepared inputs.
      replaceRemoteCards(cards.filter((card) => card.id !== cards[1]!.id));
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.queryByRole("menu")).not.toBeInTheDocument());
      await expect(canvas.queryByRole("button", { name: "View Second" })).not.toBeInTheDocument();
    });
  },
};
export const MenuReorder: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-CARD-LIST-16 Keep menu identity when subscription order changes", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.selectOptions` with the prepared inputs.
      await userEvent.selectOptions(await canvas.findByRole("combobox", { name: "Sort order" }), "newest");
      await userEvent.click(canvas.getByRole("button", { name: "Open actions for Hello" }));
      replaceRemoteCards(cards.map((card) => (card.id === cards[0]!.id ? { ...card, createdAt: now + 100 } : card)));
      // Then: Verify the expected result in the assertions below.
      await waitFor(() => expect(canvas.getAllByRole("article")[0]).toHaveTextContent("Hello"));
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("menuitem", { name: "Edit" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await canvas.findByRole("textbox", { name: "Front text" })).toHaveValue("Hello");
    });
  },
};
export const Deletion: Story = {
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    const first = await canvas.findByRole("button", { name: "View Hello" });
    const second = canvas.getByRole("button", { name: "View Second" });
    const trigger = canvas.getByRole("button", { name: "Open actions for Hello" });
    await step("STORYBOOK-CARD-LIST-21 Confirm the selected card before removing it", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(trigger);
      await userEvent.click(canvas.getByRole("menuitem", { name: "Delete" }));
      // Then: Verify the expected result in the assertions below.
      await expect(await screen.findByRole("alertdialog")).toHaveTextContent("Hello");
      await expect(first).toBeInTheDocument();
      await expect(second).toBeInTheDocument();
    });
    await step(
      "STORYBOOK-CARD-LIST-20 STORYBOOK-CARD-LIST-22 Block card operations during a pending modal deletion",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        const original = mocked(deleteCard).getMockImplementation()!;
        let finish!: () => void;
        mocked(deleteCard).mockImplementationOnce(async (...args) => {
          await new Promise<void>((resolve) => {
            finish = resolve;
          });
          await original(...args);
        });
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(within(screen.getByRole("alertdialog")).getByRole("button", { name: "Delete card" }));
        // Then: Verify the expected result in the assertions below.
        await expect(first).toBeDisabled();
        await expect(second).toBeDisabled();
        await expect(trigger).toBeDisabled();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(trigger);
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("menu")).not.toBeInTheDocument();
        await expect(first).toBeInTheDocument();
        await expect(second).toBeInTheDocument();
        // When: Exercise `finish` with the prepared inputs.
        finish();
        // Then: Verify the expected result in the assertions below.
        await waitFor(() => expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument());
        await expect(canvas.queryByRole("button", { name: "View Hello" })).not.toBeInTheDocument();
        await expect(canvas.getByRole("button", { name: "View Second" })).toBeEnabled();
      }
    );
  },
};
export const TagFiltering: Story = {
  parameters: { page: page([], false, cards.slice(0, 3)) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByText("Filters", { exact: true }));
    await step(
      "STORYBOOK-DECK-FILTER-03 STORYBOOK-DECK-FILTER-04 Select one deduplicated tag and filter the list",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        await expect(canvas.getAllByRole("checkbox", { name: "A" })).toHaveLength(1);
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByRole("checkbox", { name: "A" }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("checkbox", { name: "A" })).toBeChecked();
        await expect(canvas.getAllByRole("button", { name: "Remove A filter" })).toHaveLength(1);
        await expect(canvas.getAllByRole("article")).toHaveLength(2);
        await expect(canvas.queryByRole("button", { name: "View Second" })).not.toBeInTheDocument();
      }
    );
    await step("STORYBOOK-CARD-LIST-14 Preserve selection and matching cards during Tab navigation", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("radio", { name: "Any" }).focus();
      // When: Exercise `userEvent.tab` with the prepared inputs.
      await userEvent.tab();
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("checkbox", { name: "A" })).toBeChecked();
      await expect(canvas.getAllByRole("article")).toHaveLength(2);
    });
    await step("STORYBOOK-DECK-FILTER-05 Compare Any and All against the same three cards", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("checkbox", { name: "B" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("article")).toHaveLength(3);
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("radio", { name: "All" }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
      await expect(canvas.getAllByRole("article")).toHaveLength(1);
      await expect(canvas.getByRole("button", { name: "View Third" })).toBeVisible();
    });
    await step(
      "STORYBOOK-DECK-FILTER-01 STORYBOOK-DECK-FILTER-10 Clear all tags and move focus before disabling Clear",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        canvas.getByRole("button", { name: "Clear" }).focus();
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard("{Enter}");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("button", { name: "Clear" })).toBeDisabled();
        await expect(canvas.getByRole("radio", { name: "Any" })).toHaveFocus();
        await expect(canvas.queryByRole("list", { name: "Selected tags" })).not.toBeInTheDocument();
        await expect(canvas.getAllByRole("article")).toHaveLength(3);
      }
    );
    await step("STORYBOOK-DECK-FILTER-11 Keep all eight-or-fewer choices visible without disclosure", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Storybook renders this scenario with its configured args and parameters.
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getAllByRole("checkbox")).toHaveLength(2);
      await expect(canvas.queryByRole("button", { name: /Show .* more tags/ })).not.toBeInTheDocument();
    });
  },
};
const tagNames = Array.from({ length: 12 }, (_, i) => `tag-${String(i + 1).padStart(2, "0")}`);
const taggedCards = tagNames.map((tag, i) => ({
  ...cards[0]!,
  id: `tag-card-${String(i).padStart(2, "0")}`,
  frontText: `Tagged ${i + 1}`,
  tags: [tag],
}));
export const MoreTags: Story = {
  parameters: { page: page([], false, taggedCards) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByText("Filters", { exact: true }));
    await step(
      "STORYBOOK-DECK-FILTER-02 STORYBOOK-DECK-FILTER-07 Reveal additional choices and select one with the keyboard",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        await expect(canvas.queryByRole("checkbox", { name: "tag-09" })).not.toBeInTheDocument();
        const trigger = canvas.getByRole("button", { name: "Show 4 more tags" });
        trigger.focus();
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard("{Enter}");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("checkbox", { name: "tag-09" })).toHaveFocus();
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard(" ");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("checkbox", { name: "tag-09" })).toBeChecked();
        await expect(canvas.getAllByRole("article")).toHaveLength(1);
        await expect(canvas.getByRole("button", { name: "View Tagged 9" })).toBeVisible();
      }
    );
    await step("STORYBOOK-DECK-FILTER-15 Keep expansion and selected user tags when translating", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `appI18n.changeLanguage` with the prepared inputs.
      await appI18n.changeLanguage("ja");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByRole("button", { name: "表示するタグを減らす" })).toHaveAttribute(
        "aria-expanded",
        "true"
      );
      await expect(canvas.getByRole("checkbox", { name: "tag-12" })).toBeVisible();
      await expect(canvas.getByRole("checkbox", { name: "tag-09" })).toBeChecked();
    });
  },
};
export const DisappearingTags: Story = {
  parameters: { page: page(["tag-12"], false, taggedCards) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByText("Filters", { exact: true }));
    await step("STORYBOOK-DECK-FILTER-08 Move focus when a deselected choice collapses out of view", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      canvas.getByRole("checkbox", { name: "tag-12" }).focus();
      // When: Exercise `userEvent.keyboard` with the prepared inputs.
      await userEvent.keyboard(" ");
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.queryByRole("checkbox", { name: "tag-12" })).not.toBeInTheDocument();
      await expect(canvas.getByRole("checkbox", { name: "tag-01" })).toHaveFocus();
      await expect(canvas.getAllByRole("article")).toHaveLength(12);
    });
  },
};
export const StaleTags: Story = {
  parameters: { page: page(["missing", "A"]) },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    // When: Exercise `userEvent.click` with the prepared inputs.
    await userEvent.click(await canvas.findByText("Filters", { exact: true }));
    await step("STORYBOOK-DECK-FILTER-06 Keep unavailable selected tags first and removable", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      await expect(canvas.getAllByRole("checkbox")[0]).toHaveAccessibleName("missing");
      await expect(canvas.getByRole("checkbox", { name: "missing" })).toBeChecked();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByRole("checkbox", { name: "A" }));
    });
    await step(
      "STORYBOOK-DECK-FILTER-09 Remove the last unavailable tag and keep focus on a valid control",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        canvas.getByRole("checkbox", { name: "missing" }).focus();
        // When: Exercise `userEvent.keyboard` with the prepared inputs.
        await userEvent.keyboard(" ");
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.queryByRole("checkbox", { name: "missing" })).not.toBeInTheDocument();
        await expect(canvas.getByRole("checkbox", { name: "A" })).toHaveFocus();
        await expect(canvas.getAllByRole("article")).toHaveLength(5);
      }
    );
  },
};
export const NoTagOptions: Story = {
  parameters: {
    page: page(
      [],
      true,
      cards.map((card) => ({ ...card, tags: [] }))
    ),
  },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-12 Preserve All when there are no candidate tags", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(await canvas.findByText("Filters", { exact: true }));
      // Then: Verify the expected result in the assertions below.
      await expect(canvas.getByText("No tags available.")).toBeVisible();
      await expect(canvas.getByRole("radio", { name: "All" })).toBeChecked();
      await expect(canvas.getAllByRole("article")).toHaveLength(5);
    });
  },
};
const longTag = "averylongunbrokentag".repeat(12);
export const LongTag: Story = {
  parameters: { page: page([longTag], false, [{ ...cards[0]!, tags: [longTag] }]) },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step(
      "STORYBOOK-CARD-LIST-11 STORYBOOK-DECK-FILTER-14 Preserve the full selected and candidate tag names",
      async () => {
        // Given: Use the rendered story, its args, parameters, and any setup below.
        await expect(await canvas.findByRole("button", { name: `Remove ${longTag} filter` })).toBeVisible();
        // When: Exercise `userEvent.click` with the prepared inputs.
        await userEvent.click(canvas.getByText("Filters", { exact: true }));
        // Then: Verify the expected result in the assertions below.
        await expect(canvas.getByRole("checkbox", { name: longTag })).toBeChecked();
        await expect(canvas.getByRole("checkbox", { name: longTag })).toHaveAccessibleName(longTag);
        await expect(canvas.getByRole("button", { name: `Remove ${longTag} filter` })).toHaveTextContent(longTag);
      }
    );
  },
};
export const ManySelectedTags: Story = {
  parameters: { page: page(Array.from({ length: 80 }, (_, i) => `Selected tag ${i + 1}`)) },
  globals: { viewport: { value: "iphonex", isRotated: false } },
  play: async ({ canvas, userEvent, step }) => {
    // Given: Use the rendered story, its args, parameters, and any setup below.
    await step("STORYBOOK-DECK-FILTER-13 Keep all selected tags in bounded scrolling regions", async () => {
      // Given: Use the rendered story, its args, parameters, and any setup below.
      const selected = await canvas.findByRole("list", { name: "Selected tags" });
      await expect(within(selected).getAllByRole("button")).toHaveLength(80);
      await expect(selected.scrollHeight).toBeGreaterThan(selected.clientHeight);
      selected.scrollTop = selected.scrollHeight;
      // When: Exercise `fireEvent.scroll` with the prepared inputs.
      await fireEvent.scroll(selected);
      // Then: Verify the expected result in the assertions below.
      await expect(selected.scrollTop).toBeGreaterThan(0);
      await expect(within(selected).getByRole("button", { name: "Remove Selected tag 80 filter" })).toBeVisible();
      // When: Exercise `userEvent.click` with the prepared inputs.
      await userEvent.click(canvas.getByText("Filters", { exact: true }));
      const choices = canvas.getByRole("group", { name: "Tag choices" });
      // Then: Verify the expected result in the assertions below.
      await expect(
        within(choices)
          .getAllByRole("checkbox")
          .filter((input) => (input as HTMLInputElement).checked)
      ).toHaveLength(80);
      await expect(choices.scrollHeight).toBeGreaterThan(choices.clientHeight);
    });
  },
};

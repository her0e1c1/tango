/**
 * @file Defines Storybook examples for every route-level page.
 * The stories render the production route tree with deterministic authentication, stores, routing,
 * and MSW-backed network behavior.
 */

import type { Meta, StoryObj } from "@storybook/react";
import { expect } from "storybook/test";

import { AppRoutes } from "@/app/routes";
import { routes } from "@/features/navigate";
import { type PageStoryParameters, preparePageStory, withPageStory } from "@/storybook/PageDecorator";
import { PAGE_STORY_CARD_ID, PAGE_STORY_DECK_ID, pageStoryState } from "@/storybook/pageFixture";

const page = (path: string, overrides: Partial<Omit<PageStoryParameters, "path">> = {}): PageStoryParameters => ({
  ...pageStoryState,
  ...overrides,
  path,
});

const meta = {
  title: "Page",
  component: AppRoutes,
  decorators: [withPageStory],
  loaders: [
    ({ parameters }) => {
      preparePageStory(parameters.page as PageStoryParameters);
      return {};
    },
  ],
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AppRoutes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeckList: Story = {
  parameters: { page: page(routes.deckList.to()) },
};

export const CardList: Story = {
  parameters: { page: page(routes.cardList.to(PAGE_STORY_DECK_ID)) },
};

export const DeckForm: Story = {
  parameters: { page: page(routes.deckForm.to(PAGE_STORY_DECK_ID)) },
};

export const DeckStudyStart: Story = {
  parameters: { page: page(routes.deckStudyStart.to(PAGE_STORY_DECK_ID)) },
};

export const DeckStudy: Story = {
  parameters: { page: page(routes.deckStudy.to(PAGE_STORY_DECK_ID)) },
};

export const CardView: Story = {
  parameters: { page: page(routes.cardView.to(PAGE_STORY_CARD_ID)) },
};

export const CardForm: Story = {
  parameters: { page: page(routes.cardForm.to(PAGE_STORY_CARD_ID)) },
};

export const Settings: Story = {
  parameters: { page: page(routes.settings.to()) },
};

export const Import: Story = {
  parameters: { page: page(routes.deckImport.to()) },
  play: async ({ canvas, userEvent }) => {
    const file = new File(
      ['"storybook prompt","storybook answer","story","storybook-import"'],
      "storybook-import.csv",
      { type: "text/csv" }
    );

    await userEvent.click(canvas.getByRole("radio", { name: /Local only/ }));
    await userEvent.upload(canvas.getByLabelText("Upload a csv file"), file);

    await expect(await canvas.findByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
    await expect(canvas.getByText("1 create")).toBeVisible();
    await expect(canvas.getByText("storybook answer")).toBeVisible();
  },
};

export const NotFound: Story = {
  parameters: { page: page("/not-found") },
};

/**
 * @file Defines Storybook examples for every route-level page.
 * The stories render the production route tree with deterministic authentication, stores, and routing.
 */

import type { Meta, StoryObj } from "@storybook/react";

import { AppRoutes } from "@/App";
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
    async ({ parameters }) => {
      await preparePageStory(parameters.page as PageStoryParameters);
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
  parameters: { page: page("/") },
};

export const CardList: Story = {
  parameters: { page: page(`/deck/${PAGE_STORY_DECK_ID}`) },
};

export const DeckForm: Story = {
  parameters: { page: page(`/deck/${PAGE_STORY_DECK_ID}/edit`) },
};

export const DeckStart: Story = {
  parameters: { page: page(`/deck/${PAGE_STORY_DECK_ID}/start`) },
};

export const DeckStudy: Story = {
  parameters: { page: page(`/deck/${PAGE_STORY_DECK_ID}/study`) },
};

export const CardView: Story = {
  parameters: { page: page(`/card/${PAGE_STORY_CARD_ID}`) },
};

export const CardForm: Story = {
  parameters: { page: page(`/card/${PAGE_STORY_CARD_ID}/edit`) },
};

export const Settings: Story = {
  parameters: { page: page("/settings") },
};

export const Import: Story = {
  parameters: { page: page("/import") },
};

export const NotFound: Story = {
  parameters: { page: page("/not-found") },
};

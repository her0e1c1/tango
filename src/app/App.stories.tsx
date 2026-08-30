import type { Decorator, Meta, StoryObj } from "@storybook/react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect } from "storybook/test";

import { routes } from "@/shared/router";
import { type PageStoryParameters, preparePageStory } from "@/storybook/PageDecorator";
import { PAGE_STORY_CARD_ID, PAGE_STORY_DECK_ID, pageStoryState } from "@/storybook/pageFixture";

import { appRoutes } from "./routes";

const AppRoutes = () => null;

const withAppRouter: Decorator = (_Story, context) => {
  const parameters = context.parameters.page as PageStoryParameters | undefined;
  if (parameters == null) throw new Error("App route stories require parameters.page");
  const router = createMemoryRouter(appRoutes, { initialEntries: [parameters.path] });
  return <RouterProvider key={context.id} router={router} />;
};

const page = (path: string, overrides: Partial<Omit<PageStoryParameters, "path">> = {}): PageStoryParameters => ({
  ...pageStoryState,
  ...overrides,
  path,
});

const meta = {
  title: "Integration/Routes",
  component: AppRoutes,
  decorators: [withAppRouter],
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

export const DeckCreate: Story = {
  parameters: { page: page(routes.deckCreate.to()) },
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

export const Account: Story = {
  parameters: { page: page(routes.account.to()) },
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
    await expect(canvas.getByText("1 valid")).toBeVisible();
    await expect(canvas.getByText("storybook answer")).toBeVisible();
  },
};

export const NotFound: Story = {
  parameters: { page: page("/not-found") },
};

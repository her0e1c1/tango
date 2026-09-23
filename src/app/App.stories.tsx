import type { Meta, StoryObj } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { expect } from "storybook/test";

import { routes } from "@/shared/router";
import { APP_STORY_UID, type AppStoryParameters, prepareAppStory } from "@/storybook/appStory";
import type { CardId } from "@/entities/card";
import type { Deck, DeckId } from "@/entities/deck";
import { createCard, createDeck, createPreferences } from "@/test/factories";

import { appRoutes } from "./routes";

const PAGE_STORY_DECK_ID: DeckId = "storybook-japanese";
const PAGE_STORY_SECONDARY_DECK_ID: DeckId = "storybook-math";
const PAGE_STORY_CARD_ID: CardId = "storybook-hello";

const timestamp = Date.UTC(2026, 6, 1, 9, 0, 0);

const pageStoryDecks: Deck[] = [
  createDeck({
    id: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    name: "Japanese starter",
    category: "markdown",
    selectedTags: ["greeting"],
    url: "https://example.com/decks/starter.csv",
    createdAt: timestamp - 14 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createDeck({
    id: PAGE_STORY_SECONDARY_DECK_ID,
    uid: APP_STORY_UID,
    name: "Everyday mathematics",
    category: "math",
    createdAt: timestamp - 30 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 24 * 60 * 60 * 1000,
  }),
];

const pageStoryCards = [
  createCard({
    id: PAGE_STORY_CARD_ID,
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Hello",
    backText: "こんにちは",
    tags: ["greeting"],
    uniqueKey: "storybook-hello",
    createdAt: timestamp - 10 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp,
  }),
  createCard({
    id: "storybook-good-morning",
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Good morning",
    backText: "おはようございます",
    tags: ["greeting", "polite"],
    uniqueKey: "storybook-good-morning",
    createdAt: timestamp - 9 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-thank-you",
    deckId: PAGE_STORY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "Thank you",
    backText: "ありがとうございます",
    tags: ["polite"],
    uniqueKey: "storybook-thank-you",
    createdAt: timestamp - 8 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 2 * 60 * 60 * 1000,
  }),
  createCard({
    id: "storybook-circle-area",
    deckId: PAGE_STORY_SECONDARY_DECK_ID,
    uid: APP_STORY_UID,
    frontText: "What is the area of a circle with radius r?",
    backText: "$\\pi r^2$",
    tags: ["geometry"],
    uniqueKey: "storybook-circle-area",
    createdAt: timestamp - 20 * 24 * 60 * 60 * 1000,
    updatedAt: timestamp - 3 * 24 * 60 * 60 * 1000,
  }),
];

const pageStoryState = {
  decks: pageStoryDecks,
  cards: pageStoryCards,
  preferences: createPreferences({
    maxNumberOfCardsToLearn: 20,
  }),
  sessionsByDeckId: {
    [PAGE_STORY_DECK_ID]: {
      sessionId: "storybook-session-japanese",
      lastStudiedAt: timestamp,
      startedAt: timestamp - 5 * 60 * 1000,
      cardOrderIds: pageStoryCards.filter((card) => card.deckId === PAGE_STORY_DECK_ID).map((card) => card.id),
      currentIndex: 1,
    },
  },
} satisfies Omit<AppStoryParameters, "path">;

const AppRoutes = ({ path }: { path: string }) => {
  const [router] = useState(() => createMemoryRouter(appRoutes, { initialEntries: [path] }));
  useEffect(() => () => router.dispose(), [router]);
  return <RouterProvider router={router} />;
};

const meta = {
  title: "Integration/Routes",
  render: (_args, context) => (
    <AppRoutes key={context.id} path={(context.parameters.page as AppStoryParameters).path} />
  ),
  beforeEach: prepareAppStory,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeckList: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckList.to() } },
};

export const DeckCreate: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckCreate.to() } },
};

export const CardList: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardList.to(PAGE_STORY_DECK_ID) } },
};

export const DeckForm: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckForm.to(PAGE_STORY_DECK_ID) } },
};

export const DeckStudyStart: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckStudyStart.to(PAGE_STORY_DECK_ID) } },
};

export const DeckStudy: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckStudy.to(PAGE_STORY_DECK_ID) } },
};

export const CardView: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardView.to(PAGE_STORY_CARD_ID) } },
};

export const CardForm: Story = {
  parameters: { page: { ...pageStoryState, path: routes.cardForm.to(PAGE_STORY_CARD_ID) } },
};

export const Settings: Story = {
  parameters: { page: { ...pageStoryState, path: routes.settings.to() } },
};

export const Account: Story = {
  parameters: { page: { ...pageStoryState, path: routes.account.to() } },
};

export const Import: Story = {
  parameters: { page: { ...pageStoryState, path: routes.deckImport.to() } },
  play: async ({ canvas, userEvent, step }) => {
    await step("STORYBOOK-IMPORT-02 Import preview through route", async () => {
      const file = new File(
        ['"storybook prompt","storybook answer","story","storybook-import"'],
        "storybook-import.csv",
        { type: "text/csv" }
      );

      await expect(canvas.queryByRole("heading", { name: "Review import" })).not.toBeInTheDocument();
      await expect(canvas.queryByRole("radio")).not.toBeInTheDocument();
      await userEvent.upload(canvas.getByLabelText("Upload a csv file"), file);

      await expect(await canvas.findByRole("heading", { level: 2, name: "Review import" })).toBeVisible();
      await expect(canvas.getByText("1 valid")).toBeVisible();
      await expect(canvas.getByText("storybook answer")).toBeVisible();
    });
  },
};

export const NotFound: Story = {
  parameters: { page: { ...pageStoryState, path: "/not-found" } },
};

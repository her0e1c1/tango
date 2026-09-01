/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { CardId } from "@/entities/card";
import { type RemoteCard, replaceRemoteCards } from "@/entities/card/testing";
import type { Deck, DeckId } from "@/entities/deck";
import { replaceRemoteDecks } from "@/entities/deck/testing";

import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { replaceAuthSession } from "@/entities/auth";
import { type PreferencesFixture, replacePreferences } from "@/entities/preference/testing";
import { clearStudySessions, setStudySessionIndex, startStudy } from "@/entities/study-session";

export const PAGE_STORY_UID = "storybook-user";

type StudySessionFixtures = Partial<Record<DeckId, { cardOrderIds: CardId[]; currentIndex: number }>>;

export interface PageStoryParameters {
  path: string;
  decks?: Extract<Deck, { localMode: false }>[];
  cards?: RemoteCard[];
  preferences?: PreferencesFixture;
  sessionsByDeckId?: StudySessionFixtures;
  autoPlay?: boolean;
}

const cloneDeck = (deck: Extract<Deck, { localMode: false }>): Extract<Deck, { localMode: false }> => ({
  ...deck,
  selectedTags: [...deck.selectedTags],
});

const cloneCard = (card: RemoteCard): RemoteCard => ({
  ...card,
  tags: [...card.tags],
  ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(card.nextSeeingAt.getTime()) }),
});

// Reset every store before seeding it so navigation between stories cannot leak state.
export const preparePageStory = (parameters: PageStoryParameters): void => {
  clearStudySessions();

  replaceAuthSession({
    status: "authenticated",
    uid: PAGE_STORY_UID,
    isAnonymous: true,
    displayName: null,
  });

  const decks = (parameters.decks ?? []).map(cloneDeck);
  const cards = (parameters.cards ?? []).map(cloneCard);
  replacePreferences({
    ...parameters.preferences,
    study: {
      ...(parameters.preferences?.study ?? {}),
      ...(parameters.autoPlay !== undefined ? { defaultAutoPlay: parameters.autoPlay } : {}),
    },
  });
  Object.entries(parameters.sessionsByDeckId ?? {}).forEach(([deckId, session]) => {
    if (session == null) return;
    startStudy(
      deckId,
      session.cardOrderIds.map((id, numberOfSeen) => ({ id, difficulty: 5, numberOfSeen })),
      { shuffled: false, maxNumberOfCardsToLearn: 0 }
    );
    setStudySessionIndex(deckId, session.currentIndex);
  });
  replaceRemoteDecks(decks);
  replaceRemoteCards(cards);
};

export const withPageStory: Decorator = (Story, context) => {
  const parameters = context.parameters.page as PageStoryParameters | undefined;
  if (parameters == null) throw new Error("Page stories require parameters.page");

  return (
    <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
      <Story />
    </MemoryRouter>
  );
};

/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { CardId, RemoteCard } from "@/entities/card";
import { replaceRemoteCards } from "@/entities/card/model/store";
import type { DeckId } from "@/entities/deck";
import { replaceRemoteDecks } from "@/entities/deck/model/store";
import type { RemoteDeck } from "@/entities/deck/model/types";

import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { replaceAuthSession } from "@/entities/auth";
import type { Preferences } from "@/entities/preferences";
import { preferencesSchema } from "@/entities/preferences/model/schema";
import { preferencesStore } from "@/entities/preferences/model/store";
import { clearStudySessions, setStudySessionIndex, startStudy } from "@/entities/study-session";

export const PAGE_STORY_UID = "storybook-user";

type StudySessionFixtures = Partial<Record<DeckId, { cardOrderIds: CardId[]; currentIndex: number }>>;

type PartialPreferences = {
  [K in keyof Preferences]?: Partial<Preferences[K]>;
};

export interface PageStoryParameters {
  path: string;
  decks?: RemoteDeck[];
  cards?: RemoteCard[];
  preferences?: PartialPreferences;
  sessionsByDeckId?: StudySessionFixtures;
  autoPlay?: boolean;
}

const cloneDeck = (deck: RemoteDeck): RemoteDeck => ({
  ...deck,
  selectedTags: [...deck.selectedTags],
});

const cloneCard = (card: RemoteCard): RemoteCard => ({
  ...card,
  tags: [...card.tags],
  ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(card.nextSeeingAt.getTime()) }),
});

/**
 * Rehydrates persisted stores and replaces their values with one story's deterministic fixture.
 * Running this in a Storybook loader guarantees study hydration is complete before the route renders.
 */
export const preparePageStory = async (parameters: PageStoryParameters): Promise<void> => {
  await clearStudySessions();

  replaceAuthSession({
    status: "authenticated",
    uid: PAGE_STORY_UID,
    isAnonymous: true,
    displayName: null,
  });

  const decks = (parameters.decks ?? []).map(cloneDeck);
  const cards = (parameters.cards ?? []).map(cloneCard);
  const preferences = preferencesSchema.parse({
    ...parameters.preferences,
    study: {
      ...(parameters.preferences?.study ?? {}),
      ...(parameters.autoPlay !== undefined ? { defaultAutoPlay: parameters.autoPlay } : {}),
    },
  });
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: {
        ...preferences.study,
        selectedTags: [...preferences.study.selectedTags],
      },
    },
  });
  Object.entries(parameters.sessionsByDeckId ?? {}).forEach(([deckId, session]) => {
    if (session == null) return;
    startStudy(
      deckId,
      session.cardOrderIds.map((id, numberOfSeen) => ({ id, score: 0, numberOfSeen })),
      { shuffled: false, maxNumberOfCardsToLearn: 0 }
    );
    setStudySessionIndex(deckId, session.currentIndex);
  });
  replaceRemoteDecks(decks);
  replaceRemoteCards(cards);
};

/** Wraps a page story with the providers normally supplied by the application entry point. */
export const withPageStory: Decorator = (Story, context) => {
  const parameters = context.parameters.page as PageStoryParameters | undefined;
  if (parameters == null) throw new Error("Page stories require parameters.page");

  return (
    <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
      <Story />
    </MemoryRouter>
  );
};

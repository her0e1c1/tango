/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { CardId, RemoteCard } from "@/entities/card";
import { replaceRemoteCards } from "@/entities/card";
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
import { replaceRemoteStudyProgresses } from "@/entities/study-progress";
import { createStudyProgress } from "@/entities/study-progress/model/defaults";

export const PAGE_STORY_UID = "storybook-user";

type StudySessionFixtures = Partial<Record<DeckId, { cardOrderIds: CardId[]; currentIndex: number }>>;
type StudyProgress = ReturnType<typeof createStudyProgress>;

type PartialPreferences = {
  [K in keyof Preferences]?: Partial<Preferences[K]>;
};

export interface PageStoryParameters {
  path: string;
  decks?: RemoteDeck[];
  cards?: RemoteCard[];
  progresses?: StudyProgress[];
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
});

const cloneProgress = (progress: StudyProgress): StudyProgress => ({
  ...progress,
  ...(progress.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(progress.nextSeeingAt.getTime()) }),
});

/**
 * Rehydrates persisted stores and replaces their values with one story's deterministic fixture.
 * Running this in a Storybook loader guarantees study hydration is complete before the route renders.
 */
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
  const progresses = (parameters.progresses ?? cards.map(({ id }) => createStudyProgress(id))).map(cloneProgress);
  const progressByCardId = new Map(progresses.map((progress) => [progress.cardId, progress]));
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
      session.cardOrderIds.map((id) => progressByCardId.get(id) ?? createStudyProgress(id)),
      { shuffled: false, maxNumberOfCardsToLearn: 0 }
    );
    setStudySessionIndex(deckId, session.currentIndex);
  });
  replaceRemoteDecks(decks);
  replaceRemoteCards(cards);
  replaceRemoteStudyProgresses(progresses);
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

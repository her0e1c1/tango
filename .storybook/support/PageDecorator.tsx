/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { Card } from "@/entities/card";
import type { Deck } from "@/entities/deck";
import { cardRemoteReadStore } from "@/features/card/read/model/remoteReadStore";
import { replaceDecks } from "@/entities/deck";

import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { replaceAuthSession } from "@/entities/auth";
import type { Preferences } from "@/entities/preferences";
import { preferencesSchema } from "@/entities/preferences/model/schema";
import { preferencesStore } from "@/entities/preferences/model/store";
import type { StudyState } from "@/features/study/state/studyStore";
import { studyStore } from "@/features/study/state/studyStoreInstance";
import { toRemoteById } from "@/shared/api/remoteSnapshot";
import { RemoteReadScopeProvider } from "@/shared/lib/remote-read/RemoteReadScope";

export const PAGE_STORY_UID = "storybook-user";

type PartialPreferences = {
  [K in keyof Preferences]?: Partial<Preferences[K]>;
};

export interface PageStoryParameters {
  path: string;
  decks?: Deck[];
  cards?: Card[];
  preferences?: PartialPreferences;
  sessionsByDeckId?: StudyState["sessionsByDeckId"];
  showBackText?: boolean;
  autoPlay?: boolean;
}

const cloneDeck = (deck: Deck): Deck => ({
  ...deck,
  selectedTags: [...deck.selectedTags],
});

const cloneCard = (card: Card): Card => ({
  ...card,
  tags: [...card.tags],
  ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(card.nextSeeingAt.getTime()) }),
});

const cloneSessions = (sessionsByDeckId: StudyState["sessionsByDeckId"]): StudyState["sessionsByDeckId"] => {
  const sessions: StudyState["sessionsByDeckId"] = {};
  Object.entries(sessionsByDeckId).forEach(([deckId, session]) => {
    if (session != null) sessions[deckId] = { ...session, cardOrderIds: [...session.cardOrderIds] };
  });
  return sessions;
};

/**
 * Rehydrates persisted stores and replaces their values with one story's deterministic fixture.
 * Running this in a Storybook loader guarantees study hydration is complete before the route renders.
 */
export const preparePageStory = async (parameters: PageStoryParameters): Promise<void> => {
  await studyStore.persist.rehydrate();

  replaceAuthSession({
    status: "authenticated",
    uid: PAGE_STORY_UID,
    isAnonymous: true,
    displayName: null,
  });

  const decks = (parameters.decks ?? []).map(cloneDeck);
  const cards = (parameters.cards ?? []).map(cloneCard);
  const preferences = preferencesSchema.parse(parameters.preferences);
  preferencesStore.setState({
    preferences: {
      ...preferences,
      study: {
        ...preferences.study,
        selectedTags: [...preferences.study.selectedTags],
      },
    },
  });
  studyStore.setState({
    sessionsByDeckId: cloneSessions(parameters.sessionsByDeckId ?? {}),
    showBackText: parameters.showBackText ?? false,
    autoPlay: parameters.autoPlay ?? false,
    lastSwipe: undefined,
  });
  replaceDecks(decks);
  cardRemoteReadStore.setState({
    uid: PAGE_STORY_UID,
    status: "ready",
    itemsById: toRemoteById(cards),
    syncStatus: "synced",
  });
};

/** Wraps a page story with the providers normally supplied by the application entry point. */
export const withPageStory: Decorator = (Story, context) => {
  const parameters = context.parameters.page as PageStoryParameters | undefined;
  if (parameters == null) throw new Error("Page stories require parameters.page");

  return (
    <RemoteReadScopeProvider uid={PAGE_STORY_UID}>
      <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
        <Story />
      </MemoryRouter>
    </RemoteReadScopeProvider>
  );
};

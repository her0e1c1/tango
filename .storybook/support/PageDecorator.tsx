/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { Card } from "@/entities/card";
import { cardRemoteReadStore } from "@/entities/card/model/remoteReadStore";
import type { Deck, DeckId } from "@/entities/deck";
import { deckRemoteReadStore } from "@/entities/deck/model/remoteReadStore";

import type { Decorator } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { createSessionStore, SessionProvider, type SessionState } from "@/entities/session";
import { studyStore, type StudySession } from "@/features/study/state/studyStore";
import { configStore } from "@/shared/config/configStore";
import { configSchema, normalizeConfigInput } from "@/shared/config/configSchema";
import type { PartialConfigState } from "@/shared/config/configStore";
import { toRemoteById } from "@/shared/api/remoteSnapshot";

export const PAGE_STORY_UID = "storybook-user";

export interface PageStoryParameters {
  path: string;
  decks?: Deck[];
  cards?: Card[];
  config?: PartialConfigState;
  sessionsByDeckId?: Partial<Record<DeckId, StudySession>>;
  showBackText?: boolean;
  autoPlay?: boolean;
}

const storybookSession: SessionState = {
  status: "authenticated",
  uid: PAGE_STORY_UID,
  isAnonymous: true,
  displayName: null,
};

const storybookSessionStore = createSessionStore(storybookSession);

const cloneDeck = (deck: Deck): Deck => ({
  ...deck,
  selectedTags: [...deck.selectedTags],
});

const cloneCard = (card: Card): Card => ({
  ...card,
  tags: [...card.tags],
  ...(card.nextSeeingAt === undefined ? {} : { nextSeeingAt: new Date(card.nextSeeingAt.getTime()) }),
});

const cloneSessions = (
  sessionsByDeckId: Partial<Record<DeckId, StudySession>>
): Partial<Record<DeckId, StudySession>> => {
  const sessions: Partial<Record<DeckId, StudySession>> = {};
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
  await Promise.all([configStore.persist.rehydrate(), studyStore.persist.rehydrate()]);

  const decks = (parameters.decks ?? []).map(cloneDeck);
  const cards = (parameters.cards ?? []).map(cloneCard);
  const config = configSchema.parse(normalizeConfigInput(parameters.config));
  configStore.setState({
    config: {
      ...config,
      study: {
        ...config.study,
        selectedTags: [...config.study.selectedTags],
      },
    },
  });
  studyStore.setState({
    sessionsByDeckId: cloneSessions(parameters.sessionsByDeckId ?? {}),
    showBackText: parameters.showBackText ?? false,
    autoPlay: parameters.autoPlay ?? false,
    lastSwipe: undefined,
  });
  deckRemoteReadStore.setState({
    uid: PAGE_STORY_UID,
    status: "ready",
    itemsById: toRemoteById(decks),
    syncStatus: "synced",
  });
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
    <SessionProvider store={storybookSessionStore}>
      <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
        <Story />
      </MemoryRouter>
    </SessionProvider>
  );
};

/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { Decorator } from "@storybook/react";
import type { User } from "firebase/auth";
import { MemoryRouter } from "react-router-dom";

import { AuthProvider, type AuthState, type AuthStore } from "@/auth/AuthContext";
import { studyStore, type StudySession } from "@/features/study/state/studyStore";
import { configStore, defaultConfig } from "@/store/configStore";
import { remoteStore, toRemoteById } from "@/store/remoteStore";

export const PAGE_STORY_UID = "storybook-user";

export interface PageStoryParameters {
  path: string;
  decks?: Deck[];
  cards?: Card[];
  config?: Partial<ConfigState>;
  sessionsByDeckId?: Partial<Record<DeckId, StudySession>>;
  showBackText?: boolean;
  autoPlay?: boolean;
}

const storybookUser = {
  uid: PAGE_STORY_UID,
  isAnonymous: true,
  providerData: [],
} as unknown as User;

const storybookAuthState: AuthState = {
  status: "authenticated",
  user: storybookUser,
  uid: PAGE_STORY_UID,
};

const storybookAuthStore: AuthStore = {
  getSnapshot: () => storybookAuthState,
  subscribe: () => () => false,
  publishAuthenticatedUser: () => undefined,
  suspendAnonymousBootstrap: () => () => undefined,
  dispose: () => undefined,
};

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
  const config = { ...defaultConfig, ...parameters.config };
  configStore.setState({
    config: {
      ...config,
      selectedTags: [...config.selectedTags],
    },
  });
  studyStore.setState({
    sessionsByDeckId: cloneSessions(parameters.sessionsByDeckId ?? {}),
    showBackText: parameters.showBackText ?? false,
    autoPlay: parameters.autoPlay ?? false,
    lastSwipe: undefined,
  });
  remoteStore.setState({
    read: {
      uid: PAGE_STORY_UID,
      status: "ready",
      decksById: toRemoteById(decks),
      cardsById: toRemoteById(cards),
      syncStatus: "synced",
    },
    cardMutation: {
      uid: PAGE_STORY_UID,
      pendingCounts: new Map<CardId, number>(),
      error: null,
    },
    deckMutation: {
      uid: PAGE_STORY_UID,
      pendingCounts: new Map<DeckId, number>(),
      error: null,
    },
  });
};

/** Wraps a page story with the providers normally supplied by the application entry point. */
export const withPageStory: Decorator = (Story, context) => {
  const parameters = context.parameters.page as PageStoryParameters | undefined;
  if (parameters == null) throw new Error("Page stories require parameters.page");

  return (
    <AuthProvider store={storybookAuthStore}>
      <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
        <Story />
      </MemoryRouter>
    </AuthProvider>
  );
};

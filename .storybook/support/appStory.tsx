/**
 * @file Provides the authenticated router and deterministic application state used by page stories.
 * The helper keeps Storybook composition outside production page components while preserving their
 * normal containers, hooks, and route parameters.
 */

import type { CardId } from "@/entities/card";
import { type RemoteCard, replaceRemoteCards } from "@/entities/card/testing";
import type { Deck, DeckId } from "@/entities/deck";
import { replaceRemoteDecks } from "@/entities/deck/testing";

import type { Decorator, StoryContext } from "@storybook/react";
import { MemoryRouter } from "react-router-dom";

import { replaceAuthSession } from "@/entities/auth";
import { type PreferencesFixture, replacePreferences } from "@/entities/preference/testing";
import { clearStudySessions } from "@/entities/study-session";
import { restoreStudySession } from "@/test/entityFixtures";

import { pendingFilters } from "@/features/deck-filter/model/store";
import { dismissToast } from "@/shared/ui/toast";

import { accountPageStore } from "@/pages/account/model/store";
import { cardListStore } from "@/pages/card-list/model/store";
import { deckCreatePageStore } from "@/pages/deck-create/model/store";
import { deckEditPageStore } from "@/pages/deck-edit/model/store";
import { deckImportStore } from "@/pages/deck-import/model/store";
import { deckListStore } from "@/pages/deck-list/model/store";
import { deckViewStore } from "@/pages/deck-view/model/store";
import { studySessionPageStore } from "@/pages/study-session/model/store";

export const APP_STORY_UID = "storybook-user";

type StudySessionFixtures = Partial<
  Record<
    DeckId,
    { sessionId: string; cardOrderIds: CardId[]; currentIndex: number; lastStudiedAt: number; startedAt: number }
  >
>;

export interface AppStoryParameters {
  path: string;
  decks?: Deck[];
  cards?: RemoteCard[];
  preferences?: PreferencesFixture;
  sessionsByDeckId?: StudySessionFixtures;
  autoPlay?: boolean;
}

const cloneDeck = (deck: Deck): Deck => ({
  ...deck,
  selectedTags: [...deck.selectedTags],
});

const cloneCard = (card: RemoteCard): RemoteCard => ({
  ...card,
  tags: [...card.tags],
  fsrs: card.fsrs == null ? null : { ...card.fsrs },
});

const preparedRuns = new WeakSet<AbortSignal>();

export const prepareAppStory = async ({
  parameters: storyParameters,
  abortSignal,
}: StoryContext): Promise<(() => void) | undefined> => {
  // Storybook also invokes beforeEach for globals/args updates. Its signal lasts until remount/teardown.
  if (preparedRuns.has(abortSignal)) return;
  const parameters = storyParameters.page as AppStoryParameters | undefined;
  if (parameters == null) throw new Error("App stories require parameters.page");

  // CSV reads are real in route Stories and can outlive the Page; discard their result only after completion.
  if (deckImportStore.getState().status === "validating") {
    await new Promise<void>((resolve) => {
      const finish = () => {
        unsubscribe();
        abortSignal.removeEventListener("abort", finish);
        resolve();
      };
      const unsubscribe = deckImportStore.subscribe((state) => {
        if (state.status !== "validating") finish();
      });
      abortSignal.addEventListener("abort", finish, { once: true });
      if (abortSignal.aborted || deckImportStore.getState().status !== "validating") finish();
    });
  }
  if (abortSignal.aborted) return;

  // Page stores deliberately survive navigation in production; a new Story starts a separate scenario.
  accountPageStore.setState(accountPageStore.getInitialState(), true);
  cardListStore.setState(cardListStore.getInitialState(), true);
  deckCreatePageStore.setState(deckCreatePageStore.getInitialState(), true);
  deckEditPageStore.setState(deckEditPageStore.getInitialState(), true);
  deckImportStore.setState(deckImportStore.getInitialState(), true);
  deckListStore.setState(deckListStore.getInitialState(), true);
  deckViewStore.setState(deckViewStore.getInitialState(), true);
  studySessionPageStore.setState(studySessionPageStore.getInitialState(), true);
  pendingFilters.clear();
  dismissToast();
  clearStudySessions();

  replaceAuthSession({
    status: "authenticated",
    uid: APP_STORY_UID,
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
    restoreStudySession({
      sessionId: session.sessionId,
      deckId,
      cardOrderIds: [...session.cardOrderIds],
      currentIndex: session.currentIndex,
      lastStudiedAt: session.lastStudiedAt,
      remote: { uid: APP_STORY_UID, startedAt: session.startedAt },
    });
  });
  replaceRemoteDecks(decks);
  replaceRemoteCards(cards);
  preparedRuns.add(abortSignal);
  return () => {
    preparedRuns.delete(abortSignal);
  };
};

export const withPageStory: Decorator = (Story, context) => {
  const parameters = context.parameters.page as AppStoryParameters | undefined;
  if (parameters == null) throw new Error("Page stories require parameters.page");

  return (
    <MemoryRouter key={context.id} initialEntries={[parameters.path]}>
      <Story />
    </MemoryRouter>
  );
};

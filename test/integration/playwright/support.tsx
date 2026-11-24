import type { ReactNode } from "react";
import { useState } from "react";
import { useUnmount } from "react-use";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { appRoutes } from "@/app/routes";
import App from "@/app/App";
import { I18nProvider } from "@/app/i18n";
import { replaceAuthSession } from "@/entities/auth";
import { clearStudySessions } from "@/entities/study-session";
import { studySessionStore } from "@/entities/study-session/model/store";
import type { Deck } from "@/entities/deck";
import { createCard as cardFixture, createDeck as deckFixture } from "@/test/factories";
import {
  replacePreferences,
  replaceRemoteCards,
  replaceRemoteDecks,
  restoreStudySession,
  type RemoteCard,
  type PreferencesFixture,
} from "@/test/utils/entityFixtures";
import { pendingFilters } from "@/features/deck-filter/model/store";
import { accountPageStore } from "@/pages/account/model/store";
import { cardListStore } from "@/pages/card-list/model/store";
import { deckCreatePageStore } from "@/pages/deck-create/model/store";
import { deckEditPageStore } from "@/pages/deck-edit/model/store";
import { deckImportStore } from "@/pages/deck-import/model/store";
import { deckListStore } from "@/pages/deck-list/model/store";
import { deckViewStore } from "@/pages/deck-view/model/store";
import { studySessionPageStore } from "@/pages/study-session/model/store";
import { ToastViewport } from "@/shared/ui/toast";
import { dismissToast } from "@/test/utils/toast";
import { resetIO } from "./io";
export { io, events } from "./io";
export const uid = "playwright-user";
export interface AppParameters {
  path?: string;
  decks?: Deck[];
  cards?: RemoteCard[];
  preferences?: PreferencesFixture | null;
  sessionsByDeckId?: Partial<
    Record<
      string,
      { sessionId: string; cardOrderIds: string[]; currentIndex: number; lastStudiedAt: number; startedAt: number }
    >
  >;
  autoPlay?: boolean;
  auth?: Parameters<typeof replaceAuthSession>[0];
}
export const now = Date.UTC(2026, 6, 1, 12);
export const deck = deckFixture({
  id: "contract-deck",
  uid: uid,
  name: "Japanese verbs",
  category: "math",
  createdAt: now,
  updatedAt: now,
});
const otherDeck = deckFixture({
  id: "other-deck",
  uid: uid,
  name: "Other deck",
  category: "python",
  createdAt: now,
  updatedAt: now,
});
export const cards = ["Hello", "Second", "Third", "Fourth", "Fifth"].map((frontText, index) =>
  cardFixture({
    id: `contract-card-${index}`,
    deckId: deck.id,
    uid: uid,
    frontText,
    backText: index === 0 ? "Hola" : `${frontText} answer`,
    tags: index === 0 ? ["A"] : index === 1 ? ["B"] : ["A", "B"],
    uniqueKey: `key-${index}`,
    createdAt: now + index,
    updatedAt: now + index,
  })
);
const otherCard = cardFixture({
  id: "other-card",
  deckId: otherDeck.id,
  uid: uid,
  frontText: "Other prompt",
  backText: "Other answer",
  createdAt: now,
  updatedAt: now,
});
export const state = {
  decks: [deck, otherDeck],
  cards: [...cards, otherCard],
  preferences: {
    loadSample: false,
    study: { shuffled: false, cardInterval: 60 },
    controls: { showPlaybackControls: true, showSwipeButtonList: true, showHelp: true, showCardDetails: true },
  },
} satisfies Omit<AppParameters, "path">;

export function session(index = 0, cardOrder = cards) {
  return {
    [deck.id]: {
      sessionId: "contract-session",
      cardOrderIds: cardOrder.map((card) => card.id),
      currentIndex: index,
      startedAt: now,
      lastStudiedAt: now,
    },
  };
}
function preparePreferences(preferences: AppParameters["preferences"], autoPlay?: boolean) {
  // A null fixture preserves the production store's hydrated preferences across document navigations.
  if (preferences === null) return;
  replacePreferences({
    ...preferences,
    study: {
      ...preferences?.study,
      ...(autoPlay === undefined ? {} : { defaultAutoPlay: autoPlay }),
    },
  });
}

export function prepareApp(parameters: AppParameters = {}) {
  resetIO();
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
  replaceAuthSession(parameters.auth ?? { status: "authenticated", uid, isAnonymous: true, displayName: null });
  studySessionStore.setState({
    ownerUid: parameters.auth?.status === "authenticated" ? parameters.auth.uid : parameters.auth ? undefined : uid,
    remoteLoading: false,
    fromCache: false,
  });
  preparePreferences(parameters.preferences, parameters.autoPlay);
  for (const [deckId, value] of Object.entries(parameters.sessionsByDeckId ?? {})) {
    if (value)
      restoreStudySession({
        ...value,
        deckId,
        cardOrderIds: [...value.cardOrderIds],
        remote: {
          uid: parameters.auth?.status === "authenticated" ? parameters.auth.uid : uid,
          startedAt: value.startedAt,
        },
      });
  }
  replaceRemoteDecks(structuredClone(parameters.decks ?? []));
  replaceRemoteCards(structuredClone(parameters.cards ?? []));
}
function Routes({ path, routes }: { path: string; routes: RouteObject[] }) {
  const [router] = useState(() => {
    const initialPath = new URLSearchParams(location.search).has("scenario")
      ? path
      : `${location.pathname}${location.search}${location.hash}`;
    window.history.replaceState(null, "", initialPath);
    return createBrowserRouter(routes);
  });
  useUnmount(() => router.dispose());
  return <App router={router} />;
}
export function renderRoutes(path: string, routes: RouteObject[] = appRoutes) {
  return <Routes path={path} routes={routes} />;
}
export function renderFixture(children: ReactNode) {
  return (
    <I18nProvider>
      {children}
      <ToastViewport />
    </I18nProvider>
  );
}

import type { Meta, StoryContext } from "@storybook/react-vite";
import { useEffect, useState } from "react";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import { mocked } from "storybook/test";
import { omitUndefined } from "@/shared/lib/omitUndefined";

import { appRoutes } from "@/app/routes";
import { I18nProvider } from "@/app/i18n";
import { usePreferences } from "@/entities/preference";
import { getCards, createCard, editCard, deleteCard } from "@/entities/card";
import { getDecks, createDeck, editDeck, deleteDeck } from "@/entities/deck";
import {
  getStudySession,
  startStudy,
  setStudySessionIndex,
  abandonStudySession,
  writeStudySessionPosition,
  touchStudySession,
  subscribeStudyHistory,
} from "@/entities/study-session";
import { subscribeStudyAnswerHistory, writeStudyAnswer } from "@/entities/study-answer";
import { ToastViewport } from "@/shared/ui/toast";
import { APP_STORY_UID, type AppStoryParameters, prepareAppStory } from "@/storybook/appStory";
import { createCard as cardFixture, createDeck as deckFixture } from "@/test/factories";
import {
  applyStudySessionResult,
  replaceRemoteCards,
  replaceRemoteDecks,
  restoreStudySession,
} from "@/test/utils/entityFixtures";

export const now = Date.UTC(2026, 6, 1, 12);
export const deck = deckFixture({
  id: "contract-deck",
  uid: APP_STORY_UID,
  name: "Japanese verbs",
  category: "math",
  createdAt: now,
  updatedAt: now,
});
export const otherDeck = deckFixture({
  id: "other-deck",
  uid: APP_STORY_UID,
  name: "Other deck",
  category: "python",
  createdAt: now,
  updatedAt: now,
});
export const cards = ["Hello", "Second", "Third", "Fourth", "Fifth"].map((frontText, index) =>
  cardFixture({
    id: `contract-card-${index}`,
    deckId: deck.id,
    uid: APP_STORY_UID,
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
  uid: APP_STORY_UID,
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
} satisfies Omit<AppStoryParameters, "path">;

function preparePersistence() {
  mocked(createDeck).mockImplementation(async (uid, value) => {
    replaceRemoteDecks([...getDecks(), deckFixture({ ...omitUndefined(value), uid, createdAt: now, updatedAt: now })]);
  });
  mocked(editDeck).mockImplementation(async (_uid, value) => {
    replaceRemoteDecks(
      getDecks().map((item) =>
        item.id === value.id
          ? { ...item, ...omitUndefined(value), url: value.url === null ? undefined : (value.url ?? item.url) }
          : item
      )
    );
  });
  mocked(deleteDeck).mockImplementation(async (_uid, id) =>
    replaceRemoteDecks(getDecks().filter((item) => item.id !== id))
  );
  mocked(createCard).mockImplementation(async (uid, value) =>
    replaceRemoteCards([...getCards(), cardFixture({ ...value, uid, createdAt: now, updatedAt: now })])
  );
  mocked(editCard).mockImplementation(async (_uid, value) =>
    replaceRemoteCards(getCards().map((item) => (item.id === value.id ? { ...item, ...omitUndefined(value) } : item)))
  );
  mocked(deleteCard).mockImplementation(async (_uid, id) =>
    replaceRemoteCards(getCards().filter((item) => item.id !== id))
  );
}

function prepareStudyPersistence() {
  mocked(startStudy).mockImplementation(async ({ deckId, cardOrderIds, uid }) => {
    const sessionId = "contract-session";
    restoreStudySession({
      sessionId,
      deckId,
      cardOrderIds: [...cardOrderIds],
      currentIndex: 0,
      lastStudiedAt: now,
      remote: { uid, startedAt: now },
    });
    return sessionId;
  });
  mocked(touchStudySession).mockResolvedValue(undefined);
  mocked(setStudySessionIndex).mockImplementation(async (deckId, index) => {
    const value = getStudySession(deckId);
    if (!value || index <= value.currentIndex || index >= value.cardOrderIds.length) return false;
    applyStudySessionResult({ ...value, currentIndex: index }, null);
    return true;
  });
  mocked(abandonStudySession).mockImplementation(async (deckId) => {
    const value = getStudySession(deckId);
    if (value) applyStudySessionResult(value, "completed");
  });
  mocked(writeStudySessionPosition).mockImplementation(async (value, targetIndex) => {
    const completed = targetIndex === value.cardOrderIds.length;
    const result = {
      session: { ...value, currentIndex: completed ? targetIndex - 1 : targetIndex },
      endReason: completed ? ("completed" as const) : null,
    };
    applyStudySessionResult(result.session, result.endReason);
    return result;
  });
  mocked(writeStudyAnswer).mockResolvedValue(undefined);
  mocked(subscribeStudyHistory).mockImplementation((_request, receive) => {
    receive([], false);
    return () => undefined;
  });
  mocked(subscribeStudyAnswerHistory).mockImplementation((_request, receive) => {
    receive({ records: [], source: "server", truncated: false, invalidCount: 0, hasPendingWrites: false });
    return () => undefined;
  });
}

async function prepare(context: StoryContext) {
  const cleanup = await prepareAppStory(context);
  if (!cleanup) return;
  window.getSelection()?.removeAllRanges();
  window.scrollTo(0, 0);
  // Storybook's spy logger reads Date.now itself, so use an uninstrumented clock override.
  const realDate = Date;
  globalThis.Date = new Proxy(realDate, {
    construct: (target, args) => Reflect.construct(target, args.length === 0 ? [now] : args),
    get: (target, property) => (property === "now" ? () => now : Reflect.get(target, property)),
  });
  const language = Object.getOwnPropertyDescriptor(navigator, "language");
  Object.defineProperty(navigator, "language", {
    configurable: true,
    value: context.parameters.locale === "ja" ? "ja-JP" : "en-US",
  });
  preparePersistence();
  prepareStudyPersistence();
  const operations = [
    createDeck,
    editDeck,
    deleteDeck,
    createCard,
    editCard,
    deleteCard,
    startStudy,
    setStudySessionIndex,
    abandonStudySession,
    touchStudySession,
    writeStudySessionPosition,
    writeStudyAnswer,
    subscribeStudyHistory,
    subscribeStudyAnswerHistory,
  ];
  return () => {
    for (const operation of operations) mocked(operation).mockReset();
    globalThis.Date = realDate;
    if (language) Object.defineProperty(navigator, "language", language);
    else Reflect.deleteProperty(navigator, "language");
    cleanup();
  };
}

export function prepareWith(setup: () => void | (() => void)) {
  const preparedRuns = new WeakSet<AbortSignal>();
  return async (context: StoryContext) => {
    const cleanup = await prepare(context);
    if (preparedRuns.has(context.abortSignal)) return cleanup;
    preparedRuns.add(context.abortSignal);
    const cleanupSetup = setup();
    return () => {
      cleanupSetup?.();
      preparedRuns.delete(context.abortSignal);
      cleanup?.();
    };
  };
}

function Routes({ path }: { path: string }) {
  const [router] = useState(() => createMemoryRouter(appRoutes, { initialEntries: [path] }));
  const { darkMode } = usePreferences().appearance;
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);
  useEffect(() => () => router.dispose(), [router]);
  return (
    <I18nProvider>
      <RouterProvider router={router} />
      <ToastViewport />
    </I18nProvider>
  );
}

export const routeMeta = {
  render: (_args, context) => <Routes key={context.id} path={(context.parameters.page as AppStoryParameters).path} />,
  beforeEach: prepare,
  parameters: { layout: "fullscreen" },
} satisfies Meta;

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

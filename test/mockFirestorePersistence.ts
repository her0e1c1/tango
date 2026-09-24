import { vi } from "vitest";

vi.mock("@/entities/deck/api/firestore", async (original) => {
  const actual = await original<typeof import("@/entities/deck/api/firestore")>();
  const { deckStore } = await import("@/entities/deck/model/store");
  const { deckCreateSchema } = await import("@/entities/deck/model/schema");
  const { omitUndefined } = await import("@/shared/lib/omitUndefined");
  return {
    ...actual,
    createDeck: async (uid: string, input: unknown) => {
      await Promise.resolve();
      const deck = { ...deckCreateSchema.parse(input), uid, createdAt: Date.now(), updatedAt: Date.now() };
      deckStore.setState((state) => ({
        remoteDecks: [...state.remoteDecks.filter((value) => value.id !== deck.id), deck],
      }));
    },
    editDeck: async (uid: string, input: { id: string; url?: string | null }) => {
      if (!uid || deckStore.getState().remoteDecks.find((deck) => deck.id === input.id)?.uid !== uid)
        throw new Error("Deck owner does not match the authenticated user");
      await Promise.resolve();
      deckStore.setState((state) => ({
        remoteDecks: state.remoteDecks.map((deck) =>
          deck.id !== input.id
            ? deck
            : { ...deck, ...omitUndefined(input), url: input.url === null ? undefined : (input.url ?? deck.url) }
        ),
      }));
    },
    deleteDeck: async (uid: string, id: string) => {
      if (!uid || deckStore.getState().remoteDecks.find((deck) => deck.id === id)?.uid !== uid)
        throw new Error("Deck owner does not match the authenticated user");
      await Promise.resolve();
      deckStore.setState((state) => ({ remoteDecks: state.remoteDecks.filter((deck) => deck.id !== id) }));
    },
    subscribeDecks: () => () => undefined,
  };
});

vi.mock("@/entities/card/api/firestore", async (original) => {
  const actual = await original<typeof import("@/entities/card/api/firestore")>();
  const { cardStore } = await import("@/entities/card/model/store");
  const { cardCreateSchema } = await import("@/entities/card/model/schema");
  const operations = {
    ...actual,
    createOwnedCard: async (uid: string, input: import("@/entities/card/model/types").CardCreateCommand) => {
      await Promise.resolve();
      const card = {
        ...cardCreateSchema.parse({ ...input, uid }),
        fsrs: null,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      cardStore.setState((state) => ({
        remoteCards: [...state.remoteCards.filter((value) => value.id !== card.id), card],
      }));
    },
    editOwnedCard: async (_uid: string, input: { id: string }) => {
      await Promise.resolve();
      cardStore.setState((state) => ({
        remoteCards: state.remoteCards.map((card) => (card.id === input.id ? { ...card, ...input } : card)),
      }));
    },
    deleteOwnedCard: async (_uid: string, id: string) => {
      await Promise.resolve();
      cardStore.setState((state) => ({ remoteCards: state.remoteCards.filter((card) => card.id !== id) }));
    },
    subscribeCards: () => () => undefined,
    mutateCards: async (uid: string, mutations: import("@/entities/card").CardMutation[]) => {
      await Promise.all(
        mutations.map((mutation) =>
          mutation.kind === "create"
            ? operations.createOwnedCard(uid, mutation.card)
            : operations.editOwnedCard(uid, mutation.card)
        )
      );
    },
  };
  return operations;
});

vi.mock("@/entities/study-session/api/firestore", async (original) => {
  const actual = await original<typeof import("@/entities/study-session/api/firestore")>();
  const { studySessionStore } = await import("@/entities/study-session/model/store");
  const { restoreStudySession } = await import("@/test/entityFixtures");
  const { isStudySessionPositionUnchanged } = await import("@/entities/study-session/model/rules");
  return {
    ...actual,
    startStudy: ({ deckId, cardOrderIds, uid, now = Date.now() }: Parameters<typeof actual.startStudy>[0]) => {
      const sessionId = crypto.randomUUID();
      restoreStudySession({
        sessionId,
        deckId,
        cardOrderIds: [...cardOrderIds],
        currentIndex: 0,
        lastStudiedAt: now,
        remote: { uid, startedAt: now },
      });
      return sessionId;
    },
    touchStudySession: (deckId: string) => {
      const current = studySessionStore.getState().sessionsByDeckId[deckId];
      if (current) restoreStudySession({ ...current, lastStudiedAt: Date.now() });
    },
    setStudySessionIndex: (deckId: string, currentIndex: number) => {
      const session = studySessionStore.getState().sessionsByDeckId[deckId];
      if (!session || currentIndex <= session.currentIndex || currentIndex >= session.cardOrderIds.length) return false;
      restoreStudySession({ ...session, currentIndex, lastStudiedAt: Date.now() });
      return true;
    },
    moveStudySession: (session: import("@/entities/study-session").StudySession) => {
      const current = studySessionStore.getState().sessionsByDeckId[session.deckId];
      if (!isStudySessionPositionUnchanged(session, current)) return false;
      if (session.currentIndex + 1 === session.cardOrderIds.length) {
        studySessionStore.setState((state) => ({
          sessionsByDeckId: Object.fromEntries(
            Object.entries(state.sessionsByDeckId).filter(([id]) => id !== session.deckId)
          ),
        }));
      } else {
        restoreStudySession({ ...session, currentIndex: session.currentIndex + 1, lastStudiedAt: Date.now() });
      }
      return true;
    },
    abandonStudySession: (deckId: string) => {
      studySessionStore.setState((state) => ({
        sessionsByDeckId: Object.fromEntries(Object.entries(state.sessionsByDeckId).filter(([id]) => id !== deckId)),
      }));
    },
  };
});

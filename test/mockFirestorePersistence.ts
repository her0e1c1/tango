import { vi } from "vitest";

vi.mock("@/entities/deck/api/firestore", async () => {
  const { deckStore } = await import("@/entities/deck/model/store");
  const { deckCreateSchema } = await import("@/entities/deck/model/schema");
  const { omitUndefined } = await import("@/shared/lib/omitUndefined");
  return {
    createDeck: async (uid: string, input: unknown) => {
      await Promise.resolve();
      const deck = { ...deckCreateSchema.parse(input), uid, createdAt: Date.now(), updatedAt: Date.now() };
      deckStore.setState((state) => ({
        remoteDecks: [...state.remoteDecks.filter((value) => value.id !== deck.id), deck],
      }));
    },
    editDeck: async (_uid: string, input: { id: string; url?: string | null }) => {
      await Promise.resolve();
      deckStore.setState((state) => ({
        remoteDecks: state.remoteDecks.map((deck) =>
          deck.id !== input.id
            ? deck
            : { ...deck, ...omitUndefined(input), url: input.url === null ? undefined : (input.url ?? deck.url) }
        ),
      }));
    },
    deleteDeck: async (_uid: string, id: string) => {
      await Promise.resolve();
      deckStore.setState((state) => ({ remoteDecks: state.remoteDecks.filter((deck) => deck.id !== id) }));
    },
    subscribeDecks: () => () => undefined,
  };
});

vi.mock("@/entities/card/api/firestore", async () => {
  const { cardStore } = await import("@/entities/card/model/store");
  const { cardCreateSchema } = await import("@/entities/card/model/schema");
  return {
    createCard: async (_uid: string, input: unknown) => {
      await Promise.resolve();
      const card = { ...cardCreateSchema.parse(input), fsrs: null, createdAt: Date.now(), updatedAt: Date.now() };
      cardStore.setState((state) => ({
        remoteCards: [...state.remoteCards.filter((value) => value.id !== card.id), card],
      }));
    },
    editCard: async (_uid: string, input: { id: string }) => {
      await Promise.resolve();
      cardStore.setState((state) => ({
        remoteCards: state.remoteCards.map((card) => (card.id === input.id ? { ...card, ...input } : card)),
      }));
    },
    deleteCard: async (_uid: string, input: { id: string }) => {
      await Promise.resolve();
      cardStore.setState((state) => ({ remoteCards: state.remoteCards.filter((card) => card.id !== input.id) }));
    },
    subscribeCards: () => () => undefined,
  };
});

vi.mock("@/entities/study-session/api/firestore", async (original) => {
  const actual = await original<typeof import("@/entities/study-session/api/firestore")>();
  const { studySessionStore } = await import("@/entities/study-session/model/store");
  return {
    ...actual,
    updateStudySessionRecency: async (session: import("@/entities/study-session").StudySession) => {
      await Promise.resolve();
      studySessionStore.setState((state) => {
        // Simulate an update to this document, not a replacement of another run's snapshot.
        const current = state.sessionsByDeckId[session.deckId];
        if (current?.sessionId === session.sessionId) current.lastStudiedAt = session.lastStudiedAt;
      });
    },
    createStudySession: async (session: import("@/entities/study-session").StudySession) => {
      await Promise.resolve();
      studySessionStore.setState((state) => {
        state.sessionsByDeckId[session.deckId] = session;
      });
    },
    updateStudySession: async (session: import("@/entities/study-session").StudySession, endReason: string | null) => {
      await Promise.resolve();
      studySessionStore.setState((state) => {
        if (state.sessionsByDeckId[session.deckId]?.sessionId !== session.sessionId) return;
        if (endReason) delete state.sessionsByDeckId[session.deckId];
        else state.sessionsByDeckId[session.deckId] = { ...session, lastStudiedAt: Date.now() };
      });
    },
  };
});

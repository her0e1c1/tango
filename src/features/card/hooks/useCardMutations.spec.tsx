import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as type from "@/action/type";
import { firestoreKeys } from "@/query/firestoreKeys";
import { createTestQueryClient, createQueryWrapper } from "@/query/testUtils";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  dispatch: vi.fn(),
  deck: null as Deck | null,
  card: null as Card | null,
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
  readAll: vi.fn(),
}));

vi.mock("react-redux", () => ({ useDispatch: () => mocks.dispatch }));
vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: "uid-a", user: { uid: "uid-a" } }),
}));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
    deckById: () => mocks.deck,
    cardById: () => mocks.card,
  }),
}));
vi.mock("@/action/firestore", () => ({
  card: {
    create: mocks.create,
    update: mocks.update,
    logicalRemove: mocks.logicalRemove,
    upsert: mocks.upsert,
    readAll: mocks.readAll,
  },
}));

import { useCardMutations } from "@/features/card/hooks/useCardMutations";

describe("useCardMutations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.update.mockResolvedValue(undefined);
    mocks.readAll.mockResolvedValue([]);
  });

  it("updates localMode Cards only through Redux", async () => {
    mocks.deck = createDeck({ localMode: true });
    mocks.card = createCard({ deckId: mocks.deck.id });
    const client = createTestQueryClient();
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => result.current.update(mocks.card as Card));

    expect(mocks.dispatch).toHaveBeenCalledWith(type.cardUpdate(mocks.card));
    expect(mocks.update).not.toHaveBeenCalled();
  });

  it("awaits remote writes and keeps them out of Redux", async () => {
    mocks.deck = createDeck({ localMode: false });
    mocks.card = createCard({ deckId: mocks.deck.id, score: 0 });
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.cards("uid-a"), { [mocks.card.id]: mocks.card });
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => result.current.update({ ...mocks.card, score: 1 } as Card));

    expect(mocks.update).toHaveBeenCalledWith({ ...mocks.card, score: 1 });
    expect(mocks.dispatch).not.toHaveBeenCalled();
    expect(client.getQueryData(firestoreKeys.cards("uid-a"))).toEqual({
      [mocks.card.id]: { ...mocks.card, score: 1 },
    });
  });
});

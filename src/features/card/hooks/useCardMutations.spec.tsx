import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { firestoreKeys } from "@/query/firestoreKeys";
import { createTestQueryClient, createQueryWrapper } from "@/query/testUtils";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  card: null as Card | null,
  create: vi.fn(),
  update: vi.fn(),
  logicalRemove: vi.fn(),
  upsert: vi.fn(),
  readAll: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: "uid-a", user: { uid: "uid-a" } }),
}));
vi.mock("@/query/useRemoteCollections", () => ({
  useRemoteCollections: () => ({
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

  it("routes Card updates through the Firestore mutation service", async () => {
    const deck = createDeck();
    mocks.card = createCard({ deckId: deck.id, score: 0 });
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.cards("uid-a"), { [mocks.card.id]: mocks.card });
    const { result } = renderHook(useCardMutations, { wrapper: createQueryWrapper(client) });

    await act(async () => result.current.update({ ...mocks.card, score: 1 } as Card));

    expect(mocks.update).toHaveBeenCalledWith({ ...mocks.card, score: 1 });
    expect(client.getQueryData(firestoreKeys.cards("uid-a"))).toEqual({
      [mocks.card.id]: { ...mocks.card, score: 1 },
    });
  });
});

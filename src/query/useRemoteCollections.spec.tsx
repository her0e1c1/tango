import { renderHook } from "@testing-library/react";
import type { PropsWithChildren } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { firestoreKeys } from "@/query/firestoreKeys";
import { createTestQueryClient, createQueryWrapper } from "@/query/testUtils";
import { createCard, createDeck } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  uid: "uid-a",
  state: { uid: "uid-a", status: "ready", syncStatus: "synced" } as
    | { uid: string; status: "ready"; syncStatus: "cached" | "pending" | "synced" }
    | { uid: string; status: "loading" }
    | { uid: string; status: "error"; error: Error },
  blocker: undefined as Error | undefined,
  rootState: undefined as unknown as RootState,
  retry: vi.fn(),
}));

vi.mock("@/auth/AuthContext", () => ({
  useAuth: () => ({ status: "authenticated", uid: mocks.uid, user: { uid: mocks.uid } }),
}));
vi.mock("react-redux", () => ({
  useSelector: (select: (state: RootState) => unknown) => select(mocks.rootState),
}));
vi.mock("@/query/remoteReadSession", () => ({
  subscribeRemoteReadState: () => () => undefined,
  subscribeRemoteReadBlocker: () => () => undefined,
  getRemoteReadState: () => mocks.state,
  retryRemoteReads: mocks.retry,
  getRemoteReadBlocker: () => mocks.blocker,
}));

import { useRemoteCollections } from "@/query/useRemoteCollections";

describe("useRemoteCollections", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.state = { uid: "uid-a", status: "ready", syncStatus: "synced" };
    mocks.blocker = undefined;
  });

  it("merges Query remote data with Redux local-only data and lets local IDs win", () => {
    const localDeck = createDeck({ id: "local", name: "Local", localMode: true });
    const staleReduxRemote = createDeck({ id: "stale", localMode: false });
    const remoteCollision = createDeck({ id: "local", name: "Remote collision", localMode: false });
    const freshRemote = createDeck({ id: "fresh", localMode: false });
    const localCard = createCard({ id: "local-card", deckId: localDeck.id, frontText: "Local" });
    const staleReduxCard = createCard({ id: "stale-card", deckId: staleReduxRemote.id });
    const remoteCardCollision = createCard({ id: "local-card", deckId: freshRemote.id, frontText: "Remote" });
    const freshRemoteCard = createCard({ id: "fresh-card", deckId: freshRemote.id });
    mocks.rootState = {
      deck: { byId: { local: localDeck, stale: staleReduxRemote }, categories: [] },
      card: { byId: { "local-card": localCard, "stale-card": staleReduxCard }, tags: [] },
      config: {} as ConfigState,
    };
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { local: remoteCollision, fresh: freshRemote });
    client.setQueryData(firestoreKeys.cards("uid-a"), {
      "local-card": remoteCardCollision,
      "fresh-card": freshRemoteCard,
    });
    const QueryWrapper = createQueryWrapper(client);
    const wrapper = ({ children }: PropsWithChildren) => <QueryWrapper>{children}</QueryWrapper>;

    const { result } = renderHook(useRemoteCollections, { wrapper });

    expect(result.current.decksById).toEqual({ local: localDeck, fresh: freshRemote });
    expect(result.current.cardsById).toEqual({ "local-card": localCard, "fresh-card": freshRemoteCard });
    expect(result.current.cardsByDeckId(freshRemote.id)).toEqual([freshRemoteCard]);
    expect(result.current.status).toBe("ready");
    expect(result.current.syncStatus).toBe("synced");
  });

  it("exposes terminal state and Retry without dropping cached data", () => {
    const error = new Error("terminal");
    const remoteDeck = createDeck({ id: "remote", localMode: false });
    mocks.state = { uid: "uid-a", status: "error", error };
    mocks.rootState = {
      deck: { byId: {}, categories: [] },
      card: { byId: {}, tags: [] },
      config: {} as ConfigState,
    };
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { remote: remoteDeck });
    const QueryWrapper = createQueryWrapper(client);

    const { result } = renderHook(useRemoteCollections, { wrapper: QueryWrapper });
    result.current.retry();

    expect(result.current.decks).toEqual([remoteDeck]);
    expect(result.current.status).toBe("error");
    expect(result.current.error).toBe(error);
    expect(mocks.retry).toHaveBeenCalledTimes(1);
  });

  it("does not expose Query data until authenticated and active UIDs match", () => {
    const remoteDeck = createDeck({ id: "remote", localMode: false });
    mocks.state = { uid: "uid-b", status: "ready", syncStatus: "synced" };
    mocks.rootState = {
      deck: { byId: {}, categories: [] },
      card: { byId: {}, tags: [] },
      config: {} as ConfigState,
    };
    const client = createTestQueryClient();
    client.setQueryData(firestoreKeys.decks("uid-a"), { remote: remoteDeck });
    const QueryWrapper = createQueryWrapper(client);

    const { result } = renderHook(useRemoteCollections, { wrapper: QueryWrapper });

    expect(result.current.decks).toEqual([]);
    expect(result.current.status).toBe("loading");
  });

  it("exposes persistent cache initialization failures as blocking state", () => {
    const blocker = new Error("another tab owns the cache");
    mocks.blocker = blocker;
    mocks.rootState = {
      deck: { byId: {}, categories: [] },
      card: { byId: {}, tags: [] },
      config: {} as ConfigState,
    };
    const client = createTestQueryClient();
    const QueryWrapper = createQueryWrapper(client);

    const { result } = renderHook(useRemoteCollections, { wrapper: QueryWrapper });

    expect(result.current.status).toBe("blocked");
    expect(result.current.error).toBe(blocker);
  });
});

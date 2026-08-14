import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  operations: [] as string[],
  currentDeckSessionByUid: {} as Record<string, () => boolean>,
}));

vi.mock("@/entities/card", () => ({
  clearCards: () => mocks.operations.push("clear-cards"),
}));
vi.mock("@/entities/deck", () => ({
  clearDecks: () => mocks.operations.push("clear-decks"),
}));
vi.mock("./card", () => ({
  startCardSynchronization: (uid: string) => {
    mocks.operations.push(`start-cards:${uid}`);
    return () => mocks.operations.push(`stop-cards:${uid}`);
  },
}));
vi.mock("./deck", () => ({
  subscribeDecks: (uid: string, _onError: (error: Error) => void, isCurrent: () => boolean) => {
    mocks.operations.push(`start-decks:${uid}`);
    mocks.currentDeckSessionByUid[uid] = isCurrent;
    return () => mocks.operations.push(`stop-decks:${uid}`);
  },
}));

import { replaceAuthSession } from "@/entities/auth";
import { startRemoteReadSession } from "./lifecycle";

const authenticate = (uid: string) =>
  replaceAuthSession({ status: "authenticated", uid, isAnonymous: true, displayName: null });

describe("remote read session lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.operations.length = 0;
    Object.keys(mocks.currentDeckSessionByUid).forEach((uid) => {
      delete mocks.currentDeckSessionByUid[uid];
    });
    replaceAuthSession({ status: "initializing" });
  });

  it("clears entity data on startup and starts listeners for an authenticated UID", () => {
    const stop = startRemoteReadSession();

    expect(mocks.operations).toEqual(["clear-cards", "clear-decks"]);
    authenticate("uid-a");
    expect(mocks.operations.slice(-4)).toEqual([
      "clear-cards",
      "clear-decks",
      "start-cards:uid-a",
      "start-decks:uid-a",
    ]);

    stop();
  });

  it("stops and clears the previous UID before starting the next UID", () => {
    const stop = startRemoteReadSession();
    authenticate("uid-a");
    mocks.operations.length = 0;

    authenticate("uid-b");

    expect(mocks.operations).toEqual([
      "stop-cards:uid-a",
      "stop-decks:uid-a",
      "clear-cards",
      "clear-decks",
      "start-cards:uid-b",
      "start-decks:uid-b",
    ]);
    expect(mocks.currentDeckSessionByUid["uid-a"]?.()).toBe(false);
    expect(mocks.currentDeckSessionByUid["uid-b"]?.()).toBe(true);

    stop();
  });

  it("stops and clears listeners on logout without starting replacements", () => {
    const stop = startRemoteReadSession();
    authenticate("uid-a");
    mocks.operations.length = 0;

    replaceAuthSession({ status: "unauthenticated" });

    expect(mocks.operations).toEqual(["stop-cards:uid-a", "stop-decks:uid-a", "clear-cards", "clear-decks"]);

    stop();
  });

  it("does not restart listeners when authenticated metadata changes for the same UID", () => {
    const stop = startRemoteReadSession();
    authenticate("uid-a");
    mocks.operations.length = 0;

    replaceAuthSession({ status: "authenticated", uid: "uid-a", isAnonymous: false, displayName: "Ada" });

    expect(mocks.operations).toEqual([]);
    stop();
  });
});

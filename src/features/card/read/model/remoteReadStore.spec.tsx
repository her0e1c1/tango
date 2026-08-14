import { renderHook } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { clearCards, useCards, type Card } from "@/entities/card";
import type { RemoteSubscriptionProps } from "@/shared/api";
import { createCard } from "@/test/factories";

const mocks = vi.hoisted(() => ({
  subscriptions: [] as Array<RemoteSubscriptionProps<Card>>,
  unsubscribe: vi.fn(),
}));

vi.mock("../api/subscribeCardReads", () => ({
  subscribeCardReads: vi.fn((props: RemoteSubscriptionProps<Card>) => {
    mocks.subscriptions.push(props);
    return mocks.unsubscribe;
  }),
}));

import { cardRemoteReadStore, startCardReads, stopCardReads } from "./remoteReadStore";

const publish = (subscription: RemoteSubscriptionProps<Card> | undefined, cards: Card[]): void => {
  subscription?.onSnapshot({
    itemsById: Object.fromEntries(cards.map((card) => [card.id, card])),
    syncStatus: "synced",
  });
};

describe("Card remote read bridge", () => {
  beforeEach(() => {
    stopCardReads();
    clearCards();
    mocks.subscriptions.length = 0;
    vi.clearAllMocks();
  });

  it("synchronizes accepted snapshots with the Card entity store", () => {
    const { result } = renderHook(useCards);
    const card = createCard({ id: "card" });
    startCardReads("uid-a");

    act(() => publish(mocks.subscriptions[0], [card]));

    expect(cardRemoteReadStore.getState().itemsById).toEqual({ card });
    expect(result.current).toEqual([card]);
  });

  it("ignores stale snapshots after a UID switch", () => {
    const { result } = renderHook(useCards);
    const staleCard = createCard({ id: "stale", uid: "uid-a" });
    const currentCard = createCard({ id: "current", uid: "uid-b" });
    startCardReads("uid-a");
    const staleSubscription = mocks.subscriptions[0];

    startCardReads("uid-b");
    clearCards();
    act(() => publish(staleSubscription, [staleCard]));

    expect(result.current).toEqual([]);
    act(() => publish(mocks.subscriptions[1], [currentCard]));
    expect(result.current).toEqual([currentCard]);
  });
});

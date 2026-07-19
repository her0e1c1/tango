import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";

import { createRemoteCache } from "@/query/cache/remoteCache";
import { createCard, createDeck } from "@/test/factories";

describe("remote cache", () => {
  it("reads and replaces UID-scoped collections independently", () => {
    const cache = createRemoteCache(new QueryClient());
    const deck = createDeck({ id: "deck-a" });
    const card = createCard({ id: "card-b" });

    expect(cache.read("uid-a", "decks")).toEqual({});

    cache.replace("uid-a", "decks", { [deck.id]: deck });
    cache.replace("uid-b", "cards", { [card.id]: card });

    expect(cache.read("uid-a", "decks")).toEqual({ [deck.id]: deck });
    expect(cache.read("uid-a", "cards")).toEqual({});
    expect(cache.read("uid-b", "cards")).toEqual({ [card.id]: card });
  });
});
